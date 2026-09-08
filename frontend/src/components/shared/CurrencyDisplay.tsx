import React from 'react';

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  prefix?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ amount, className = '', prefix = '₹' }) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount || 0);

  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      {prefix}{formatted}
    </span>
  );
};
