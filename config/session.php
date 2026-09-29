<?php
// config/session.php
return [
    'lifetime' => (int)(getenv('SESSION_LIFETIME') ?: 120), // minutes
    'cookie_name' => 'staffcore_session',
    'path' => '/',
    'domain' => getenv('SESSION_DOMAIN') ?: null,
    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
    'httponly' => true,
    'samesite' => 'Lax', // 'Lax' or 'Strict'
];
