<?php

declare(strict_types=1);

/**
 * Checks if sent csrf token is valid or not
 * raise error return object if invalid, else nothing returned
 */
function requireValidCsrfToken(){

    // start session
    if (session_status() !== PHP_SESSION_ACTIVE){
        session_start();
    }
    
    $sentToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    // if server side csrf token is empty/not string ,  sent token is empty/not string or if hashes do not match
    // send error invalid csrf
    if ( empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token']) || !is_string($sentToken) ||
            $sentToken === '' || !hash_equals($_SESSION['csrf_token'], $sentToken) ) {
        http_response_code(403);
        echo json_encode(
            ['ok' => false, 
            'error' => 'Invalid or missing CSRF token',
            'debug_has_session_token' => !empty($_SESSION['csrf_token']),
            'debug_has_sent_header' => $sentToken !== '',
        ]);
        exit;
    }

    // else csrf token is legit, do nothing and api calls flow normally
}