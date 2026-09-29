<?php
namespace App\Middleware;

use App\Core\Request;
use App\Core\Session;

class TenantMiddleware
{
    public function handle(Request $request): void
    {
        $authUser = Session::get('auth_user');

        if (!$authUser || empty($authUser['organization_id'])) {
            // Unauthenticated or Super Admin without active organization context
            return;
        }

        // Enforce server-side tenant context on the request
        $request->setAttribute('tenant_id', (int)$authUser['organization_id']);
    }
}
