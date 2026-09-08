import React, { useState, useEffect } from 'react';
import { PhoneCall } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Link } from 'react-router-dom';

export const FollowupsPage: React.FC = () => {
  const [followups, setFollowups] = useState<any[]>([]);
  const [tab, setTab] = useState<'TODAY' | 'OVERDUE' | 'UPCOMING' | 'ALL'>('TODAY');

  useEffect(() => {
    api.getFollowups()
      .then(res => setFollowups(res.data || []))
      .catch(console.error);
  }, []);

  const filtered = followups.filter(f => {
    const d = new Date(f.followupDate);
    const today = new Date();
    if (tab === 'OVERDUE') return f.status === 'SCHEDULED' && d < today;
    if (tab === 'TODAY') return f.status === 'SCHEDULED';
    if (tab === 'UPCOMING') return f.status === 'SCHEDULED' && d > today;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-brand-600" />
            Lead Follow-up CRM & Call Scheduler
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage daily tele-calling cadence, WhatsApp touchpoints & trial reminders</p>
        </div>
        <div className="flex items-center gap-2">
          {['TODAY', 'OVERDUE', 'UPCOMING', 'ALL'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === t ? 'bg-brand-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Follow-up Date & Slot</th>
                <th className="py-3 px-4">Lead Prospect</th>
                <th className="py-3 px-4">Channel Type</th>
                <th className="py-3 px-4">Notes / Requirement</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {new Date(f.followupDate).toLocaleDateString()} {f.time && `• ${f.time}`}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{f.lead?.fullName || 'Lead'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{f.lead?.phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                      {f.activityType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-sm truncate">{f.notes}</td>
                  <td className="py-3.5 px-4"><StatusBadge status={f.status} /></td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`https://wa.me/${f.lead?.phone?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold"
                      >
                        WhatsApp
                      </a>
                      <Link
                        to={`/leads/${f.leadId}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        Open Lead
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
