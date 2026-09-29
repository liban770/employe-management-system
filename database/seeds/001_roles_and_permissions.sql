-- Seed Data: Core Roles and Default Permissions
-- Target: MySQL 8.0+ / InnoDB

INSERT IGNORE INTO `permissions` (`id`, `module`, `name`, `slug`, `description`) VALUES
(1, 'employees', 'View Employees', 'employees.view', 'View employee roster and profiles'),
(2, 'employees', 'Create Employee', 'employees.create', 'Onboard new staff member'),
(3, 'employees', 'Edit Employee', 'employees.edit', 'Update employee details and contracts'),
(4, 'employees', 'Delete Employee', 'employees.delete', 'Archive or delete employee records'),
(5, 'departments', 'View Departments', 'departments.view', 'View department structure and managers'),
(6, 'departments', 'Manage Departments', 'departments.manage', 'Create, edit, or archive departments'),
(7, 'positions', 'Manage Positions', 'positions.manage', 'Manage job titles and grades'),
(8, 'attendance', 'Clock In / Out', 'attendance.clock', 'Self-service digital time tracking punch'),
(9, 'attendance', 'View Department Attendance', 'attendance.view_dept', 'Review attendance for direct team'),
(10, 'attendance', 'Manage All Attendance', 'attendance.manage', 'Company-wide attendance review & manual overrides'),
(11, 'leave', 'Submit Leave Request', 'leave.request', 'Apply for annual, sick, or emergency leave'),
(12, 'leave', 'Approve Leave', 'leave.approve', 'Review and approve/reject staff leave requests'),
(13, 'leave', 'Manage Leave Types', 'leave.manage_types', 'Configure organizational leave policies'),
(14, 'documents', 'Upload Personal Document', 'documents.upload_own', 'Upload IDs, certificates, and tax forms'),
(15, 'documents', 'Manage Documents', 'documents.manage', 'Review, download and audit staff files'),
(16, 'announcements', 'Manage Announcements', 'announcements.manage', 'Broadcast company communications'),
(17, 'reports', 'View Reports', 'reports.view', 'View analytical HR and attendance reports'),
(18, 'audit', 'View Audit Logs', 'audit.view', 'Access immutable audit trail'),
(19, 'settings', 'Manage Organization Settings', 'settings.manage', 'Update company profile, working hours, and security');

-- System Roles
INSERT IGNORE INTO `roles` (`id`, `organization_id`, `name`, `slug`, `description`, `is_system`) VALUES
(1, NULL, 'Platform Super Admin', 'super_admin', 'SaaS platform infrastructure operator', 1),
(2, NULL, 'Organization Owner', 'org_owner', 'Primary corporate executive with full tenant control', 1),
(3, NULL, 'Organization Admin', 'org_admin', 'Senior administrative operations manager', 1),
(4, NULL, 'HR Manager', 'hr_manager', 'Human capital management & leave administrator', 1),
(5, NULL, 'Department Manager', 'dept_manager', 'Team supervisor with direct report authority', 1),
(6, NULL, 'Employee', 'employee', 'Standard organization workforce member', 1);

-- Map Permissions to Roles (Role 2: Org Owner -> All Permissions 1-19)
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, `id` FROM `permissions`;

-- Role 4: HR Manager Permissions
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8), (4, 10), (4, 11), (4, 12), (4, 13), (4, 14), (4, 15), (4, 16), (4, 17), (4, 18);

-- Role 5: Department Manager Permissions
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(5, 1), (5, 5), (5, 8), (5, 9), (5, 11), (5, 12), (5, 14), (5, 15);

-- Role 6: Employee Permissions
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(6, 1), (6, 8), (6, 11), (6, 14);
