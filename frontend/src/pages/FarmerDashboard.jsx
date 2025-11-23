import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { farmAPI, productivityAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [myFarms, setMyFarms] = useState([]);
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalArea: 0,
    totalProductivity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [center] = useState([-6.2088, 106.8456]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const farmsRes = await farmAPI.getAll();
        const farms = farmsRes.data || [];
        
        const myFarmsList = farms.filter(f => f.farmerId === user?.uuid);
        setMyFarms(myFarmsList);

        const totalArea = myFarmsList.reduce((sum, f) => sum + f.farmArea, 0);
        
        const prodRes = await productivityAPI.getAll();
        const myProds = (prodRes.data || []).filter(p => 
          myFarmsList.some(f => f.uuid === p.farmId)
        );
        const totalProductivity = myProds.reduce((sum, p) => sum + p.productivity, 0);

        setStats({
          totalFarms: myFarmsList.length,
          totalArea: totalArea.toFixed(2),
          totalProductivity: totalProductivity.toFixed(2),
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uuid]);

  const parseCoordinates = (geomCoordinates) => {
    try {
      const geom = JSON.parse(geomCoordinates);
      if (geom.type === 'Point' && geom.coordinates) {
        return [geom.coordinates[1], geom.coordinates[0]];
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
    return null;
  };

  const getDateRange = () => {
    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const formatDate = (date) => {
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };

    return `${formatDate(startMonth)} - ${formatDate(endMonth)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Farms</h1>
              <p className="text-sm text-slate-600 mt-1">{getDateRange()}</p>
            </div>
            <a 
              href="#register-farm"
              className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors text-center"
            >
              + Register Farm
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Stats Grid - Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Farms Card */}
          <Card variant="elevated">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600">My Farms</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalFarms}</p>
                <p className="text-xs text-slate-500 mt-2">🌾 Registered</p>
              </div>
              <span className="text-4xl">🏡</span>
            </div>
          </Card>

          {/* Total Area Card */}
          <Card variant="elevated">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Area</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalArea}</p>
                <p className="text-xs text-slate-500 mt-2">📐 hectares</p>
              </div>
              <span className="text-4xl">📊</span>
            </div>
          </Card>

          {/* Productivity Card */}
          <Card variant="elevated">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Productivity</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalProductivity}</p>
                <p className="text-xs text-slate-500 mt-2">📈 recorded</p>
              </div>
              <span className="text-4xl">📈</span>
            </div>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            {!loading && (
              <Card variant="default" className="p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900">Your Farms Location</h2>
                  <p className="text-sm text-slate-600 mt-1">{myFarms.length} farm(s) on map</p>
                </div>
                <MapContainer
                  center={center}
                  zoom={10}
                  style={{ height: '350px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {myFarms.map((farm) => {
                    const coords = parseCoordinates(farm.geomCoordinates);
                    return coords ? (
                      <Marker key={farm.uuid} position={coords}>
                        <Popup>
                          <div>
                            <h3 className="font-bold text-sm">{farm.district?.districtName}</h3>
                            <p className="text-xs">Area: {farm.farmArea} ha</p>
                            <p className="text-xs">Elevation: {farm.elevation}m</p>
                          </div>
                        </Popup>
                      </Marker>
                    ) : null;
                  })}
                </MapContainer>
              </Card>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* Account Info Card */}
            <Card variant="default">
              <div className="border-b border-slate-200 pb-4 mb-4">
                <p className="text-sm font-medium text-slate-600">Account Information</p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600">Name</p>
                  <p className="font-medium text-slate-900 mt-1">{user?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Email</p>
                  <p className="font-medium text-slate-900 mt-1">{user?.email}</p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-900">👨‍🌾 Farmer Account</p>
                </div>
              </div>
            </Card>

            {/* Quick Guide Card */}
            <Card variant="default">
              <div className="border-b border-slate-200 pb-4 mb-4">
                <p className="text-sm font-medium text-slate-600">Getting Started</p>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-lg flex-shrink-0">1️⃣</span>
                  <div>
                    <p className="text-xs font-medium text-slate-900">Register Your Farm</p>
                    <p className="text-xs text-slate-600 mt-1">Input farm details and location</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg flex-shrink-0">2️⃣</span>
                  <div>
                    <p className="text-xs font-medium text-slate-900">Admin Verification</p>
                    <p className="text-xs text-slate-600 mt-1">Wait for location mapping</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg flex-shrink-0">3️⃣</span>
                  <div>
                    <p className="text-xs font-medium text-slate-900">View on Map</p>
                    <p className="text-xs text-slate-600 mt-1">Your farm appears here</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Farms List Section */}
        <div>
          <Card variant="default">
            <div className="border-b border-slate-200 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Your Registered Farms</h2>
              <p className="text-sm text-slate-600 mt-1">Complete information about your farms</p>
            </div>

            {loading ? (
              <p className="text-slate-600">Loading...</p>
            ) : myFarms.length > 0 ? (
              <div className="space-y-3">
                {myFarms.map((farm) => (
                  <div
                    key={farm.uuid}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">{farm.district?.districtName}</p>
                        <p className="text-xs text-slate-600 mt-1">ID: {farm.uuid.substring(0, 8)}...</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                      <div>
                        <p className="text-xs text-slate-600 font-medium">Area</p>
                        <p className="font-bold text-slate-900 mt-1">{farm.farmArea}</p>
                        <p className="text-xs text-slate-600">hectares</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-medium">Elevation</p>
                        <p className="font-bold text-slate-900 mt-1">{farm.elevation}</p>
                        <p className="text-xs text-slate-600">meters</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-medium">Year Planted</p>
                        <p className="font-bold text-slate-900 mt-1">{farm.plantingYear}</p>
                        <p className="text-xs text-slate-600">year</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">🌾</p>
                <p className="text-slate-600 mb-4 font-medium">No farms registered yet</p>
                <p className="text-sm text-slate-600 mb-6">Start by registering your first farm to begin tracking your production</p>
                <a
                  href="#register-farm"
                  className="inline-block px-6 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Register Your First Farm
                </a>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
