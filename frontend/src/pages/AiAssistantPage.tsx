import React, { useState } from 'react';
import { Sparkles, Bot, Send, CheckCircle2, TrendingUp, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'ai',
      text: "👋 Hello! I am the Sri Munis Kanna AI Intelligence Engine. I analyze lesson schedules, instructor availability, student learning progress, and financial forecasts in real-time. How can I assist your academy today?"
    }
  ]);
  const [input, setInput] = useState('');

  const suggestions = [
    "Predict next month revenue and enrollment demand",
    "Identify instructors with highest RTO pass rates",
    "Find vehicles due for preventive maintenance",
    "Smart allocation: Assign best instructor for automatic car lead in Indiranagar"
  ];

  const handleSend = (query?: string) => {
    const textToSend = query || input;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');

    setTimeout(() => {
      let reply = "Based on our operational data, Sri Munis Kanna Driving School has 40 active students, 10 on-duty instructors, and 12 fleet vehicles. Operating efficiency is at 94.2% with ₹6,20,000 projected monthly billing.";
      if (textToSend.toLowerCase().includes('revenue')) {
        reply = "📈 Revenue Forecast: Next month enrollment demand is projected to grow by 18%, reaching approx. ₹7,30,000 in fee receipts, driven by the new Automatic LMV package.";
      } else if (textToSend.toLowerCase().includes('instructor')) {
        reply = "🏆 Top Instructor Performance: Ramesh Gowda has a 98% first-attempt RTO pass rate with 4.9⭐ rating across 38 completed batches.";
      } else if (textToSend.toLowerCase().includes('maintenance')) {
        reply = "🔧 Fleet Alert: Vehicle KA01-MJ-8812 (Maruti Swift) is at 18,500 km and will require 20,000 km periodic engine service in 12 days.";
      }
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-sky-500" />
          Sri Munis Kanna AI Intelligence & Decision Suite
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Automated timetable optimization, churn risk detection, and revenue forecasting</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
        {/* Chat Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${
                m.sender === 'user' ? 'bg-brand-600 text-white font-medium rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none font-medium'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[11px] font-semibold text-slate-600 hover:text-brand-700 bg-white hover:bg-brand-50 border border-slate-200 px-3 py-1 rounded-full transition-all cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            placeholder="Ask anything about students, schedule optimization, revenue, fleet..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-brand-500 outline-hidden font-medium"
          />
          <button
            onClick={() => handleSend()}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/20 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
};
