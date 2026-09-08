import React, { useState } from 'react';
import { Search, Bell, Plus, ShieldAlert, ChevronDown, Check, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenQuickAction: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenQuickAction,
  onOpenNotifications,
  unreadCount = 5,
}) => {
  const { user, role, switchRoleDemo, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const availableRoles: { role: Role; label: string; desc: string }[] = [
    { role: 'OWNER', label: 'Owner & Executive', desc: 'Full P&L, analytics, approvals' },
    { role: 'MANAGER', label: 'Operations Manager', desc: 'Fleet, instructors, allocations' },
    { role: 'SALES_EXECUTIVE', label: 'Sales & Inquiries Lead', desc: 'Lead pipeline, used cars' },
    { role: 'INSTRUCTOR', label: 'Senior Driving Instructor', desc: 'Lessons, attendance, ratings' },
    { role: 'ACCOUNTANT', label: 'Finance & Accounts', desc: 'Billing, taxes, payouts' },
    { role: 'MECHANIC', label: 'Fleet Mechanic', desc: 'Service logs, vehicle health' },
    { role: 'STUDENT', label: 'Enrolled Student', desc: 'Self-service progress & calendar' },
    { role: 'SUPER_ADMIN', label: 'System Super Admin', desc: 'System configuration' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 transition-all shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search Leads, Students, Fleet, Lessons, Payments, Used Cars...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-slate-500 border border-slate-200 rounded shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Create</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Role:</span>
            <span className="font-bold text-brand-700">{role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400">
                Switch Demo Persona
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {availableRoles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRoleDemo(r.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                      role === r.role ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{r.label}</p>
                      <p className="text-[10px] text-slate-400">{r.desc}</p>
                    </div>
                    {role === r.role && <Check className="w-4 h-4 text-brand-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-brand-50 flex items-center justify-center font-bold text-brand-700 text-xs shadow-xs">
              {user?.avatar ? (
                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0] || 'U'
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500">{user?.email || 'user@drivepro.com'}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-xs text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
