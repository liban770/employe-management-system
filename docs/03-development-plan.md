# Document 03: Development Plan & Phased Roadmap

**Project:** StaffCore SaaS — Enterprise Employee Management Platform  
**Document Version:** 1.0.0  
**Methodology:** Phased Iterative Delivery with Strict Quality Gates  
**Author:** Technical Project Lead & Senior Architect  
**Status:** Approved for Development Baseline Review  

---

## 1. Development Principles & Quality Gates

To prevent technical debt, security regressions, and incomplete half-features, this project enforces strict engineering rules:
1. **Zero Skipping:** No phase may begin until the preceding phase meets its exit criteria (implementation verified, automated tests pass, zero unresolved high-severity bugs).
2. **Explicit Verification:** Every phase concludes with:
   * Architecture & Code Review against the four foundational documents.
   * Security & Tenant-Isolation verification.
   * Semantic Git commit reflecting the milestone.
3. **Continuous Integration Mindset:** All shared interfaces (data models, service contracts, view helpers) are finalized before parallel development begins.

---

## 2. Phased Development Roadmap

### Phase 0: System Architecture & Foundation Documentation (Current Phase)
* **Deliverables:**
  * `01-architecture.md`: System topology, layers, security model, multi-tenancy design.
  * `02-project-definition.md`: Product scope, user personas, module requirements, MVP boundaries.
  * `03-development-plan.md`: Step-by-step phased execution roadmap with acceptance criteria.
  * `04-constraints.md`: Technical, security, database, and UI/UX constraints.
* **Exit Gate:** Architectural sign-off, contradiction audit, resolution of potential bottlenecks before touching application code.

---

### Phase 1: Project Skeleton & Core Framework Foundation
* **Deliverables:**
  * Clean directory structure following `01-architecture.md`.
  * `.env.example`, `.env` configuration loader with strict type casting.
  * `Core\Database.php`: Resilient PDO wrapper, UTF8MB4 configuration, prepared statement helpers, transaction support (`beginTransaction`, `commit`, `rollback`).
  * `Core\Router.php`: Fast regex-based routing supporting GET, POST, PUT, DELETE, route parameters (e.g. `/employees/{id}`), and middleware pipelines.
  * `Core\Request.php` & `Core\Response.php`: Clean HTTP abstractions with JSON and view responders.
  * `Core\Session.php`: Hardened session management (SameSite, HttpOnly, secure flags, flash messages).
  * `Core\View.php`: Master layout rendering engine with layout inheritance, component partials, and automatic XSS escaping helper `e()`.
  * Asset pipeline: Modern Tailwind CSS build setup, global base stylesheet, responsive shell layout.
  * Custom exception handler preventing stack trace leaks to production users while logging to `storage/logs/app.log`.
* **Exit Gate:** Application boots successfully; routing responds with clean master layout; database connection succeeds.

---

### Phase 2: Relational Database Architecture & Migrations
* **Deliverables:**
  * SQL Migrations:
    * `001_create_tenants_and_auth_tables.sql`: `organizations`, `users`, `roles`, `permissions`, `role_permissions`, `user_roles`.
    * `002_create_organization_structure_tables.sql`: `departments`, `positions`, `work_schedules`.
    * `003_create_employee_tables.sql`: `employees`, `emergency_contacts`.
    * `004_create_attendance_and_leave_tables.sql`: `attendance_records`, `leave_types`, `leave_balances`, `leave_requests`.
    * `005_create_documents_and_audit_tables.sql`: `documents`, `announcements`, `notifications`, `audit_logs`, `organization_settings`.
  * Seeders:
    * `RolePermissionSeeder`: Standard SaaS roles and atomic permissions.
    * `DemoOrganizationSeeder`: Realistic demo tenant ("Acme Technologies") with departments, job positions, and pre-configured staff accounts across all personas.
  * Foreign key constraints, compound indices on `(organization_id, ...)` and cascade policies configured.
* **Exit Gate:** Migrations run cleanly on fresh database; seeders execute without error; database foreign keys verify referential integrity.

---

### Phase 3: Authentication & Security Engine
* **Deliverables:**
  * `AuthService`: Credential verification via `password_verify()`, session generation, session ID regeneration, rate-limiting on failed attempts.
  * `AuthController`: Login form rendering, login POST handler, secure logout handler.
  * `AuthMiddleware`: Enforces active session on protected routes; redirects guests to `/login`.
  * `GuestMiddleware`: Redirects authenticated users from login page to dashboard.
  * `CsrfMiddleware`: Generates and verifies cryptographic tokens on all non-GET requests.
  * Security helpers: `csrf_token()`, `csrf_field()`.
* **Exit Gate:** Secure login and logout operational; invalid credentials rejected; brute force attempt throttled; CSRF spoofing blocked.

---

### Phase 4: SaaS Multi-Tenancy & RBAC Authorization Layer
* **Deliverables:**
  * `TenantMiddleware`: Extracts authenticated user's `organization_id`, initializes `TenantContext`, and makes tenant attributes globally available to the request cycle.
  * `PermissionMiddleware`: Verifies `$user->hasPermission('...')` against active route metadata.
  * `BaseRepository`: Enforces automatic tenant scoping `AND organization_id = :tenant_id` on all queries.
  * Explicit Multi-Tenancy Penetration Test:
    * Tenant A user attempts to read Tenant B employee via direct URL manipulation (`/employees/view?id=999`).
    * Verifies that the system throws a strict `404 Not Found` or `403 Forbidden` response and records a security audit entry.
* **Exit Gate:** Zero data leakage between distinct organizations; RBAC permissions restrict unauthorized menu items and endpoints.

---

### Phase 5: Employee Management Module
* **Deliverables:**
  * `EmployeeRepository`, `EmployeeService`, `EmployeeController`.
  * Employee Directory: Paginated data table, live text search, department & status filter dropdowns, sorting by name/code/date.
  * Employee Creation Wizard: Multi-field form with client-side and server-side validation (unique employee code per organization, valid email, required dates).
  * Tabbed Employee Profile View:
    * Overview (Personal details, contact cards, emergency contacts).
    * Employment (Department, Position, Manager, Contract type, Joining date).
    * Attendance (Personal punch records).
    * Leave (Balance summary & leave history).
    * Documents (Uploaded files with download action).
    * Activity Log (Timeline of changes).
  * Edit & Deactivation (Soft delete) workflows with status badge updates.
* **Exit Gate:** Full CRUD lifecycle for employees operational; validation errors render gracefully; tenant isolation maintained.

---

### Phase 6: Organizational Structure (Departments & Positions)
* **Deliverables:**
  * `DepartmentController`, `PositionController`, associated Services and Repositories.
  * Department Management: List departments, view headcount, create department, edit department, assign Department Manager.
  * Position Management: List positions linked to departments, create position, view employee roster per position.
  * Safety guards preventing deletion of departments with active staff members.
* **Exit Gate:** Departments and positions link seamlessly to the employee onboarding wizard.

---

### Phase 7: Attendance & Time Tracking Module
* **Deliverables:**
  * `AttendanceService`, `AttendanceRepository`, `AttendanceController`.
  * Digital Punch Card Component: Live clock, 1-click Clock In / Clock Out, daily elapsed timer.
  * Automated Status Calculation: Compares clock-in time with organization shift start time + grace period; marks as `Present` or `Late`.
  * Attendance Oversight Grid: HR and Department Managers can filter daily attendance across company/department.
  * Manual Punch Adjustment: HR override with required audit justification note.
* **Exit Gate:** Punch in/out works in real-time; daily work duration calculates accurately; late arrivals flagged correctly.

---

### Phase 8: Leave Management & Approval Engine
* **Deliverables:**
  * `LeaveService`, `LeaveRepository`, `LeaveController`.
  * Leave Request Modal: Type selector (Annual, Sick, Casual, Unpaid), date range picker, automatic business day calculation, balance verification.
  * Conflict Prevention: Prevents overlapping leave requests for the same employee.
  * Approval Queue for Managers & HR: Review pending requests with one-click Approve or Reject (mandatory rejection reason).
  * Automated Balance Deduction: Deducts allocated days immediately upon approval; restores balance if cancelled.
* **Exit Gate:** Leave submission checks balance; approval updates quota; email/in-app notifications trigger.

---

### Phase 9: Secure Document Vault
* **Deliverables:**
  * `DocumentService`, `DocumentRepository`, `DocumentController`.
  * Document Upload Component: Category selection (Contract, ID, Certificate, Tax), drag-and-drop file target.
  * Security Pipeline:
    * Server-side extension check against whitelist (`.pdf`, `.png`, `.jpg`, `.docx`).
    * MIME sniffing with `finfo_file()` to reject renamed executables.
    * Storage outside public root (`storage/uploads/org_{id}/[uuid].[ext]`).
  * Secure Download Streamer: Validates session ownership before binary file streaming (`Content-Type`, `Content-Disposition`).
* **Exit Gate:** Private files inaccessible via direct URL; authorized users can view and download; invalid file types rejected.

---

### Phase 10: Notifications & Corporate Announcements
* **Deliverables:**
  * `NotificationService`: Dispatches in-app notification records on leave requests, approvals, and system alerts.
  * UI Notification Center: Topbar bell icon with unread badge counter, popover drawer, and "Mark as Read" action.
  * Announcement Management: Admin interface to publish company-wide or department-specific broadcasts with priority flags.
* **Exit Gate:** In-app notifications deliver instantly upon workflow events; announcements display on employee dashboard.

---

### Phase 11: Reports & Business Intelligence
* **Deliverables:**
  * `ReportService`, `ReportController`.
  * Employee Demographic Report: Headcount, department distribution, turnover rate.
  * Attendance Summary Report: Aggregate work hours, late clock-ins, and absenteeism rates.
  * Leave Utilization Report: Days taken by type and department.
  * Streaming CSV Export Engine: Outputs clean CSV with RFC 4180 compliance without loading entire datasets into PHP memory.
  * Print-Friendly Stylesheets: Clean `@media print` CSS for browser printing.
* **Exit Gate:** Reports render accurate metrics; CSV downloads correctly open in Excel/Sheets with intact formatting.

---

### Phase 12: Centralized Audit Trail & Governance
* **Deliverables:**
  * `AuditService`: Interceptor logging entity mutations with before/after state snapshots.
  * Audit Log Viewer: Read-only searchable table with filters for User, Action, Entity, and Date Range.
  * Security immutability: Complete absence of delete/edit routes for audit records.
* **Exit Gate:** Every create/update/delete across all modules leaves a traceable audit record.

---

### Phase 13: UI/UX Refinement & Polishing
* **Deliverables:**
  * Design Consistency Audit: Enforce strict design tokens (Tailwind Slate/Indigo palette, typography hierarchy, zero decorative clutter).
  * Micro-interactions: Accessible modals, dropdowns, keyboard navigation (`Escape` closes modals), and toast feedback.
  * Responsive Viewport Testing: Seamless layout transition across 1440px desktop, tablet, and mobile views.
* **Exit Gate:** Interface feels like a cohesive, polished, professional SaaS tool.

---

### Phase 14: Security Hardening & Penetration Testing
* **Deliverables:**
  * Automated & Manual Verification:
    * SQLi: Injection payload testing on all query parameters.
    * XSS: Script injection attempts on text fields (`<script>`, `onerror=`).
    * CSRF: Form submissions without or with corrupted `_csrf_token`.
    * IDOR: Cross-tenant URL parameter manipulation.
    * Broken Access: Unauthenticated direct access to administrative endpoints.
* **Exit Gate:** Zero identified vulnerabilities across OWASP Top 10 vectors.

---

### Phase 15: Quality Assurance & Functional Testing
* **Deliverables:**
  * End-to-end user journey tests across all 6 personas (Platform Super Admin, Org Owner, Org Admin, HR Manager, Department Manager, Employee).
  * Boundary condition testing (e.g. leap years, overlapping leave, 0-day requests, empty search results).
* **Exit Gate:** All core workflows pass without errors or UI glitches.

---

### Phase 16: Production Readiness & Deployment Documentation
* **Deliverables:**
  * Production `.env` guidelines and security checklist.
  * Web server configuration templates (`.htaccess` for Apache, `nginx.conf` for Nginx).
  * Database backup and restore procedures.
  * Complete operational `README.md`.
* **Exit Gate:** System is turnkey deployable on standard PHP 8.2+ hosting or VPS environments.

---

## 3. Collaborative Team Workflow & Responsibility Split

When developing in tandem (e.g., Lead Architect / Backend Engineer & Frontend / UI Engineer):

```text
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│       DEVELOPER A (Backend/DB)       │     │       DEVELOPER B (Frontend/UI)      │
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ • Database schema & migrations       │     │ • Tailwind CSS design system         │
│ • Core framework & routing           │     │ • Layouts, Topbar, Sidebar, Nav      │
│ • Repositories & SQL queries         │     │ • Accessible Modal & Form components │
│ • Business logic Services            │ ◄─► │ • Data tables & responsive cards     │
│ • Tenant isolation & security        │     │ • Client-side input validation UX    │
│ • Session, Auth & RBAC Middleware    │     │ • Vanilla JS interactions & toasts   │
│ • CSV export & file streaming        │     │ • Print styles & dashboard widgets   │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
                   ▲                                            ▲
                   └───────────── SHARED CONTRACTS ─────────────┘
                               • API & Route definitions
                               • View variable naming conventions
                               • Database entity attributes
                               • Security & CSRF token contracts
```

---

## 4. Pull Request & Quality Standards

Every feature branch and pull request must satisfy:
1. **Scope Alignment:** Delivers strictly what is specified in Document 02 without unapproved feature creep.
2. **Tenant Scoping:** All database queries explicitly include tenant constraints.
3. **Input Sanitization & Output Escaping:** Every dynamic variable in templates is rendered via `e($var)`.
4. **Audit Logging:** Any state-mutating operation logs to `audit_logs`.
5. **Clean Git History:** Meaningful conventional commit messages (e.g. `feat(leave): add balance deduction on approval`).

---
*End of Document 03*
