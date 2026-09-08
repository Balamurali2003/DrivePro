import React, { useState } from 'react';
import { X, UserPlus, CalendarPlus, CreditCard, Wrench } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'LEAD' | 'LESSON' | 'PAYMENT' | 'MAINTENANCE'>('LEAD');
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('Indiranagar');
  const [transmission, setTransmission] = useState('MANUAL');

  if (!isOpen) return null;

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead({ fullName, phone, area, transmission });
      toast.success(`Lead created successfully for ${fullName}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error creating lead');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-extrabold text-base text-slate-900">Quick Create Action</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl my-4 text-xs font-semibold">
          <button
            onClick={() => setTab('LEAD')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 ${tab === 'LEAD' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'}`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Lead
          </button>
          <button
            onClick={() => setTab('LESSON')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 ${tab === 'LESSON' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'}`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Lesson
          </button>
          <button
            onClick={() => setTab('PAYMENT')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 ${tab === 'PAYMENT' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'}`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Payment
          </button>
          <button
            onClick={() => setTab('MAINTENANCE')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 ${tab === 'MAINTENANCE' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'}`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Service
          </button>
        </div>

        {tab === 'LEAD' && (
          <form onSubmit={handleCreateLead} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kavya Ranganath"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Area</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="Indiranagar">Indiranagar</option>
                  <option value="Koramangala">Koramangala</option>
                  <option value="HSR Layout">HSR Layout</option>
                  <option value="Whitefield">Whitefield</option>
                  <option value="Jayanagar">Jayanagar</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transmission Preference</label>
              <div className="grid grid-cols-3 gap-2">
                {['MANUAL', 'AUTOMATIC', 'BOTH'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTransmission(t)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border ${
                      transmission === t ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all mt-4"
            >
              Add Inquiry Lead
            </button>
          </form>
        )}

        {tab !== 'LEAD' && (
          <div className="p-6 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-2">Detailed Coordinator Wizard</p>
            <p>Please open the full {tab.toLowerCase()} management page for collision checks & smart multi-parameter allocation.</p>
          </div>
        )}
      </div>
    </div>
  );
};
