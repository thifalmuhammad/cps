import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, ChevronLeft, Menu } from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, navItems, user }) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavClick = (itemId) => {
    setCurrentPage(itemId);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-4 top-4 lg:hidden z-50 p-2 bg-white border border-slate-200 hover:bg-slate-50 active:scale-90 rounded-lg transition-all duration-300 shadow-sm"
      >
        <Menu className="w-6 h-6 text-slate-900 transition-transform duration-300" strokeWidth={2} />
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 text-slate-900 transition-all duration-300 z-50 flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        
        {/* Logo Section */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
          {isOpen && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">☕</span>
              <div>
                <h1 className="text-lg font-bold text-slate-900">CPS</h1>
                <p className="text-xs text-slate-600">Coffee Farm</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:flex p-1.5 hover:bg-slate-100 active:scale-90 rounded-md transition-all duration-300 text-slate-600"
            title={isOpen ? 'Collapse' : 'Expand'}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {isOpen && (
            <div className="px-3 py-2 mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</p>
            </div>
          )}
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-300 active:scale-95 ${
                  currentPage === item.id
                    ? 'bg-slate-100 text-slate-900 font-medium border-l-2 border-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-xs'
                }`}
                title={!isOpen ? item.label : ''}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0 transition-transform duration-300" strokeWidth={2} />
                {isOpen && (
                  <span className="text-sm truncate transition-all duration-300">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-200 p-3">
          {isOpen ? (
            <div className="space-y-3">
              {/* User Info Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0 transition-transform duration-300">
                    <span className="text-sm font-bold text-slate-700">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-600 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-600">
                    {user?.isAdmin ? '🔑 Administrator' : '👨‍🌾 Farmer'}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 rounded-md transition-all duration-300 border border-slate-200 flex items-center gap-2 justify-center"
              >
                <LogOut className="w-4 h-4 transition-transform duration-300" strokeWidth={2} />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 active:scale-95 rounded-md transition-all duration-300"
              title="Logout"
            >
              <LogOut className="w-5 h-5 transition-transform duration-300" strokeWidth={2} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
