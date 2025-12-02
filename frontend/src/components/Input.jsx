import React from 'react';

export default function Input({ label, className = '', error, ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <input
        className={`flex h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-neutral-900' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-neutral-600">{error}</p>}
    </div>
  );
}
