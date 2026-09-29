<?php
// routes/web.php
use App\Core\Router;
use App\Core\Request;
use App\Core\Response;
use App\Core\View;
use App\Core\Session;
use App\Middleware\AuthMiddleware;
use App\Middleware\CsrfMiddleware;
use App\Middleware\TenantMiddleware;
use App\Repositories\EmployeeRepository;

/** @var Router $router */

// Public / Guest Routes
$router->get('/login', function(Request $request) {
    if (Session::has('auth_user')) {
        header("Location: /dashboard", true, 302);
        exit;
    }
    return View::render('auth/login', ['title' => 'Sign In - StaffCore SaaS'], 'auth');
});

$router->post('/login', function(Request $request) {
    $email = trim((string)$request->input('email'));
    $password = (string)$request->input('password');

    // Authenticate against database users table
    $db = \App\Core\Database::getConnection();
    $stmt = $db->prepare("SELECT u.*, o.name AS org_name, o.slug AS org_slug, o.status AS org_status
                          FROM users u
                          LEFT JOIN organizations o ON u.organization_id = o.id
                          WHERE u.email = :email AND u.status = 'active'
                          LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        Session::regenerate();
        Session::set('auth_user', [
            'id' => $user['id'],
            'organization_id' => $user['organization_id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'] ?? 'employee',
            'org_name' => $user['org_name'],
        ]);

        header("Location: /dashboard", true, 302);
        exit;
    }

    Session::flash('error', 'Invalid email or password provided.');
    header("Location: /login", true, 302);
    exit;
}, [CsrfMiddleware::class]);

$router->post('/logout', function(Request $request) {
    Session::destroy();
    header("Location: /login", true, 302);
    exit;
}, [CsrfMiddleware::class]);

// Protected Tenant-Isolated Dashboard
$router->get('/dashboard', function(Request $request) {
    return View::render('dashboard/index', [
        'title' => 'Executive Dashboard - StaffCore',
        'user' => Session::get('auth_user'),
    ]);
}, [AuthMiddleware::class, TenantMiddleware::class]);

// Employee Management Routes
$router->get('/employees', function(Request $request) {
    $repo = new EmployeeRepository();
    $tenantId = (int)Session::get('auth_user')['organization_id'];
    $employees = $repo->getPaginated($tenantId);

    return View::render('employees/index', [
        'title' => 'Staff Directory',
        'employees' => $employees,
    ]);
}, [AuthMiddleware::class, TenantMiddleware::class]);

$router->get('/api/health', function(Request $request) {
    (new Response())->json([
        'status' => 'operational',
        'platform' => 'StaffCore Enterprise SaaS',
        'engine' => 'PHP ' . PHP_VERSION,
        'database' => 'MySQL 8.0+ InnoDB',
        'timestamp' => gmdate('Y-m-d H:i:s \U\T\C'),
    ]);
});
