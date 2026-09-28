import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon?: LucideIcon;
  trend?: {
    value: string | number;
    positive?: boolean;
    neutral?: boolean;
    label?: string;
  };
  indicatorColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan' | 'slate';
  progress?: number; // 0 to 100
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  trend,
  indicatorColor = 'blue',
  progress,
  className = '',
  onClick
}) => {
  const colorMap = {
    blue: {
      accent: 'text-blue-600',
      bg: 'bg-blue-50/80',
      border: 'border-blue-100',
      bar: 'bg-blue-600',
      dot: 'bg-blue-500'
    },
    emerald: {
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50/80',
      border: 'border-emerald-100',
      bar: 'bg-emerald-600',
      dot: 'bg-emerald-500'
    },
    amber: {
      accent: 'text-amber-600',
      bg: 'bg-amber-50/80',
      border: 'border-amber-100',
      bar: 'bg-amber-500',
      dot: 'bg-amber-500'
    },
    rose: {
      accent: 'text-rose-600',
      bg: 'bg-rose-50/80',
      border: 'border-rose-100',
      bar: 'bg-rose-500',
      dot: 'bg-rose-500'
    },
    indigo: {
      accent: 'text-indigo-600',
      bg: 'bg-indigo-50/80',
      border: 'border-indigo-100',
      bar: 'bg-indigo-600',
      dot: 'bg-indigo-500'
    },
    cyan: {
      accent: 'text-cyan-600',
      bg: 'bg-cyan-50/80',
      border: 'border-cyan-100',
      bar: 'bg-cyan-500',
      dot: 'bg-cyan-500'
    },
    slate: {
      accent: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      bar: 'bg-slate-500',
      dot: 'bg-slate-400'
    }
  };

  const scheme = colorMap[indicatorColor] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs transition-all duration-150 hover:border-slate-300 hover:shadow-sm h-full flex flex-col justify-between ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              {label}
            </span>
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 tabular-nums truncate block">
              {value}
            </span>
          </div>
        </div>

        {Icon && (
          <div className={`p-2 rounded-xl ${scheme.bg} ${scheme.accent} border ${scheme.border} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] gap-2 min-h-[22px]">
          {sublabel ? (
            <span className="text-slate-500 truncate font-normal">
              {sublabel}
            </span>
          ) : (
            <span className="text-transparent select-none">-</span>
          )}

          {trend && (
            <span
              className={`font-semibold inline-flex items-center gap-0.5 ml-auto shrink-0 ${
                trend.neutral
                  ? 'text-slate-400'
                  : trend.positive
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {trend.value} {trend.label && <span className="font-normal text-slate-400 text-[10px] ml-1">{trend.label}</span>}
            </span>
          )}
        </div>

        {progress !== undefined && (
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${scheme.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
