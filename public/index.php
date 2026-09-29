<?php
/**
 * StaffCore SaaS - Enterprise Employee Management System
 * Front Controller
 */

declare(strict_types=1);

// Autoloader for PSR-4 App namespace
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

use App\Core\Application;

$app = new Application();

// Load routes
require __DIR__ . '/../routes/web.php';

// Dispatch request
$app->run();
