<?php
declare(strict_types=1);

function getLatestOrderID(PDO $pdo): int {
    
    $stmt = $pdo->query('SELECT order_id FROM borrow_order ORDER BY order_id DESC LIMIT 1'); 
    $row = $stmt? $stmt->fetch(PDO::FETCH_ASSOC) : false;
    // if nothing returned
    if(!$row || !isset($row['order-id'])) {
        return 0;
    } 

    return (int) $row['order-id'];
}

// removed exit , bug for early exit