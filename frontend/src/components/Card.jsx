import React from 'react';

export function CardHeader({ children, className = '' }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`text-sm text-neutral-500 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;
}

export default function Card({ children, className = '', variant = 'default' }) {
  const baseClasses = 'rounded-xl border border-neutral-200 bg-white text-neutral-950';
  
  const variants = {
    default: '',
    elevated: '',
    flat: 'border-0',
    outline: 'bg-transparent',
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {className.includes('p-0') ? children : <div className="p-6">{children}</div>}
    </div>
  );
}