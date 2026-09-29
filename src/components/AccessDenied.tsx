import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Lock, ArrowLeft, UserCheck } from 'lucide-react';
import { NavTab } from './Sidebar';

interface AccessDeniedProps {
  tab: NavTab;
  requiredRole?: string;
  requiredPermission?: string;
  onNavigate: (tab: NavTab) => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  tab,
  requiredRole,
  requiredPermission,
  onNavigate,
}) => {
  const { currentUser, currentOrg, availableUsers, setCurrentUser } = useDatabase();

  const higherPrivilegedUsers = availableUsers.filter(u => 
    u.role === 'super_admin' || (u.organizationId === currentOrg.id && (u.role === 'org_owner' || u.role === 'hr_manager'))
  );

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg text-center p-8">
        <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Access Restricted
        </h2>

        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Your account (<strong className="text-slate-700">{currentUser.name}</strong> &bull; {currentUser.role.replace('_', ' ')}) doesn't have permission to access the <strong className="text-slate-800 capitalize">{tab}</strong> section.
        </p>

        <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Your Role:</span>
            <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase text-[10px]">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Required Role:</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase text-[10px]">
              {requiredRole || 'HR Manager / Admin'}
            </span>
          </div>
          {requiredPermission && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Required Permission:</span>
              <span className="font-mono text-[10px] text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                {requiredPermission}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>

        {/* Demo Switcher */}
        {higherPrivilegedUsers.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-left">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              Switch account for testing:
            </p>
            <div className="space-y-1.5">
              {higherPrivilegedUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => setCurrentUser(user)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-left text-xs transition flex items-center justify-between group"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{user.name}</span>
                    <span className="text-[10px] text-slate-500 ml-2 uppercase font-medium">({user.role.replace('_', ' ')})</span>
                  </div>
                  <span className="text-[11px] text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Switch &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
