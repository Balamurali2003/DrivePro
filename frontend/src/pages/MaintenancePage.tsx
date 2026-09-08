import React, { useState, useEffect } from 'react';
import { Wrench, Plus } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';

export const MaintenancePage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getMaintenance().then(res => setLogs(res.data || [])).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-brand-600" />
          Fleet Maintenance & Service Workshop Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Track oil changes, dual-control pedal calibrations & repair bills</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">Authorized Center</th>
                <th className="py-3 px-4">Cost (₹)</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{m.vehicle?.registrationNumber || 'KA01...'}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{m.serviceType}</td>
                  <td className="py-3.5 px-4 text-slate-600">{new Date(m.serviceDate).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 text-slate-600">{m.vendorName}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900"><CurrencyDisplay amount={m.cost} /></td>
                  <td className="py-3.5 px-4 text-right"><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
