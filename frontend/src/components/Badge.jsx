import React from 'react';

export default function Badge({ children, variant = 'default', className = '' }) {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none';
  
  const variants = {
    default: 'border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80',
    secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80',
    destructive: 'border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80',
    outline: 'text-slate-950 border border-slate-200',
    success: 'border-transparent bg-green-500 text-slate-50 hover:bg-green-500/80',
    warning: 'border-transparent bg-yellow-500 text-slate-50 hover:bg-yellow-500/80',
    pending: 'border-transparent bg-yellow-100 text-yellow-800',
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}