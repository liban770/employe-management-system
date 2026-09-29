import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Plus, Briefcase } from 'lucide-react';

export const PositionsView: React.FC = () => {
  const { positions, departments, addPosition, currentUser } = useDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState<number>(departments[0]?.id || 1);

  const canManage = currentUser.role === 'super_admin' || currentUser.role === 'org_owner' || currentUser.role === 'org_admin' || currentUser.role === 'hr_manager';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPosition({
      departmentId: Number(departmentId),
      title,
      code: code.toUpperCase(),
      description,
    });
    setTitle('');
    setCode('');
    setDescription('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Job Titles & Position Architecture</h1>
          <p className="text-xs text-slate-500">
            Define organizational roles, position grading, and departmental linkages
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job Position</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Position Title</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Associated Department</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {positions.map(pos => {
                const dept = departments.find(d => d.id === pos.departmentId);
                return (
                  <tr key={pos.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{pos.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                      {pos.code}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {dept?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-sm truncate">
                      {pos.description || 'Standard corporate grade position.'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {pos.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Position Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Define Job Position</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Position Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead DevOps Engineer"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Position Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENG-DEVOPS"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg uppercase font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Department *</label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description / Requirements</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  Save Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
