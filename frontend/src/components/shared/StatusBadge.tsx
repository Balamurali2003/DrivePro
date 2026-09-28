import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'PENDING', className = '', size = 'md' }) => {
  const normalized = (status || '').toUpperCase().trim();

  const getBadgeStyle = (st: string) => {
    switch (st) {
      // Success / Green
      case 'ACTIVE':
      case 'COMPLETED':
      case 'CONVERTED':
      case 'CONVERTED_TO_SALE':
      case 'PAID':
      case 'RESOLVED':
      case 'PASSED':
      case 'SOLD':
      case 'REWARDED':
      case 'APPROVED':
        return 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80';

      // Blue / Info
      case 'SCHEDULED':
      case 'CONFIRMED':
      case 'NEW':
      case 'REGISTERED':
      case 'AVAILABLE':
      case 'ENROLLED':
      case 'PROCESSING':
        return 'bg-blue-50/90 text-blue-700 border-blue-200/80';

      // Amber / Warning / In Progress
      case 'PENDING':
      case 'UNDER_REVIEW':
      case 'REQUESTED':
      case 'INTERESTED':
      case 'HIGHLY_INTERESTED':
      case 'OFFER_MADE':
      case 'FOLLOW_UP':
      case 'PAUSED':
      case 'IN_PROGRESS':
      case 'CONTACTED':
      case 'PARTIALLY_PAID':
        return 'bg-amber-50/90 text-amber-700 border-amber-200/80';

      // Red / Error / Cancelled
      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED':
      case 'LOST':
      case 'NO_SHOW':
      case 'NOT_INTERESTED':
      case 'CRITICAL':
      case 'OVERDUE':
        return 'bg-rose-50/90 text-rose-700 border-rose-200/80';

      // Neutral / Muted
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wider border transition-colors ${
        isSmall ? 'text-[10px] px-1.5 py-0.5 rounded' : 'text-[11px] px-2 py-0.5 rounded-md'
      } ${getBadgeStyle(normalized)} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-85 shrink-0" />
      <span className="truncate">{formatText(status)}</span>
    </span>
  );
};
