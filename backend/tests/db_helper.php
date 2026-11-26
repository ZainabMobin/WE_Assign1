<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../api/order.php';

$action = $argv[1] ?? '';

if ($action === 'now') {
    $stmt = $pdo->query('SELECT NOW() AS now_ts');
    $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : ['now_ts' => date('Y-m-d H:i:s')];
    echo json_encode($row);
    exit;
}

if ($action === 'latest-order-id') {
    echo json_encode(['latest_order_id' => getLatestOrderID($pdo)]);
    exit;
}

if ($action === 'seed-product') {
    $name = $argv[2] ?? 'test';
    $desc = $argv[3] ?? 'test suite desc';
    $stock = (int) ($argv[4] ?? 10);

    $del = $pdo->prepare('DELETE FROM product WHERE name = :name AND description = :descr');
    $del->execute([':name' => $name, ':descr' => $desc]);

    $ins = $pdo->prepare('INSERT INTO product (name, description, amount_stock) VALUES (:name, :descr, :stock)');
    $ins->execute([
        ':name' => $name,
        ':descr' => $desc,
        ':stock' => $stock,
    ]);

    echo json_encode(['prod_id' => (int) $pdo->lastInsertId()]);
    exit;
}

if ($action === 'reset-stock') {
    $prodId = (int) ($argv[2] ?? 0);
    $stock = (int) ($argv[3] ?? 10);

    $stmt = $pdo->prepare('UPDATE product SET amount_stock = :stock WHERE prod_id = :id');
    $stmt->execute([
        ':stock' => $stock,
        ':id' => $prodId,
    ]);

    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'get-product') {
    $prodId = (int) ($argv[2] ?? 0);
    $stmt = $pdo->prepare('SELECT prod_id, name, description, amount_stock FROM product WHERE prod_id = :id');
    $stmt->execute([':id' => $prodId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($row ?: null);
    exit;
}

if ($action === 'get-order') {
    $orderId = (int) ($argv[2] ?? 0);
    $stmt = $pdo->prepare('SELECT order_id, status, order_date, due_date, user_id, issue_staff_id FROM borrow_order WHERE order_id = :id');
    $stmt->execute([':id' => $orderId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($row ?: null);
    exit;
}

if ($action === 'cleanup') {
    $prodId = (int) ($argv[2] ?? 0);
    $userId = (int) ($argv[3] ?? 0);
    $since = $argv[4] ?? '1970-01-01 00:00:00';

    if ($prodId > 0) {
        $delOrdersWithItem = $pdo->prepare(
            'DELETE bo FROM borrow_order bo
             INNER JOIN borrow_item bi ON bi.order_id = bo.order_id
             WHERE bi.prod_id = :pid'
        );
        $delOrdersWithItem->execute([':pid' => $prodId]);

        $delItems = $pdo->prepare('DELETE FROM borrow_item WHERE prod_id = :pid');
        $delItems->execute([':pid' => $prodId]);
    }

    if ($userId > 0) {
        $delUserOrders = $pdo->prepare(
            'DELETE FROM borrow_order WHERE user_id = :uid AND order_date >= :since'
        );
        $delUserOrders->execute([
            ':uid' => $userId,
            ':since' => $since,
        ]);
    }

    if ($prodId > 0) {
        $delProd = $pdo->prepare('DELETE FROM product WHERE prod_id = :pid');
        $delProd->execute([':pid' => $prodId]);
    }

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action', 'action' => $action]);