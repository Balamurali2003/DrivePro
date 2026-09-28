import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ShieldCheck, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('owner@drivepro.com');
  const [password, setPassword] = useState('drivepro123');
  const [loading, setLoading] = useState(false);
  const { login, switchRoleDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        toast.success('Welcome back to Sri Munis Kanna Driving School!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid credentials');
      }
    } catch {
      toast.error('Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoAccounts: { role: Role; name: string; email: string; desc: string }[] = [
    { role: 'OWNER', name: 'Vikramaditya Roy', email: 'owner@drivepro.com', desc: 'Full Executive P&L & Approvals' },
    { role: 'MANAGER', name: 'Pooja Hegde', email: 'manager@drivepro.com', desc: 'Fleet Operations & Timetables' },
    { role: 'SALES_EXECUTIVE', name: 'Rahul Sharma', email: 'sales@drivepro.com', desc: 'CRM Inquiries & Used Car Sales' },
    { role: 'INSTRUCTOR', name: 'Ramesh Gowda', email: 'instructor1@drivepro.com', desc: 'Lesson Logs, Attendance & Skills' },
    { role: 'ACCOUNTANT', name: 'Suresh Menon', email: 'accounts@drivepro.com', desc: 'GST Invoices, Receipts & Ledger' },
    { role: 'STUDENT', name: 'Aarav Sharma', email: 'student1@drivepro.com', desc: 'Self-Service Progress & Radar' },
  ];

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
                <p className="text-xs text-sky-400 font-bold tracking-wide uppercase mt-1">Driving School ERP</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Commercial Driving School Management</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Manage complete lifecycle from Leads → Registration → Instructor & Fleet Allocation → Scheduling → 17-Skill Radar → RTO Licences → Billing → Used Car Showroom.
            </p>

            <div className="space-y-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">1-Click Demo Logins:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickDemoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => {
                      switchRoleDemo(acc.role);
                      toast.success(`Logged in as ${acc.name} (${acc.role})`);
                      navigate('/dashboard');
                    }}
                    className="text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-brand-500/50 transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between font-bold text-white group-hover:text-brand-400">
                      <span>{acc.role}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{acc.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ISO 9001 Certified Driving Academy SaaS Architecture</span>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col justify-center bg-slate-900">
          <h3 className="text-lg font-bold text-white mb-1">Sign In to Dashboard</h3>
          <p className="text-xs text-slate-400 mb-6">Enter your authorized staff or student credentials</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none"
                  placeholder="name@drivepro.com"
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
              <a href="#reset" onClick={(e) => { e.preventDefault(); toast.info('Default password for all seeded accounts is: drivepro123'); }} className="text-brand-400 hover:underline">
                Forgot password?
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
