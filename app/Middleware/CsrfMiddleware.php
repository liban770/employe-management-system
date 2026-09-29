<?php
namespace App\Middleware;

use App\Core\Request;
use App\Core\Session;
use RuntimeException;

class CsrfMiddleware
{
    public function handle(Request $request): void
    {
        $method = $request->method();
        if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            $token = $request->input('_csrf_token');
            if (!Session::validateCsrf($token)) {
                http_response_code(419);
                echo "<h1>419 Page Expired</h1><p>CSRF token mismatch or expired session. Please refresh and try again.</p>";
                exit;
            }
        }
    }
}
