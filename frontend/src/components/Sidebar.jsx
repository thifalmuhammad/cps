import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, navItems, user }) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavClick = (itemId) => {
    setCurrentPage(itemId);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-4 top-4 lg:hidden z-50 inline-flex items-center justify-center rounded-md p-2 text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus:outline-none transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" strokeWidth={2} />
        ) : (
          <Menu className="h-5 w-5" strokeWidth={2} />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 lg:hidden z-40"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 h-screen bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out flex flex-col ${
        isOpen ? 'w-64' : 'w-16'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-neutral-200">
          {isOpen && (
            <div className="flex items-center space-x-2">
              <img src="/transparent_logo.png" alt="CPS Logo" className="h-10 w-10" />
              <div>
                <h1 className="text-sm font-semibold text-neutral-900">CPS</h1>
              </div>
            </div>
          )}
          
          {!isOpen && (
            <img src="/transparent_logo.png" alt="CPS Logo" className="h-10 w-10 mx-auto" />
          )}
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 transition-colors"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <IconComponent 
                  className={`h-4 w-4 flex-shrink-0 ${
                    isOpen ? 'mr-3' : 'mx-auto'
                  } ${isActive ? 'text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-700'}`} 
                  strokeWidth={1.5} 
                />
                {isOpen && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-neutral-200">
          {isOpen ? (
            <div className="space-y-2">
              {/* User Info */}
              <div className="flex items-center space-x-2 rounded-md border border-neutral-200 bg-white p-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
                  <span className="text-xs font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {user?.isAdmin ? 'Admin' : 'Farmer'}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4 text-neutral-500 group-hover:text-neutral-700" strokeWidth={1.5} />
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Collapsed User Avatar */}
              <div className="flex justify-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white">
                  <span className="text-xs font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              
              {/* Collapsed Logout */}
              <button
                onClick={handleLogout}
                className="group flex w-full items-center justify-center rounded-md px-2 py-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}