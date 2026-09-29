import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { CalendarDays, Plus, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export const LeaveView: React.FC = () => {
  const { 
    leaveRequests, 
    leaveTypes, 
    leaveBalances, 
    employees, 
    currentUser, 
    submitLeaveRequest, 
    reviewLeaveRequest 
  } = useDatabase();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<number>(leaveTypes[0]?.id || 1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentEmp = employees.find(e => e.userId === currentUser.id);
  const userBalances = currentEmp ? leaveBalances.filter(b => b.employeeId === currentEmp.id) : [];

  // Rule-Based Access Scoping:
  // - Employees see own requests
  // - Dept Managers see requests for employees in their department
  // - HR / Owner / Super Admin see all requests
  const visibleRequests = leaveRequests.filter(req => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'org_owner' || currentUser.role === 'org_admin' || currentUser.role === 'hr_manager') {
      return true;
    }
    if (currentUser.role === 'dept_manager') {
      // Find employee of this request
      const reqEmp = employees.find(e => e.id === req.employeeId);
      return (currentEmp && reqEmp && reqEmp.departmentId === currentEmp.departmentId) || (currentEmp && req.employeeId === currentEmp.id);
    }
    // Employee self-service
    return currentEmp && req.employeeId === currentEmp.id;
  });

  const canApproveRequest = (req: any) => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'org_owner' || currentUser.role === 'org_admin' || currentUser.role === 'hr_manager') {
      return true;
    }
    if (currentUser.role === 'dept_manager') {
      const reqEmp = employees.find(e => e.id === req.employeeId);
      return currentEmp && reqEmp && reqEmp.departmentId === currentEmp.departmentId && req.employeeId !== currentEmp.id;
    }
    return false;
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Compute days between dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 0) {
      setFeedback({ type: 'error', message: 'End date must be greater than or equal to start date.' });
      return;
    }

    const res = submitLeaveRequest({
      leaveTypeId: Number(selectedType),
      startDate,
      endDate,
      totalDays: diffDays,
      reason,
    });

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setReason('');
      setStartDate('');
      setEndDate('');
      setTimeout(() => {
        setIsApplyModalOpen(false);
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management & Time Off</h1>
          <p className="text-xs text-slate-500">
            Vacation requests, sick leave quotas, and multi-tier approval workflows
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Time Off</span>
        </button>
      </div>

      {/* User Leave Balance Cards */}
      {userBalances.length > 0 && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Your Leave Quotas ({new Date().getFullYear()})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {userBalances.map(bal => {
              const remaining = bal.totalDays - bal.usedDays - bal.pendingDays;
              return (
                <div key={bal.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-600 block truncate">{bal.leaveTypeName}</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{remaining} <span className="text-xs font-normal text-slate-500">days left</span></div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Used: {bal.usedDays} &bull; Pending: {bal.pendingDays}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leave Requests Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            {currentUser.role === 'employee' ? 'My Leave Requests' : 'Organizational Leave Requests'}
          </h2>
          <span className="text-xs text-slate-500 font-mono">{visibleRequests.length} scoped entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Category</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason / Purpose</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No scoped leave requests found for your role and department.
                  </td>
                </tr>
              ) : (
                visibleRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{req.employeeName}</p>
                      <p className="text-[11px] text-slate-500">{req.employeeCode} &bull; {req.departmentName}</p>
                    </td>

                    <td className="py-3 px-4 font-medium text-indigo-700">
                      {req.leaveTypeName}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {req.startDate} to {req.endDate}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {req.totalDays}d
                    </td>

                    <td className="py-3 px-4 max-w-xs text-slate-600 truncate" title={req.reason}>
                      {req.reason}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {req.status}
                      </span>
                      {req.actionBy && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{req.actionBy}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {req.status === 'pending' && canApproveRequest(req) ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => reviewLeaveRequest(req.id, 'approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium shadow-2xs transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reviewLeaveRequest(req.id, 'rejected', 'Staffing coverage required.')}
                            className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded text-[11px] font-medium transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : req.status === 'pending' ? (
                        <span className="text-slate-400 text-[10px] font-mono">Requires Dept Mgr / HR</span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Submit Leave Request</h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {feedback && (
              <div className={`p-3 rounded-lg text-xs mb-4 flex items-center space-x-2 ${
                feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}>
                {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Leave Category *</label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                >
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>{lt.name} (Max {lt.daysAllowed} days/yr)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Reason / Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the circumstances for this time-off request..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
