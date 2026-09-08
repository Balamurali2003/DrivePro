import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = (st: string) => {
    switch (st.toUpperCase()) {
      case 'NEW':
      case 'SCHEDULED':
      case 'REGISTERED':
      case 'AVAILABLE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ACTIVE':
      case 'COMPLETED':
      case 'CONVERTED':
      case 'PAID':
      case 'RESOLVED':
      case 'PASSED':
      case 'SOLD':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INTERESTED':
      case 'FOLLOW_UP':
      case 'CONFIRMED':
      case 'TEST_DRIVE':
      case 'NEGOTIATION':
      case 'IN_PROGRESS':
      case 'PARTIALLY_PAID':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'URGENT':
      case 'CRITICAL':
      case 'OVERDUE':
      case 'MAINTENANCE':
      case 'CANCELLED':
      case 'FAILED':
      case 'LOST':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(status)} ${className}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-80" />
      {formatText(status)}
    </span>
  );
};
