import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, Calendar, Clock, DollarSign, Award,
  Car, AlertTriangle, TrendingUp, Sparkles, PhoneCall, CheckCircle2,
  AlertCircle, ChevronRight, Wrench, ShieldAlert, RefreshCw, Layers,
  PhoneOff, XCircle, FileText, CheckCheck, ShieldCheck, Target, UserX, Eye
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { StatusBadge } from '../components/shared/StatusBadge';
import { DateFilterSelector } from '../components/shared/DateFilterSelector';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [leadAssignment, setLeadAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadDashboard = useCallback(async (period = dateFilter, sDate = startDate, eDate = endDate) => {
    try {
      setRefreshing(true);
      const params: Record<string, any> = { period };
      if (period === 'custom' && sDate && eDate) {
        params.startDate = sDate;
        params.endDate = eDate;
      }
      const res = await api.getDashboardStats(params);
      setData(res.data);

      try {
        const assignRes = await api.getLeadAssignmentStats();
        if (assignRes?.data) {
          setLeadAssignment(assignRes.data);
        }
      } catch (err) {
        console.error('Failed to load lead assignment stats:', err);
      }
    } catch (err: any) {
      toast.error('Failed to load dashboard metrics: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter, startDate, endDate]);

  useEffect(() => {
    loadDashboard('all');
  }, []);

  const handleDateFilterChange = (val: string, s?: string, e?: string) => {
    setDateFilter(val);
    if (s && e) {
      setStartDate(s);
      setEndDate(e);
      loadDashboard(val, s, e);
    } else {
      setStartDate('');
      setEndDate('');
      loadDashboard(val);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-10 bg-slate-200 rounded-xl w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const leads = data?.leads || {};
  const campaigns = data?.campaigns || [];
  const students = data?.students || {};
  const classes = data?.classes || {};
  const payments = data?.payments || {};
  const revenue = data?.revenue || {};
  const followups = data?.followups || {};
  const rto = data?.rto || {};
  const charts = data?.charts || {};
  const widgets = data?.widgets || {};

  const kpiCards = [
    { title: 'Total Leads / Inquiries', value: leads.totalLeads ?? 0, sub: `${leads.newLeads ?? 0} new • ${leads.convertedLeads ?? 0} converted`, icon: UserCheck, color: 'text-blue-600 bg-blue-50 border-blue-100', link: '/leads' },
    { title: 'Active Students Enrolled', value: students.activeStudents ?? 0, sub: `${students.completedStudents ?? 0} completed total`, icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', link: '/students' },
    { title: 'Total Revenue Collected', value: revenue.totalCollected ?? 0, isCurrency: true, sub: `Net Profit: ₹${Number(kpi.netProfit ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', link: '/payments' },
    { title: 'Pending Fee Balance', value: payments.totalOutstanding ?? 0, isCurrency: true, sub: `${payments.partialPayments ?? 0} students with balance`, icon: AlertCircle, color: 'text-amber-600 bg-amber-50 border-amber-100', link: '/payments' },
    { title: "Today's Driving Classes", value: classes.todayClasses ?? 0, sub: `${classes.completedClasses ?? 0} completed total`, icon: Clock, color: 'text-sky-600 bg-sky-50 border-sky-100', link: '/lessons' },
    { title: 'Student Attendance Rate', value: `${classes.attendancePercentage ?? 0}%`, sub: `${classes.presentStudents ?? 0} Present • ${classes.absentStudents ?? 0} Absent • ${classes.leaveStudents ?? 0} Leave`, icon: CheckCheck, color: 'text-teal-600 bg-teal-50 border-teal-100', link: '/attendance' },
    { title: 'Active Fleet Vehicles', value: `${kpi.availableVehicles ?? 0} / ${kpi.totalVehicles ?? (kpi.availableVehicles ?? 0)}`, sub: `${kpi.vehiclesUnderMaintenance ?? 0} under service`, icon: Car, color: 'text-purple-600 bg-purple-50 border-purple-100', link: '/vehicles' },
    { title: 'RTO Test Candidates', value: rto.totalCandidates ?? 0, sub: `${rto.llPending ?? 0} LL Pending • ${rto.drivingTestScheduled ?? 0} Test Scheduled`, icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-100', link: '/students' },
  ];

  const sourceColors = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4', '#14b8a6', '#f43f5e', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sri Munis Kanna Driving School Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
              Live Database
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational metrics calculated dynamically from SQLite database ({data?.period || 'All Time'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DateFilterSelector selected={dateFilter} onChange={handleDateFilterChange} startDate={startDate} endDate={endDate} />
          
          <button
            onClick={() => loadDashboard()}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>

          <Link
            to="/ai-assistant"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-brand-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 hover:opacity-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Forecast
          </Link>
        </div>
      </div>

      {/* 1. TOP EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-brand-300 shadow-xs hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color} border`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <p className="text-xs font-medium text-slate-500">{card.title}</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {card.isCurrency ? <CurrencyDisplay amount={Number(card.value)} /> : card.value}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">{card.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* 2. SECTION 3: CURRENT LEAD METRICS DYNAMICS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Lead & Inquiry Pipeline Dynamics</h3>
          </div>
          <Link to="/leads" className="text-xs font-semibold text-brand-600 hover:underline">
            Manage All {leads.totalLeads ?? 0} Leads →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase">New Leads</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{leads.newLeads ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Contacted</span>
            <p className="text-xl font-black text-blue-900 mt-0.5">{leads.contactedLeads ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Call Not Attended</span>
            <p className="text-xl font-black text-amber-900 mt-0.5">{leads.callNotAttended ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">Interested (Need Time)</span>
            <p className="text-xl font-black text-indigo-900 mt-0.5">{leads.interestedNeedTime ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Today Come to Join</span>
            <p className="text-xl font-black text-emerald-900 mt-0.5">{leads.todayComeToJoin ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
            <span className="text-[10px] font-bold text-purple-600 uppercase">Follow-up Leads</span>
            <p className="text-xl font-black text-purple-900 mt-0.5">{leads.followupLeads ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100">
            <span className="text-[10px] font-bold text-teal-600 uppercase">Converted</span>
            <p className="text-xl font-black text-teal-900 mt-0.5">{leads.convertedLeads ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-[10px] font-bold text-rose-600 uppercase">Not Interested</span>
            <p className="text-xl font-black text-rose-900 mt-0.5">{leads.notInterestedLeads ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
            <span className="text-[10px] font-bold text-sky-600 uppercase">Total Interested</span>
            <p className="text-xl font-black text-sky-900 mt-0.5">{leads.interestedLeads ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-600 uppercase">Pipeline Total</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{leads.totalLeads ?? 0}</p>
          </div>
        </div>
      </div>

      {/* 3. SECTION 4: CURRENT CAMPAIGN METRICS (SHOWS 0 IF EMPTY) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">Campaign & Admissions Attribution</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">10 Dedicated Tracking Channels</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {campaigns.map((c: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-600 truncate" title={c.campaign}>{c.campaign}</span>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-lg font-black ${c.count > 0 ? 'text-brand-700' : 'text-slate-400'}`}>
                  {c.count}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.count > 0 ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>
                  {c.count > 0 ? `${Math.round((c.count / (leads.totalLeads || 1)) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. CHARTS SECTION: FINANCIAL P&L AND LEAD FUNNEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Financials Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Monthly Revenue vs Operating Expenses</h3>
                <p className="text-xs text-slate-500">Real Financial P&L performance for Sri Munis Kanna Driving School</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1 text-brand-600"><span className="w-2.5 h-2.5 rounded-full bg-brand-600" /> Revenue</span>
                <span className="flex items-center gap-1 text-rose-500"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses</span>
                <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Net Profit</span>
              </div>
            </div>

            <div className="h-72 w-full">
              {(charts.monthlyFinancials || []).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthlyFinancials} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="#0284c7" radius={[6, 6, 0, 0]} name="Revenue" />
                    <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Expenses" />
                    <Bar dataKey="profit" fill="#10b981" radius={[6, 6, 0, 0]} name="Net Profit" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                  No data available for this period
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 mt-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Revenue</span>
              <p className="font-extrabold text-brand-700 mt-0.5">₹{(revenue.totalCollected ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Expenses</span>
              <p className="font-extrabold text-rose-600 mt-0.5">₹{(kpi.totalExpenses ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Net Profit</span>
              <p className="font-extrabold text-emerald-600 mt-0.5">₹{(kpi.netProfit ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Lead Funnel & Sources Pie */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Inquiry Lead Source Breakdown</h3>
            <p className="text-xs text-slate-500 mb-4">Admissions channel attribution from live database</p>
            
            <div className="h-52 w-full">
              {(charts.leadsBySource || []).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.leadsBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="campaign"
                    >
                      {(charts.leadsBySource || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={sourceColors[index % sourceColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                  No data available for this period
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            {(charts.leadsBySource || []).slice(0, 4).map((s: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sourceColors[idx % sourceColors.length] }} />
                <span className="text-slate-600 truncate">{s.campaign}</span>
                <span className="font-bold text-slate-900 ml-auto">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. SECTIONS 5, 7 & 8: STUDENT & FINANCIAL HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Health Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Student Enrollment Health (Sri Munis Kanna)</h3>
            </div>
            <Link to="/students" className="text-xs font-semibold text-brand-600 hover:underline">
              View Students ({students.totalStudents ?? 0}) →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Enrolled</span>
              <p className="text-xl font-black text-slate-900 mt-1">{students.totalStudents ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Active Training</span>
              <p className="text-xl font-black text-emerald-900 mt-1">{students.activeStudents ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Course Completed</span>
              <p className="text-xl font-black text-blue-900 mt-1">{students.completedStudents ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100">
              <span className="text-[10px] font-bold text-teal-600 uppercase">Fully Paid</span>
              <p className="text-xl font-black text-teal-900 mt-1">{payments.fullyPaidStudents ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Pending Payment</span>
              <p className="text-xl font-black text-amber-900 mt-1">{students.pendingPayment ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase">Attending Classes</span>
              <p className="text-xl font-black text-purple-900 mt-1">{students.attendingClasses ?? 0}</p>
            </div>
          </div>

          {/* Revenue by Course Breakdown */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-700 text-xs mb-2">Revenue Attributed by Driving Package</h4>
            <div className="space-y-2">
              {(charts.revenueByCourse || []).map((c: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-bold text-slate-800">{c.course}</span>
                  <span className="font-extrabold text-emerald-700">₹{Number(c.revenue).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fees & Revenue Operations Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm">Course Fees & Revenue Ledger</h3>
            </div>
            <Link to="/payments" className="text-xs font-semibold text-brand-600 hover:underline">
              View Ledger →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Course Fees</span>
              <p className="text-xl font-black text-slate-900 mt-1">₹{(payments.totalCourseFees ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Collected</span>
              <p className="text-xl font-black text-emerald-800 mt-1">₹{(revenue.totalCollected ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Total Outstanding</span>
              <p className="text-xl font-black text-rose-800 mt-1">₹{(revenue.outstandingAmount ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
              <span className="text-[10px] font-bold text-sky-600 uppercase">Today's Revenue</span>
              <p className="text-xl font-black text-sky-900 mt-1">₹{(revenue.todayRevenue ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">This Week Revenue</span>
              <p className="text-xl font-black text-indigo-900 mt-1">₹{(revenue.thisWeekRevenue ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase">This Month Revenue</span>
              <p className="text-xl font-black text-purple-900 mt-1">₹{(revenue.thisMonthRevenue ?? 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-100 text-xs space-y-1">
            <div className="flex justify-between font-bold text-amber-900">
              <span>Collection Realization Rate</span>
              <span>{Math.round(((revenue.totalCollected || 0) / (payments.totalCourseFees || 1)) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.round(((revenue.totalCollected || 0) / (payments.totalCourseFees || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. SECTIONS 9 & 10: FOLLOW-UPS & RTO TEST TRACKER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follow-up Tracking */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Lead Follow-up Operational Matrix</h3>
            </div>
            <Link to="/followups" className="text-xs font-semibold text-brand-600 hover:underline">
              View CRM →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Follow-ups</span>
              <p className="text-xl font-black text-slate-900 mt-1">{followups.todayFollowups ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Upcoming</span>
              <p className="text-xl font-black text-blue-900 mt-1">{followups.upcomingFollowups ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Overdue</span>
              <p className="text-xl font-black text-rose-900 mt-1">{followups.overdueFollowups ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Completed</span>
              <p className="text-xl font-black text-emerald-900 mt-1">{followups.completedFollowups ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 col-span-2 sm:col-span-2">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Leads Pending Initial Follow-up</span>
              <p className="text-xl font-black text-amber-900 mt-1">{followups.leadsWithoutFollowup ?? 0}</p>
            </div>
          </div>
        </div>

        {/* RTO Test Tracker */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm">RTO Test & Driving Licence Tracker</h3>
            </div>
            <Link to="/students" className="text-xs font-semibold text-brand-600 hover:underline">
              View Candidates →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">RTO Candidates</span>
              <p className="text-xl font-black text-slate-900 mt-1">{rto.totalCandidates ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
              <span className="text-[10px] font-bold text-amber-600 uppercase">LL Pending</span>
              <p className="text-xl font-black text-amber-900 mt-1">{rto.llPending ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Test Scheduled</span>
              <p className="text-xl font-black text-blue-900 mt-1">{rto.drivingTestScheduled ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
              <span className="text-[10px] font-bold text-sky-600 uppercase">Test Completed</span>
              <p className="text-xl font-black text-sky-900 mt-1">{rto.drivingTestCompleted ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Licence Received</span>
              <p className="text-xl font-black text-emerald-900 mt-1">{rto.licenceReceived ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase">Licence Pending</span>
              <p className="text-xl font-black text-purple-900 mt-1">{rto.licencePending ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6.5. STAFF LEAD ASSIGNMENT & PIPELINE DISTRIBUTION MATRIX */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Staff Lead Assignment & Pipeline Matrix</h3>
              <p className="text-[11px] text-slate-500">Live allocation of admissions inquiries across CRM staff and instructors</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/leads?assignedTo=UNASSIGNED"
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs inline-flex items-center gap-1"
            >
              ⚡ Unassigned Queue ({leadAssignment?.unassignedLeads ?? 0})
            </Link>
            <Link to="/leads" className="text-xs font-semibold text-brand-600 hover:underline">
              Manage All Leads →
            </Link>
          </div>
        </div>

        {/* Mini KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Database Leads</span>
            <p className="text-xl font-black text-slate-900 mt-1">{leadAssignment?.totalLeads ?? leads.totalLeads ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-700 uppercase">Assigned Leads</span>
            <p className="text-xl font-black text-indigo-900 mt-1">{leadAssignment?.assignedLeads ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase">Unassigned Leads</span>
            <p className="text-xl font-black text-amber-900 mt-1">{leadAssignment?.unassignedLeads ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Assignment Ratio</span>
            <p className="text-xl font-black text-emerald-900 mt-1">
              {Math.round(((leadAssignment?.assignedLeads ?? 0) / (leadAssignment?.totalLeads || 1)) * 100)}%
            </p>
          </div>
        </div>

        {/* Staff Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-2.5">Staff Member</th>
                <th className="pb-2.5">Role</th>
                <th className="pb-2.5 text-center">Assigned Leads</th>
                <th className="pb-2.5 text-center">High Priority</th>
                <th className="pb-2.5 text-center">Follow-ups Today</th>
                <th className="pb-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(leadAssignment?.staffBreakdown || []).length > 0 ? (
                leadAssignment.staffBreakdown.map((staff: any) => (
                  <tr key={staff.id} className="hover:bg-slate-50">
                    <td className="py-2.5">
                      <div className="font-bold text-slate-900">{staff.name}</div>
                      <div className="text-[10px] text-slate-400">{staff.email}</div>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {staff.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="font-black text-slate-900 font-mono text-xs">{staff.assignedCount}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      {staff.highPriorityCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          🔥 {staff.highPriorityCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">0</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      {staff.followupsTodayCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          📞 {staff.followupsTodayCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">0</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        to={`/leads?assignedTo=${staff.id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                      >
                        View Leads →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400 text-xs">
                    No staff records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. WIDGETS GRID: TODAY'S SCHEDULE & FLEET SERVICE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Training Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm">Today's On-Road Practical Driving Schedule</h3>
            </div>
            <Link to="/lessons" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View Lessons →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Time Slot</th>
                  <th className="pb-2">Student</th>
                  <th className="pb-2">Instructor</th>
                  <th className="pb-2">Vehicle</th>
                  <th className="pb-2">Pickup Hub</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(widgets.todaySchedule || []).length > 0 ? (
                  widgets.todaySchedule.map((l: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900 font-mono">{l.startTime} - {l.endTime}</td>
                      <td className="py-3 font-semibold text-slate-800">{l.student?.fullName || 'Student'}</td>
                      <td className="py-3 text-slate-600">{l.instructor?.fullName || 'Instructor'}</td>
                      <td className="py-3 font-mono text-slate-600">{l.vehicle?.registrationNumber || 'KA01...'}</td>
                      <td className="py-3 text-slate-500 truncate max-w-[120px]">{l.pickupLocation || 'Training Hub'}</td>
                      <td className="py-3 text-right"><StatusBadge status={l.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                      No classes scheduled for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Follow-ups & Service Alerts */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-amber-500" />
                Overdue Follow-ups
              </h3>
              <Link to="/followups" className="text-xs font-semibold text-brand-600 hover:underline">
                View CRM
              </Link>
            </div>
            <div className="space-y-2.5">
              {(widgets.overdueFollowups || []).length > 0 ? (
                widgets.overdueFollowups.slice(0, 4).map((f: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{f.lead?.fullName || 'Lead Inquiry'}</span>
                      <span className="text-[10px] font-bold text-amber-600 uppercase">{f.activityType}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{f.notes}</p>
                  </div>
                ))
              ) : (
                <div className="py-3 text-center text-slate-400 text-xs">No overdue follow-ups.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-rose-500" />
                Fleet Service Due
              </h3>
              <Link to="/vehicles" className="text-xs font-semibold text-brand-600 hover:underline">
                Manage Fleet
              </Link>
            </div>
            <div className="space-y-2.5">
              {(widgets.serviceDueVehicles || []).length > 0 ? (
                widgets.serviceDueVehicles.slice(0, 3).map((v: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">{v.registrationNumber}</span>
                      <span className="text-[10px] font-bold text-rose-600">Due {new Date(v.nextServiceDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{v.make} {v.model} • {v.currentKm} KM</p>
                  </div>
                ))
              ) : (
                <div className="py-3 text-center text-slate-400 text-xs">All vehicles up to date.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
