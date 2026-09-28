import React from 'react';
import { Calendar } from 'lucide-react';

interface DateFilterProps {
  selected: string;
  onChange: (val: string, startDate?: string, endDate?: string) => void;
  startDate?: string;
  endDate?: string;
}

export const DateFilterSelector: React.FC<DateFilterProps> = ({
  selected,
  onChange,
  startDate = '',
  endDate = ''
}) => {
  const [showCustom, setShowCustom] = React.useState(selected === 'custom');
  const [customStart, setCustomStart] = React.useState(startDate);
  const [customEnd, setCustomEnd] = React.useState(endDate);

  const options = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: '7 Days', value: 'last7days' },
    { label: '30 Days', value: 'last30days' },
    { label: 'Month', value: 'month' },
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
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="inline-flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 text-xs font-semibold overflow-x-auto max-w-full">
        <div className="px-2 text-slate-400 flex items-center gap-1 border-r border-slate-200/80 pr-1.5">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-all whitespace-nowrap cursor-pointer ${
              selected === opt.value
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-lg p-1 text-xs shadow-2xs">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-0.5 text-[11px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          <span className="text-slate-400 text-[10px] font-bold">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-0.5 text-[11px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded hover:bg-blue-700 cursor-pointer shadow-xs"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
};
