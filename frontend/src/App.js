import React, { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import FarmRegistrationPage from './pages/FarmRegistrationPage';
import FarmManagementPage from './pages/FarmManagementPage';
import FarmVerificationPage from './pages/FarmVerificationPage';
import DistrictManagementPage from './pages/DistrictManagementPage';
import ProductivityManagementPage from './pages/ProductivityManagementPage';
import WarehouseInventoryPage from './pages/WarehouseInventoryPage';
import WeatherPage from './pages/WeatherPage';
import { LayoutDashboard, MapPin, Sprout, Home, Plus, CheckCircle, TrendingUp, Package, Cloud } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);

  // If no user logged in, show landing page or login page
  if (!user) {
    return showLogin ? <LoginPage /> : <LandingPage onLogin={() => setShowLogin(true)} />;
  }

  // Admin navigation items dengan icons
  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'verify-farms', label: 'Verify Farms', icon: CheckCircle },
    { id: 'manage-district', label: 'Districts', icon: MapPin },
    { id: 'manage-farm', label: 'Manage Farms', icon: Sprout },
  ];

  // Farmer navigation items dengan icons
  const farmerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'register-farm', label: 'Register Farm', icon: Plus },
    { id: 'productivity', label: 'Productivity', icon: TrendingUp },
    { id: 'warehouse', label: 'Warehouse', icon: Package },
    { id: 'weather', label: 'Weather', icon: Cloud },
  ];

  const navItems = user.isAdmin ? adminNavItems : farmerNavItems;

  return (
    <div className="App flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} navItems={navItems} user={user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-64 transition-all duration-300">
        {/* Page Content */}
        <main className="flex-1">
          {currentPage === 'dashboard' && (user.isAdmin ? <AdminDashboard /> : <FarmerDashboard setCurrentPage={setCurrentPage} />)}
          {user.isAdmin && (
            <>
              {currentPage === 'verify-farms' && <FarmVerificationPage />}
              {currentPage === 'manage-district' && <DistrictManagementPage />}
              {currentPage === 'manage-farm' && <FarmManagementPage />}
            </>
          )}
          {!user.isAdmin && (
            <>
              {currentPage === 'register-farm' && <FarmRegistrationPage />}
              {currentPage === 'productivity' && <ProductivityManagementPage />}
              {currentPage === 'warehouse' && <WarehouseInventoryPage />}
              {currentPage === 'weather' && <WeatherPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
