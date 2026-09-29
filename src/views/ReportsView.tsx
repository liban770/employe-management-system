import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { FileBarChart2, Download, Table, Calendar, Users, Filter } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { employees, attendance, leaveRequests, departments, currentOrg } = useDatabase();
  const [reportType, setReportType] = useState<'employees' | 'attendance' | 'leave'>('employees');

  const downloadCSV = (filename: string, rows: string[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (reportType === 'employees') {
      const headers = ['Employee ID', 'First Name', 'Last Name', 'Work Email', 'Phone', 'Department', 'Position', 'Contract', 'Status', 'Joining Date'];
      const data = employees.map(e => [
        e.employeeCode,
        e.firstName,
        e.lastName,
        e.email,
        e.phone || '',
        e.departmentName || '',
        e.positionTitle || '',
        e.employmentType,
        e.status,
        e.joiningDate
      ]);
      downloadCSV(`${currentOrg.slug}_employee_roster`, [headers, ...data]);
    } else if (reportType === 'attendance') {
      const headers = ['Employee Code', 'Staff Name', 'Department', 'Date', 'Clock In', 'Clock Out', 'Minutes', 'Status', 'IP Address', 'Notes'];
      const data = attendance.map(a => [
        a.employeeCode || '',
        a.employeeName || '',
        a.departmentName || '',
        a.date,
        a.clockIn,
        a.clockOut || 'Shift Active',
        a.totalMinutes.toString(),
        a.status,
        a.clockInIp || '',
        a.notes || ''
      ]);
      downloadCSV(`${currentOrg.slug}_attendance_audit`, [headers, ...data]);
    } else {
      const headers = ['Employee Code', 'Staff Name', 'Department', 'Leave Category', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Reviewed By'];
      const data = leaveRequests.map(l => [
        l.employeeCode || '',
        l.employeeName || '',
        l.departmentName || '',
        l.leaveTypeName || '',
        l.startDate,
        l.endDate,
        l.totalDays.toString(),
        l.status,
        l.reason,
        l.actionBy || 'Pending'
      ]);
      downloadCSV(`${currentOrg.slug}_leave_utilization`, [headers, ...data]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Reports & Data Export</h1>
          <p className="text-xs text-slate-500">
            Export compliant, audit-ready CSV datasets for payroll, compliance, and headcount analytics
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Export {reportType.toUpperCase()} (CSV)</span>
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex space-x-2 bg-white p-1 rounded-xl border border-slate-200 w-fit text-xs font-medium">
        <button
          onClick={() => setReportType('employees')}
          className={`px-4 py-1.5 rounded-lg transition ${
            reportType === 'employees' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Employee Demographic Roster
        </button>
        <button
          onClick={() => setReportType('attendance')}
          className={`px-4 py-1.5 rounded-lg transition ${
            reportType === 'attendance' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Attendance Punctuality Ledger
        </button>
        <button
          onClick={() => setReportType('leave')}
          className={`px-4 py-1.5 rounded-lg transition ${
            reportType === 'leave' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Leave Utilization Report
        </button>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-sm font-bold text-slate-900">Data Preview (Showing Active Records)</h3>
          <span className="text-xs font-mono text-slate-400">RFC 4180 Streaming Format</span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'employees' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Contract</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {employees.map(e => (
                  <tr key={e.id}>
                    <td className="py-2 px-3 font-semibold text-slate-800">{e.employeeCode}</td>
                    <td className="py-2 px-3 font-sans text-slate-900">{e.firstName} {e.lastName}</td>
                    <td className="py-2 px-3 font-sans text-slate-600">{e.departmentName}</td>
                    <td className="py-2 px-3 font-sans text-slate-600">{e.positionTitle}</td>
                    <td className="py-2 px-3 capitalize font-sans">{e.employmentType.replace('_', ' ')}</td>
                    <td className="py-2 px-3 capitalize font-sans">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'attendance' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Clock In</th>
                  <th className="py-2.5 px-3">Clock Out</th>
                  <th className="py-2.5 px-3">Logged Mins</th>
                  <th className="py-2.5 px-3">Punctuality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {attendance.map(a => (
                  <tr key={a.id}>
                    <td className="py-2 px-3 text-slate-600">{a.date}</td>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">{a.employeeName}</td>
                    <td className="py-2 px-3 font-semibold">{a.clockIn}</td>
                    <td className="py-2 px-3">{a.clockOut || 'Active'}</td>
                    <td className="py-2 px-3">{a.totalMinutes}m</td>
                    <td className="py-2 px-3 font-sans capitalize">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'leave' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Leave Type</th>
                  <th className="py-2.5 px-3">Date Range</th>
                  <th className="py-2.5 px-3">Days</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {leaveRequests.map(l => (
                  <tr key={l.id}>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">{l.employeeName}</td>
                    <td className="py-2 px-3 font-sans text-indigo-700">{l.leaveTypeName}</td>
                    <td className="py-2 px-3 text-slate-600">{l.startDate} – {l.endDate}</td>
                    <td className="py-2 px-3 font-bold">{l.totalDays}d</td>
                    <td className="py-2 px-3 font-sans capitalize">{l.status}</td>
                    <td className="py-2 px-3 font-sans text-slate-500">{l.actionBy || 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
