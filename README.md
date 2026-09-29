# StaffCore SaaS — Enterprise Employee Management System

A multi-tenant, cloud-ready **Human Resources & Employee Operations SaaS Platform** built with **PHP 8.2+**, **MySQL 8+**, **Tailwind CSS**, and **Vanilla ECMAScript 6+**.

---

## 1. Architectural Highlights

* **Strict Multi-Tenancy:** Shared database with discriminator column (`organization_id`). Tenant context is established exclusively from verified server-side session credentials—never from user-controllable query parameters, headers, or form fields.
* **Modular MVC-Inspired Design:** Thin Controllers, domain Services, dedicated Repositories with PDO prepared statements, and atomic RBAC Policies.
* **Defense-in-Depth Security:**
  * Contextual output escaping helper `e()` across all views.
  * Synchronizer CSRF tokens (`CsrfMiddleware`) enforced on all mutating HTTP methods.
  * Password hashing using `password_hash()` with BCrypt (cost factor 12).
  * Storage of confidential staff files strictly outside the public web root (`storage/uploads/`), streamed via authenticated binary controllers after MIME type sniffing (`finfo`).
  * Session hardening: `SameSite=Lax`, `HttpOnly`, `Secure`, and automatic session ID regeneration on login (`session_regenerate_id(true)`).
* **Immutable Audit Trail:** All mutations (creations, profile updates, status changes, shift clock-ins, leave approvals) write append-only records with before/after state deltas, IP addresses, and user agent signatures.

---

## 2. Directory Structure

```text
├── app/
│   ├── Controllers/               # Web & API HTTP handlers
│   ├── Core/                      # Application, Database, Request, Response, Router, Session, View
│   ├── Middleware/                # Auth, Csrf, Tenant, and Permission pipelines
│   ├── Models/                    # Domain Entities & DTOs
│   ├── Repositories/              # BaseRepository & tenant-isolated SQL queries
│   └── Services/                  # Business logic & transaction orchestration
├── config/
│   ├── app.php                    # Application settings, timezone, debug flags
│   ├── database.php               # MySQL PDO parameters
│   └── session.php                # Hardened session & cookie flags
├── database/
│   ├── migrations/                # Versioned SQL migrations (Tenants, Employees, Attendance, Leave, Docs)
│   └── seeds/                     # Core roles, permission matrix, and demo tenants
├── docs/                          # Architecture & design specifications
│   ├── 01-architecture.md
│   ├── 02-project-definition.md
│   ├── 03-development-plan.md
│   └── 04-constraints.md
├── public/                        # Only directory exposed to web server
│   ├── index.php                  # Front Controller & PSR-4 autoloader
│   └── .htaccess                  # Apache mod_rewrite router
├── resources/                     # Server-rendered layouts & component views
├── routes/                        # web.php HTTP route definitions
├── storage/                       # Protected logs and tenant uploads (outside webroot)
└── src/                           # Live interactive SaaS application UI & live test suite
```

---

## 3. Local Development (XAMPP / LAMP / Valet)

### 3.1 Database Setup (phpMyAdmin or MySQL CLI)
1. Start Apache & MySQL in your XAMPP Control Panel.
2. Create a new database:
   ```sql
   CREATE DATABASE staffcore_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the migration scripts in order:
   - `database/migrations/001_create_tenants_and_auth_tables.sql`
   - `database/migrations/002_create_organization_structure_tables.sql`
   - `database/seeds/001_roles_and_permissions.sql`

### 3.2 Virtual Host Configuration (Apache)
Point your web server's DocumentRoot strictly to the `/public` folder:
```apache
<VirtualHost *:80>
    ServerName staffcore.local
    DocumentRoot "C:/xampp/htdocs/employee-management/public"
    <Directory "C:/xampp/htdocs/employee-management/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

---

## 4. Default Seeded Accounts & Roles

| Role | Email | Password | Scope & Responsibilities |
|---|---|---|---|
| **Organization Owner** | `victoria@apexglobal.com` | `Secret123!` | Full tenant administrative & strategic control |
| **HR Manager** | `marcus.hr@apexglobal.com` | `Secret123!` | Employee directory, leave approvals, attendance overrides |
| **Department Manager** | `elena.eng@apexglobal.com` | `Secret123!` | Team roster oversight and leave approval |
| **Employee** | `david.chen@apexglobal.com` | `Secret123!` | Self-service attendance clock, leave submissions, documents |
| **Secondary Tenant Owner** | `arthur@biohealthlab.org` | `Secret123!` | Separate tenant (BioHealth Research Lab) |

---

## 5. Automated Verification & Testing
The system includes an integrated **Security & Tenant Isolation Test Suite** accessible from the left navigation menu. It runs simulated attack assertions covering:
- Cross-Tenant IDOR parameter tampering (`?organization_id=2`)
- Cross-Tenant direct entity manipulation (`/employees/view?id=999`)
- SQL Injection in search parameters (`' OR 1=1 --`)
- Cross-Site Request Forgery (POST without `_csrf_token`)
- Role privilege escalation
