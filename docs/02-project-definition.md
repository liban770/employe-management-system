# Document 02: Project Definition & Functional Specifications

**Project Name:** StaffCore SaaS — Enterprise Employee Management Platform  
**Document Version:** 1.0.0  
**Target Environment:** PHP 8.2+, MySQL 8+, Tailwind CSS, Vanilla JS  
**Author:** Senior SaaS Product Engineer & Technical Lead  
**Status:** Approved for Functional Baseline Review  

---

## 1. Product Name & Positioning

**Working Title:** `StaffCore` (Employee Management Platform)  
**Positioning:** A multi-tenant, cloud-ready SaaS Human Resources & Employee Management Platform engineered for growing businesses, startups, educational institutions, and NGOs. It delivers enterprise-grade operational efficiency, tenant data isolation, audit compliance, and intuitive workforce self-service without the bloat of legacy enterprise suites.

---

## 2. Product Objective

StaffCore replaces disconnected spreadsheets, email threads, and paper forms with a unified, role-aware system of record. The platform enables organizations to:
1. Maintain accurate, audit-ready employee master data and organizational charts.
2. Automate daily attendance tracking with one-click employee clock-in/out and manager verification.
3. Streamline leave management with real-time balance calculations, automated approval workflows, and conflict prevention.
4. Securely archive confidential employment documents (contracts, tax forms, IDs, certifications).
5. Enforce granular Role-Based Access Control (RBAC) and maintain an unalterable audit log for governance.
6. Provide executive visibility through real-time operational analytics and exportable reports.

---

## 3. Target User Personas & Permissions

| Persona | Scope of Authority | Key Tasks & Objectives |
|---|---|---|
| **Platform Super Admin** | Cross-Organization / System Infrastructure | Onboard new organizations, monitor tenant resource usage, review global audit logs, configure platform-wide system settings. |
| **Organization Owner** | Single Organization (Full Ownership) | Configure company profile, work week, business hours, assign Organization Admins & HR Managers, review executive reports. |
| **Organization Admin** | Single Organization (Administrative Operations) | Manage departments, job positions, system users, permission assignments, company policies, and announcement broadcasts. |
| **HR Manager** | Single Organization (Human Capital Operations) | Full employee lifecycle management (create, onboard, edit, deactivate), approve/reject leave requests, audit attendance, manage employee documents, export payroll-ready reports. |
| **Department Manager** | Department Scope | Review attendance of direct and indirect reports within assigned department, approve or recommend department leave requests, view department roster. |
| **Employee** | Personal Scope (Self-Service) | One-click daily clock-in/clock-out, view personal attendance logs, submit leave requests with balance check, upload permitted verification documents, review corporate announcements. |

---

## 4. Core Modules & Detailed Specifications

### Module 1: Executive & Role-Based Dashboard
* **Dynamic Views by Role:**
  * *Organization Admin / HR:* Real-time KPI metric cards (Total Headcount, Active Employees, Present Today, Absent Today, On Leave, Pending Leave Requests). Quick action bar (Add Employee, New Announcement, Review Approvals). Visual attendance distribution breakdown and recent 10 organizational audit actions.
  * *Department Manager:* Department headcount, team members present today, pending team leave requests, upcoming team absences.
  * *Employee:* Today's clock-in status timer, remaining leave balance summaries by type (Annual, Sick, Casual), recent personal attendance history, company announcements feed.
* **Information Design:** Clean typography, purposeful numerical metrics, no decorative or redundant charts.

### Module 2: Employee Management & Directory
* **Directory Features:**
  * Searchable table with instant filtering by Department, Position, Employment Type (Full-time, Part-time, Contract, Intern), and Status (Active, On Leave, Suspended, Terminated).
  * Server-side pagination with configurable page sizes (10, 25, 50).
  * Sortable columns: Name, Employee Code, Department, Position, Joining Date, Status.
* **Employee Lifecycle Actions:**
  * Create employee with auto-generated or custom Employee ID Code (e.g. `EMP-00104`).
  * Dedicated Comprehensive Profile view divided into functional tabs:
    1. *Overview:* Contact info, work email, emergency contacts, profile photo avatar.
    2. *Employment Details:* Department, Position, Reporting Manager, Employment Type, Work Location, Joining Date, Probation End Date.
    3. *Attendance:* Historical punch records with late/early flags and summary statistics.
    4. *Leave:* Leave request history, accumulated balances, and approved days.
    5. *Documents:* Secure document repository tagged by category.
    6. *Activity & Audit:* Timestamped timeline of all profile updates and status transitions.
  * Edit, Deactivate, and Soft Delete / Archive workflows with mandatory reason capture.

### Module 3: Organization Management
* **Company Profile:** Legal organization name, brand logo, registration number, primary contact email, telephone, physical address.
* **Workplace Parameters:** Configurable time zone, standard working days (e.g., Monday–Friday), standard work day shift hours (start time, end time, grace period for late clock-in).

### Module 4: Department Management
* Create, update, and archive departments (e.g., Engineering, Human Resources, Finance, Sales).
* Assign a designated Department Manager (linked to an active employee record).
* Real-time metrics per department: Headcount, open leave requests, active manager.
* Guard against deleting departments that currently have active employee assignments.

### Module 5: Position & Job Title Management
* Create and organize organizational positions with titles, grade levels, and descriptions.
* Link positions to primary departments.
* View all employees currently holding a given position.

### Module 6: Attendance Tracking & Time Management
* **Web Clock-In / Clock-Out:**
  * Self-service digital punch card with live browser clock synchronized with server time.
  * Automated calculation of daily work duration (hours and minutes).
  * Automatic status assignment: `Present`, `Late` (clocked in after grace period), `Half-Day`, `Left Early`, or `Absent`.
  * IP address and user-agent recorded per punch for audit verification.
* **Attendance Oversight & Management:**
  * Daily and monthly company-wide attendance grid for HR and Managers.
  * Manual override/adjustment capability for HR with required audit note (e.g. forgot to punch, field assignment).
  * Filter by date range, department, and attendance status.

### Module 7: Leave Management & Approval Workflow
* **Configurable Leave Types:** Annual Leave, Sick Leave, Emergency/Casual Leave, Maternity/Paternity Leave, Unpaid Leave with custom annual quotas.
* **Leave Balances:** Automated allocation upon employee creation, dynamic deduction upon approval, real-time balance checks preventing over-drawing.
* **End-to-End Workflow:**
  ```text
  [Employee submits request] 
            │ (Selects Type, Start Date, End Date, Reason)
            ▼
  [System validates available balance & date overlaps]
            │
            ▼
  [Manager / HR receives notification & pending queue]
            │
            ├──► [Approve] ──► Deduct Balance ──► Notify Employee ──► Mark on Calendar
            │
            └──► [Reject] ──► Mandatory Reason ──► Notify Employee ──► Balance Untouched
  ```

### Module 8: Secure Employee Document Vault
* Document categories: Government ID / Passport, Employment Contract, Educational Certificate, Resume, Tax Forms, Disciplinary Record.
* Multi-factor upload validation: Strict allowed file extensions (`pdf`, `png`, `jpg`, `jpeg`, `docx`), server-side MIME type verification via `finfo`, and maximum file size cap (5MB).
* Zero direct URL exposure: Uploaded files stored outside public web directory with randomized UUID file names.
* Secure download streaming controller validating session identity and authorization before sending binary headers.

### Module 9: In-App Notifications Center
* Real-time event notifications for critical triggers:
  * Leave request submitted (dispatched to Manager & HR).
  * Leave request approved or rejected (dispatched to Employee).
  * Employee onboarding profile created (dispatched to Employee with credentials).
  * New organizational announcement published.
* Dropdown notification tray with unread badge counter and "Mark as Read" / "Mark All as Read" actions.

### Module 10: Company Announcements
* Broadcast communications created by Organization Admins or HR.
* Attributes: Title, rich text description, priority level (Normal, Important, Urgent), target audience (All Employees or Specific Department), publish date, and optional expiration date.
* Displayed prominently on the employee dashboard.

### Module 11: Reports & Business Intelligence
* **Standard Operational Reports:**
  * *Employee Roster Report:* Complete demographic, job title, and department listing.
  * *Attendance Summary Report:* Aggregate work hours, late occurrences, and absence counts over customizable date intervals.
  * *Leave Utilization Report:* Breakdown of leave days requested and taken per department and leave category.
  * *Department Headcount Report:* Staffing levels and manager distribution.
* **Export Formats:** Clean CSV export engine with streaming output for low memory consumption, and dedicated CSS print stylesheets for printer/PDF export.

### Module 12: User & RBAC Management
* Manage user login accounts linked to employee records.
* Assign roles (`Organization Admin`, `HR Manager`, `Department Manager`, `Employee`).
* Activate, suspend, or reset passwords securely.
* Prevent self-elevation of privileges or lockout of the last remaining Organization Owner.

### Module 13: Centralized Audit Trail
* Unalterable ledger recording who performed what action, on which entity, at what exact timestamp, from which IP address.
* Search and filter interface for HR and Compliance officers by User, Action type, Date range, and Entity ID.

### Module 14: Organization Settings
* Structured multi-tab settings panel:
  * *General:* Organization info, business details.
  * *Work Schedule:* Standard shifts, working days, late thresholds.
  * *Leave Settings:* Custom leave types and balance allocations.
  * *Security:* Password complexity rules, session timeout settings.

---

## 5. Minimum Viable Product (MVP) Scope

The MVP encompasses the end-to-end operational loop of a modern company:
1. Multi-tenant foundation with verified tenant isolation.
2. Secure session authentication, password hashing, and CSRF protection.
3. RBAC with default roles and permission middleware.
4. Organization settings and workplace configuration.
5. Department and Position management.
6. Full Employee lifecycle management with tabbed profile view.
7. Web clock-in/out attendance tracking and manager review.
8. Leave request, balance calculation, and approval/rejection workflow.
9. Secure document storage and download streaming.
10. In-app notifications and company announcements.
11. Audit logging for compliance.
12. Dashboard with role-specific views and CSV reports.

---

## 6. Future Expansion Roadmap (Post-MVP)

Architectural hooks and database schema are intentionally designed to seamlessly support future additions:
* **Automated Payroll Processing:** Basic salary structures, deductions, tax brackets, and payslip PDF generation.
* **Shift Management & Rotas:** Multiple shift patterns, overnight shifts, and rotational schedules.
* **Recruitment & Applicant Tracking (ATS):** Job postings, applicant pipelines, interview scheduling.
* **Performance Reviews (OKRs & 360 Feedback):** Quarterly goals, appraisal forms, manager scoring.
* **Email & Calendar Sync:** SMTP transactional emails (send leave approvals to Outlook/Google Calendar via `.ics`).
* **REST API & Webhooks:** Authenticated Bearer token API for third-party integrations (Slack, biometric hardware).

---
*End of Document 02*
