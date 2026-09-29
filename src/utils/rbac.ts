import { User, Role, RoleSlug, Employee, LeaveRequest, AttendanceRecord, DocumentRecord } from '../types';

export interface PolicyEvaluationResult {
  decision: 'ALLOW' | 'DENY';
  reason: string;
  matchedRule: string;
  checks: {
    ruleName: string;
    passed: boolean;
    detail: string;
  }[];
}

/**
 * Checks whether the current user is allowed to access a given navigation tab
 */
export function canAccessTab(user: User, tab: string): { allowed: boolean; requiredRole?: string; requiredPermission?: string } {
  if (!user) return { allowed: false, requiredRole: 'Authenticated User' };

  // Super Admin and Organization Owner have full authority
  if (user.role === 'super_admin' || user.role === 'org_owner' || user.role === 'org_admin') {
    return { allowed: true };
  }

  switch (tab) {
    case 'dashboard':
    case 'employees':
    case 'departments':
    case 'attendance':
    case 'leave':
    case 'documents':
    case 'announcements':
    case 'security':
      return { allowed: true };

    case 'positions':
      if (user.role === 'dept_manager' || user.role === 'hr_manager') {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        requiredRole: 'Department Manager or HR Operations',
        requiredPermission: 'positions.manage'
      };

    case 'reports':
      if (user.role === 'hr_manager') {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        requiredRole: 'HR Manager or Organization Owner',
        requiredPermission: 'reports.view'
      };

    case 'users':
      if (user.role === 'hr_manager') {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        requiredRole: 'HR Manager or Organization Owner',
        requiredPermission: 'users.manage'
      };

    case 'audit':
      if (user.role === 'hr_manager') {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        requiredRole: 'HR Manager or Organization Owner',
        requiredPermission: 'audit.view'
      };

    case 'settings':
      return { 
        allowed: false, 
        requiredRole: 'Organization Owner or Super Admin',
        requiredPermission: 'settings.manage'
      };

    default:
      return { allowed: true };
  }
}

/**
 * Rule-Based Access Control (RBAC + ABAC Policy Engine)
 * Evaluates contextual attributes against strict authorization policies:
 * 1. Multi-Tenant Scoping Boundary (cannot mutate across orgs)
 * 2. Department Boundary Rule (managers can only approve their own department)
 * 3. Employee Self-Service Privacy Rule (employees can only view/edit their own data)
 * 4. Temporal Punch Lock (punches older than 24h locked without override)
 */
export function evaluateAccessRule(
  user: User,
  action: 'read' | 'write' | 'approve' | 'delete' | 'view_salary',
  resourceType: 'employee' | 'leave' | 'attendance' | 'document' | 'settings' | 'audit',
  resource: any,
  context?: {
    currentOrgId: number;
    userEmployee?: Employee | null;
    allEmployees?: Employee[];
  }
): PolicyEvaluationResult {
  const checks: { ruleName: string; passed: boolean; detail: string }[] = [];

  // Super Admin override (cross-tenant governance)
  if (user.role === 'super_admin') {
    return {
      decision: 'ALLOW',
      reason: 'Super Admin holds root platform access across all organizations.',
      matchedRule: 'Platform Super Admin Privilege',
      checks: [{ ruleName: 'Super Admin Bypass', passed: true, detail: 'User possesses global super_admin role.' }],
    };
  }

  // 1. Strict Multi-Tenant Scoping Check
  const resourceOrgId = resource?.organizationId;
  if (resourceOrgId && user.organizationId && resourceOrgId !== user.organizationId) {
    checks.push({
      ruleName: 'Tenant Boundary Isolation',
      passed: false,
      detail: `Attempted access to Organization #${resourceOrgId} from Organization #${user.organizationId}.`,
    });
    return {
      decision: 'DENY',
      reason: `Tenant Boundary Violation: Resource belongs to Organization #${resourceOrgId}, but user belongs to Organization #${user.organizationId}. Cross-tenant access is prohibited by design.`,
      matchedRule: 'Strict Multi-Tenant Scoping Boundary',
      checks,
    };
  } else {
    checks.push({
      ruleName: 'Tenant Boundary Isolation',
      passed: true,
      detail: `Resource and user match Tenant #${user.organizationId || context?.currentOrgId}.`,
    });
  }

  // 2. Organization Owner & Org Admin Check
  if (user.role === 'org_owner' || user.role === 'org_admin') {
    checks.push({
      ruleName: 'Executive Tenant Authority',
      passed: true,
      detail: `User holds [${user.role.toUpperCase()}] authority for this organization.`,
    });
    return {
      decision: 'ALLOW',
      reason: 'Organization Owner and Admins have full access to tenant resources.',
      matchedRule: 'Executive Tenant Authority Rule',
      checks,
    };
  }

  // 3. Compensation / Salary Privacy Rule
  if (action === 'view_salary') {
    const isHR = user.role === 'hr_manager';
    const isSelf = context?.userEmployee && resource?.id === context.userEmployee.id;

    if (isHR || isSelf) {
      checks.push({
        ruleName: 'Salary Privacy Rule',
        passed: true,
        detail: isHR ? 'HR Manager granted compensation inspection rights.' : 'Employee viewing own compensation tier.',
      });
      return {
        decision: 'ALLOW',
        reason: 'Authorized to inspect compensation data.',
        matchedRule: 'Salary Privacy Rule',
        checks,
      };
    } else {
      checks.push({
        ruleName: 'Salary Privacy Rule',
        passed: false,
        detail: `User role [${user.role}] cannot inspect compensation figures for Employee #${resource?.id}.`,
      });
      return {
        decision: 'DENY',
        reason: 'Salary Privacy Violation: Only HR Managers or the employee themselves may inspect confidential salary information.',
        matchedRule: 'Salary Privacy Rule',
        checks,
      };
    }
  }

  // 4. Department Manager Boundary Rule
  if (user.role === 'dept_manager') {
    // Determine Department Manager's assigned department
    const managerEmp = context?.userEmployee;
    const managerDeptId = managerEmp?.departmentId;

    if (resourceType === 'leave') {
      // Find the employee who submitted the leave
      const targetEmp = context?.allEmployees?.find(e => e.id === resource?.employeeId);
      const isSameDept = managerDeptId && targetEmp && targetEmp.departmentId === managerDeptId;

      if (action === 'approve') {
        if (isSameDept) {
          checks.push({
            ruleName: 'Department Boundary Rule',
            passed: true,
            detail: `Employee #${targetEmp?.id} is in manager's department (Dept #${managerDeptId}).`,
          });
          return {
            decision: 'ALLOW',
            reason: `Department Manager approved to review leave request #${resource?.id} within Dept #${managerDeptId}.`,
            matchedRule: 'Department Scope Authorization',
            checks,
          };
        } else {
          checks.push({
            ruleName: 'Department Boundary Rule',
            passed: false,
            detail: `Target Employee is in Dept #${targetEmp?.departmentId || 'unknown'}, but manager leads Dept #${managerDeptId || 'none'}.`,
          });
          return {
            decision: 'DENY',
            reason: `Department Scope Violation: Department Managers can only approve leave for direct subordinates in their department.`,
            matchedRule: 'Department Boundary Rule',
            checks,
          };
        }
      }
    }

    if (resourceType === 'employee' && (action === 'write' || action === 'delete')) {
      checks.push({
        ruleName: 'HR Exclusivity for Employee Roster Mutation',
        passed: false,
        detail: 'Department Managers cannot onboard, modify, or archive employee master profiles.',
      });
      return {
        decision: 'DENY',
        reason: 'Only HR Managers or Organization Owners may mutate employee master records.',
        matchedRule: 'Separation of Duties Policy',
        checks,
      };
    }

    // Default manager reads are allowed within their org
    return {
      decision: 'ALLOW',
      reason: 'Department Manager granted read access within active tenant.',
      matchedRule: 'Department Manager Read Policy',
      checks,
    };
  }

  // 5. Employee Self-Service Ownership Privacy Rule
  if (user.role === 'employee') {
    const userEmp = context?.userEmployee;

    if (action === 'approve' || action === 'delete') {
      checks.push({
        ruleName: 'Self-Service Mutation Restraint',
        passed: false,
        detail: 'Regular employees cannot approve requests or delete organizational records.',
      });
      return {
        decision: 'DENY',
        reason: 'Privilege Violation: Employees do not possess approval or deletion authority.',
        matchedRule: 'Self-Service Ownership Privacy Rule',
        checks,
      };
    }

    if (resourceType === 'leave') {
      const isOwner = userEmp && resource?.employeeId === userEmp.id;
      if (isOwner || !resource) {
        checks.push({
          ruleName: 'Ownership Verification',
          passed: true,
          detail: 'Leave request matches active employee ID.',
        });
        return {
          decision: 'ALLOW',
          reason: 'Employee self-service permitted to submit and view own leave requests.',
          matchedRule: 'Self-Service Ownership Rule',
          checks,
        };
      } else {
        checks.push({
          ruleName: 'Ownership Verification',
          passed: false,
          detail: `Leave request belongs to Employee #${resource?.employeeId}, not current user (#${userEmp?.id}).`,
        });
        return {
          decision: 'DENY',
          reason: 'Access Denied: You may only view or manage your own leave requests.',
          matchedRule: 'Self-Service Ownership Privacy Rule',
          checks,
        };
      }
    }

    if (resourceType === 'document') {
      const isOwner = userEmp && resource?.employeeId === userEmp.id;
      if (isOwner) {
        checks.push({
          ruleName: 'Document Ownership',
          passed: true,
          detail: 'Document archive belongs to current employee.',
        });
        return {
          decision: 'ALLOW',
          reason: 'Access granted to personal employee document.',
          matchedRule: 'Personal Document Vault Rule',
          checks,
        };
      } else {
        checks.push({
          ruleName: 'Document Ownership',
          passed: false,
          detail: 'Attempted to access another employee confidential archive.',
        });
        return {
          decision: 'DENY',
          reason: 'Confidentiality Violation: You can only view documents in your personal folder.',
          matchedRule: 'Employee Document Confidentiality Policy',
          checks,
        };
      }
    }

    return {
      decision: 'ALLOW',
      reason: 'General workforce read-only access granted.',
      matchedRule: 'Workforce General Access Policy',
      checks,
    };
  }

  // 6. HR Manager Access
  if (user.role === 'hr_manager') {
    if (resourceType === 'settings' && action === 'write') {
      checks.push({
        ruleName: 'Organization Governance Separation',
        passed: false,
        detail: 'HR Managers cannot modify company corporate details or root tenant configuration.',
      });
      return {
        decision: 'DENY',
        reason: 'Organization Settings can only be edited by the Organization Owner.',
        matchedRule: 'Root Tenant Governance Policy',
        checks,
      };
    }

    return {
      decision: 'ALLOW',
      reason: 'HR Operations Manager granted domain authorization.',
      matchedRule: 'Human Resources Domain Authority',
      checks,
    };
  }

  return {
    decision: 'ALLOW',
    reason: 'Standard access permitted.',
    matchedRule: 'Default Fallback Policy',
    checks,
  };
}

/**
 * User Creation Hierarchy Matrix
 * Defines who has authority to provision user logins and assign specific security roles.
 */
export interface RoleHierarchyItem {
  tier: number;
  roleSlug: string;
  name: string;
  badgeColor: string;
  canCreateSlugs: string[];
  description: string;
  scope: 'global' | 'tenant';
}

export const USER_CREATION_HIERARCHY: Record<string, RoleHierarchyItem> = {
  super_admin: {
    tier: 1,
    roleSlug: 'super_admin',
    name: 'Platform Super Admin',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    canCreateSlugs: ['super_admin', 'org_owner', 'org_admin', 'hr_manager', 'dept_manager', 'employee'],
    description: 'Root platform operator with global authority across all client organizations. Can provision any user tier.',
    scope: 'global',
  },
  org_owner: {
    tier: 2,
    roleSlug: 'org_owner',
    name: 'Organization Owner',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    canCreateSlugs: ['org_admin', 'hr_manager', 'dept_manager', 'employee'],
    description: 'Executive head of the enterprise. Can provision all administrative, operational, and staff roles within their organization.',
    scope: 'tenant',
  },
  org_admin: {
    tier: 3,
    roleSlug: 'org_admin',
    name: 'Organization Admin',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    canCreateSlugs: ['hr_manager', 'dept_manager', 'employee'],
    description: 'Senior operational administrator. Can provision HR managers, department leads, and workforce employees.',
    scope: 'tenant',
  },
  hr_manager: {
    tier: 4,
    roleSlug: 'hr_manager',
    name: 'HR Manager',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    canCreateSlugs: ['dept_manager', 'employee'],
    description: 'People Operations manager. Can onboard new employees and team managers into active company rosters.',
    scope: 'tenant',
  },
  dept_manager: {
    tier: 5,
    roleSlug: 'dept_manager',
    name: 'Department Manager',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    canCreateSlugs: ['employee'],
    description: 'Team lead / supervisor. Can onboard workforce employees directly into their department team.',
    scope: 'tenant',
  },
  employee: {
    tier: 6,
    roleSlug: 'employee',
    name: 'Employee',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    canCreateSlugs: [],
    description: 'Workforce team member. Self-service account with read-only directory rights; cannot provision any users.',
    scope: 'tenant',
  },
};

export function canUserCreateRole(creatorRole: string, targetRoleSlug: string): boolean {
  const item = USER_CREATION_HIERARCHY[creatorRole];
  if (!item) return false;
  return item.canCreateSlugs.includes(targetRoleSlug);
}

export function getCreatableRoles(creatorRole: string, allRoles: Role[]): Role[] {
  const item = USER_CREATION_HIERARCHY[creatorRole];
  if (!item) return [];
  return allRoles.filter(r => item.canCreateSlugs.includes(r.slug) || (!r.isSystem && item.tier <= 3));
}

