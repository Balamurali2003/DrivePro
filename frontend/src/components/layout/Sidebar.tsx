import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, UserCheck, PhoneCall, MessageSquare, GraduationCap,
  BookOpen, Calendar, Clock, Award, Car, Wrench, Fuel, CreditCard,
  FileText, RotateCcw, AlertTriangle, Star, CheckSquare, Shield, RefreshCw,
  Share2, Megaphone, Receipt, Users, DollarSign, BarChart3,
  TrendingUp, Sparkles, MapPin, FileBox, ShieldCheck, Settings,
  History, CarFront, ClipboardCheck, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navigationGroups = [
    {
      title: 'Executive & Strategy',
      items: [
        { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Territory Live Map', path: '/map', icon: MapPin },
        { label: 'AI Intelligence Suite', path: '/ai-assistant', icon: Sparkles, badge: 'AI' },
      ],
    },
    {
      title: 'Leads & Admissions CRM',
      items: [
        { label: 'Inquiries & Leads', path: '/leads', icon: UserCheck },
        { label: 'Follow-up Scheduler', path: '/followups', icon: PhoneCall },
        { label: 'Communications Hub', path: '/communications', icon: MessageSquare },
        { label: 'Referral Rewards', path: '/referral-rewards', icon: Share2, matchPaths: ['/referral-rewards', '/referrals'] },
        { label: 'Marketing Campaigns', path: '/marketing-campaigns', icon: Megaphone, matchPaths: ['/marketing-campaigns', '/campaigns'] },
      ],
    },
    {
      title: 'Student & Training Ops',
      items: [
        { label: 'Daily Attendance Hub', path: '/attendance', icon: ClipboardCheck, badge: 'Live' },
        { label: 'Active Students 360°', path: '/students', icon: GraduationCap },
        { label: 'Courses & Packages', path: '/courses', icon: BookOpen },
        { label: 'Enrollment Ledger', path: '/enrollments', icon: FileText },
        { label: 'Calendar Scheduler', path: '/calendar', icon: Calendar },
        { label: 'Lessons & Progress', path: '/lessons-progress', icon: Clock, matchPaths: ['/lessons-progress', '/lessons'] },
        { label: 'Instructor Directory', path: '/instructors', icon: Award },
        { label: 'RTO & Mock Tests', path: '/tests', icon: CheckSquare },
        { label: 'Licence Tracking (LL/DL)', path: '/licences', icon: Shield },
      ],
    },
    {
      title: 'Fleet & Vehicle Ops',
      items: [
        { label: 'Vehicle Fleet', path: '/vehicles', icon: Car },
        { label: 'Maintenance & Service', path: '/maintenance', icon: Wrench },
        { label: 'Fuel Logs & Mileage', path: '/fuel', icon: Fuel },
        { label: 'Expiry & Renewals', path: '/renewals', icon: RefreshCw },
      ],
    },
    {
      title: 'Finance & ERP Operations',
      items: [
        { label: 'Payments & Collections', path: '/payments', icon: CreditCard },
        { label: 'Invoices & Receipts', path: '/invoices', icon: Receipt },
        { label: 'Refund Requests', path: '/refund-requests', icon: RotateCcw, matchPaths: ['/refund-requests', '/refunds'] },
        { label: 'Operating Expenses', path: '/operating-expenses', icon: DollarSign, matchPaths: ['/operating-expenses', '/expenses'] },
        { label: 'Staff & Commissions', path: '/commissions', icon: Award },
      ],
    },
    {
      title: 'Showroom & Used Cars',
      items: [
        { label: 'Showroom Inventory', path: '/used-cars', icon: CarFront, badge: 'Hot' },
        { label: 'Buyer Inquiries', path: '/used-car-leads', icon: Users },
        { label: 'Test Drive Calendar', path: '/test-drive-calendar', icon: Calendar, matchPaths: ['/test-drive-calendar', '/test-drives'] },
        { label: 'Car Sales & P&L', path: '/used-car-sales', icon: TrendingUp },
      ],
    },
    {
      title: 'Quality & Experience',
      items: [
        { label: 'Complaints & Support', path: '/complaints', icon: AlertTriangle },
        { label: 'Student Reviews', path: '/feedback', icon: Star },
        { label: 'Document Vault', path: '/documents', icon: FileBox },
      ],
    },
    {
      title: 'Enterprise Management',
      items: [
        { label: 'Downloadable Reports', path: '/reports', icon: BarChart3 },
        { label: 'Advanced Analytics', path: '/analytics', icon: TrendingUp },
        { label: 'Staff & Employees', path: '/employees', icon: Users },
        { label: 'User Roles & RBAC', path: '/roles', icon: ShieldCheck },
        { label: 'System Audit Trail', path: '/audit-logs', icon: History },
        { label: 'Academy Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#111318] text-slate-300 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20 shrink-0">
            <Car className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[13px] text-white tracking-tight leading-tight truncate">
                  Sri Munis Kanna
                </span>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                  ERP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate">
                Driving School
              </p>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 custom-scrollbar">
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-0.5">
            {!collapsed && (
              <h2 className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500/90">
                {group.title}
              </h2>
            )}
            {group.items.map((item, iIdx) => {
              const Icon = item.icon;
              const isMatch = item.matchPaths
                ? item.matchPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))
                : location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={iIdx}
                  to={item.path}
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => {
                    const active = isActive || isMatch;
                    return `relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                      active
                        ? 'bg-blue-600/95 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    }`;
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span className="ml-2 text-[9px] font-black px-1.5 py-0.2 rounded bg-white/10 text-sky-300 border border-white/10">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* User / Persona Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-black/20">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block leading-tight">Role Persona</span>
                <span className="text-[11px] font-bold text-white truncate block">{role}</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-mono text-slate-500">v3.0 Ent</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-200 z-30 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
