import React from 'react';

export default function Card({ children, className = '', variant = 'default' }) {
  const baseClasses = 'rounded-lg border bg-white transition-all duration-200';
  
  const variants = {
    default: 'border-slate-200 shadow-subtle hover:shadow-base hover:border-slate-300',
    flat: 'border-slate-200 shadow-subtle',
    elevated: 'border-slate-200 shadow-base',
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
