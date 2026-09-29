import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Employee, EmploymentType, EmployeeStatus } from '../types';
import { 
  Users, Search, Filter, Plus, FileText, MoreHorizontal, 
  Mail, Phone, Calendar, Building, Briefcase, Eye, Edit3, Trash2, X 
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { 
    employees, 
    departments, 
    positions, 
    addEmployee, 
    updateEmployee, 
    archiveEmployee,
    currentUser 
  } = useDatabase();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'employment' | 'emergency'>('overview');

  // New Employee Form State
  const [formData, setFormData] = useState({
    employeeCode: `EMP-0${Date.now().toString().slice(-3)}`,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'female' as 'male' | 'female' | 'other',
    joiningDate: new Date().toISOString().split('T')[0],
    departmentId: departments[0]?.id || 1,
    positionId: positions[0]?.id || 1,
    employmentType: 'full_time' as EmploymentType,
    status: 'active' as EmployeeStatus,
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  const canManage = currentUser.role === 'super_admin' || currentUser.role === 'org_owner' || currentUser.role === 'org_admin' || currentUser.role === 'hr_manager';

  // Filtering
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || emp.departmentId.toString() === selectedDept;
    const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee({
      ...formData,
      userId: null,
      departmentId: Number(formData.departmentId),
      positionId: Number(formData.positionId),
      managerId: null,
      avatar: `https://images.unsplash.com/photo-${formData.gender === 'female' ? '1494790108377-be9c29b29330' : '1507003211169-0a1dd7228f2d'}?w=150&auto=format&fit=crop&q=80`,
    });
    setIsAddModalOpen(false);
    setFormData({
      employeeCode: `EMP-0${Date.now().toString().slice(-3)}`,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'female',
      joiningDate: new Date().toISOString().split('T')[0],
      departmentId: departments[0]?.id || 1,
      positionId: positions[0]?.id || 1,
      employmentType: 'full_time',
      status: 'active',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
    });
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500">
            Enterprise staff directory &bull; {filteredEmployees.length} personnel in active organization
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Employee</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, ID code, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Department & Title</th>
                <th className="py-3 px-4">Contract</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No employees matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={emp.firstName}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[11px] text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {emp.employeeCode}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{emp.positionTitle}</p>
                      <p className="text-[11px] text-slate-500">{emp.departmentName}</p>
                    </td>

                    <td className="py-3 px-4 capitalize text-slate-600">
                      {emp.employmentType.replace('_', ' ')}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {emp.joiningDate}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        emp.status === 'on_leave' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {emp.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setViewingEmployee(emp)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                          title="View Full Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <button
                            onClick={() => archiveEmployee(emp.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                            title="Archive / Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Comprehensive Profile Drawer / Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            {/* Drawer Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setViewingEmployee(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-4">
                <img
                  src={viewingEmployee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={viewingEmployee.firstName}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/50"
                />
                <div>
                  <h2 className="text-lg font-bold">{viewingEmployee.firstName} {viewingEmployee.lastName}</h2>
                  <p className="text-xs text-indigo-300 font-mono">{viewingEmployee.employeeCode} &bull; {viewingEmployee.positionTitle}</p>
                  <p className="text-xs text-slate-400 mt-1">{viewingEmployee.departmentName}</p>
                </div>
              </div>

              {/* Tab Bar */}
              <div className="flex space-x-4 mt-6 border-b border-slate-800 text-xs">
                <button
                  onClick={() => setActiveProfileTab('overview')}
                  className={`pb-2 border-b-2 font-medium transition ${
                    activeProfileTab === 'overview' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Overview & Contact
                </button>
                <button
                  onClick={() => setActiveProfileTab('employment')}
                  className={`pb-2 border-b-2 font-medium transition ${
                    activeProfileTab === 'employment' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Employment Details
                </button>
                <button
                  onClick={() => setActiveProfileTab('emergency')}
                  className={`pb-2 border-b-2 font-medium transition ${
                    activeProfileTab === 'emergency' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Emergency Contacts
                </button>
              </div>
            </div>

            {/* Profile Tab Body */}
            <div className="p-6 text-xs space-y-4">
              {activeProfileTab === 'overview' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Email Address</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{viewingEmployee.email}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone Number</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{viewingEmployee.phone || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Gender</span>
                    <p className="font-semibold text-slate-900 capitalize mt-0.5">{viewingEmployee.gender}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Date of Birth</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{viewingEmployee.dateOfBirth || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Residential Address</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{viewingEmployee.address || 'Standard Registered Corporate Address'}</p>
                  </div>
                </div>
              )}

              {activeProfileTab === 'employment' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Department</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{viewingEmployee.departmentName}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Position Title</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{viewingEmployee.positionTitle}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Employment Type</span>
                    <p className="font-semibold text-slate-900 capitalize mt-0.5">{viewingEmployee.employmentType.replace('_', ' ')}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Joining Date</span>
                    <p className="font-semibold text-slate-900 font-mono mt-0.5">{viewingEmployee.joiningDate}</p>
                  </div>
                </div>
              )}

              {activeProfileTab === 'emergency' && (
                <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Contact Name:</span>
                    <span className="font-semibold text-slate-900">{viewingEmployee.emergencyContactName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Relationship:</span>
                    <span className="font-semibold text-slate-900">{viewingEmployee.emergencyContactRelation || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Emergency Phone:</span>
                    <span className="font-semibold text-slate-900">{viewingEmployee.emergencyContactPhone || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Onboard New Employee</h3>
                <p className="text-[11px] text-slate-500">Add staff member to current organization tenant</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Official Work Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department *</label>
                  <select
                    value={formData.departmentId}
                    onChange={e => setFormData({ ...formData, departmentId: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Position / Title *</label>
                  <select
                    value={formData.positionId}
                    onChange={e => setFormData({ ...formData, positionId: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                  >
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contract Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={e => setFormData({ ...formData, employmentType: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
