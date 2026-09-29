import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Search } from 'lucide-react';

export const AuditView: React.FC = () => {
  const { auditLogs } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(l => {
    const term = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      (l.userName && l.userName.toLowerCase().includes(term)) ||
      l.entityType.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
          <p className="text-xs text-slate-500">
            Activity history and record change tracking across the organization.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, user, or record..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <span className="text-xs text-slate-500">{filteredLogs.length} events logged</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {log.createdAt}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {log.userName || 'System'}
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-700">
                    {log.entityType} <span className="font-mono text-slate-400">#{log.entityId}</span>
                  </td>

                  <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-500" title={log.newValues ? JSON.stringify(log.newValues) : ''}>
                    {log.newValues ? JSON.stringify(log.newValues) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
