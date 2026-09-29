import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Users, UserCheck, CalendarClock, UserX, Network, 
  Clock, ArrowUpRight, Megaphone, CheckCircle2 
} from 'lucide-react';

export const DashboardView: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const { 
    currentUser, 
    currentOrg, 
    employees, 
    departments, 
    attendance, 
    leaveRequests, 
    announcements,
    auditLogs 
  } = useDatabase();

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const onLeaveEmployees = employees.filter(e => e.status === 'on_leave').length;
  
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentCount = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentCount = Math.max(0, activeEmployees - presentCount - onLeaveEmployees);

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Greeting & Metric Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational Overview for <strong className="text-slate-700">{currentOrg.name}</strong> &bull; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onNavigate('employees')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            + Onboard Employee
          </button>
          <button
            onClick={() => onNavigate('leave')}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
          >
            Review Leave Requests
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Staff</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{totalEmployees}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Headcount in tenant</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Duty</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{activeEmployees}</div>
          <span className="text-[10px] text-slate-500">Full & Part Time</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Present Today</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">{presentCount}</div>
          <span className="text-[10px] text-emerald-600 font-medium">{todayAttendance.filter(a => a.status === 'late').length} late arrivals</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">On Leave</span>
            <CalendarClock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 tracking-tight">{onLeaveEmployees}</div>
          <span className="text-[10px] text-amber-600 font-medium">Approved time off</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Absent Today</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700 tracking-tight">{absentCount}</div>
          <span className="text-[10px] text-slate-500">Unpunched shift</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Departments</span>
            <Network className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{departments.length}</div>
          <span className="text-[10px] text-indigo-600 font-medium">Operational units</span>
        </div>
      </div>

      {/* Middle Row: Pending Approvals & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leave Requests */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pending Leave Approvals</h2>
              <p className="text-[11px] text-slate-500">Requires HR or Department Supervisor sign-off</p>
            </div>
            <button
              onClick={() => onNavigate('leave')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
              <span>All staff leave requests are up to date.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingLeaves.slice(0, 4).map(req => (
                <div key={req.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">{req.employeeName} <span className="font-mono text-slate-400 text-[11px]">({req.employeeCode})</span></p>
                    <p className="text-slate-500 text-[11px]">{req.departmentName} &bull; <strong className="text-indigo-700">{req.leaveTypeName}</strong></p>
                    <p className="text-slate-400 text-[10px]">Dates: {req.startDate} to {req.endDate} ({req.totalDays} days)</p>
                  </div>
                  <button
                    onClick={() => onNavigate('leave')}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-medium text-xs transition"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Corporate Announcements */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Announcements</h2>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 3).map(ann => (
              <div key={ann.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    ann.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                    ann.priority === 'important' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {ann.priority}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{ann.publishedAt.split(' ')[0]}</span>
                </div>
                <h4 className="font-semibold text-slate-900 text-xs">{ann.title}</h4>
                <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
            <p className="text-[11px] text-slate-500">Latest actions and updates in the organization</p>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View All Activity
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2">Timestamp</th>
                <th className="py-2">User / Actor</th>
                <th className="py-2">Action</th>
                <th className="py-2">Entity Target</th>
                <th className="py-2">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 5).map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-2 text-slate-500 font-mono text-[11px]">{log.createdAt}</td>
                  <td className="py-2 font-medium text-slate-900">{log.userName}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 text-slate-600">{log.entityType} #{log.entityId}</td>
                  <td className="py-2 font-mono text-slate-400 text-[10px]">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
