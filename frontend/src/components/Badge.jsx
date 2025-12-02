import React from 'react';

export default function Badge({ children, variant = 'default', className = '' }) {
  const baseClasses = 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors';
  
  const variants = {
    default: 'border-transparent bg-neutral-900 text-white',
    secondary: 'border-transparent bg-neutral-100 text-neutral-900',
    destructive: 'border-transparent bg-neutral-900 text-white',
    outline: 'border-neutral-200 text-neutral-950',
    success: 'border-transparent bg-neutral-100 text-neutral-900',
    warning: 'border-transparent bg-neutral-100 text-neutral-900',
    error: 'border-transparent bg-neutral-100 text-neutral-900',
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}