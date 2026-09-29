<?php
namespace App\Core;

class View
{
    public static function render(string $view, array $data = [], string $layout = 'app'): string
    {
        extract($data);

        // Security Helper: e() for contextual escaping
        if (!function_exists('e')) {
            function e(mixed $value): string {
                return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
            }
        }

        $viewPath = __DIR__ . '/../../resources/views/' . $view . '.php';
        if (!file_exists($viewPath)) {
            return "<!-- View [$view] not found -->";
        }

        ob_start();
        require $viewPath;
        $content = ob_get_clean();

        if ($layout === '') {
            return $content;
        }

        $layoutPath = __DIR__ . '/../../resources/views/layouts/' . $layout . '.php';
        if (file_exists($layoutPath)) {
            ob_start();
            require $layoutPath;
            return ob_get_clean();
        }

        return $content;
    }
}
