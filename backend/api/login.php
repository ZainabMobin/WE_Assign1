<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not Allowed']);
    exit;
}

if (session_status() !== PHP_SESSION_ACTIVE){
    session_start();
}

require_once __DIR__ . '/../config/db.php';

$rawInput = file_get_contents('php://input');
$decoded = is_string($rawInput) && $rawInput !== '' ? json_decode($rawInput, true) : null;
$input = is_array($decoded) ? $decoded : $_POST;

$email = isset($input['email']) && is_string($input['email'])
    ? strtolower(trim($input['email'])) : '';
$password = isset($input['password']) && is_string($input['password'])
    ? $input['password'] : '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email and password are required']);
    exit;
}

try {
    $sql = 'SELECT user_id, email, password_hash FROM user WHERE email = :email LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

       
    // user email not found or incorrect password
    if (!is_array($user) || !password_verify($password, (string) $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Invalid email or password']);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['user_id'];
    $_SESSION['user_email'] = (string) $user['email'];

    if (empty($_SESSION['csrf_token'])){
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    echo json_encode([
        'ok' => true,
        'authorized' => true,
        'user' => [
            'user_id' => (int) $user['user_id'],
            'email' => (string) $user['email'],
        ],
        'csrf_token' => $_SESSION['csrf_token'],
    ], JSON_UNESCAPED_SLASHES);
    exit;
} catch (Throwable $e) {
    error_log('GearRig login error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Authentication failed']);
    exit;
}