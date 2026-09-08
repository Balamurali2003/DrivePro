import React from 'react';
import { TrendingUp, BarChart3, Users, DollarSign, Award, Car, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';

export const AnalyticsPage: React.FC = () => {
  const revenueTrend = [
    { month: 'Jan', revenue: 420000, expenses: 180000, profit: 240000 },
    { month: 'Feb', revenue: 480000, expenses: 210000, profit: 270000 },
    { month: 'Mar', revenue: 530000, expenses: 220000, profit: 310000 },
    { month: 'Apr', revenue: 590000, expenses: 240000, profit: 350000 },
    { month: 'May', revenue: 640000, expenses: 260000, profit: 380000 },
    { month: 'Jun', revenue: 620000, expenses: 250000, profit: 370000 },
  ];

  const leadConversionFunnel = [
    { stage: 'Inquiries Captured', count: 100, fill: '#0284c7' },
    { stage: 'Contacted & Qualified', count: 78, fill: '#0ea5e9' },
    { stage: 'Trial Booked', count: 54, fill: '#38bdf8' },
    { stage: 'Enrolled & Paid', count: 40, fill: '#10b981' },
  ];

  const transmissionShare = [
    { name: 'Manual (LMV-M)', value: 65, color: '#0284c7' },
    { name: 'Automatic (LMV-A)', value: 25, color: '#8b5cf6' },
    { name: 'Two-Wheeler (MCWG)', value: 10, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-brand-600" />
          Driving Academy Business Intelligence & BI Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Comprehensive P&L trends, student throughput, instructor ratings & vehicle ROI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Monthly Revenue vs Operating Expenses (P&L)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stroke="#0284c7" fill="#e0f2fe" strokeWidth={2} name="Gross Revenue" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#d1fae5" strokeWidth={2} name="Net Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Lead Conversion Funnel Efficiency</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadConversionFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="stage" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {leadConversionFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-400 uppercase">First-Time RTO Pass Rate</h4>
          <h2 className="text-3xl font-black text-emerald-600 mt-2">94.2%</h2>
          <p className="text-xs text-slate-500 mt-1">Based on last 150 student practical examinations</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-400 uppercase">Fleet Fuel Efficiency Average</h4>
          <h2 className="text-3xl font-black text-brand-600 mt-2">16.8 km/l</h2>
          <p className="text-xs text-slate-500 mt-1">Monitored across 12 training cars & CNG retrofits</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-400 uppercase">Student Satisfaction CSAT</h4>
          <h2 className="text-3xl font-black text-amber-500 mt-2">4.9 / 5.0 ⭐</h2>
          <p className="text-xs text-slate-500 mt-1">Calculated from verified post-lesson feedback</p>
        </div>
      </div>
    </div>
  );
};
