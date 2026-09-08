import React, { useState, useEffect } from 'react';
import { Fuel } from 'lucide-react';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';

export const FuelPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getFuelLogs().then(res => setLogs(res.data || [])).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Fuel className="w-6 h-6 text-brand-600" />
          Fleet Fuel Logs & Mileage Economy
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Petrol, Diesel & CNG refuel receipts with odometer tracking</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Fuel Type</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Total Bill (₹)</th>
                <th className="py-3 px-4">Station Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-800">{new Date(f.logDate).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{f.vehicle?.registrationNumber || 'KA01...'}</td>
                  <td className="py-3.5 px-4 font-bold text-[10px] text-blue-700 uppercase">{f.fuelType}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{f.litres} Litres</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900"><CurrencyDisplay amount={f.totalCost} /></td>
                  <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">{f.fuelStation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
