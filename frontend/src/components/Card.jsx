import React from 'react';

export default function Card({ children, className = '', variant = 'default' }) {
  const baseClasses = 'rounded-lg bg-white text-slate-950';
  
  const variants = {
    default: 'shadow-sm',
    elevated: 'shadow-md',
    flat: 'shadow-none',
    outline: 'bg-transparent shadow-none',
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}