import React, { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import RegisterPage from './pages/RegisterPage';
import FarmRegistrationPage from './pages/FarmRegistrationPage';
import FarmManagementPage from './pages/FarmManagementPage';
import FarmVerificationPage from './pages/FarmVerificationPage';
import MapViewPage from './pages/MapViewPage';
import DistrictManagementPage from './pages/DistrictManagementPage';
import { BarChart3, MapPin, TreePine, UserPlus, Home, PlusCircle, CheckSquare, Map } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // If no user logged in, show login page
  if (!user) {
    return <LoginPage />;
  }

  // Admin navigation items dengan icons
  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'map-view', label: 'Farm Map', icon: Map },
    { id: 'verify-farms', label: 'Verify Farms', icon: CheckSquare },
    { id: 'manage-district', label: 'Districts', icon: MapPin },
    { id: 'manage-farm', label: 'Manage Farms', icon: TreePine },
    { id: 'register-user', label: 'Register User', icon: UserPlus },
  ];

  // Farmer navigation items dengan icons
  const farmerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'register-farm', label: 'Register Farm', icon: PlusCircle },
  ];

  const navItems = user.isAdmin ? adminNavItems : farmerNavItems;

  return (
    <div className="App flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} navItems={navItems} user={user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-64 transition-all duration-300">
        {/* Page Content */}
        <main className="flex-1">
          {currentPage === 'dashboard' && (user.isAdmin ? <AdminDashboard /> : <FarmerDashboard />)}
          {user.isAdmin && (
            <>
              {currentPage === 'map-view' && <MapViewPage />}
              {currentPage === 'verify-farms' && <FarmVerificationPage />}
              {currentPage === 'manage-district' && <DistrictManagementPage />}
              {currentPage === 'manage-farm' && <FarmManagementPage />}
              {currentPage === 'register-user' && <RegisterPage />}
            </>
          )}
          {!user.isAdmin && (
            <>
              {currentPage === 'register-farm' && <FarmRegistrationPage />}
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
