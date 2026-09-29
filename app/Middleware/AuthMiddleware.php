<?php
namespace App\Middleware;

use App\Core\Request;
use App\Core\Session;

class AuthMiddleware
{
    public function handle(Request $request): void
    {
        if (!Session::has('auth_user')) {
            header("Location: /login", true, 302);
            exit;
        }
    }
}
