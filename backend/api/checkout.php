<?php

declare(strict_types=1);

// Send checkout request:
// - If any item exceeds available stock, return 409 with no DB writes
// - If stock sufficient for all items, create borrow_order, insert borrow_item rows
//  and decrease product stock in DB

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/../config/csrf.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../api/order.php';

requireValidCsrfToken();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
    exit;
}

$userId = (int) $_SESSION['user_id'];

$rawInput = file_get_contents('php://input');
$payload = is_string($rawInput) && $rawInput !== '' ? json_decode($rawInput, true) : null;
$items = is_array($payload) && isset($payload['items']) && is_array($payload['items'])
    ? $payload['items']
    : [];
$returnDate = is_array($payload) && isset($payload['return_date']) && is_string($payload['return_date'])
    ? trim($payload['return_date'])
    : '';

if (count($items) === 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Cart is empty']);
    exit;
}

if ($returnDate === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $returnDate)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Valid return date is required']);
    exit;
}

// Aggregate requested quantities per product ID
$requestedByProd = [];
foreach ($items as $entry) {
    if (!is_array($entry)) {
        continue;
    }
    $prodId = (int) ($entry['prod_id'] ?? $entry['prodId'] ?? 0);
    $qty = (int) ($entry['quantity'] ?? 0);

    if ($prodId <= 0 || $qty <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid item or quantity in cart']);
        exit;
    }

    $requestedByProd[$prodId] = ($requestedByProd[$prodId] ?? 0) + $qty;
}

if (count($requestedByProd) === 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'No valid items to checkout']);
    exit;
}

try {
    $pdo->beginTransaction();

    // verify requested amount does not exceed stock for each product
    $stockStmt = $pdo->prepare(
        'SELECT prod_id, amount_stock FROM product WHERE prod_id = :prod_id FOR UPDATE'
    );

    foreach ($requestedByProd as $prodId => $requestedQty) {
        $stockStmt->bindValue(':prod_id', $prodId, PDO::PARAM_INT);
        $stockStmt->execute();
        $row = $stockStmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || $requestedQty > (int) $row['amount_stock']) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode([
                'ok' => false,
                'stock_exceeded' => true,
                'error' => 'Requested amount exceeds available stock',
            ]);
            exit;
        }
    }

    // create bprrow_order row
    $previousLatestOrderId = getLatestOrderID($pdo);
    $nextOrderId = $previousLatestOrderId + 1;

    $insertOrderSql = 'INSERT INTO borrow_order (status, order_date, due_date, user_id, issue_staff_id)
                         VALUES (\'PENDING\', CURRENT_TIMESTAMP, :due_date, :user_id, NULL)';
    $orderStmt = $pdo->prepare($insertOrderSql);
    $orderStmt->bindValue(':due_date', $returnDate, PDO::PARAM_STR);
    $orderStmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $orderStmt->execute();

    $orderId = (int) $pdo->lastInsertId();

    $insertItemSql = 'INSERT INTO borrow_item (qty_borrowed, condition_out_rating, condition_out_notes, order_id, prod_id)
                        VALUES (:qty_borrowed, \'FAIR\', NULL, :order_id, :prod_id)';
    $itemStmt = $pdo->prepare($insertItemSql);

    // seperate deducted and required quantity as seperate params
    $updateStockSql = 'UPDATE product
                        SET amount_stock = amount_stock - :deduct_qty
                        WHERE prod_id = :prod_id AND amount_stock >= :req_qty';
    $updateStockStmt = $pdo->prepare($updateStockSql);

    foreach ($requestedByProd as $prodId => $requestedQty) {
        $itemStmt->bindValue(':qty_borrowed', $requestedQty, PDO::PARAM_INT);
        $itemStmt->bindValue(':order_id', $orderId, PDO::PARAM_INT);
        $itemStmt->bindValue(':prod_id', $prodId, PDO::PARAM_INT);
        $itemStmt->execute();

        $updateStockStmt->bindValue(':deduct_qty', $requestedQty, PDO::PARAM_INT);
        $updateStockStmt->bindValue(':req_qty', $requestedQty, PDO::PARAM_INT);
        $updateStockStmt->bindValue(':prod_id', $prodId, PDO::PARAM_INT);
        $updateStockStmt->execute();

        if ($updateStockStmt->rowCount() === 0) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode([
                'ok' => false,
                'stock_exceeded' => true,
                'error' => 'Requested amount exceeds available stock',
            ]);
            exit;
        }
    }

    $pdo->commit();

    error_log('Successful checkout , all db operations ran');

    echo json_encode([
        'ok' => true,
        'order_id' => $orderId,
        'previous_latest_order_id' => $previousLatestOrderId,
        'computed_next_order_id' => $nextOrderId,
        'issue_staff_id' => null,
        'status' => 'PENDING',
        'message' => 'Order placed successfully',
    ], JSON_UNESCAPED_SLASHES);
    exit;
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('GearRig checkout error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Checkout failed']);
    exit;
}