import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCheck } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export const CommunicationsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [recipient, setRecipient] = useState('+91 98450 11223');
  const [channel, setChannel] = useState('WHATSAPP');
  const [template, setTemplate] = useState('WELCOME');
  const [customMsg, setCustomMsg] = useState('Welcome to DrivePro Driving Academy! Your admissions coordinator will contact you shortly.');

  const templates: Record<string, string> = {
    WELCOME: 'Welcome to DrivePro Driving Academy Bengaluru! We are delighted to guide you on your journey to becoming a confident driver.',
    REGISTRATION: 'Congratulations! Your enrollment for 4-Wheeler Driving Course is confirmed. Receipt #REC-2026-101 generated.',
    LESSON_REMINDER: 'Reminder: Your driving lesson is scheduled tomorrow at 07:00 AM with Instructor Ramesh Gowda (KA01MG2041).',
    PAYMENT_REMINDER: 'Friendly reminder: Installment payment of ₹3,500 is due for Course Enrollment #ENR-5001.',
    TEST_REMINDER: 'Your official RTO Driving Test is scheduled on Friday at KA-01 Koramangala Track. Please carry original Aadhaar.',
  };

  useEffect(() => {
    api.getCommunications().then(res => setLogs(res.data || [])).catch(console.error);
  }, []);

  const handleTemplateChange = (tmplKey: string) => {
    setTemplate(tmplKey);
    setCustomMsg(templates[tmplKey] || '');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.sendCommunication({
        leadId: logs[0]?.leadId || 'led_1',
        channel,
        template,
        message: customMsg,
        recipient,
      });
      toast.success(`Message transmitted via ${channel} to ${recipient}`);
      api.getCommunications().then(res => setLogs(res.data || []));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-brand-600" />
          Centralized Omni-Channel Communications Hub
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">WhatsApp Business, SMS & Email automated dispatch engine</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Instant Dispatcher</h3>
          <form onSubmit={handleSendMessage} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {['WHATSAPP', 'SMS', 'EMAIL'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      channel === ch ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-xs' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pre-approved Template</label>
              <select
                value={template}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
              >
                <option value="WELCOME">Welcome Greetings</option>
                <option value="REGISTRATION">Registration Confirmation</option>
                <option value="LESSON_REMINDER">Lesson Schedule Reminder</option>
                <option value="PAYMENT_REMINDER">Pending Payment Notice</option>
                <option value="TEST_REMINDER">RTO Driving Test Alert</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Recipient Phone / Email *</label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Message Content</label>
              <textarea
                rows={4}
                required
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Transmit Message
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm">Live Dispatch Timeline Logs</h3>
            <span className="text-xs text-slate-400 font-mono">100+ Transmissions</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" />
                    {log.actionType}
                  </span>
                  <span className="text-[11px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-800 mt-2 font-medium">{log.description}</p>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                  <span>Target: {log.lead?.fullName || 'Lead Prospect'}</span>
                  <span>By: {log.actorName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
