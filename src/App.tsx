import React, { useState } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ClockModal } from './components/ClockModal';
import { AccessDenied } from './components/AccessDenied';
import { LoginView } from './views/LoginView';

import { DashboardView } from './views/DashboardView';
import { EmployeesView } from './views/EmployeesView';
import { DepartmentsView } from './views/DepartmentsView';
import { PositionsView } from './views/PositionsView';
import { AttendanceView } from './views/AttendanceView';
import { LeaveView } from './views/LeaveView';
import { DocumentsView } from './views/DocumentsView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { ReportsView } from './views/ReportsView';
import { UsersView } from './views/UsersView';
import { AuditView } from './views/AuditView';
import { SettingsView } from './views/SettingsView';
import { canAccessTab } from './utils/rbac';

function MainApp() {
  const { isAuthenticated, currentUser } = useDatabase();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);

  // If unauthenticated, present the Secure Access Gateway (Login screen)
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setCurrentTab('dashboard')} />;
  }

  // Check RBAC & Policy authorization for current tab
  const tabAccess = canAccessTab(currentUser, currentTab);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      {/* Main Left Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar with Tenant Switcher & Session Controls */}
        <Topbar onOpenClockModal={() => setIsClockModalOpen(true)} />

        {/* Dynamic Content View Container */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* If tab access is restricted by Rule-Based Access Control, show HTTP 403 Access Denied */}
            {!tabAccess.allowed ? (
              <AccessDenied 
                tab={currentTab} 
                onNavigate={setCurrentTab}
                requiredRole={tabAccess.requiredRole}
                requiredPermission={tabAccess.requiredPermission}
              />
            ) : (
              <>
                {currentTab === 'dashboard' && <DashboardView onNavigate={setCurrentTab} />}
                {currentTab === 'employees' && <EmployeesView />}
                {currentTab === 'departments' && <DepartmentsView />}
                {currentTab === 'positions' && <PositionsView />}
                {currentTab === 'attendance' && <AttendanceView onOpenClock={() => setIsClockModalOpen(true)} />}
                {currentTab === 'leave' && <LeaveView />}
                {currentTab === 'documents' && <DocumentsView />}
                {currentTab === 'announcements' && <AnnouncementsView />}
                {currentTab === 'reports' && <ReportsView />}
                {currentTab === 'users' && <UsersView />}
                {currentTab === 'audit' && <AuditView />}
                {currentTab === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Self-Service Digital Punch Card Modal */}
      <ClockModal isOpen={isClockModalOpen} onClose={() => setIsClockModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <DatabaseProvider>
      <MainApp />
    </DatabaseProvider>
  );
}
