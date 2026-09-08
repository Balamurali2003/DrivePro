import React, { useState } from 'react';
import { Settings, Building, Bell, Shield, Key, Save } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [academyName, setAcademyName] = useState('DrivePro Motor Driving Academy');
  const [phone, setPhone] = useState('+91 80 4912 3000');
  const [gstin, setGstin] = useState('29AAAAA0000A1Z5');
  const [taxRate, setTaxRate] = useState('18');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Academy settings updated successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          Driving Academy System Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage branch info, tax rates, automated SMS reminders & system preferences</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">General Information & Branding</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Academy Trading Name</label>
            <input
              type="text"
              value={academyName}
              onChange={(e) => setAcademyName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Head Office Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">GST Tax Rate (%)</label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
