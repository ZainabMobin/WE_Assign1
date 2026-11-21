<?php
// backend/api/image.php
declare(strict_types=1);

ob_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$fallbackSrc = 'assets/img/fallback.jpg';
$imgDir = realpath(__DIR__ . '/../../frontend/assets/img');

$rawId = $_GET['prodId'] ?? '';
$cleanId = is_string($rawId) ? trim($rawId) : '';

// Reject empty or unsafe IDs (prevents ../ path traversal)
if ($cleanId === '' || !preg_match('/^[a-zA-Z0-9_-]+$/', $cleanId)) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => 'Invalid prodId',
        'src' => $fallbackSrc,
    ]);
    exit;
}

// check if any image matches
$src = $fallbackSrc;
$matched = false;

if ($imgDir !== false) {
    $extensions = ['svg', 'webp', 'png', 'jpg', 'jpeg', 'gif'];

    foreach ($extensions as $ext) {
        $candidateFs = $imgDir . DIRECTORY_SEPARATOR . $cleanId . '.' . $ext;
        $realCandidate = realpath($candidateFs);

        if (
            $realCandidate !== false &&
            str_starts_with($realCandidate, $imgDir . DIRECTORY_SEPARATOR) &&
            is_file($realCandidate)
        ) {
            $src = 'assets/img/' . $cleanId . '.' . $ext;
            $matched = true;
            break;
        }
    }
}

echo json_encode([
    'ok' => true,
    'prodId' => $cleanId,
    'matched' => $matched,
    'src' => $src,
]);
exit;