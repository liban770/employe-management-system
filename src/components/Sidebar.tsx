import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  LayoutDashboard, Users, Network, Briefcase, Clock, 
  CalendarDays, FolderLock, Megaphone, FileBarChart2, 
  ShieldCheck, Settings, Building2, UserCog, 
  Lock, LogOut 
} from 'lucide-react';
import { canAccessTab } from '../utils/rbac';

export type NavTab = 
  | 'dashboard'
  | 'employees'
  | 'departments'
  | 'positions'
  | 'attendance'
  | 'leave'
  | 'documents'
  | 'announcements'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, currentOrg, leaveRequests, logout } = useDatabase();

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const isManager = currentUser.role === 'super_admin' || currentUser.role === 'org_owner' || currentUser.role === 'org_admin' || currentUser.role === 'hr_manager' || currentUser.role === 'dept_manager';

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees' as NavTab, label: 'Employees', icon: Users, badge: null },
    { id: 'departments' as NavTab, label: 'Departments', icon: Network },
    { id: 'positions' as NavTab, label: 'Positions', icon: Briefcase },
    { id: 'attendance' as NavTab, label: 'Attendance', icon: Clock },
    { id: 'leave' as NavTab, label: 'Leave Requests', icon: CalendarDays, badge: isManager && pendingLeaves > 0 ? pendingLeaves : null },
    { id: 'documents' as NavTab, label: 'Documents', icon: FolderLock },
    { id: 'announcements' as NavTab, label: 'Announcements', icon: Megaphone },
    { id: 'reports' as NavTab, label: 'Reports', icon: FileBarChart2 },
    { id: 'users' as NavTab, label: 'Users & Roles', icon: UserCog },
    { id: 'audit' as NavTab, label: 'Audit Logs', icon: ShieldCheck },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
            SC
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">StaffCore</span>
            <p className="text-[11px] text-slate-400">HR Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Menu
          </span>
          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold">
            {currentUser.role.replace('_', ' ')}
          </span>
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const access = canAccessTab(currentUser, item.id);
          const isPermitted = access.allowed;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isPermitted
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isPermitted ? 'text-slate-400' : 'text-slate-600'}`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center space-x-1.5">
                {!isPermitted && (
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                )}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Organization Info & Sign Out Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30 space-y-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-indigo-400 font-bold text-xs">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div className="truncate flex-1">
            <p className="font-medium text-slate-300 text-xs truncate">{currentOrg.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{currentUser.name}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 rounded-lg text-xs font-medium border border-slate-700/60 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
