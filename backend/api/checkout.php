<?php

declare(strict_types=1);

// send checkout request, if true returned then quanitity
//   in db not exhausted beyond total limit and order added for person, with staff id = null
//   if answer sent not occured, then at least one product form list asked for more thean available
// amounts, and the whole order is not logged or anything, cart values should be retained on frontend


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

requireValidCsrfToken();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
    exit;
}

// get inputs userID, cart Items and return Date
$rawInput = file_get_contents('php://input');
$payload = is_string($rawInput) && $rawInput !== '' ? json_decode($rawInput, true): null;
$items = is_array($payload) && isset($payload['items']) && is_array($payload['items']) ? 
    $payload['items'] : [];
$returnDate = is_array($payload) && isset($payload['return_date']) && is_string($payload['return_date']) ?
    trim($payload['return_date']) : '';


// empty cart
if (count($items) === 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Cart is empty']);
    exit;
}


// Proceed with order creation and stock update using $_SESSION['user_id']...

// verify quantities per product ID

$requestedByProd = []; // manage verified quantities to be borrwed per product
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

// no items after borrow validation
if (count($requestedByProd) === 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'No valid items to checkout']);
    exit;
}

try {
    $pdo->beginTransaction();

    $stockStmt = $pdo->prepare('SELECT prod_id, amount_stock FROM equipment WHERE prod_id = :prod_id FOR UPDATE');

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

    // initiate order lifecycle: user gives borrow order, staff_id remains null until assigned
    $orderSql = 'INSERT INTO orders (user_id, staff_id, return_date, status) VALUES (:user_id, NULL, :return_date, :status)';
    $orderStmt = $pdo->prepare($orderSql);
    $orderStmt->bindValue(':user_id', (int) $_SESSION['user_id'], PDO::PARAM_INT);
    $orderStmt->bindValue(':return_date', $returnDate !== '' ? $returnDate : null, $returnDate !== '' ? PDO::PARAM_STR : PDO::PARAM_NULL);
    $orderStmt->bindValue(':status', 'pending', PDO::PARAM_STR);
    $orderStmt->execute();

    $orderId = (int) $pdo->lastInsertId();

    $itemSql = 'INSERT INTO order_items (order_id, prod_id, quantity) VALUES (:order_id, :prod_id, :quantity)';
    $itemStmt = $pdo->prepare($itemSql);

    $updateStockSql = 'UPDATE equipment SET amount_stock = amount_stock - :qty WHERE prod_id = :prod_id';
    $updateStockStmt = $pdo->prepare($updateStockSql);

    foreach ($requestedByProd as $prodId => $requestedQty) {
        $itemStmt->bindValue(':order_id', $orderId, PDO::PARAM_INT);
        $itemStmt->bindValue(':prod_id', $prodId, PDO::PARAM_INT);
        $itemStmt->bindValue(':quantity', $requestedQty, PDO::PARAM_INT);
        $itemStmt->execute();

        $updateStockStmt->bindValue(':qty', $requestedQty, PDO::PARAM_INT);
        $updateStockStmt->bindValue(':prod_id', $prodId, PDO::PARAM_INT);
        $updateStockStmt->execute();
    }

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'order_id' => $orderId,
        'staff_id' => null,
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