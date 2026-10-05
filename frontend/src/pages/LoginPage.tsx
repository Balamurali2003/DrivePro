import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ShieldCheck, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both username/email and password.');
      toast.error('Please enter both username/email and password.');
      return;
    }

    setLoading(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        toast.success('Authentication successful! Welcome to Sri Munis Kanna Admin ERP.');
        navigate('/dashboard');
      } else {
        setErrorMsg('Access Denied: Invalid username or password. Only authorized admins can login.');
        toast.error('Access Denied: Invalid username or password.');
      }
    } catch {
      setErrorMsg('Authentication service unavailable. Please check your network or credentials.');
      toast.error('Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin');
    setPassword('@dmin#123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        <div className="p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                <Car className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight leading-none">Sri Munis Kanna</h1>
                <p className="text-xs text-sky-400 font-bold tracking-wide uppercase mt-1">Driving School &amp; Rentals ERP</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Restricted Admin Portal</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Access to student records, fleet scheduling, RTO licence applications, invoices, accounting, and system configurations is strictly restricted to authenticated personnel.
            </p>

            <div className="p-4 mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorized Admin Credentials:</span>
                </div>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                >
                  Fill Admin Form
                </button>
              </div>
              <p className="text-xs text-slate-300">User: <code className="text-amber-300 font-bold">admin</code></p>
              <p className="text-xs text-slate-300">Password: <code className="text-amber-300 font-bold">@dmin#123</code></p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Security &amp; Access Policy</span>
              </div>
              <p>• Unauthorized access attempts are monitored and logged.</p>
              <p>• Sessions expire automatically after inactivity.</p>
              <p>• For staff credential resets, contact the Master Admin.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sri Munis Kanna Driving School ERP Security Gateway</span>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col justify-center bg-slate-900">
          <h3 className="text-lg font-bold text-white mb-1">Sign In to Admin Portal</h3>
          <p className="text-xs text-slate-400 mb-6">Enter authorized admin or staff credentials</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-start gap-2">
                <span className="font-bold">Error:</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Admin Username or Email</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none"
                  placeholder="admin or email@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-950 text-brand-600" />
                <span>Remember session</span>
              </label>
              <a href="/" className="text-brand-400 hover:underline">
                &larr; Back to Website
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? 'Authenticating...' : 'Sign In to Sri Munis Kanna ERP'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
