import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Key, CheckCircle2, AlertCircle, X, LogOut, Award, Shield 
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentOrg, logout, roles, permissions } = useDatabase();

  const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'password'>('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const activeRole = roles.find(r => r.slug === currentUser.role);
  const userPermissionSlugs = activeRole?.permissions || [];
  const assignedPermissions = permissions.filter(p => userPermissionSlugs.includes(p.slug));
  const isAllAccess = currentUser.role === 'org_owner' || currentUser.role === 'super_admin';

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'New password must contain at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setStatusMessage({ type: 'success', text: 'Password successfully updated.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-4">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-white/30"
            />
            <div>
              <h3 className="text-base font-bold text-white">{currentUser.name}</h3>
              <p className="text-xs text-slate-300 font-mono">{currentUser.email}</p>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                <span>{currentOrg.name}</span>
                <span>&bull;</span>
                <span className="text-indigo-300 capitalize font-medium">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 mt-5 pt-3 border-t border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'profile' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'permissions' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Permissions ({isAllAccess ? 'All' : assignedPermissions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'password' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {statusMessage && (
            <div className={`mb-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
              statusMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">Role</span>
                  <p className="font-semibold text-slate-800 capitalize">{currentUser.role.replace('_', ' ')}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">Status</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {currentUser.status}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">Company</span>
                  <p className="font-semibold text-slate-800">{currentOrg.name}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">Timezone</span>
                  <p className="font-semibold text-slate-800">{currentOrg.timezone}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-3">
              {isAllAccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Full Administrator Privileges
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    This account has unrestricted access across all modules in the organization.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {assignedPermissions.map(p => (
                    <div key={p.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-xs">{p.name}</span>
                        <span className="text-[9px] uppercase font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded">
                          {p.module}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{p.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition"
              >
                Update Password
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
