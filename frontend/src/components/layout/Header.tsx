import React, { useState } from 'react';
import { Search, Bell, Plus, ShieldAlert, ChevronDown, Check, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenQuickAction: () => void;
  onOpenNotifications: () => void;
  onToggleMobileMenu?: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenQuickAction,
  onOpenNotifications,
  onToggleMobileMenu,
  unreadCount = 5,
}) => {
  const { role, switchRoleDemo } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

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
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
      {/* Mobile Hamburger + Search Input */}
      <div className="flex items-center gap-2.5 flex-1 max-w-xl">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs text-slate-500 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search CRM modules, leads, fleet, lessons...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-slate-500 border border-slate-200 rounded shadow-xs ml-2 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          onClick={onOpenQuickAction}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Quick Create</span>
        </button>

        {/* Role Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline text-[11px] text-slate-500">Role:</span>
            <span className="font-bold text-slate-900 text-xs">{role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                      role === r.role ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{r.label}</p>
                      <p className="text-[10px] text-slate-400">{r.desc}</p>
                    </div>
                    {role === r.role && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  );
};
