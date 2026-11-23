<?php

// API CALL: http://127.0.0.1:8000/backend/api/products.php?name=light&colour=none&category=none 
// no colour or category parameters: all values fetched
// colour being none: fetch products that have no colours associated with it

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/db.php';

/**
 * Fetch all products under every colour and category value.
 */
function getAllProductsAllCategoriesAllColours(PDO $db): array
{
    $sql = '
        SELECT prod_id, name, description, amount_stock
        FROM product
        ORDER BY prod_id ASC
    ';

    $stmt = $db->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($rows === []) {
        return [];
    }

    return attachColoursAndCategories($db, $rows);
}

/**
 * Fetch products matching specific name, colour string, and/or category string filters.
 * Empty string ("") for any parameter means "do not filter by that field".
 */
function getAllProductsSpecificParams(
    PDO $db,
    string $name = '',
    string $colour = '',
    string $category = ''
): array {
    $nameFilter = trim($name);
    $colourFilter = trim($colour);
    $categoryFilter = trim($category);

    $sql = '
        SELECT DISTINCT
            p.prod_id,
            p.name,
            p.description,
            p.amount_stock
        FROM product p
        LEFT JOIN product_colour pc ON pc.prod_id = p.prod_id
        LEFT JOIN colour col ON col.colour_id = pc.colour_id
        LEFT JOIN product_category pcat ON pcat.prod_id = p.prod_id
        LEFT JOIN category cat ON cat.category_id = pcat.category_id
        WHERE (:name_filter = \'\' OR p.name LIKE :name_like)
          AND (
                :colour_filter = \'\'
                OR (LOWER(:colour_none) = \'none\' AND col.name IS NULL)
                OR LOWER(col.name) = LOWER(:colour_exact)
              )
          AND (
                :category_filter = \'\'
                OR (LOWER(:category_none) = \'none\' AND cat.name IS NULL)
                OR LOWER(cat.name) = LOWER(:category_exact)
              )
        ORDER BY p.prod_id ASC
    ';

    $stmt = $db->prepare($sql);
    $likeName = '%' . $nameFilter . '%';

    $stmt->bindValue(':name_filter', $nameFilter, PDO::PARAM_STR);
    $stmt->bindValue(':name_like', $likeName, PDO::PARAM_STR);
    $stmt->bindValue(':colour_filter', $colourFilter, PDO::PARAM_STR);
    $stmt->bindValue(':colour_none', $colourFilter, PDO::PARAM_STR);
    $stmt->bindValue(':colour_exact', $colourFilter, PDO::PARAM_STR);
    $stmt->bindValue(':category_filter', $categoryFilter, PDO::PARAM_STR);
    $stmt->bindValue(':category_none', $categoryFilter, PDO::PARAM_STR);
    $stmt->bindValue(':category_exact', $categoryFilter, PDO::PARAM_STR);

    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($rows === []) {
        return [];
    }

    return attachColoursAndCategories($db, $rows);
}

/**
 * Map colour and category strings onto product rows.
 * Early exit when no product rows are provided.
 */
function attachColoursAndCategories(PDO $db, array $productRows): array
{
    if ($productRows === []) {
        return [];
    }

    $productsById = [];
    foreach ($productRows as $row) {
        $prodId = (int) $row['prod_id'];
        $productsById[$prodId] = [
            'prod_id' => $prodId,
            'name' => (string) $row['name'],
            'description' => (string) $row['description'],
            'amount_stock' => (int) $row['amount_stock'],
            'colours' => [],
            'categories' => [],
        ];
    }

    // Colour lookup via product_colour -> colour
    $colSql = '
        SELECT pc.prod_id, col.name AS colour_name
        FROM product_colour pc
        INNER JOIN colour col ON col.colour_id = pc.colour_id
        ORDER BY pc.prod_id ASC, col.colour_id ASC
    ';
    $colStmt = $db->prepare($colSql);
    $colStmt->execute();
    $colRows = $colStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($colRows as $cRow) {
        $prodId = (int) $cRow['prod_id'];
        $colourName = (string) $cRow['colour_name'];
        if (
            isset($productsById[$prodId]) &&
            !in_array($colourName, $productsById[$prodId]['colours'], true)
        ) {
            $productsById[$prodId]['colours'][] = $colourName;
        }
    }

    // Category lookup via product_category -> category
    $catSql = '
        SELECT pc.prod_id, cat.name AS category_name
        FROM product_category pc
        INNER JOIN category cat ON cat.category_id = pc.category_id
        ORDER BY pc.prod_id ASC, cat.category_id ASC
    ';
    $catStmt = $db->prepare($catSql);
    $catStmt->execute();
    $catRows = $catStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($catRows as $catRow) {
        $prodId = (int) $catRow['prod_id'];
        $categoryName = (string) $catRow['category_name'];
        if (
            isset($productsById[$prodId]) &&
            !in_array($categoryName, $productsById[$prodId]['categories'], true)
        ) {
            $productsById[$prodId]['categories'][] = $categoryName;
        }
    }

    return array_values($productsById);
}

// Read optional query parameters (filter by name, category or colour)
$nameParam = isset($_GET['name']) && is_string($_GET['name'])
    ? trim($_GET['name'])
    : (isset($_GET['q']) && is_string($_GET['q']) ? trim($_GET['q']) : '');
$colourParam = isset($_GET['colour']) && is_string($_GET['colour'])
    ? trim($_GET['colour'])
    : '';
$categoryParam = isset($_GET['category']) && is_string($_GET['category'])
    ? trim($_GET['category'])
    : '';

try {
    $hasSpecificParams = ($nameParam !== '' || $colourParam !== '' || $categoryParam !== '');

    $products = $hasSpecificParams
        ? getAllProductsSpecificParams($pdo, $nameParam, $colourParam, $categoryParam)
        : getAllProductsAllCategoriesAllColours($pdo);

    echo json_encode([
        'ok' => true,
        'mode' => $hasSpecificParams ? 'specific_params' : 'all_categories_all_colours',
        'count' => count($products),
        'products' => $products,
    ], JSON_UNESCAPED_SLASHES);
    exit;
} catch (Throwable $e) {
    error_log('GearRig products error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to load products',
        'debug' => $e->getMessage(),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}