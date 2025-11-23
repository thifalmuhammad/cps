import React from 'react';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="px-6 py-3 flex justify-between items-center">
        {/* Empty navbar - clean minimal header */}
        <div className="flex-1"></div>
      </div>
    </nav>
  );
}
