# Document 04: Technical, Architectural, Security & UI/UX Constraints

**Project:** StaffCore SaaS — Enterprise Employee Management Platform  
**Document Version:** 1.0.0  
**Target Environment:** PHP 8.2+, MySQL 8+, Tailwind CSS, Vanilla JS  
**Author:** Senior Software Architect & Lead UI/UX Designer  
**Status:** Approved for Architectural Baseline Review  

---

## 1. Technology Constraints

* **Backend Engine:** Native PHP 8.2+ utilizing modern features (constructor property promotion, match expressions, typed class constants, readonly classes, intersection types).
* **Framework Constraint:** No heavy third-party PHP frameworks (e.g., full Laravel or Symfony full-stack) to ensure lean performance, deep understanding of internals, zero dependency bloat, and trivial portability across shared hosting/XAMPP/VPS. All routing, DI, and MVC abstractions are custom, lightweight, and audit-friendly.
* **Database Engine:** MySQL 8.0+ / MariaDB 10.5+ running InnoDB with strict SQL mode (`STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION`).
* **Frontend Core:** Semantic HTML5, Tailwind CSS for atomic, responsive styling.
* **JavaScript:** Pure Vanilla ECMAScript 6+ (Fetch API, DOM manipulation, custom events). No heavy SPA runtime (React, Vue, Angular) required for the core server-rendered PHP monolith, ensuring near-instant page loads and zero hydration overhead.
* **Local Development:** XAMPP / LAMP / Valet / Docker compatible.
* **Version Control:** Git with GitHub workflow; semantic commit conventions enforced.

---

## 2. Architectural Constraints

* **Strict Separation of Concerns:**
  * **Controllers** must never execute SQL queries or contain complex business formulas. Maximum recommended controller method length: 25 lines.
  * **Views** must contain zero SQL, zero business logic, and zero direct session mutations. Views are strictly limited to display formatting and conditional rendering loops.
  * **Repositories** are the sole layer permitted to construct and execute SQL queries.
  * **Services** encapsulate all domain workflows (e.g., leave approval balance deduction + notification dispatch + audit log creation).
* **DRY & Reusability:** No repeated SQL queries across endpoints. Common data queries (e.g., active department list, tenant user count) must be centralized in their respective Repositories.
* **Zero Cross-Tenant Leakage:** Every multi-tenant database interaction MUST explicitly bind the active `organization_id` derived from the verified session.

---

## 3. Database Constraints

* **Password Security:** Never store plaintext passwords, MD5, or SHA1 hashes. Only `PASSWORD_BCRYPT` (cost 12) or `PASSWORD_ARGON2ID` are permitted.
* **Prepared Statements Exclusively:** Zero SQL string concatenation. All dynamic values must be passed as parameterized bindings into PDO statements.
* **No Unindexed Foreign Keys:** Every foreign key column (`organization_id`, `department_id`, `employee_id`, `user_id`) must have an explicit B-tree index to guarantee JOIN performance.
* **Compound Indexes for Multi-Tenancy:** Critical tables must employ compound indexes combining the tenant discriminator with search fields (e.g., `INDEX idx_emp_org_status (organization_id, status)`).
* **Relational Integrity Over JSON:** Avoid storing structured relational data (such as permission lists, department rosters, or leave history) inside unstructured JSON columns. Use normalized tables (`roles`, `permissions`, `role_permissions`). JSON is reserved strictly for immutable audit snapshots (`old_values`, `new_values`).

---

## 4. Security Constraints & Defensive Engineering

* **Parameter Manipulation Defense (IDOR):**
  A user must never gain unauthorized access simply by altering URL query parameters such as `?id=123`, `?employee_id=456`, or `?organization_id=789`. All requests must verify that the requested entity belongs to the user's authenticated tenant organization AND that the user possesses the required permission.
* **CSRF Protection:** Every mutating HTTP method (`POST`, `PUT`, `DELETE`) must validate a cryptographically secure token passed via `_csrf_token`.
* **Output Escaping:** All output rendered in templates must pass through the `e()` helper function (`htmlspecialchars($val, ENT_QUOTES, 'UTF-8')`) unless explicitly generated as sanitized HTML by an authorized service.
* **Protected File Uploads:**
  * No uploaded files may be placed inside the public web server directory (`public/uploads/` is strictly prohibited).
  * Storage directory must reside outside webroot (`storage/uploads/`).
  * Real file content validation using PHP's `finfo` (MIME checking) rather than trusting client-provided `$_FILES['...']['type']` or file extension.
  * Files must be renamed to cryptographically random UUID strings upon storage.
  * Downloads must be streamed through an authorized PHP controller that validates tenant context before sending `header('Content-Type: ...')` and invoking `readfile()`.
* **Error & Information Leakage:**
  * Display of raw PHP exceptions, database errors, or stack traces is disabled in non-development environments (`display_errors = 0`).
  * All application errors are written to an encrypted or protected log file (`storage/logs/app.log`).
  * End users see clean, friendly error screens (403 Forbidden, 404 Not Found, 500 Server Error).

---

## 5. UI/UX & Visual Design Constraints

### 5.1 Anti-Patterns (Strictly Forbidden)
* ❌ No neon or saturated rainbow color schemes.
* ❌ No excessive, distracting full-screen gradients.
* ❌ No gratuitous glassmorphism across every surface (no transparent cards that make text illegible).
* ❌ No oversized, fluffy border radiuses (avoid `rounded-3xl` or pill buttons for primary enterprise controls).
* ❌ No giant marketing hero banners inside an operational SaaS dashboard.
* ❌ No random, unaligned animations or bouncy transitions.
* ❌ No template-looking layouts with empty, non-functional filler widgets.

### 5.2 Enterprise SaaS Visual Identity
* **Design Philosophy:** Minimalist, high information density, calm, enterprise-grade, precision typography, purposeful white space.
* **Color System:**
  * **Neutrals:** Slate / Zinc (`slate-50` background, `slate-900` primary text, `slate-600` secondary text, `slate-200` subtle borders).
  * **Brand Primary:** Deep Indigo / Slate Blue (`indigo-600` primary buttons, active tabs, brand accents).
  * **Semantic Indicators:**
    * *Success:* Emerald (`emerald-600`, `bg-emerald-50`, `text-emerald-700`) for Active status, Approved leave, Present attendance.
    * *Warning / Pending:* Amber (`amber-500`, `bg-amber-50`, `text-amber-700`) for Pending approvals, Late arrivals.
    * *Danger / Error:* Rose (`rose-600`, `bg-rose-50`, `text-rose-700`) for Terminated status, Rejected leave, Absent records.
    * *Info:* Sky (`sky-600`, `bg-sky-50`, `text-sky-700`) for System notifications, In-review status.
* **Glassmorphism Discipline:**
  * Glass effects are restricted strictly to:
    1. Top navigation bar (`backdrop-blur-md bg-white/90 border-b border-slate-200/80`).
    2. Modal dialog backdrops (`backdrop-blur-sm bg-slate-900/40`).
    3. Floating dropdown menus and command palettes (`backdrop-blur-md bg-white/95 shadow-lg border border-slate-200/80`).
  * Standard data cards and tables must use clean, solid opaque backgrounds (`bg-white border border-slate-200 shadow-xs`) for maximum contrast and legibility.

### 5.3 Typography Hierarchy
* Font Family: Modern clean sans-serif (`Inter`, system-ui, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, sans-serif).
* Scale:
  * Page Title: `text-xl font-bold text-slate-900 tracking-tight`
  * Section Title / Card Header: `text-base font-semibold text-slate-800`
  * Body Text: `text-sm font-normal text-slate-700`
  * Secondary / Meta Text: `text-xs font-medium text-slate-500`
  * Micro Badge Text: `text-[11px] font-semibold uppercase tracking-wider`

---

## 6. Reusable Component Specifications

Every view must be assembled from standardized, reusable UI component patterns:

| Component | Visual Specification | Behavior & UX |
|---|---|---|
| **Button Primary** | `bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md shadow-xs transition-colors focus:ring-2 focus:ring-indigo-500/20` | Subtle active state, disabled state with `opacity-50 cursor-not-allowed`. |
| **Button Secondary**| `bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium px-4 py-2 rounded-md transition-colors` | Neutral secondary action. |
| **Form Input** | `block w-full rounded-md border-slate-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs py-2 px-3` | Displays inline error message below input in `text-xs text-rose-600 mt-1`. |
| **Badge** | `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium` with semantic colors (Emerald, Amber, Rose, Sky) | Provides instant visual status indicator for attendance, leave, and employment. |
| **Data Table** | `min-w-full divide-y divide-slate-200 bg-white text-left text-sm` with `thead` in `bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold` | Zebra hovering (`hover:bg-slate-50/60`), sortable header indicators, clean pagination footer. |
| **Modal Dialog** | Fixed overlay (`bg-slate-900/40 backdrop-blur-xs`), centered white card (`rounded-lg shadow-xl max-w-lg w-full border border-slate-200 p-6`) | Closes on `Escape` key or backdrop click; traps focus. |
| **Toast Alert** | Fixed bottom-right popover (`bg-slate-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3`) | Auto-dismisses after 4 seconds; supports Success, Error, and Warning variants. |

---

## 7. Performance & Query Standards

* **Pagination by Default:** All listings (employees, attendance logs, leave requests, audit trails) must be paginated (default 15–25 rows per page). Unbounded `SELECT * FROM table` queries are forbidden.
* **Eager Loading Pattern:** When displaying lists of employees with their departments and positions, queries must use explicit SQL `JOIN`s to fetch related labels in a single query, rather than executing separate queries inside a PHP loop ($N+1$ query defect).
* **Streaming CSV Exports:** Large report downloads must stream directly to the output buffer using `fputcsv(fopen('php://output', 'w'))` with chunked database cursors to keep memory consumption under 8MB regardless of dataset size.

---

## 8. Development Discipline & Git Standards

* **The 10 Architectural Questions for Every Feature:**
  1. *What business problem does this solve?*
  2. *Who (which persona) is authorized to use it?*
  3. *What data entities and relations does it require?*
  4. *What explicit RBAC permission is required?*
  5. *What organization owns this data, and how is tenant isolation guaranteed?*
  6. *What failure scenarios exist, and how are errors communicated to the user?*
  7. *What mutation details must be logged to `audit_logs`?*
  8. *How can this feature be verified through automated or manual test cases?*
  9. *Is this implementation clean, documented, and easily maintainable by another engineer?*
  10. *Does this design scale cleanly in a multi-tenant cloud environment?*
* **Git Commit Guidelines:**
  * Format: `type(scope): concise imperative description`
  * Examples: `feat(attendance): add grace period check for late arrivals`, `fix(security): sanitize download filename to prevent directory traversal`.
  * Strict prohibition: Never commit credentials, `.env`, local database dumps, or private uploaded files to source control.

---
*End of Document 04*
