import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Building2, Users, Bell, Search, Clock, LogOut, CheckCircle2, 
  ChevronDown, Check, Globe, User, Shield 
} from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';

interface TopbarProps {
  onOpenClockModal: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenClockModal }) => {
  const { 
    currentUser, 
    currentOrg, 
    switchOrganization, 
    setCurrentUser, 
    availableUsers, 
    availableOrgs,
    notifications,
    markNotificationAsRead,
    logout
  } = useDatabase();

  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Left: Organization Switcher */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={() => {
              setShowOrgDropdown(!showOrgDropdown);
              setShowUserDropdown(false);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left"
          >
            <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentOrg.code}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {currentOrg.name}
              </p>
              <p className="text-[10px] text-slate-500">{currentOrg.timezone}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Org Switcher Dropdown */}
          {showOrgDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-100">
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Select Organization</span>
              </div>
              {availableOrgs.map(org => (
                <button
                  key={org.id}
                  onClick={() => {
                    switchOrganization(org.id);
                    setShowOrgDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition text-xs ${
                    org.id === currentOrg.id ? 'bg-indigo-50 text-indigo-900 font-medium' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {org.code}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 leading-tight">{org.name}</p>
                      <p className="text-[10px] text-slate-500">{org.timezone}</p>
                    </div>
                  </div>
                  {org.id === currentOrg.id && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search employees, positions..."
            className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg w-64 transition focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Clock In/Out Quick Action Button */}
        <button
          onClick={onOpenClockModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium transition"
        >
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Clock In / Out</span>
        </button>

        {/* In-App Notifications Tray */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
              setShowOrgDropdown(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Notifications ({unreadCount})</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No notifications yet.</p>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition ${!n.isRead ? 'bg-indigo-50/40' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-slate-900 text-xs">{n.title}</p>
                        {!n.isRead && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1"></span>}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 leading-snug">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.createdAt}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative border-l border-slate-200 pl-3">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowOrgDropdown(false);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
            />
            <div className="text-left hidden lg:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{currentUser.name}</p>
              <span className="inline-block text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-1.5 py-0.2 rounded">
                {currentUser.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Switcher Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
              </div>

              <div className="px-4 py-1.5 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Switch User Account
              </div>

              <div className="max-h-60 overflow-y-auto">
                {availableUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition text-xs ${
                      user.id === currentUser.id ? 'bg-indigo-50 text-indigo-900 font-medium' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {user.role.replace('_', ' ')} &bull; {user.email}
                      </p>
                    </div>
                    {user.id === currentUser.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-slate-100 mt-1 space-y-1">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-slate-50 transition text-xs font-medium text-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Profile & Permissions</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  className="w-full px-3 py-2 text-left rounded-lg hover:bg-rose-50 transition text-xs font-medium text-rose-600 flex items-center space-x-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile & Permissions Modal */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </header>
  );
};
