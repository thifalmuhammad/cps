import React from 'react';

export default function Button({ children, className = '', variant = 'primary', disabled = false, ...props }) {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 shadow-subtle',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 border border-slate-200',
    ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
    success: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
