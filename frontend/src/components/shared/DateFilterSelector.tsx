import React from 'react';
import { Calendar } from 'lucide-react';

interface DateFilterProps {
  selected: string;
  onChange: (val: string, startDate?: string, endDate?: string) => void;
  startDate?: string;
  endDate?: string;
}

export const DateFilterSelector: React.FC<DateFilterProps> = ({ selected, onChange, startDate = '', endDate = '' }) => {
  const [showCustom, setShowCustom] = React.useState(selected === 'custom');
  const [customStart, setCustomStart] = React.useState(startDate);
  const [customEnd, setCustomEnd] = React.useState(endDate);

  const options = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Last 30 Days', value: 'last30days' },
    { label: 'This Month', value: 'month' },
    { label: 'Last Month', value: 'lastmonth' },
    { label: 'Custom', value: 'custom' },
  ];

  const handleSelect = (val: string) => {
    if (val === 'custom') {
      setShowCustom(true);
      onChange('custom', customStart, customEnd);
    } else {
      setShowCustom(false);
      onChange(val);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onChange('custom', customStart, customEnd);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs text-xs font-medium overflow-x-auto max-w-full">
        <div className="px-2 text-slate-400 flex items-center gap-1 border-r border-slate-200 pr-2">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
              selected === opt.value
                ? 'bg-brand-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-xs text-xs">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
            required
          />
          <span className="text-slate-400 text-xs font-semibold">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
            required
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 cursor-pointer"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
};
