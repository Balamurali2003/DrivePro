import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, UserCheck, PhoneCall, MessageSquare, GraduationCap,
  BookOpen, Calendar, Clock, Award, Car, Wrench, Fuel, CreditCard,
  FileText, RotateCcw, AlertTriangle, Star, CheckSquare, Shield, RefreshCw,
  Share2, Megaphone, Receipt, Users, DollarSign, BarChart3,
  TrendingUp, Sparkles, MapPin, FileBox, ShieldCheck, Settings,
  History, CarFront, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const navigationGroups = [
    {
      title: 'Main Executive',
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
        { label: 'Referral Rewards', path: '/referrals', icon: Share2 },
        { label: 'Marketing Campaigns', path: '/campaigns', icon: Megaphone },
      ],
    },
    {
      title: 'Student & Training Ops',
      items: [
        { label: 'Daily Attendance Hub', path: '/attendance', icon: ClipboardCheck, badge: 'Live' },
        { label: 'Active Students 360°', path: '/students', icon: GraduationCap, badge: '40' },
        { label: 'Courses & Packages', path: '/courses', icon: BookOpen },
        { label: 'Enrollment Ledger', path: '/enrollments', icon: FileText },
        { label: 'Calendar Scheduler', path: '/calendar', icon: Calendar },
        { label: 'Lessons & Progress', path: '/lessons', icon: Clock, badge: '150' },
        { label: 'Instructor Directory', path: '/instructors', icon: Award },
        { label: 'RTO & Mock Tests', path: '/tests', icon: CheckSquare },
        { label: 'Licence Tracking (LL/DL)', path: '/licences', icon: Shield },
      ],
    },
    {
      title: 'Fleet & Vehicle Ops',
      items: [
        { label: 'Vehicle Fleet', path: '/vehicles', icon: Car, badge: '12' },
        { label: 'Maintenance & Service', path: '/maintenance', icon: Wrench },
        { label: 'Fuel Logs & Mileage', path: '/fuel', icon: Fuel },
        { label: 'Expiry & Renewals', path: '/renewals', icon: RefreshCw, badge: 'Alert' },
      ],
    },
    {
      title: 'Finance & Billing ERP',
      items: [
        { label: 'Payments & Collections', path: '/payments', icon: CreditCard },
        { label: 'Invoices & Receipts', path: '/invoices', icon: Receipt },
        { label: 'Refund Requests', path: '/refunds', icon: RotateCcw },
        { label: 'Operating Expenses', path: '/expenses', icon: DollarSign },
        { label: 'Staff & Commissions', path: '/commissions', icon: Award },
      ],
    },
    {
      title: 'Used Car Dealership',
      items: [
        { label: 'Showroom Inventory', path: '/used-cars', icon: CarFront, badge: 'Hot' },
        { label: 'Buyer Inquiries', path: '/used-car-leads', icon: Users },
        { label: 'Test Drive Calendar', path: '/test-drives', icon: Calendar },
        { label: 'Car Sales & Profit P&L', path: '/used-car-sales', icon: TrendingUp },
      ],
    },
    {
      title: 'Customer Experience',
      items: [
        { label: 'Complaints & Support', path: '/complaints', icon: AlertTriangle, badge: 'Open' },
        { label: 'Student Reviews', path: '/feedback', icon: Star },
        { label: 'Document Vault', path: '/documents', icon: FileBox },
      ],
    },
    {
      title: 'BI Reports & Management',
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

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 select-none z-30">
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white font-extrabold shadow-lg shadow-brand-500/20">
          <Car className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-base text-white tracking-tight leading-none">DrivePro CRM</h1>
          <p className="text-[11px] text-sky-400 font-semibold mt-1">Driving School ERP</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h2 className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              {group.title}
            </h2>
            {group.items.map((item, iIdx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={iIdx}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-800 text-sky-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-slate-400 font-medium truncate">Role: <strong className="text-white">{role}</strong></span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">v2.4 Pro</span>
        </div>
      </div>
    </aside>
  );
};
