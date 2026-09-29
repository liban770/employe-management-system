<?php
// config/app.php
return [
    'name' => 'StaffCore SaaS',
    'env' => getenv('APP_ENV') ?: 'production',
    'debug' => (bool)(getenv('APP_DEBUG') ?: false),
    'url' => getenv('APP_URL') ?: 'http://localhost:8000',
    'timezone' => 'UTC',
    'locale' => 'en',
    'key' => getenv('APP_KEY') ?: 'base64:staffcore-super-secret-key-32chars',
];
