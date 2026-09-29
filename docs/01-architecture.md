# Document 01: System Architecture

**Project:** Enterprise SaaS Employee Management System  
**Document Version:** 1.0.0  
**Target Environment:** PHP 8.2+, MySQL 8+, Apache/Nginx (XAMPP local & Cloud/VPS production-ready)  
**Author:** Senior Software Architect & Technical Lead  
**Status:** Approved for Architectural Baseline Review  

---

## 1. Architecture Goals

The architectural foundation of this Employee Management System is built around enterprise SaaS principles rather than a monolithic, single-tenant internal script. Every layer is intentionally separated to guarantee:

* **Maintainability:** Strict Single Responsibility Principle (SRP). Controllers coordinate, Services execute business rules, Repositories handle persistence, and Views render presentation. No business logic leaks into views or raw SQL inside controllers.
* **Security & Defense-in-Depth:** Zero-trust architecture regarding client input. Strict PDO prepared statements, contextual output escaping, CSRF token validation on mutating verbs, session security (HTTP-only, SameSite, regeneration), and constant-time password hashing.
* **Tenant Isolation (Multi-Tenancy):** Logical data isolation keyed by `organization_id`. Tenant context is established strictly from verified server-side session credentials, never accepted from user-manipulated query strings, post parameters, or client headers.
* **Modularity & Scalability:** Feature domains (Auth, Organization, Employee, Department, Attendance, Leave, Documents, Audit) are organized into decoupled modules with clear interfaces. This enables future migration towards microservices, queue workers, or read-replica database configurations without rewriting domain logic.
* **Testability:** Decoupled business logic allows unit testing of Services with mock Repositories, integration testing with isolated test databases, and end-to-end API/flow validation.
* **SaaS Readiness:** Built-in multi-tenancy, granular Role-Based Access Control (RBAC), multi-organization scoping, centralized audit logging, and configurable organization settings.
* **Performance:** Optimized database indices on compound keys (e.g. `(organization_id, status)`), cursor/offset pagination to eliminate memory bloat, eager loading patterns to prevent $N+1$ query cascades, and minimal runtime footprint.

---

## 2. Application Architecture & Directory Structure

The system implements a modern, modular MVC-inspired architecture crafted for modern PHP 8.2+:

```text
employee-management/
│
├── app/
│   ├── Controllers/               # HTTP Request handlers (dispatch & view coordination)
│   │   ├── Auth/                  # Login, Logout, Session controllers
│   │   ├── DashboardController.php
│   │   ├── EmployeeController.php
│   │   ├── DepartmentController.php
│   │   ├── PositionController.php
│   │   ├── AttendanceController.php
│   │   ├── LeaveController.php
│   │   ├── DocumentController.php
│   │   ├── NotificationController.php
│   │   ├── ReportController.php
│   │   ├── AuditLogController.php
│   │   └── SettingController.php
│   │
│   ├── Core/                      # Low-level framework primitives
│   │   ├── Application.php        # App lifecycle & DI container
│   │   ├── Router.php             # Fast route resolution & parameter binding
│   │   ├── Request.php            # Encapsulated, sanitized HTTP request object
│   │   ├── Response.php           # Encapsulated HTTP response (View/JSON/Redirect)
│   │   ├── Database.php           # Singleton PDO connection wrapper with transaction support
│   │   ├── Session.php            # Hardened session manager & flash data
│   │   └── View.php               # Secure template rendering engine with layout support
│   │
│   ├── Middleware/                # Request pipeline filters
│   │   ├── AuthMiddleware.php     # Session authentication gate
│   │   ├── GuestMiddleware.php    # Guest-only gate (login/register)
│   │   ├── TenantMiddleware.php   # Organization context binding & tenant validation
│   │   ├── PermissionMiddleware.php # RBAC gate
│   │   └── CsrfMiddleware.php     # Token verification for POST/PUT/DELETE
│   │
│   ├── Models/                    # Active/Passive Domain Entities (type-safe DTOs/Entities)
│   │   ├── User.php
│   │   ├── Organization.php
│   │   ├── Employee.php
│   │   ├── Department.php
│   │   ├── Position.php
│   │   ├── Attendance.php
│   │   ├── LeaveRequest.php
│   │   ├── LeaveBalance.php
│   │   ├── Document.php
│   │   ├── Notification.php
│   │   └── AuditLog.php
│   │
│   ├── Repositories/              # Direct SQL persistence layer (Prepared statements)
│   │   ├── Contracts/             # Interface contracts for testability
│   │   ├── UserRepository.php
│   │   ├── OrganizationRepository.php
│   │   ├── EmployeeRepository.php
│   │   ├── DepartmentRepository.php
│   │   ├── PositionRepository.php
│   │   ├── AttendanceRepository.php
│   │   ├── LeaveRepository.php
│   │   ├── DocumentRepository.php
│   │   └── AuditLogRepository.php
│   │
│   ├── Services/                  # Core domain & business rules
│   │   ├── AuthService.php
│   │   ├── TenantService.php
│   │   ├── EmployeeService.php
│   │   ├── DepartmentService.php
│   │   ├── AttendanceService.php
│   │   ├── LeaveService.php
│   │   ├── DocumentService.php
│   │   ├── NotificationService.php
│   │   ├── ReportService.php
│   │   └── AuditService.php
│   │
│   ├── Policies/                  # Fine-grained authorization gates
│   │   ├── EmployeePolicy.php
│   │   ├── DepartmentPolicy.php
│   │   ├── AttendancePolicy.php
│   │   ├── LeavePolicy.php
│   │   ├── DocumentPolicy.php
│   │   └── SettingPolicy.php
│   │
│   ├── Validators/                # Request input validation schemas
│   │   ├── Validator.php          # Core rule processor (required, email, max, min, regex, unique)
│   │   ├── AuthValidator.php
│   │   ├── EmployeeValidator.php
│   │   ├── LeaveValidator.php
│   │   └── DepartmentValidator.php
│   │
│   └── Helpers/                   # Pure utility functions (formatting, date calculations, security)
│       ├── SecurityHelper.php     # e(), csrf_token(), sanitize()
│       ├── FormatHelper.php       # Currency, date, time spans
│       └── FileHelper.php         # Mime sniffing, safe random names
│
├── config/
│   ├── app.php                    # App name, env, timezone, debug flags
│   ├── database.php               # MySQL host, port, dbname, user, pass, options
│   └── session.php                # Session lifetime, cookie secure/httponly flags
│
├── database/
│   ├── migrations/                # Versioned SQL migration files
│   │   ├── 001_create_tenants_and_auth_tables.sql
│   │   ├── 002_create_organization_structure_tables.sql
│   │   ├── 003_create_employee_tables.sql
│   │   ├── 004_create_attendance_and_leave_tables.sql
│   │   └── 005_create_documents_and_audit_tables.sql
│   ├── seeds/                     # Database seeders for roles, default admin, demo orgs
│   │   ├── RolePermissionSeeder.php
│   │   └── DemoOrganizationSeeder.php
│   └── DatabaseMigrator.php       # CLI/Web migration runner
│
├── public/                        # Only directory exposed to the web server
│   ├── index.php                  # Web front controller
│   ├── .htaccess                  # Apache mod_rewrite rule router
│   └── assets/                    # Static assets
│       ├── css/style.css          # Compiled Tailwind CSS
│       ├── js/app.js              # Vanilla ES6 micro-interactions
│       └── images/                # Brand assets & UI icons
│
├── resources/                     # Server-rendered templates
│   ├── views/
│   │   ├── layouts/               # Master layouts (app.php, auth.php)
│   │   ├── components/            # Reusable UI partials (navbar, sidebar, modal, table, badge)
│   │   ├── auth/                  # login.php
│   │   ├── dashboard/             # index.php
│   │   ├── employees/             # index.php, create.php, edit.php, show.php
│   │   ├── departments/           # index.php, modal_form.php
│   │   ├── positions/             # index.php
│   │   ├── attendance/            # index.php, my_attendance.php
│   │   ├── leave/                 # index.php, request_modal.php, balances.php
│   │   ├── documents/             # index.php, upload_modal.php
│   │   ├── reports/               # index.php, export_view.php
│   │   ├── audit/                 # index.php
│   │   └── settings/              # organization.php, users.php, leave_types.php
│   └── errors/
│       ├── 403.php
│       ├── 404.php
│       └── 500.php
│
├── routes/
│   └── web.php                    # HTTP route definitions with middleware stacks
│
├── storage/                       # Protected file storage (strictly outside public webroot)
│   ├── logs/                      # Application runtime & security logs
│   ├── cache/                     # View cache / route cache
│   └── uploads/                   # Sensitive employee files, contracts, certificates
│       └── org_{id}/              # Encrypted or tenant-isolated directory partitions
│
├── docs/                          # Architecture & project specifications
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules
└── README.md                      # Operational setup guide
```

---

## 3. SaaS Multi-Tenancy Architecture

### 3.1 Tenant Isolation Strategy: Shared Database with Discriminator Column
For a modern high-efficiency SaaS platform serving small to medium organizations, the **shared database with shared schema** model (partitioned via `organization_id`) provides the optimal balance of resource efficiency, instant tenant onboarding, automated migrations, and zero infrastructure overhead.

```text
Incoming HTTP Request
        │
        ▼
   [Router]
        │
        ▼
[AuthMiddleware] ──► Validates session cookie, loads User Entity
        │
        ▼
[TenantMiddleware] ──► Extracts user's organization_id from authenticated session
        │             Bind TenantContext::setOrganizationId($orgId)
        │
        ▼
[Service / Repository Layer]
        │
        ▼
[BaseRepository] ──► Automatically attaches `WHERE organization_id = :tenant_id`
                     to EVERY query, update, select, and delete statement.
```

### 3.2 Tenant Context Security Rules
1. **Never Trust Input Parameters:** An HTTP parameter like `GET ?organization_id=2` or `POST ['organization_id' => 2]` is rejected for tenant identification. The current tenant ID is exclusively pulled from `$_SESSION['auth_user']['organization_id']`.
2. **Platform Super Admin Switching:** Only users with the system-wide role `Platform Super Admin` can switch active organization context, and this action is explicitly validated and logged in the audit trail.
3. **Repository Defense:** Repositories accept domain identifiers (e.g. `$employeeId`) alongside the implicit or explicit `$organizationId`. Any attempt to fetch `WHERE id = :id` must enforce `AND organization_id = :org_id`. If an employee ID belongs to another tenant, a `404 Not Found` or `403 Forbidden` exception is thrown immediately.

---

## 4. Layer Responsibilities & Data Flow

```text
┌────────────────────────────────────────────────────────┐
│                      Client / UI                       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP POST /employees
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Front Controller                     │
│                  (public/index.php)                    │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Routing & Middleware                 │
│        (AuthMiddleware -> Csrf -> Tenant -> RBAC)      │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                   EmployeeController                   │
│   • Validates input using EmployeeValidator            │
│   • Checks authorization via EmployeePolicy            │
│   • Coordinates EmployeeService                        │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                    EmployeeService                     │
│   • Executes business rules (check duplicate code)     │
│   • Starts database transaction                        │
│   • Calls EmployeeRepository->create()                 │
│   • Calls AuditService->logAction()                    │
│   • Calls NotificationService->send()                  │
│   • Commits transaction                                │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                  EmployeeRepository                    │
│   • Executes PDO prepared statement with tenant_id     │
│   • Maps SQL row result to Employee Entity Model       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                     MySQL Database                     │
└────────────────────────────────────────────────────────┘
```

* **Controllers:** Thin layer. Reads request, validates input rules via Validators, checks authorization policies, calls the corresponding domain Service, and returns a View or JSON response.
* **Services:** Pure business logic. Orchestrates operations, handles multi-table transactions, manages balance deductions, dispatches notifications, and triggers audit logs.
* **Repositories:** Pure persistence abstraction. Owns SQL queries, binds parameters, executes prepared statements, and returns entity objects or arrays of entities.
* **Policies:** Authorization logic checking whether the authenticated user has explicit rights to perform an action on a specific resource.
* **Validators:** Dedicated validation classes returning typed errors array without terminating the script.

---

## 5. Authentication Architecture

* **Session Management:**
  * Custom `Session` wrapper setting `session.cookie_httponly = 1`, `session.cookie_secure = (auto-detected HTTPS)`, and `session.cookie_samesite = 'Lax'`.
  * Session ID is regenerated on login (`session_regenerate_id(true)`) to prevent session fixation attacks.
  * Idle session timeout: 120 minutes of inactivity destroys the session.
* **Password Hashing:**
  * Uses PHP's native `password_hash($password, PASSWORD_BCRYPT, ['cost' => 12])` or `PASSWORD_ARGON2ID` if available.
  * Constant-time verification with `password_verify()`.
  * Automatic rehashing support via `password_needs_rehash()`.
* **Account Status & Brute-Force Protection:**
  * Accounts can have statuses: `active`, `suspended`, `pending_verification`.
  * Rate-limiting on login endpoint: max 5 failed attempts per IP / username per 15 minutes before temporary lockout.
* **CSRF Token Protocol:**
  * Synchronizer token pattern. Every session creates a cryptographically secure random token (`bin2hex(random_bytes(32))`).
  * Injected as a hidden input `_csrf_token` in all HTML forms and verified by `CsrfMiddleware`.

---

## 6. Authorization & RBAC Architecture

The system implements a granular **Role-Based Access Control (RBAC)** model with hierarchical default roles and decoupled permission flags:

### Roles
1. **Platform Super Admin:** SaaS infrastructure owner. Oversees all organizations, manages subscriptions, monitors system health.
2. **Organization Owner:** Primary company executive. Full control over company settings, billing, administrators, departments, and operations.
3. **Organization Admin:** High-level administrator. Manages user accounts, organizational structure, global settings.
4. **HR Manager:** Human resources specialist. Manages employee profiles, leave approvals, attendance auditing, documents, and reports.
5. **Department Manager:** Team supervisor. Views department staff, approves/rejects team leave requests, reviews team attendance.
6. **Employee:** Standard staff member. Clocks in/out, views personal attendance records, submits leave requests, uploads personal documents, views announcements.

### Permission Matrix (Selected Core Permissions)
* `employees.view`, `employees.create`, `employees.update`, `employees.delete`, `employees.export`
* `departments.view`, `departments.manage`
* `positions.view`, `positions.manage`
* `attendance.clock`, `attendance.view_own`, `attendance.view_department`, `attendance.view_all`, `attendance.manage`
* `leave.request`, `leave.view_own`, `leave.view_department`, `leave.approve`, `leave.manage_types`
* `documents.upload_own`, `documents.view_own`, `documents.view_all`, `documents.manage`
* `reports.view`, `audit.view`, `settings.manage`

Permissions are cached in the user's session during login and evaluated using:
`$user->can('leave.approve')` or within views: `<?php if ($user->can('employees.create')): ?> ... <?php endif; ?>`.

---

## 7. Database Architecture Principles

* **Engine:** InnoDB exclusively for ACID compliance, row-level locking, and foreign key integrity.
* **Character Set & Collation:** `utf8mb4` with `utf8mb4_unicode_ci` for universal Unicode and emoji support.
* **Primary Keys:** `id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`.
* **Foreign Keys:** Strict referential integrity (`ON DELETE RESTRICT` or `ON DELETE CASCADE` where appropriate, e.g., deleting a draft organization cascades, but deleting an employee is restricted if audit/attendance records exist).
* **Timestamps:** Every table contains `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` and `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`.
* **Soft Deletes:** Critical business entities (`employees`, `departments`, `positions`) contain `deleted_at TIMESTAMP NULL DEFAULT NULL` to prevent accidental data destruction and maintain historic audit integrity.

---

## 8. Audit Logging Architecture

Every business-critical mutation triggers an immutable audit log entry via `AuditService::log()`:
* **Payload Structure:**
  * `id`: BIGINT UNSIGNED PK
  * `organization_id`: Tenant context
  * `user_id`: Acting user (NULL if system action)
  * `action`: Action verb (`employee.created`, `leave.approved`, `attendance.overridden`, `auth.login_failed`)
  * `entity_type`: Target entity (`Employee`, `LeaveRequest`, `User`)
  * `entity_id`: Target primary key
  * `old_values`: JSON representation of previous state (for updates)
  * `new_values`: JSON representation of updated state
  * `ip_address`: Client IPv4/IPv6 address
  * `user_agent`: Sanitized browser agent string
  * `created_at`: Exact timestamp

Audit logs cannot be modified or deleted through the user interface under any role.

---

## 9. Security Architecture & Threat Model

| Threat | Mitigation Architecture |
|---|---|
| **SQL Injection (SQLi)** | 100% prepared statements via PDO with parameter binding. Never concatenate variables into SQL strings. |
| **Cross-Site Scripting (XSS)** | Contextual output escaping helper `e($string)` wrapping `htmlspecialchars($str, ENT_QUOTES, 'UTF-8')` applied across all template views. |
| **Cross-Site Request Forgery (CSRF)** | Crypto-secure synchronizer tokens enforced on every mutating HTTP method (POST, PUT, DELETE) via middleware. |
| **Broken Object Level Auth (IDOR)** | Every query enforces `WHERE id = :id AND organization_id = :tenant_id`. Authorization policies check ownership. |
| **Mass Assignment** | Controllers and Validators define strict whitelists of fillable attributes before passing data to entities. |
| **Arbitrary File Upload** | Uploads stored strictly outside `public/` directory in `storage/uploads/`. File extension re-checked against server-side MIME detection (`finfo`). Uploaded files renamed to random UUID hashes. Served only via authenticated streaming controller (`readfile()`). |
| **Session Fixation & Hijacking** | Regenerate session ID on privilege changes. Flag cookies `HttpOnly`, `SameSite=Lax`, and `Secure` over HTTPS. |

---
*End of Document 01*
