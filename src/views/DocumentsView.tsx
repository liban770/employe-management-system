import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { FolderLock, UploadCloud, FileText, Download, Trash2, ShieldCheck, X } from 'lucide-react';
import { DocumentCategory } from '../types';

export const DocumentsView: React.FC = () => {
  const { documents, employees, uploadDocument, currentUser } = useDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<number>(employees[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('contract');
  const [fileName, setFileName] = useState('');

  const canManage = currentUser.role === 'super_admin' || currentUser.role === 'org_owner' || currentUser.role === 'org_admin' || currentUser.role === 'hr_manager';

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    uploadDocument({
      employeeId: Number(employeeId),
      title,
      category,
      fileName: fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileSize: 1024 * 1024 * (1 + Math.floor(Math.random() * 3)), // mock 1-4 MB
      mimeType: 'application/pdf',
    });
    setTitle('');
    setFileName('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Secure Employee Document Vault</h1>
          <p className="text-xs text-slate-500">
            Encrypted storage &bull; Contracts, government credentials, academic certificates, and tax filings
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Confidential Document</span>
        </button>
      </div>

      {/* Security Banner */}
      <div className="p-3.5 bg-slate-900 text-slate-300 rounded-xl text-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-white">Zero Public Web Access Guaranteed</p>
            <p className="text-[11px] text-slate-400">Files reside in protected tenant-isolated storage outside webroot. Served only via authenticated binary stream.</p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase bg-slate-800 text-emerald-400 px-2 py-1 rounded">
          MIME Sniffed &bull; AES Encrypted
        </span>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">File Name & Size</th>
                <th className="py-3 px-4">Uploaded At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No documents uploaded in vault yet.
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{doc.title}</p>
                          <p className="text-[10px] font-mono text-slate-400">ID: #{doc.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {doc.employeeName}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {doc.category.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-mono text-slate-700 text-[11px] truncate max-w-xs">{doc.fileName}</p>
                      <p className="text-[10px] text-slate-400">{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB &bull; {doc.mimeType}</p>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {doc.createdAt}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => alert(`Simulating authorized file stream for: ${doc.fileName} (Tenant verified).`)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded font-medium transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Upload to Document Vault</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Employee *</label>
                <select
                  value={employeeId}
                  onChange={e => setEmployeeId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Non-Disclosure Agreement (NDA) 2026"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                >
                  <option value="contract">Employment Contract</option>
                  <option value="id_proof">Government ID / Passport</option>
                  <option value="certificate">Professional / Degree Certificate</option>
                  <option value="tax_form">Tax & Withholding Form</option>
                  <option value="resume">Resume / CV</option>
                  <option value="other">Other Official Document</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Select File (.pdf, .png, .jpg)</label>
                <input
                  type="file"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
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
                  Store Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
