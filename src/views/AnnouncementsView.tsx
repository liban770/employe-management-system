import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Megaphone, Plus, Calendar, AlertCircle } from 'lucide-react';
import { PriorityLevel } from '../types';

export const AnnouncementsView: React.FC = () => {
  const { announcements, createAnnouncement, departments, currentUser } = useDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [departmentId, setDepartmentId] = useState<number | null>(null);

  const canPublish = currentUser.role === 'super_admin' || currentUser.role === 'org_owner' || currentUser.role === 'org_admin' || currentUser.role === 'hr_manager';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnnouncement({
      title,
      content,
      priority,
      departmentId: departmentId ? Number(departmentId) : null,
    });
    setTitle('');
    setContent('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Company Announcements</h1>
          <p className="text-xs text-slate-500">
            Official communications, policy updates, and corporate events
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  ann.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                  ann.priority === 'important' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {ann.priority}
                </span>
                <span className="text-xs font-semibold text-slate-400">&bull;</span>
                <span className="text-xs text-slate-500 font-medium">Published by {ann.authorName}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{ann.publishedAt}</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Broadcast Announcement</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Announcement Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Company Offsite 2026 Schedule"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Audience</label>
                  <select
                    value={departmentId || ''}
                    onChange={e => setDepartmentId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                  >
                    <option value="">All Company Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} Only</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Body Text / Details *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write clear instructions, dates, or details for the workforce..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
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
                  Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
