<?php
namespace App\Core;

class Session
{
    private static bool $started = false;

    public static function start(): void
    {
        if (self::$started || session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $config = require __DIR__ . '/../../config/session.php';

        session_set_cookie_params([
            'lifetime' => $config['lifetime'] * 60,
            'path' => $config['path'],
            'domain' => $config['domain'],
            'secure' => $config['secure'],
            'httponly' => $config['httponly'],
            'samesite' => $config['samesite'],
        ]);

        session_name($config['cookie_name']);
        session_start();
        self::$started = true;

        // Auto-generate CSRF token if not present
        if (!isset($_SESSION['_csrf_token'])) {
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }

        // Idle session timeout check
        if (isset($_SESSION['_last_activity']) && (time() - $_SESSION['_last_activity'] > ($config['lifetime'] * 60))) {
            self::destroy();
            session_start();
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }
        $_SESSION['_last_activity'] = time();
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        self::start();
        return $_SESSION[$key] ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        self::start();
        $_SESSION[$key] = $value;
    }

    public static function has(string $key): bool
    {
        self::start();
        return isset($_SESSION[$key]);
    }

    public static function remove(string $key): void
    {
        self::start();
        unset($_SESSION[$key]);
    }

    public static function regenerate(): void
    {
        self::start();
        session_regenerate_id(true);
    }

    public static function destroy(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(
                    session_name(),
                    '',
                    time() - 42000,
                    $params["path"],
                    $params["domain"],
                    $params["secure"],
                    $params["httponly"]
                );
            }
            session_destroy();
            self::$started = false;
        }
    }

    public static function csrfToken(): string
    {
        self::start();
        return $_SESSION['_csrf_token'] ?? '';
    }

    public static function validateCsrf(?string $token): bool
    {
        self::start();
        if (!$token || !isset($_SESSION['_csrf_token'])) {
            return false;
        }
        return hash_equals($_SESSION['_csrf_token'], $token);
    }

    public static function flash(string $key, mixed $message = null): mixed
    {
        self::start();
        if ($message !== null) {
            $_SESSION['_flash'][$key] = $message;
            return null;
        }
        $val = $_SESSION['_flash'][$key] ?? null;
        unset($_SESSION['_flash'][$key]);
        return $val;
    }
}
