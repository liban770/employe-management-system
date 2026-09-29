import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { User, Role } from '../types';
import { 
  Users, Shield, CheckCircle2, AlertTriangle, 
  X, Lock, Key, Award, UserPlus, GitFork, 
  ArrowDown, ArrowRight, HelpCircle, Layers, 
  Check, Building2, UserCheck, AlertCircle 
} from 'lucide-react';
import { INITIAL_POLICIES } from '../data/mockDatabase';
import { 
  USER_CREATION_HIERARCHY, 
  getCreatableRoles, 
  canUserCreateRole, 
  RoleHierarchyItem 
} from '../utils/rbac';

export const UsersView: React.FC = () => {
  const { 
    availableUsers, 
    availableOrgs,
    currentOrg, 
    currentUser, 
    setCurrentUser, 
    roles, 
    permissions, 
    updateRolePermissions, 
    createCustomRole,
    addUser,
  } = useDatabase();

  const [activeTab, setActiveTab] = useState<'users' | 'hierarchy' | 'roles' | 'rules'>('users');

  // User Creation Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<string>('employee');
  const [selectedOrgId, setSelectedOrgId] = useState<number>(currentOrg.id);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Custom Role Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDesc, setCustomRoleDesc] = useState('');
  const [customRolePerms, setCustomRolePerms] = useState<string[]>(['employees.view', 'attendance.clock']);

  // Selected Role for Permissions Editing
  const [selectedRoleSlug, setSelectedRoleSlug] = useState<string>('hr_manager');

  // Hierarchy Simulator States
  const [simCreatorRole, setSimCreatorRole] = useState<string>(currentUser.role);
  const [simTargetRole, setSimTargetRole] = useState<string>('employee');

  // Hierarchy calculations
  const creatorHierarchy = USER_CREATION_HIERARCHY[currentUser.role] || USER_CREATION_HIERARCHY.employee;
  const creatableRoles = getCreatableRoles(currentUser.role, roles);
  const canCreateAnyUser = creatableRoles.length > 0;

  // Tenant-filtered users
  const tenantUsers = currentUser.role === 'super_admin' 
    ? availableUsers 
    : availableUsers.filter(u => u.organizationId === currentOrg.id || u.role === 'super_admin');

  // Group permissions by module
  const modules = Array.from(new Set(permissions.map(p => p.module)));

  const openCreateUserModal = () => {
    if (creatableRoles.length > 0) {
      setNewRole(creatableRoles[0].slug);
    }
    setSelectedOrgId(currentOrg.id);
    setIsCreateModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addUser({
      name: newName,
      email: newEmail,
      role: newRole,
      organizationId: currentUser.role === 'super_admin' ? Number(selectedOrgId) : currentOrg.id,
    });

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: res.message,
      });
      setIsCreateModalOpen(false);
      setNewName('');
      setNewEmail('');
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message,
      });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleResetPassword = (targetUser: User) => {
    setStatusMessage({
      type: 'success',
      text: `Password reset email sent to ${targetUser.email}.`,
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTogglePermission = (roleSlug: string, permSlug: string) => {
    const targetRole = roles.find(r => r.slug === roleSlug);
    if (!targetRole) return;
    
    // Org Owner and Super Admin are unmodifiable root
    if (targetRole.slug === 'org_owner' || targetRole.slug === 'super_admin') {
      setStatusMessage({
        type: 'error',
        text: 'Owner and Super Admin have full system access by default.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const currentPerms = targetRole.permissions;
    const updated = currentPerms.includes(permSlug)
      ? currentPerms.filter(p => p !== permSlug)
      : [...currentPerms, permSlug];

    updateRolePermissions(roleSlug, updated);
    setStatusMessage({
      type: 'success',
      text: `Permissions updated for ${targetRole.name}.`,
    });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleCreateCustomRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoleName.trim()) return;
    createCustomRole(customRoleName, customRoleDesc, customRolePerms);
    setStatusMessage({
      type: 'success',
      text: `Custom role "${customRoleName}" created with ${customRolePerms.length} permissions.`,
    });
    setIsRoleModalOpen(false);
    setCustomRoleName('');
    setCustomRoleDesc('');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Hierarchy Simulator Results
  const isSimAllowed = canUserCreateRole(simCreatorRole, simTargetRole);
  const simCreatorMeta = USER_CREATION_HIERARCHY[simCreatorRole] || USER_CREATION_HIERARCHY.employee;
  const simTargetMeta = USER_CREATION_HIERARCHY[simTargetRole] || USER_CREATION_HIERARCHY.employee;

  const hierarchyList = Object.values(USER_CREATION_HIERARCHY).sort((a, b) => a.tier - b.tier);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Users & Roles</h1>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${creatorHierarchy.badgeColor}`}>
              Tier {creatorHierarchy.tier}: {creatorHierarchy.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user accounts, enforce role creation hierarchies, and configure permissions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {creatorHierarchy.tier <= 3 && (
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Create Custom Role</span>
            </button>
          )}

          {canCreateAnyUser ? (
            <button
              onClick={openCreateUserModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed">
              <Lock className="w-3.5 h-3.5" />
              <span>Provisioning Restricted (Self-Service)</span>
            </div>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in ${
          statusMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 font-semibold transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Logins ({tenantUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-3 px-3 font-semibold transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'hierarchy'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>Creation Hierarchy</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">New</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-3 font-semibold transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'roles'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Role Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 font-semibold transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'rules'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Access Rules</span>
        </button>
      </div>

      {/* TAB 1: Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-800">Directory of Provisioned User Accounts</p>
              <p className="text-[11px] text-slate-500">
                {currentUser.role === 'super_admin' ? 'Cross-tenant view (All Organizations)' : `Scoped to ${currentOrg.name}`}
              </p>
            </div>
            <div className="text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              Your Provisioning Authority: <strong className="text-indigo-600">{creatableRoles.length} roles creatable</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Hierarchy Tier & Role</th>
                  {currentUser.role === 'super_admin' && <th className="py-3 px-4">Organization</th>}
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenantUsers.map(user => {
                  const isSelf = user.id === currentUser.id;
                  const roleDef = roles.find(r => r.slug === user.role);
                  const roleMeta = USER_CREATION_HIERARCHY[user.role];
                  const userOrg = availableOrgs.find(o => o.id === user.organizationId);

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {user.name}
                              {isSelf && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 rounded">
                                  YOU
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleMeta ? roleMeta.badgeColor : 'bg-slate-100 text-slate-700'}`}>
                            {roleMeta ? `Tier ${roleMeta.tier}` : 'Custom'}
                          </span>
                          <span className="text-slate-800 font-medium text-xs">
                            {roleDef ? roleDef.name : user.role.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      {currentUser.role === 'super_admin' && (
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {user.organizationId ? (
                            <span className="font-medium text-slate-800">{userOrg?.name || `Org #${user.organizationId}`}</span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[10px]">Global (All)</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span className="capitalize">{user.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                            title="Send Password Reset"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCurrentUser(user)}
                            className="px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200 transition"
                          >
                            Switch User
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: User Creation Hierarchy (NEW) */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          {/* Explanation Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-sm">
            <div className="max-w-3xl space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-mono text-[10px] font-semibold uppercase tracking-wider">
                  Role Provisioning Governance
                </span>
                <span className="text-xs text-indigo-300">&bull; Anti-Privilege Escalation Model</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Who Creates Users? The User Creation Hierarchy
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                In this enterprise architecture, user provisioning is strictly governed by hierarchical tiers. 
                A user role can only create accounts that are at a <strong>strictly lower or permitted subordinate tier</strong>. 
                For example, an HR Manager can create Department Managers and Employees, but can never provision an Organization Owner or Super Admin.
              </p>
            </div>

            {/* Current User Authority Badge */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Logged in as:</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${creatorHierarchy.badgeColor}`}>
                  Tier {creatorHierarchy.tier}: {creatorHierarchy.name}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>You can create: <strong>{creatableRoles.length > 0 ? creatableRoles.map(r => r.name).join(', ') : 'None (Read-Only)'}</strong></span>
              </div>
            </div>
          </div>

          {/* Hierarchy Tier Flow Cards */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>The 6-Tier Creation Hierarchy</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each tier defines exact provisioning authority boundaries across tenant and platform scopes.
              </p>
            </div>

            <div className="space-y-3">
              {hierarchyList.map((item, index) => {
                const isCurrent = currentUser.role === item.roleSlug;
                const creatableNames = item.canCreateSlugs
                  .map(slug => USER_CREATION_HIERARCHY[slug]?.name || slug)
                  .join(', ');

                return (
                  <div key={item.tier} className="relative">
                    <div className={`p-4 rounded-xl border transition ${
                      isCurrent 
                        ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-200' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs shadow-xs shrink-0">
                            T{item.tier}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${item.badgeColor}`}>
                                {item.scope === 'global' ? 'Global Platform' : 'Tenant Scoped'}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.2 rounded">
                                  YOUR ACTIVE ROLE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Allowed Creation List */}
                        <div className="md:text-right shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Can Provision Roles:
                          </span>
                          {item.canCreateSlugs.length > 0 ? (
                            <div className="flex flex-wrap md:justify-end gap-1">
                              {item.canCreateSlugs.map(slug => {
                                const targetMeta = USER_CREATION_HIERARCHY[slug];
                                return (
                                  <span key={slug} className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>{targetMeta?.name || slug}</span>
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic flex items-center md:justify-end gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Cannot create users (Self-Service)</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {index < hierarchyList.length - 1 && (
                      <div className="flex justify-center my-1">
                        <ArrowDown className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Hierarchy Authority Simulator */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Interactive Creation Authority Simulator</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate any Creator Role attempting to provision any Target Role to verify the system's rule evaluation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. Select Creator Role (Logged-In User)
                  </label>
                  <select
                    value={simCreatorRole}
                    onChange={e => setSimCreatorRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    {hierarchyList.map(h => (
                      <option key={h.roleSlug} value={h.roleSlug}>
                        Tier {h.tier}: {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Select Role Being Created (Target Account)
                  </label>
                  <select
                    value={simTargetRole}
                    onChange={e => setSimTargetRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    {hierarchyList.map(h => (
                      <option key={h.roleSlug} value={h.roleSlug}>
                        Tier {h.tier}: {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                isSimAllowed 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {isSimAllowed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    )}
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {isSimAllowed ? 'Decision: PERMISSION GRANTED (ALLOW)' : 'Decision: PERMISSION DENIED (HTTP 403)'}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed">
                    {isSimAllowed ? (
                      <>
                        <strong>{simCreatorMeta.name} (Tier {simCreatorMeta.tier})</strong> possesses sufficient authority to provision <strong>{simTargetMeta.name} (Tier {simTargetMeta.tier})</strong> accounts.
                      </>
                    ) : (
                      <>
                        <strong>{simCreatorMeta.name} (Tier {simCreatorMeta.tier})</strong> is <strong>not authorized</strong> to provision <strong>{simTargetMeta.name} (Tier {simTargetMeta.tier})</strong>. Accounts cannot grant equal or higher administrative privileges.
                      </>
                    )}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-slate-600">
                  <span className="font-semibold">Rule Enforced:</span> Strict Hierarchical Role Provisioning Policy
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Complete Role Provisioning Matrix
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Creator Role \ Target Role</th>
                      <th className="py-2.5 px-2">Super Admin</th>
                      <th className="py-2.5 px-2">Org Owner</th>
                      <th className="py-2.5 px-2">Org Admin</th>
                      <th className="py-2.5 px-2">HR Manager</th>
                      <th className="py-2.5 px-2">Dept Manager</th>
                      <th className="py-2.5 px-2">Employee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hierarchyList.map(creator => (
                      <tr key={creator.roleSlug} className={currentUser.role === creator.roleSlug ? 'bg-indigo-50/50 font-semibold' : 'hover:bg-slate-50/60'}>
                        <td className="py-2.5 px-3 text-left font-medium text-slate-900 flex items-center space-x-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${creator.badgeColor}`}>
                            T{creator.tier}
                          </span>
                          <span>{creator.name}</span>
                        </td>
                        {['super_admin', 'org_owner', 'org_admin', 'hr_manager', 'dept_manager', 'employee'].map(targetSlug => {
                          const allowed = creator.canCreateSlugs.includes(targetSlug);
                          return (
                            <td key={targetSlug} className="py-2.5 px-2">
                              {allowed ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Role Permissions */}
      {activeTab === 'roles' && (
        <div className="space-y-5">
          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {roles.map(r => {
              const isSelected = selectedRoleSlug === r.slug;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleSlug(r.slug)}
                  className={`p-3 rounded-xl border text-left transition ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className={`font-bold text-xs truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {r.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {r.slug === 'org_owner' || r.slug === 'super_admin' ? 'All Permissions' : `${r.permissions.length} Enabled`}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Selected Role Permissions */}
          {(() => {
            const currentSelectedRole = roles.find(r => r.slug === selectedRoleSlug) || roles[0];
            const isUnrestricted = currentSelectedRole.slug === 'org_owner' || currentSelectedRole.slug === 'super_admin';

            return (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>Permissions for:</span>
                      <span className="text-indigo-600">{currentSelectedRole.name}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{currentSelectedRole.description}</p>
                  </div>
                  {isUnrestricted ? (
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                      Full Access
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      Check/uncheck permissions to update access
                    </span>
                  )}
                </div>

                {/* Modules & Checkboxes */}
                <div className="space-y-6">
                  {modules.map(moduleName => {
                    const modulePerms = permissions.filter(p => p.module === moduleName);

                    return (
                      <div key={moduleName} className="space-y-2">
                        <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            {moduleName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {modulePerms.filter(p => currentSelectedRole.permissions.includes(p.slug)).length} / {modulePerms.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {modulePerms.map(perm => {
                            const isGranted = isUnrestricted || currentSelectedRole.permissions.includes(perm.slug);

                            return (
                              <label
                                key={perm.id}
                                className={`p-3 rounded-xl border transition flex items-start space-x-3 cursor-pointer ${
                                  isGranted
                                    ? 'bg-indigo-50/40 border-indigo-200'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                } ${isUnrestricted ? 'cursor-not-allowed opacity-90' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={isUnrestricted}
                                  checked={isGranted}
                                  onChange={() => handleTogglePermission(currentSelectedRole.slug, perm.slug)}
                                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                />
                                <div className="text-xs flex-1">
                                  <p className="font-semibold text-slate-900 leading-tight">{perm.name}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{perm.description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 4: Access Rules */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">System Access Rules</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These rules define access boundaries across roles, departments, and self-service records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INITIAL_POLICIES.map(policy => (
              <div key={policy.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{policy.name}</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {policy.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{policy.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal with Hierarchy Enforcement */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Provision New User</h3>
                  <p className="text-[11px] text-slate-500">Tier-governed account creation</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Creator Authority Note */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Your Authority</span>
                <span className="font-bold text-slate-800">{creatorHierarchy.name} (Tier {creatorHierarchy.tier})</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${creatorHierarchy.badgeColor}`}>
                {creatableRoles.length} Roles Allowed
              </span>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Liam Anderson"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="liam.a@company.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {currentUser.role === 'super_admin' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span>Target Tenant Organization</span>
                    <span className="text-[10px] text-purple-600 font-bold">Super Admin Privilege</span>
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={e => setSelectedOrgId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                  >
                    {availableOrgs.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>Assigned Role</span>
                  <span className="text-[10px] text-slate-400">Filtered by hierarchy</span>
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 capitalize"
                >
                  {creatableRoles.map(r => {
                    const targetMeta = USER_CREATION_HIERARCHY[r.slug];
                    return (
                      <option key={r.id} value={r.slug}>
                        {r.name} {targetMeta ? `(Tier ${targetMeta.tier})` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Default temporary password will be set to: <code className="font-mono font-semibold text-slate-700">Password123!</code>
                </p>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm & Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Create Custom Role</h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRoleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Role Name</label>
                <input
                  type="text"
                  required
                  value={customRoleName}
                  onChange={e => setCustomRoleName(e.target.value)}
                  placeholder="e.g. Operations Coordinator"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={customRoleDesc}
                  onChange={e => setCustomRoleDesc(e.target.value)}
                  placeholder="Briefly describe the role scope"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
