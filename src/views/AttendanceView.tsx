import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Clock, Calendar, CheckCircle2, AlertTriangle, Filter, Search, UserCheck } from 'lucide-react';

export const AttendanceView: React.FC<{ onOpenClock: () => void }> = ({ onOpenClock }) => {
  const { attendance, employees, currentOrg, currentUser } = useDatabase();
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const currentEmp = employees.find(e => e.userId === currentUser.id);

  const filteredAttendance = attendance.filter(record => {
    // Rule-Based Scope:
    // - Regular employees only see their personal punch logs
    if (currentUser.role === 'employee' && currentEmp && record.employeeId !== currentEmp.id) {
      return false;
    }
    // - Dept managers only see their department's employees + self
    if (currentUser.role === 'dept_manager' && currentEmp) {
      const recEmp = employees.find(e => e.id === record.employeeId);
      if (recEmp && recEmp.departmentId !== currentEmp.departmentId && record.employeeId !== currentEmp.id) {
        return false;
      }
    }

    const matchesDate = !dateFilter || record.date === dateFilter;
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Time & Attendance Tracking</h1>
          <p className="text-xs text-slate-500">
            Work shifts, digital punch card audit, and punctuality monitoring &bull; Standard shift {currentOrg.businessHoursStart} - {currentOrg.businessHoursEnd}
          </p>
        </div>

        <button
          onClick={onOpenClock}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Clock className="w-4 h-4" />
          <span>Clock In / Out (Punch Card)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-medium text-slate-600">Filter by Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-indigo-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
          >
            <option value="all">All Records</option>
            <option value="present">Present (On Time)</option>
            <option value="late">Late Arrival</option>
            <option value="half_day">Half Day</option>
          </select>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Punctuality Status</th>
                <th className="py-3 px-4">IP / Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{record.employeeName}</p>
                      <p className="text-[11px] text-slate-500">{record.employeeCode} &bull; {record.departmentName}</p>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {record.date}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {record.clockIn}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {record.clockOut || (
                        <span className="inline-flex items-center text-indigo-600 font-medium">
                          Active Shift
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">
                      {record.totalMinutes > 0 ? (
                        `${Math.floor(record.totalMinutes / 60)}h ${record.totalMinutes % 60}m`
                      ) : (
                        'In progress'
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        record.status === 'late' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {record.status === 'present' ? 'On Time' : record.status}
                      </span>
                      {record.notes && (
                        <p className="text-[10px] text-slate-500 mt-0.5 italic">{record.notes}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {record.clockInIp || 'Verified Web Punch'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
