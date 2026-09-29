import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Lock, Mail, Eye, EyeOff, ArrowRight, CheckCircle2, 
  AlertCircle, ShieldCheck, UserCheck, RefreshCw 
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useDatabase();

  const [email, setEmail] = useState('marcus.hr@apexglobal.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'HR Manager',
      name: 'Marcus Sterling',
      email: 'marcus.hr@apexglobal.com',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Manages employees, attendance, and leave',
    },
    {
      role: 'Department Manager',
      name: 'Elena Rostova',
      email: 'elena.eng@apexglobal.com',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Reviews department team and approvals',
    },
    {
      role: 'Employee',
      name: 'David Chen',
      email: 'david.chen@apexglobal.com',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Self-service: clock in/out & request leave',
    },
    {
      role: 'Organization Owner',
      name: 'Victoria Vance',
      email: 'victoria@apexglobal.com',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Full administrative access',
    },
    {
      role: 'Super Admin',
      name: 'Cassandra Thorne',
      email: 'superadmin@staffcore.io',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Cross-tenant platform access',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage('Login successful! Redirecting...');
        if (onLoginSuccess) {
          setTimeout(onLoginSuccess, 300);
        }
      } else {
        setErrorMessage(res.message);
      }
    }, 300);
  };

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Password123!');
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(userEmail, 'Password123!');
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage('Login successful! Redirecting...');
        if (onLoginSuccess) {
          setTimeout(onLoginSuccess, 200);
        }
      } else {
        setErrorMessage(res.message);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Left: Test Credentials & Roles */}
        <div className="lg:col-span-6 bg-slate-50 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                SC
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">StaffCore</h1>
                <p className="text-xs text-slate-500">Staff & HR Management Portal</p>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Demo Accounts (Click to Test)
              </h2>
              <p className="text-xs text-slate-500">
                Default password for all accounts: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-mono font-semibold">Password123!</code>
              </p>
            </div>

            {/* Quick Login Persona Buttons */}
            <div className="space-y-2">
              {demoAccounts.map(account => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account.email)}
                  className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between group ${
                    email === account.email 
                      ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-200' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 text-xs truncate">{account.name}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${account.badge}`}>
                        {account.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{account.email}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{account.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                    Login &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-500">
              Select any account above or enter credentials manually on the right.
            </p>
          </div>
        </div>

        {/* Right: Sign In Form */}
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your work email and password to access your account.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl outline-none transition focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl outline-none transition focus:ring-2 focus:ring-indigo-100 font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-2 mt-4"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Demo tip: Sign in as different roles to test access permissions.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
