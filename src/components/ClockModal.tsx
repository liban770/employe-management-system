import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

interface ClockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClockModal: React.FC<ClockModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentOrg, clockIn, clockOut, attendance, employees } = useDatabase();
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const currentEmp = employees.find(e => e.userId === currentUser.id);
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a.employeeId === currentEmp?.id && a.date === today);

  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleClockIn = () => {
    setFeedback(null);
    const res = clockIn(notes);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setNotes('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleClockOut = () => {
    setFeedback(null);
    const res = clockOut();
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Punch Card</h3>
              <p className="text-[11px] text-slate-500 font-mono">Timezone: {currentOrg.timezone}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">✕</button>
        </div>

        {/* Live Server / Local Time Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 text-center mb-4">
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date().toDateString()}</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {currentTime}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Standard Shift: <span className="font-semibold text-slate-700">{currentOrg.businessHoursStart} – {currentOrg.businessHoursEnd}</span> (Grace period: {currentOrg.gracePeriodMinutes}m)
          </p>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className={`p-3 rounded-lg text-xs mb-4 flex items-start space-x-2 ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Today's Status Banner */}
        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg mb-4 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Active Employee:</span>
            <span className="font-semibold text-slate-900">{currentEmp ? `${currentEmp.firstName} ${currentEmp.lastName} (${currentEmp.employeeCode})` : 'No Profile Linked'}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-slate-600">Clock In Time:</span>
            <span className="font-mono font-semibold text-slate-800">{todayRecord?.clockIn || 'Not Clocked In'}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-slate-600">Clock Out Time:</span>
            <span className="font-mono font-semibold text-slate-800">{todayRecord?.clockOut || (todayRecord ? 'Active Shift' : '—')}</span>
          </div>
        </div>

        {/* Punch Actions */}
        {!todayRecord ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Shift Notes / Reason:</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Remote working, site visit, train delay..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
            />
            <button
              onClick={handleClockIn}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              Clock In Now (Start Shift)
            </button>
          </div>
        ) : !todayRecord.clockOut ? (
          <button
            onClick={handleClockOut}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            Clock Out Now (End Shift)
          </button>
        ) : (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-center rounded-lg text-xs font-medium">
            ✓ Shift complete for today. Thank you for your work!
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
