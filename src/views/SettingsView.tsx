import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Settings, Building, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentOrg, updateOrgSettings } = useDatabase();
  const [name, setName] = useState(currentOrg.name);
  const [email, setEmail] = useState(currentOrg.email);
  const [timezone, setTimezone] = useState(currentOrg.timezone);
  const [shiftStart, setShiftStart] = useState(currentOrg.businessHoursStart);
  const [shiftEnd, setShiftEnd] = useState(currentOrg.businessHoursEnd);
  const [gracePeriod, setGracePeriod] = useState(currentOrg.gracePeriodMinutes);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgSettings({
      name,
      email,
      timezone,
      businessHoursStart: shiftStart,
      businessHoursEnd: shiftEnd,
      gracePeriodMinutes: Number(gracePeriod),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization Profile & Parameters</h1>
        <p className="text-xs text-slate-500">
          Configure business rules, standard shift hours, and attendance punctuality grace periods
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Organization settings saved and synchronized across tenant database successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
        {/* Section 1: Legal Identity */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Corporate Identity</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Company / Organization Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Primary Operations Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Default Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tenant Organization Slug</label>
              <input
                type="text"
                disabled
                value={currentOrg.slug}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Shift & Punctuality Policy */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Standard Working Hours & Punctuality Engine</span>
          </h3>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Shift Start Time (24h)</label>
              <input
                type="time"
                value={shiftStart}
                onChange={e => setShiftStart(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Shift End Time (24h)</label>
              <input
                type="time"
                value={shiftEnd}
                onChange={e => setShiftEnd(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Grace Period (Minutes)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={gracePeriod}
                onChange={e => setGracePeriod(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">Punches after this flag as 'Late'.</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            Save Organization Settings
          </button>
        </div>
      </form>
    </div>
  );
};
