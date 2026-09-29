<?php
namespace App\Middleware;

use App\Core\Request;
use App\Core\Session;

class PermissionMiddleware
{
    public function handle(Request $request): void
    {
        $authUser = Session::get('auth_user');
        if (!$authUser) {
            header("Location: /login", true, 302);
            exit;
        }

        // Platform Super Admin bypasses individual role limits
        if (($authUser['role'] ?? '') === 'super_admin' || ($authUser['role'] ?? '') === 'org_owner') {
            return;
        }

        $requiredPermission = $request->getAttribute('required_permission');
        if ($requiredPermission) {
            $userPermissions = Session::get('user_permissions', []);
            if (!in_array($requiredPermission, $userPermissions, true)) {
                http_response_code(403);
                echo "<h1>403 Forbidden</h1><p>You do not have permission to perform this operational action.</p>";
                exit;
            }
        }
    }
}
