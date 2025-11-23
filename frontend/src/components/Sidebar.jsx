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
      <aside className={`fixed left-0 top-0 z-50 h-screen bg-white shadow-sm transition-all duration-300 ease-in-out flex flex-col ${
        isOpen ? 'w-64' : 'w-16'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4">
          {isOpen && (
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <span className="text-sm font-bold">C</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-900">CPS</h1>
                <p className="text-xs text-slate-500">Coffee Production</p>
              </div>
            </div>
          )}
          
          {!isOpen && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white mx-auto">
              <span className="text-sm font-bold">C</span>
            </div>
          )}
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition-colors"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <PanelLeftClose className="h-4 w-4" strokeWidth={2} />
            ) : (
              <PanelLeftOpen className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {isOpen && (
            <div className="mb-4">
              <h2 className="mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Navigation
              </h2>
            </div>
          )}
          
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors focus:outline-none ${
                  isActive
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <IconComponent 
                  className={`h-5 w-5 flex-shrink-0 ${
                    isOpen ? 'mr-3' : 'mx-auto'
                  } ${isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} 
                  strokeWidth={2} 
                />
                {isOpen && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4">
          {isOpen ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                  <span className="text-xs font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.isAdmin ? 'Administrator' : 'Farmer'}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5 text-slate-500 group-hover:text-slate-700" strokeWidth={2} />
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Collapsed User Avatar */}
              <div className="flex justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                  <span className="text-xs font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              
              {/* Collapsed Logout */}
              <button
                onClick={handleLogout}
                className="group flex w-full items-center justify-center rounded-md px-2 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}