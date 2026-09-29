import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { ShieldCheck, Plus, Check, X, Lock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const RbacMatrixView: React.FC = () => {
  const { roles, permissions, updateRolePermissions, createCustomRole, currentUser } = useDatabase();
  const [selectedRoleSlug, setSelectedRoleSlug] = useState<string>('hr_manager');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDesc, setCustomRoleDesc] = useState('');
  const [customRolePerms, setCustomRolePerms] = useState<string[]>(['employees.view', 'attendance.clock']);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Group permissions by module
  const modules = Array.from(new Set(permissions.map(p => p.module)));

  const activeRole = roles.find(r => r.slug === selectedRoleSlug) || roles[0];

  const handleTogglePermission = (roleSlug: string, permSlug: string) => {
    // Prevent modifying system super admin or org owner (they retain full permission by design)
    if (roleSlug === 'super_admin' || roleSlug === 'org_owner') {
      return;
    }

    const role = roles.find(r => r.slug === roleSlug);
    if (!role) return;

    let updatedPerms: string[];
    if (role.permissions.includes(permSlug)) {
      updatedPerms = role.permissions.filter(p => p !== permSlug);
    } else {
      updatedPerms = [...role.permissions, permSlug];
    }

    updateRolePermissions(roleSlug, updatedPerms);
    setSaveNotice(`Rule updated for [${role.name}]: ${permSlug} is now ${role.permissions.includes(permSlug) ? 'REVOKED' : 'GRANTED'}.`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomRole(customRoleName, customRoleDesc, customRolePerms);
    setSelectedRoleSlug(customRoleName.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
    setIsModalOpen(false);
    setCustomRoleName('');
    setCustomRoleDesc('');
    setSaveNotice(`Custom role [${customRoleName}] established with ${customRolePerms.length} permissions.`);
    setTimeout(() => setSaveNotice(null), 3500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Rule-Based Access Control (RBAC) Matrix</h1>
          <p className="text-xs text-slate-500">
            Granular permission governance &bull; Configure exact operational authority and access rules across user roles
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Define Custom Role</span>
        </button>
      </div>

      {saveNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Role Selector Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        {roles.map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedRoleSlug(r.slug)}
            className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center space-x-2 ${
              selectedRoleSlug === r.slug
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{r.name}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              selectedRoleSlug === r.slug ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-slate-500'
            }`}>
              {r.permissions.length} perms
            </span>
          </button>
        ))}
      </div>

      {/* Active Role Meta Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900">{activeRole.name}</h3>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold uppercase">
              slug: {activeRole.slug}
            </span>
            {activeRole.isSystem && (
              <span className="text-[10px] font-semibold text-slate-400 font-mono">(System Protected)</span>
            )}
          </div>
          <p className="text-slate-500 mt-0.5">{activeRole.description}</p>
        </div>

        <div className="flex items-center space-x-3 text-slate-600">
          <span>Active Workforce with Role:</span>
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
            {activeRole.permissions.length} of {permissions.length} rules active
          </span>
        </div>
      </div>

      {/* Permissions Matrix by Module */}
      <div className="space-y-4">
        {modules.map(moduleName => {
          const modulePerms = permissions.filter(p => p.module === moduleName);
          return (
            <div key={moduleName} className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Module: {moduleName.replace('_', ' ')}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">{modulePerms.length} rules defined</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {modulePerms.map(perm => {
                  const isGranted = activeRole.permissions.includes(perm.slug);
                  const isLocked = activeRole.slug === 'super_admin' || activeRole.slug === 'org_owner';

                  return (
                    <div
                      key={perm.id}
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition"
                    >
                      <div className="space-y-0.5 max-w-xl">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-slate-900">{perm.name}</p>
                          <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                            {perm.slug}
                          </code>
                        </div>
                        <p className="text-[11px] text-slate-500">{perm.description}</p>
                      </div>

                      <div>
                        {isLocked ? (
                          <div className="flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-semibold">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Always Granted (Executive)</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(activeRole.slug, perm.slug)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition ${
                              isGranted
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {isGranted ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Granted (Click to Revoke)</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5 text-slate-400" />
                                <span>Restricted (Click to Grant)</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Define Custom Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Define Custom Access Role</h3>
                <p className="text-[11px] text-slate-500">Create a tailored rule set for specialized staff members</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payroll & Benefits Specialist"
                  value={customRoleName}
                  onChange={e => setCustomRoleName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Role Scope & Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Audit attendance and generate monthly payroll reports"
                  value={customRoleDesc}
                  onChange={e => setCustomRoleDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-2">Assign Initial Permissions ({customRolePerms.length} selected):</label>
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {permissions.map(p => (
                    <label key={p.id} className="flex items-center space-x-2 p-1.5 rounded hover:bg-white text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customRolePerms.includes(p.slug)}
                        onChange={e => {
                          if (e.target.checked) {
                            setCustomRolePerms([...customRolePerms, p.slug]);
                          } else {
                            setCustomRolePerms(customRolePerms.filter(slug => slug !== p.slug));
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <span className="font-semibold text-slate-800">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-1.5">({p.slug})</span>
                      </div>
                    </label>
                  ))}
                </div>
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
                  Save & Establish Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
