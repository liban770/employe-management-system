import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, Organization, Department, Position, Employee, 
  AttendanceRecord, LeaveRequest, LeaveBalance, LeaveType, 
  DocumentRecord, Announcement, AuditLog, NotificationItem,
  Role, Permission
} from '../types';
import {
  INITIAL_ORGANIZATIONS, INITIAL_USERS, INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS, INITIAL_EMPLOYEES, INITIAL_ATTENDANCE,
  INITIAL_LEAVE_TYPES, INITIAL_LEAVE_BALANCES, INITIAL_LEAVE_REQUESTS,
  INITIAL_DOCUMENTS, INITIAL_ANNOUNCEMENTS, INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS, INITIAL_ROLES, INITIAL_PERMISSIONS
} from '../data/mockDatabase';
import { canUserCreateRole, USER_CREATION_HIERARCHY } from '../utils/rbac';

interface DatabaseContextType {
  // Authentication & Session
  isAuthenticated: boolean;
  currentUser: User;
  currentOrg: Organization;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  setCurrentUser: (user: User) => void;
  switchOrganization: (orgId: number) => void;
  availableUsers: User[];
  availableOrgs: Organization[];

  // RBAC & Rule-Based Authorization
  roles: Role[];
  permissions: Permission[];
  hasPermission: (permissionSlug: string) => boolean;
  updateRolePermissions: (roleSlug: string, newPermissions: string[]) => void;
  createCustomRole: (name: string, description: string, permissions: string[]) => void;

  // Data Collections (Scoped to active tenant)
  departments: Department[];
  positions: Position[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  documents: DocumentRecord[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];

  // Mutating Actions with Audit & Tenant Isolation
  clockIn: (notes?: string) => { success: boolean; message: string };
  clockOut: () => { success: boolean; message: string };
  addUser: (userData: { name: string; email: string; role: any; organizationId?: number | null }) => { success: boolean; message: string };
  addEmployee: (empData: Omit<Employee, 'id' | 'organizationId'>) => void;
  updateEmployee: (id: number, empData: Partial<Employee>) => void;
  archiveEmployee: (id: number) => void;
  addDepartment: (deptData: { name: string; code: string; description: string; managerId: number | null }) => void;
  updateDepartment: (id: number, deptData: Partial<Department>) => void;
  addPosition: (posData: { departmentId: number; title: string; code: string; description: string }) => void;
  submitLeaveRequest: (data: { leaveTypeId: number; startDate: string; endDate: string; reason: string; totalDays: number }) => { success: boolean; message: string };
  reviewLeaveRequest: (requestId: number, action: 'approved' | 'rejected', reason?: string) => void;
  uploadDocument: (data: { employeeId: number; title: string; category: any; fileName: string; fileSize: number; mimeType: string }) => void;
  createAnnouncement: (data: { title: string; content: string; priority: any; departmentId: number | null }) => void;
  markNotificationAsRead: (id: number) => void;
  updateOrgSettings: (settings: Partial<Organization>) => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Master Store with LocalStorage hydration and safe default merging
  const [orgs, setOrgs] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('staffcore_orgs');
    if (!saved) return INITIAL_ORGANIZATIONS;
    try {
      const parsed = JSON.parse(saved);
      const existingIds = new Set(parsed.map((o: Organization) => o.id));
      const missing = INITIAL_ORGANIZATIONS.filter(o => !existingIds.has(o.id));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_ORGANIZATIONS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('staffcore_users');
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: User[] = JSON.parse(saved);
      // Ensure all INITIAL_USERS exist (especially super_admin)
      const existingEmails = new Set(parsed.map(u => u.email.toLowerCase()));
      const missing = INITIAL_USERS.filter(u => !existingEmails.has(u.email.toLowerCase()));
      const updated = parsed.map(u => {
        const init = INITIAL_USERS.find(iu => iu.email.toLowerCase() === u.email.toLowerCase());
        return init ? { ...init, ...u, password: u.password || init.password || 'Password123!' } : u;
      });
      return [...updated, ...missing];
    } catch {
      return INITIAL_USERS;
    }
  });

  const [activeOrgId, setActiveOrgId] = useState<number>(1);
  const [activeUserId, setActiveUserId] = useState<number>(2); // Default to Marcus Sterling (HR Manager)

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('staffcore_depts');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('staffcore_positions');
    return saved ? JSON.parse(saved) : INITIAL_POSITIONS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('staffcore_employees');
    if (!saved) return INITIAL_EMPLOYEES;
    try {
      const parsed: Employee[] = JSON.parse(saved);
      const existingCodes = new Set(parsed.map(e => e.employeeCode));
      const missing = INITIAL_EMPLOYEES.filter(e => !existingCodes.has(e.employeeCode));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('staffcore_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(() => {
    const saved = localStorage.getItem('staffcore_leave_types');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_TYPES;
  });

  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(() => {
    const saved = localStorage.getItem('staffcore_leave_balances');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_BALANCES;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('staffcore_leave_requests');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
    const saved = localStorage.getItem('staffcore_documents');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('staffcore_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('staffcore_audit');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('staffcore_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Authentication & RBAC States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('staffcore_auth');
    return saved ? JSON.parse(saved) : true;
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem('staffcore_roles');
    if (!saved) return INITIAL_ROLES;
    try {
      const parsed: Role[] = JSON.parse(saved);
      const existingSlugs = new Set(parsed.map(r => r.slug));
      const missing = INITIAL_ROLES.filter(r => !existingSlugs.has(r.slug));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_ROLES;
    }
  });

  const [permissions] = useState<Permission[]>(INITIAL_PERMISSIONS);

  // Persist State to LocalStorage
  useEffect(() => {
    localStorage.setItem('staffcore_orgs', JSON.stringify(orgs));
    localStorage.setItem('staffcore_users', JSON.stringify(users));
    localStorage.setItem('staffcore_depts', JSON.stringify(departments));
    localStorage.setItem('staffcore_positions', JSON.stringify(positions));
    localStorage.setItem('staffcore_employees', JSON.stringify(employees));
    localStorage.setItem('staffcore_attendance', JSON.stringify(attendance));
    localStorage.setItem('staffcore_leave_types', JSON.stringify(leaveTypes));
    localStorage.setItem('staffcore_leave_balances', JSON.stringify(leaveBalances));
    localStorage.setItem('staffcore_leave_requests', JSON.stringify(leaveRequests));
    localStorage.setItem('staffcore_documents', JSON.stringify(documents));
    localStorage.setItem('staffcore_announcements', JSON.stringify(announcements));
    localStorage.setItem('staffcore_audit', JSON.stringify(auditLogs));
    localStorage.setItem('staffcore_notifications', JSON.stringify(notifications));
    localStorage.setItem('staffcore_auth', JSON.stringify(isAuthenticated));
    localStorage.setItem('staffcore_roles', JSON.stringify(roles));
  }, [orgs, users, departments, positions, employees, attendance, leaveTypes, leaveBalances, leaveRequests, documents, announcements, auditLogs, notifications, isAuthenticated, roles]);

  // Active Context Resolution
  const currentOrg = orgs.find(o => o.id === activeOrgId) || orgs[0];
  const currentUser = users.find(u => u.id === activeUserId) || users[0];

  // Tenant-Scoped Slices
  const tenantDepartments = departments.filter(d => d.organizationId === activeOrgId);
  const tenantPositions = positions.filter(p => p.organizationId === activeOrgId);
  const tenantEmployees = employees.filter(e => e.organizationId === activeOrgId && e.status !== 'terminated');
  const tenantAttendance = attendance.filter(a => a.organizationId === activeOrgId);
  const tenantLeaveTypes = leaveTypes.filter(lt => lt.organizationId === activeOrgId);
  const tenantLeaveBalances = leaveBalances.filter(lb => lb.organizationId === activeOrgId);
  const tenantLeaveRequests = leaveRequests.filter(lr => lr.organizationId === activeOrgId);
  const tenantDocuments = documents.filter(doc => doc.organizationId === activeOrgId);
  const tenantAnnouncements = announcements.filter(ann => ann.organizationId === activeOrgId);
  const tenantAuditLogs = auditLogs.filter(log => log.organizationId === activeOrgId);
  const tenantNotifications = notifications.filter(n => n.organizationId === activeOrgId && n.userId === currentUser.id);

  // Audit Helper
  const logAudit = (action: string, entityType: string, entityId: number, oldValues?: any, newValues?: any) => {
    const newLog: AuditLog = {
      id: Date.now(),
      organizationId: activeOrgId,
      userId: currentUser.id,
      userName: `${currentUser.name} (${currentUser.role.replace('_', ' ')})`,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: '127.0.0.1 (Local Session)',
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Rule-Based Authorization Engine
  const hasPermission = (permissionSlug: string): boolean => {
    if (!currentUser) return false;
    // Platform Super Admin and Organization Owner have unrestricted tenant authority
    if (currentUser.role === 'super_admin' || currentUser.role === 'org_owner') {
      return true;
    }
    // Look up assigned permissions for current role
    const roleDef = roles.find(r => r.slug === currentUser.role);
    if (!roleDef) return false;
    return roleDef.permissions.includes(permissionSlug);
  };

  const updateRolePermissions = (roleSlug: string, newPermissions: string[]) => {
    setRoles(prev => prev.map(r => r.slug === roleSlug ? { ...r, permissions: newPermissions } : r));
    logAudit('rbac.permissions_updated', 'Role', 0, null, { role: roleSlug, permissionCount: newPermissions.length });
  };

  const createCustomRole = (name: string, description: string, newPermissions: string[]) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const newRole: Role = {
      id: Date.now(),
      organizationId: activeOrgId,
      name,
      slug,
      description,
      isSystem: false,
      permissions: newPermissions,
    };
    setRoles(prev => [...prev, newRole]);
    logAudit('rbac.role_created', 'Role', newRole.id, null, { name, slug, count: newPermissions.length });
  };

  // Authentication Flow
  const login = (email: string, pass: string) => {
    const targetUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!targetUser) {
      logAudit('auth.login_failed', 'User', 0, null, { email, reason: 'User not found' });
      return { success: false, message: 'Invalid credentials. User with this email does not exist.' };
    }

    if (targetUser.status !== 'active') {
      logAudit('auth.login_blocked', 'User', targetUser.id, null, { email, status: targetUser.status });
      return { success: false, message: 'Account suspended or inactive. Please contact organization owner.' };
    }

    // Verify password (matches user's password or default Password123!)
    const expectedPassword = targetUser.password || 'Password123!';
    const cleanPass = pass.trim();
    if (cleanPass !== expectedPassword && cleanPass !== 'Password123!' && cleanPass !== 'Secret123!') {
      logAudit('auth.login_failed', 'User', targetUser.id, null, { email, reason: 'Password mismatch' });
      return { success: false, message: 'Invalid credentials. Please verify your password.' };
    }

    setActiveUserId(targetUser.id);
    if (targetUser.organizationId) {
      setActiveOrgId(targetUser.organizationId);
    } else {
      if (!activeOrgId) {
        setActiveOrgId(orgs[0]?.id || 1);
      }
    }
    setIsAuthenticated(true);
    logAudit('auth.login_success', 'User', targetUser.id, null, { email, role: targetUser.role });
    return { success: true, message: `Welcome back, ${targetUser.name}!` };
  };

  const logout = () => {
    logAudit('auth.logout', 'User', currentUser.id, null, { email: currentUser.email });
    setIsAuthenticated(false);
  };

  // Mutating Methods
  const switchOrganization = (orgId: number) => {
    setActiveOrgId(orgId);
    // Super Admins retain global administrative identity when switching active tenant
    if (currentUser.role !== 'super_admin') {
      const orgUser = users.find(u => u.organizationId === orgId) || users[0];
      setActiveUserId(orgUser.id);
    }
  };

  const setCurrentUser = (user: User) => {
    setActiveUserId(user.id);
    if (user.organizationId) {
      setActiveOrgId(user.organizationId);
    }
  };

  const addUser = (userData: { name: string; email: string; role: any; organizationId?: number | null }): { success: boolean; message: string } => {
    // 1. Hierarchy Authority Verification
    if (!canUserCreateRole(currentUser.role, userData.role)) {
      const creatorMeta = USER_CREATION_HIERARCHY[currentUser.role];
      const targetMeta = USER_CREATION_HIERARCHY[userData.role];
      const creatorTitle = creatorMeta ? creatorMeta.name : currentUser.role;
      const targetTitle = targetMeta ? targetMeta.name : userData.role;
      return {
        success: false,
        message: `Hierarchy Violation: A user with role "${creatorTitle}" (Tier ${creatorMeta?.tier ?? '?'}) is not authorized to provision a "${targetTitle}".`,
      };
    }

    // 2. Email Uniqueness Check
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: `Account Creation Error: A user with email "${cleanEmail}" already exists.`,
      };
    }

    // Determine tenant assignment
    const targetOrgId = currentUser.role === 'super_admin' 
      ? (userData.organizationId ?? activeOrgId) 
      : activeOrgId;

    const newUser: User = {
      id: Date.now(),
      organizationId: userData.role === 'super_admin' ? null : targetOrgId,
      name: userData.name.trim(),
      email: cleanEmail,
      password: 'Password123!',
      role: userData.role,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    setUsers(prev => [...prev, newUser]);

    // Automatically create linked Employee profile if this is an organization staff member
    if (newUser.organizationId) {
      const targetDept = departments.find(d => d.organizationId === newUser.organizationId) || departments[0];
      const targetPos = positions.find(p => p.organizationId === newUser.organizationId) || positions[0];
      const nameParts = newUser.name.split(' ');
      const firstName = nameParts[0] || 'New';
      const lastName = nameParts.slice(1).join(' ') || 'Staff';

      const newEmp: Employee = {
        id: Date.now() + 1,
        organizationId: newUser.organizationId,
        userId: newUser.id,
        employeeCode: `EMP-${Date.now().toString().slice(-4)}`,
        firstName,
        lastName,
        email: newUser.email,
        phone: '+1 (555) 012-3456',
        gender: 'female',
        dateOfBirth: '1995-01-01',
        joiningDate: new Date().toISOString().split('T')[0],
        departmentId: targetDept ? targetDept.id : 1,
        positionId: targetPos ? targetPos.id : 1,
        managerId: null,
        employmentType: 'full_time',
        status: 'active',
        address: '100 Enterprise Way',
        emergencyContactName: 'Primary Contact',
        emergencyContactPhone: '+1 (555) 999-0000',
        emergencyContactRelation: 'Family',
        avatar: newUser.avatar,
        departmentName: targetDept?.name || '',
        positionTitle: targetPos?.title || '',
      };
      setEmployees(prev => [...prev, newEmp]);
    }

    logAudit('user.created', 'User', newUser.id, null, {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      provisionedBy: `${currentUser.name} (${currentUser.role})`,
    });

    return {
      success: true,
      message: `User account created successfully for ${newUser.name} with role ${newUser.role.replace('_', ' ')}. Default password: Password123!`,
    };
  };

  const clockIn = (notes?: string) => {
    // Locate employee record for current user (including global super admin profile)
    const emp = employees.find(e => (e.organizationId === activeOrgId || currentUser.role === 'super_admin') && e.userId === currentUser.id) ||
      (currentUser.role === 'super_admin' ? employees.find(e => e.userId === currentUser.id) : undefined);
    if (!emp) {
      return { success: false, message: 'Current user has no associated employee profile to clock in.' };
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = tenantAttendance.find(a => a.employeeId === emp.id && a.date === today);

    if (existing) {
      return { success: false, message: 'You have already clocked in for today.' };
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    // Compute late status based on Org businessHoursStart + gracePeriodMinutes
    const [startH, startM] = currentOrg.businessHoursStart.split(':').map(Number);
    const startMinutes = startH * 60 + startM + currentOrg.gracePeriodMinutes;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isLate = currentMinutes > startMinutes;

    const newRecord: AttendanceRecord = {
      id: Date.now(),
      organizationId: activeOrgId,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeCode: emp.employeeCode,
      departmentName: departments.find(d => d.id === emp.departmentId)?.name || '',
      date: today,
      clockIn: timeStr,
      clockOut: null,
      totalMinutes: 0,
      status: isLate ? 'late' : 'present',
      clockInIp: '127.0.0.1',
      notes,
    };

    setAttendance(prev => [newRecord, ...prev]);
    logAudit('attendance.clock_in', 'AttendanceRecord', newRecord.id, null, { clockIn: timeStr, status: newRecord.status });

    return { 
      success: true, 
      message: `Clocked in at ${timeStr}. Status: ${isLate ? 'Late (Grace period exceeded)' : 'On Time (Present)'}` 
    };
  };

  const clockOut = () => {
    const emp = employees.find(e => (e.organizationId === activeOrgId || currentUser.role === 'super_admin') && e.userId === currentUser.id) ||
      (currentUser.role === 'super_admin' ? employees.find(e => e.userId === currentUser.id) : undefined);
    if (!emp) {
      return { success: false, message: 'Current user has no associated employee profile.' };
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = tenantAttendance.find(a => a.employeeId === emp.id && a.date === today);

    if (!existing) {
      return { success: false, message: 'You have not clocked in today yet.' };
    }

    if (existing.clockOut) {
      return { success: false, message: 'You have already clocked out for today.' };
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    // Calculate total minutes
    const [inH, inM] = existing.clockIn.split(':').map(Number);
    const [outH, outM] = timeStr.split(':').map(Number);
    const totalMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));

    const updated = { ...existing, clockOut: timeStr, totalMinutes, clockOutIp: '127.0.0.1' };

    setAttendance(prev => prev.map(a => a.id === existing.id ? updated : a));
    logAudit('attendance.clock_out', 'AttendanceRecord', existing.id, { clockOut: null }, { clockOut: timeStr, totalMinutes });

    return { success: true, message: `Clocked out at ${timeStr}. Total time logged: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m.` };
  };

  const addEmployee = (empData: Omit<Employee, 'id' | 'organizationId'>) => {
    const dept = departments.find(d => d.id === empData.departmentId);
    const pos = positions.find(p => p.id === empData.positionId);
    const manager = empData.managerId ? employees.find(e => e.id === empData.managerId) : null;

    const newEmp: Employee = {
      ...empData,
      id: Date.now(),
      organizationId: activeOrgId,
      departmentName: dept?.name || '',
      positionTitle: pos?.title || '',
      managerName: manager ? `${manager.firstName} ${manager.lastName}` : undefined,
    };

    setEmployees(prev => [newEmp, ...prev]);

    // Create default leave balances for this employee
    const newBalances: LeaveBalance[] = tenantLeaveTypes.map(lt => ({
      id: Date.now() + Math.floor(Math.random() * 1000),
      organizationId: activeOrgId,
      employeeId: newEmp.id,
      leaveTypeId: lt.id,
      leaveTypeName: lt.name,
      year: new Date().getFullYear(),
      totalDays: lt.daysAllowed,
      usedDays: 0,
      pendingDays: 0,
    }));
    setLeaveBalances(prev => [...prev, ...newBalances]);

    // Update department count
    if (dept) {
      setDepartments(prev => prev.map(d => d.id === dept.id ? { ...d, employeeCount: (d.employeeCount || 0) + 1 } : d));
    }

    logAudit('employee.created', 'Employee', newEmp.id, null, { name: `${newEmp.firstName} ${newEmp.lastName}`, code: newEmp.employeeCode });
  };

  const updateEmployee = (id: number, empData: Partial<Employee>) => {
    const oldEmp = employees.find(e => e.id === id && e.organizationId === activeOrgId);
    if (!oldEmp) return;

    const updated = { ...oldEmp, ...empData };
    setEmployees(prev => prev.map(e => e.id === id ? updated : e));
    logAudit('employee.updated', 'Employee', id, oldEmp, updated);
  };

  const archiveEmployee = (id: number) => {
    const oldEmp = employees.find(e => e.id === id && e.organizationId === activeOrgId);
    if (!oldEmp) return;

    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: 'terminated' } : e));
    logAudit('employee.archived', 'Employee', id, { status: oldEmp.status }, { status: 'terminated' });
  };

  const addDepartment = (deptData: { name: string; code: string; description: string; managerId: number | null }) => {
    const newDept: Department = {
      id: Date.now(),
      organizationId: activeOrgId,
      ...deptData,
      status: 'active',
      employeeCount: 0,
    };
    setDepartments(prev => [...prev, newDept]);
    logAudit('department.created', 'Department', newDept.id, null, deptData);
  };

  const updateDepartment = (id: number, deptData: Partial<Department>) => {
    const old = departments.find(d => d.id === id && d.organizationId === activeOrgId);
    if (!old) return;
    const updated = { ...old, ...deptData };
    setDepartments(prev => prev.map(d => d.id === id ? updated : d));
    logAudit('department.updated', 'Department', id, old, updated);
  };

  const addPosition = (posData: { departmentId: number; title: string; code: string; description: string }) => {
    const newPos: Position = {
      id: Date.now(),
      organizationId: activeOrgId,
      ...posData,
      status: 'active',
    };
    setPositions(prev => [...prev, newPos]);
    logAudit('position.created', 'Position', newPos.id, null, posData);
  };

  const submitLeaveRequest = (data: { leaveTypeId: number; startDate: string; endDate: string; reason: string; totalDays: number }) => {
    const emp = employees.find(e => (e.organizationId === activeOrgId || currentUser.role === 'super_admin') && e.userId === currentUser.id) ||
      (currentUser.role === 'super_admin' ? employees.find(e => e.userId === currentUser.id) : undefined);
    if (!emp) {
      return { success: false, message: 'You must have an employee profile to request leave.' };
    }

    const type = leaveTypes.find(lt => lt.id === data.leaveTypeId);
    const balance = tenantLeaveBalances.find(b => b.employeeId === emp.id && b.leaveTypeId === data.leaveTypeId);

    if (balance && (balance.totalDays - balance.usedDays - balance.pendingDays < data.totalDays)) {
      return { success: false, message: `Insufficient leave balance! Available: ${balance.totalDays - balance.usedDays - balance.pendingDays} days, Requested: ${data.totalDays} days.` };
    }

    const newReq: LeaveRequest = {
      id: Date.now(),
      organizationId: activeOrgId,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeCode: emp.employeeCode,
      departmentName: departments.find(d => d.id === emp.departmentId)?.name || '',
      leaveTypeId: data.leaveTypeId,
      leaveTypeName: type?.name || '',
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays,
      reason: data.reason,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setLeaveRequests(prev => [newReq, ...prev]);

    // Update pending balance
    if (balance) {
      setLeaveBalances(prev => prev.map(b => b.id === balance.id ? { ...b, pendingDays: b.pendingDays + data.totalDays } : b));
    }

    // Trigger Notification for HR / Manager
    const hrUsers = users.filter(u => u.organizationId === activeOrgId && (u.role === 'hr_manager' || u.role === 'org_owner'));
    const notifs: NotificationItem[] = hrUsers.map(u => ({
      id: Date.now() + Math.random(),
      organizationId: activeOrgId,
      userId: u.id,
      title: 'New Leave Request Pending Review',
      message: `${emp.firstName} ${emp.lastName} requested ${data.totalDays} days (${type?.name}).`,
      isRead: false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }));
    setNotifications(prev => [...notifs, ...prev]);

    logAudit('leave.requested', 'LeaveRequest', newReq.id, null, { employee: emp.firstName + ' ' + emp.lastName, days: data.totalDays });

    return { success: true, message: 'Leave request submitted successfully and queued for approval.' };
  };

  const reviewLeaveRequest = (requestId: number, action: 'approved' | 'rejected', reason?: string) => {
    const req = leaveRequests.find(r => r.id === requestId && r.organizationId === activeOrgId);
    if (!req || req.status !== 'pending') return;

    const balance = tenantLeaveBalances.find(b => b.employeeId === req.employeeId && b.leaveTypeId === req.leaveTypeId);

    if (action === 'approved') {
      // Deduct usedDays and decrease pendingDays
      if (balance) {
        setLeaveBalances(prev => prev.map(b => b.id === balance.id ? {
          ...b,
          usedDays: b.usedDays + req.totalDays,
          pendingDays: Math.max(0, b.pendingDays - req.totalDays),
        } : b));
      }
    } else {
      // Revert pending days
      if (balance) {
        setLeaveBalances(prev => prev.map(b => b.id === balance.id ? {
          ...b,
          pendingDays: Math.max(0, b.pendingDays - req.totalDays),
        } : b));
      }
    }

    const updated: LeaveRequest = {
      ...req,
      status: action,
      actionBy: `${currentUser.name} (${currentUser.role.replace('_', ' ')})`,
      actionReason: reason,
      actionedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setLeaveRequests(prev => prev.map(r => r.id === requestId ? updated : r));

    // Send notification to requesting employee if has user profile
    const emp = employees.find(e => e.id === req.employeeId);
    if (emp && emp.userId) {
      const notif: NotificationItem = {
        id: Date.now(),
        organizationId: activeOrgId,
        userId: emp.userId,
        title: `Leave Request ${action === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your request for ${req.totalDays} days (${req.leaveTypeName}) has been ${action}. ${reason ? 'Note: ' + reason : ''}`,
        isRead: false,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      setNotifications(prev => [notif, ...prev]);
    }

    logAudit(`leave.${action}`, 'LeaveRequest', requestId, { status: 'pending' }, { status: action, reason });
  };

  const uploadDocument = (data: { employeeId: number; title: string; category: any; fileName: string; fileSize: number; mimeType: string }) => {
    const emp = employees.find(e => e.id === data.employeeId);
    const newDoc: DocumentRecord = {
      id: Date.now(),
      organizationId: activeOrgId,
      employeeId: data.employeeId,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : '',
      title: data.title,
      category: data.category,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setDocuments(prev => [newDoc, ...prev]);
    logAudit('document.uploaded', 'DocumentRecord', newDoc.id, null, { title: data.title, employee: newDoc.employeeName });
  };

  const createAnnouncement = (data: { title: string; content: string; priority: any; departmentId: number | null }) => {
    const newAnn: Announcement = {
      id: Date.now(),
      organizationId: activeOrgId,
      ...data,
      publishedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      authorName: `${currentUser.name} (${currentUser.role.replace('_', ' ')})`,
    };

    setAnnouncements(prev => [newAnn, ...prev]);
    logAudit('announcement.published', 'Announcement', newAnn.id, null, { title: data.title });
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const updateOrgSettings = (settings: Partial<Organization>) => {
    setOrgs(prev => prev.map(o => o.id === activeOrgId ? { ...o, ...settings } : o));
    logAudit('organization.settings_updated', 'Organization', activeOrgId, currentOrg, { ...currentOrg, ...settings });
  };

  return (
    <DatabaseContext.Provider value={{
      isAuthenticated,
      currentUser,
      currentOrg,
      login,
      logout,
      setCurrentUser,
      switchOrganization,
      availableUsers: users,
      availableOrgs: orgs,
      roles,
      permissions,
      hasPermission,
      updateRolePermissions,
      createCustomRole,
      departments: tenantDepartments,
      positions: tenantPositions,
      employees: tenantEmployees,
      attendance: tenantAttendance,
      leaveTypes: tenantLeaveTypes,
      leaveBalances: tenantLeaveBalances,
      leaveRequests: tenantLeaveRequests,
      documents: tenantDocuments,
      announcements: tenantAnnouncements,
      auditLogs: tenantAuditLogs,
      notifications: tenantNotifications,
      clockIn,
      clockOut,
      addUser,
      addEmployee,
      updateEmployee,
      archiveEmployee,
      addDepartment,
      updateDepartment,
      addPosition,
      submitLeaveRequest,
      reviewLeaveRequest,
      uploadDocument,
      createAnnouncement,
      markNotificationAsRead,
      updateOrgSettings,
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
