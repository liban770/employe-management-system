export type RoleSlug = 
  | 'super_admin'
  | 'org_owner'
  | 'org_admin'
  | 'hr_manager'
  | 'dept_manager'
  | 'employee';

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';
export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type DocumentCategory = 'contract' | 'id_proof' | 'resume' | 'certificate' | 'tax_form' | 'other';
export type PriorityLevel = 'normal' | 'important' | 'urgent';

export interface User {
  id: number;
  organizationId: number | null;
  name: string;
  email: string;
  password?: string;
  role: RoleSlug | string;
  avatar?: string;
  status: 'active' | 'inactive';
}

export interface Permission {
  id: number;
  module: string;
  name: string;
  slug: string;
  description: string;
}

export interface RulePolicy {
  id: string;
  name: string;
  category: 'tenant' | 'department' | 'ownership' | 'temporal' | 'approval';
  description: string;
  enforcedBy: 'system' | 'role' | 'attribute';
  active: boolean;
  priority: number;
}

export interface Role {
  id: number;
  organizationId: number | null;
  name: string;
  slug: RoleSlug | string;
  description: string;
  isSystem: boolean;
  permissions: string[]; // array of permission slugs
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  code: string;
  email: string;
  phone?: string;
  timezone: string;
  currency: string;
  status: 'active' | 'suspended';
  businessHoursStart: string; // e.g. '09:00'
  businessHoursEnd: string;   // e.g. '17:00'
  gracePeriodMinutes: number; // e.g. 15
  workingDays: number[];      // [1,2,3,4,5] Mon-Fri
}

export interface Department {
  id: number;
  organizationId: number;
  name: string;
  code: string;
  description: string;
  managerId: number | null;
  status: 'active' | 'inactive';
  employeeCount?: number;
}

export interface Position {
  id: number;
  organizationId: number;
  departmentId: number;
  title: string;
  code: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface Employee {
  id: number;
  organizationId: number;
  userId: number | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  joiningDate: string;
  departmentId: number;
  positionId: number;
  managerId: number | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  avatar?: string;
  // Computed / joined
  departmentName?: string;
  positionTitle?: string;
  managerName?: string;
}

export interface AttendanceRecord {
  id: number;
  organizationId: number;
  employeeId: number;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:MM:SS
  clockOut: string | null;
  totalMinutes: number;
  status: AttendanceStatus;
  clockInIp?: string;
  clockOutIp?: string;
  notes?: string;
}

export interface LeaveType {
  id: number;
  organizationId: number;
  name: string;
  daysAllowed: number;
  isPaid: boolean;
  status: 'active' | 'inactive';
}

export interface LeaveBalance {
  id: number;
  organizationId: number;
  employeeId: number;
  leaveTypeId: number;
  leaveTypeName?: string;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
}

export interface LeaveRequest {
  id: number;
  organizationId: number;
  employeeId: number;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  leaveTypeId: number;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  actionBy?: string;
  actionReason?: string;
  actionedAt?: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: number;
  organizationId: number;
  employeeId: number;
  employeeName?: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  createdAt: string;
  downloadUrl?: string;
}

export interface Announcement {
  id: number;
  organizationId: number;
  title: string;
  content: string;
  priority: PriorityLevel;
  departmentId: number | null;
  publishedAt: string;
  authorName?: string;
}

export interface AuditLog {
  id: number;
  organizationId: number;
  userId: number | null;
  userName?: string;
  action: string;
  entityType: string;
  entityId: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: number;
  organizationId: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}
