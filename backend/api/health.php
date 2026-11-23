<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'db_connected' => false,
        'message' => 'Method not allowed',
    ]);
    exit;
}

require_once __DIR__ . '/../config/db.php';

try {
    $pdo->query('SELECT 1');
    echo json_encode([
        'ok' => true,
        'status' => 'database connection established',
        'db_connected' => true,
        'database' => $dbName,
    ], JSON_UNESCAPED_SLASHES);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'status' => 'database connection failed',
        'db_connected' => false,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}