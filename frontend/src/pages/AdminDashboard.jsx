import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { farmAPI, districtAPI, userAPI, productivityAPI, warehouseAPI } from '../services/api';
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    districts: 0,
    farms: 0,
    productivities: 0,
    warehouses: 0,
  });
  const [recentFarms, setRecentFarms] = useState([]);
  const [allFarms, setAllFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center] = useState([-6.2088, 106.8456]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, districtsRes, farmsRes, productivitiesRes, warehousesRes] = await Promise.all([
          userAPI.getAll(),
          districtAPI.getAll(),
          farmAPI.getAll(),
          productivityAPI.getAll(),
          warehouseAPI.getAll(),
        ]);

        const farmsData = farmsRes.data || [];
        setStats({
          users: usersRes.data?.length || 0,
          districts: districtsRes.data?.length || 0,
          farms: farmsData.length,
          productivities: productivitiesRes.data?.length || 0,
          warehouses: warehousesRes.data?.length || 0,
        });

        setRecentFarms(farmsData.slice(0, 5));
        setAllFarms(farmsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1">{getDateRange()}</p>
            </div>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
              Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Stats Grid - Highlighted Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Farms Card */}
          <Card variant="elevated">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600">Registered Farms</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.farms}</p>
                <p className="text-xs text-slate-500 mt-2">📈 +12% from last month</p>
              </div>
              <span className="text-4xl">🌾</span>
            </div>
          </Card>

          {/* Districts Card */}
          <Card variant="elevated">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Districts</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.districts}</p>
                <p className="text-xs text-slate-500 mt-2">📊 Full coverage</p>
              </div>
              <span className="text-4xl">📍</span>
            </div>
          </Card>

          {/* Users Card */}
          <Card variant="elevated">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Users</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.users}</p>
                <p className="text-xs text-slate-500 mt-2">👥 Active accounts</p>
              </div>
              <span className="text-4xl">👤</span>
            </div>
          </Card>
        </div>

        {/* Content Grid - Main sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Map Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            {!loading && (
              <Card variant="default" className="p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900">Farm Distribution Map</h2>
                  <p className="text-sm text-slate-600 mt-1">{allFarms.length} farms visualized</p>
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
                  {allFarms.map((farm) => {
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

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            {/* Productivity Card */}
            <Card variant="default">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Productivity</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.productivities}</p>
                <p className="text-xs text-slate-500 mt-2">records tracked</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-900">Status: Active</p>
              </div>
            </Card>

            {/* Warehouses Card */}
            <Card variant="default">
              <div>
                <p className="text-sm font-medium text-slate-600">Warehouses</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.warehouses}</p>
                <p className="text-xs text-slate-500 mt-2">operational</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button className="text-xs font-medium text-slate-900 hover:text-slate-700">
                  View Details →
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Farms Section */}
        <div>
          <Card variant="default">
            <div className="border-b border-slate-200 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Farm Registrations</h2>
              <p className="text-sm text-slate-600 mt-1">Latest registrations awaiting verification</p>
            </div>

            {loading ? (
              <p className="text-slate-600">Loading...</p>
            ) : recentFarms.length > 0 ? (
              <div className="space-y-3">
                {recentFarms.map((farm, idx) => (
                  <div
                    key={farm.uuid}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{farm.district?.districtName}</p>
                      <div className="flex gap-4 mt-2 text-sm text-slate-600">
                        <span>📐 {farm.farmArea} ha</span>
                        <span>⛰️ {farm.elevation}m</span>
                        <span>📅 {farm.plantingYear}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium whitespace-nowrap ml-4">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">No farms registered yet</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
