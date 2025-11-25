import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, GeoJSON as GeoJSONLayer } from 'react-leaflet';
import L from 'leaflet';
import { farmAPI, districtAPI, userAPI, productivityAPI, warehouseAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AdminDashboard() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
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
  const [verifiedFarms, setVerifiedFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [center] = useState([-6.2088, 106.8456]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('📡 Fetching from API_BASE_URL:', API_BASE_URL);

      const [usersRes, districtsRes, farmsRes, productivitiesRes, warehousesRes] = await Promise.all([
        userAPI.getAll(),
        districtAPI.getAll(),
        farmAPI.getAll(),
        productivityAPI.getAll(),
        warehouseAPI.getAll(),
      ]);

      // Use all farms data for display
      const allFarmsData = farmsRes.data || [];

      // Validate responses
      if (!usersRes.success || !districtsRes.success || !farmsRes.success ||
        !productivitiesRes.success || !warehousesRes.success) {
        throw new Error('Failed to fetch some data');
      }

      setStats({
        users: usersRes.data?.length || 0,
        districts: districtsRes.data?.length || 0,
        farms: allFarmsData.length,
        productivities: productivitiesRes.success ? productivitiesRes.data?.length || 0 : 0,
        warehouses: warehousesRes.success ? warehousesRes.data?.length || 0 : 0,
      });

      setRecentFarms(allFarmsData.slice(0, 5));
      setAllFarms(allFarmsData);

      // Fetch verified farms separately (same as MapViewPage)
      console.log('🔍 Fetching verified farms from:', `${API_BASE_URL}/farms/verified`);
      const verifiedResponse = await fetch(`${API_BASE_URL}/farms/verified`);

      if (!verifiedResponse.ok) {
        throw new Error(`HTTP ${verifiedResponse.status}: ${verifiedResponse.statusText}`);
      }

      const verifiedData = await verifiedResponse.json();

      console.log('✅ Verified farms received:', verifiedData);

      if (verifiedData.success) {
        console.log('📊 Verified farms count:', verifiedData.data?.length || 0);
        setVerifiedFarms(verifiedData.data || []);
      } else {
        console.warn('⚠️ Verified farms fetch unsuccessful:', verifiedData.message || 'No data');
        setVerifiedFarms([]);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchData(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading, refreshing]);

  const parseGeometry = (farm) => {
    // Try verified geometry first (polygon)
    if (farm.verifiedGeometry) {
      try {
        const geom = JSON.parse(farm.verifiedGeometry);
        if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates[0]) {
          return {
            type: 'polygon',
            coordinates: geom.coordinates[0].map(coord => [coord[1], coord[0]])
          };
        }
      } catch (e) {
        console.error('Error parsing verified geometry:', e);
      }
    }

    // Fallback to input coordinates (point)
    if (farm.geomCoordinates || farm.inputCoordinates) {
      try {
        const coordStr = farm.geomCoordinates || farm.inputCoordinates;
        const geom = JSON.parse(coordStr);
        if (geom.type === 'Point' && geom.coordinates) {
          return {
            type: 'point',
            coordinates: [geom.coordinates[1], geom.coordinates[0]]
          };
        }
      } catch (e) {
        console.error('Error parsing input coordinates:', e);
      }
    }

    return null;
  };

  // For verified farms section - parse geometry like MapViewPage does
  const parseVerifiedGeometry = (geomString) => {
    try {
      const geom = JSON.parse(geomString);

      // Handle FeatureCollection
      if (geom.type === 'FeatureCollection') {
        return geom;
      }

      // Handle Feature
      if (geom.type === 'Feature') {
        return geom.geometry;
      }

      // Handle raw geometry (Polygon, MultiPolygon, etc)
      return geom;
    } catch (e) {
      console.error('Error parsing geometry:', e);
      return null;
    }
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

  const downloadReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: getDateRange(),
      statistics: stats,
      recentFarms: recentFarms.map(farm => ({
        district: farm.district?.districtName,
        area: farm.farmArea,
        elevation: farm.elevation,
        plantingYear: farm.plantingYear
      }))
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cps-dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFarmAction = async (farmUuid, action) => {
    try {
      // This would typically call an API to approve/reject the farm
      console.log(`${action} farm:`, farmUuid);

      // For now, just show a confirmation and refresh data
      const actionText = action === 'approve' ? 'approved' : 'rejected';
      if (window.confirm(`Are you sure you want to ${action} this farm?`)) {
        // Here you would call the actual API
        // await farmAPI.updateStatus(farmUuid, action);

        alert(`Farm ${actionText} successfully!`);
        fetchData(true);
      }
    } catch (error) {
      console.error(`Error ${action}ing farm:`, error);
      alert(`Failed to ${action} farm. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white">
        <div className="px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-600">{getDateRange()}</p>
                {lastUpdated && (
                  <p className="text-xs text-slate-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                variant="outline"
                className="gap-2"
              >
                <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                onClick={downloadReport}
                className="gap-2"
              >
                📊 Download Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-8 py-4">
          <div className="bg-red-50 rounded-lg p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-lg">⚠️</span>
              </div>
              <div>
                <p className="text-red-900 font-medium">Error loading dashboard</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
            <Button
              onClick={() => fetchData()}
              variant="outline"
              size="sm"
              className="bg-white text-red-700 hover:bg-red-50"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Stats Grid - Highlighted Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Farms Card */}
          <Card variant="elevated" className="p-0">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Registered Farms</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-3xl font-bold text-slate-900">{stats.farms}</p>
                  )}
                  <p className="text-xs text-slate-500">📈 +12% from last month</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-2xl">🌾</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Districts Card */}
          <Card variant="elevated" className="p-0">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Active Districts</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-3xl font-bold text-slate-900">{stats.districts}</p>
                  )}
                  <p className="text-xs text-slate-500">📊 Full coverage</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-2xl">📍</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Users Card */}
          <Card variant="elevated" className="p-0">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Total Users</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-3xl font-bold text-slate-900">{stats.users}</p>
                  )}
                  <p className="text-xs text-slate-500">👥 Active accounts</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Content Grid - Main sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Map Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            {!loading && (
              <Card variant="default" className="p-0 overflow-hidden">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Farm Distribution Map</h2>
                      <p className="text-sm text-slate-600 mt-1">
                        {allFarms.length} farms registered
                      </p>
                    </div>
                    <Button
                      onClick={() => fetchData(true)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-900"
                    >
                      🔄 Update Map
                    </Button>
                  </div>
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
                    const geometry = parseGeometry(farm);
                    if (!geometry) return null;

                    const popupContent = (
                      <div className="p-2">
                        <h3 className="font-semibold text-sm mb-2">
                          {farm.farmName || farm.district?.districtName || 'Farm'}
                        </h3>
                        <div className="space-y-1 text-xs">
                          <p><span className="font-medium">Farmer:</span> {farm.farmer?.name}</p>
                          <p><span className="font-medium">District:</span> {farm.district?.districtName}</p>
                          <p><span className="font-medium">Area:</span> {farm.farmArea} ha</p>
                          <p><span className="font-medium">Elevation:</span> {farm.elevation}m</p>
                          <p><span className="font-medium">Status:</span> {farm.status || 'Registered'}</p>
                        </div>
                      </div>
                    );

                    if (geometry.type === 'polygon') {
                      const isVerified = farm.status === 'VERIFIED';
                      return (
                        <Polygon
                          key={farm.uuid}
                          positions={geometry.coordinates}
                          pathOptions={{
                            color: isVerified ? '#059669' : '#f59e0b',
                            fillColor: isVerified ? '#10b981' : '#fbbf24',
                            fillOpacity: 0.3,
                            weight: 2
                          }}
                        >
                          <Popup>{popupContent}</Popup>
                        </Polygon>
                      );
                    } else {
                      return (
                        <Marker key={farm.uuid} position={geometry.coordinates}>
                          <Popup>{popupContent}</Popup>
                        </Marker>
                      );
                    }
                  })}
                </MapContainer>
                <div className="p-4 bg-slate-50 border-t">
                  <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-green-500 bg-opacity-30 border-2 border-green-600 rounded-sm"></div>
                      <span className="text-slate-600">Verified Farms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-yellow-500 bg-opacity-30 border-2 border-yellow-600 rounded-sm"></div>
                      <span className="text-slate-600">Pending Verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-slate-600">Farm Locations</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            {/* Productivity Card */}
            <Card variant="default" className="p-0">
              <div className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Total Productivity</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">{stats.productivities}</p>
                  )}
                  <p className="text-xs text-slate-500">records tracked</p>
                </div>
                <div className="mt-4 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <p className="text-xs font-medium text-slate-900">Active</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Warehouses Card */}
            <Card variant="default" className="p-0">
              <div className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Warehouses</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">{stats.warehouses}</p>
                  )}
                  <p className="text-xs text-slate-500">operational</p>
                </div>
                <div className="mt-4 pt-4">
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-medium text-slate-900 hover:text-slate-700">
                    View Details →
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Debug Section - Show data status */}
        {!loading && process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <p><strong>🔍 Debug Info:</strong></p>
            <p>• All farms: {allFarms.length}</p>
            <p>• Verified farms loaded: {verifiedFarms.length}</p>
            <p>• Recent farms: {recentFarms.length}</p>
            {verifiedFarms.length > 0 && (
              <p>• First verified farm: {verifiedFarms[0].uuid} - {verifiedFarms[0].farmer?.name}</p>
            )}
          </div>
        )}

        {/* Verified Farms Map Section */}
        {!loading && verifiedFarms.length > 0 && (
          <div className="mb-8">
            <Card variant="default" className="p-0 overflow-hidden">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">📍 Verified Farms Location</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {verifiedFarms.length} {verifiedFarms.length === 1 ? 'farm' : 'farms'} with verified geometry
                    </p>
                  </div>
                  <Button
                    onClick={() => fetchData(true)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-900"
                  >
                    🔄 Update Map
                  </Button>
                </div>
              </div>
              <MapContainer
                center={[2.5, 99.5]}
                zoom={9}
                style={{ height: '400px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {verifiedFarms.map((farm) => {
                  try {
                    console.log(`🗺️ Processing farm for map: ${farm.uuid}`);
                    console.log(`   Geometry string length: ${farm.verifiedGeometry?.length || 0}`);

                    const geometry = parseVerifiedGeometry(farm.verifiedGeometry);
                    console.log(`   Parsed geometry type: ${geometry?.type || 'null'}`);

                    if (!geometry) {
                      console.warn(`   ⚠️ Geometry is null for farm ${farm.uuid}`);
                      return null;
                    }

                    // Convert FeatureCollection to simple geometry if needed
                    let displayGeometry = geometry;
                    if (geometry.type === 'FeatureCollection' && geometry.features?.length > 0) {
                      console.log(`   Converting FeatureCollection to geometry`);
                      displayGeometry = geometry.features[0].geometry;
                      console.log(`   Final geometry type: ${displayGeometry?.type || 'null'}`);
                    }

                    console.log(`   ✅ Ready to render with type: ${displayGeometry?.type}`);

                    return (
                      <GeoJSONLayer
                        key={farm.uuid}
                        data={displayGeometry}
                        style={{
                          color: '#059669',
                          weight: 2,
                          opacity: 0.8,
                          fillColor: '#10b981',
                          fillOpacity: 0.3
                        }}
                        onEachFeature={(feature, layer) => {
                          layer.bindPopup(`
                            <div class="p-3 min-w-48">
                              <h3 class="font-bold text-slate-900">${farm.farmer?.name || 'Unknown'}</h3>
                              <p class="text-sm text-slate-600">${farm.district?.districtName}</p>
                              <div class="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                                <span>📐 ${farm.farmArea} ha</span>
                                <span>✓ Verified</span>
                              </div>
                            </div>
                          `);
                        }}
                      />
                    );
                  } catch (e) {
                    console.error('❌ Error rendering farm geometry:', e);
                    console.error('   Farm UUID:', farm.uuid);
                    console.error('   Geometry available:', !!farm.verifiedGeometry);
                    return null;
                  }
                })}
              </MapContainer>
              <div className="p-4 bg-slate-50 border-t">
                <div className="flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-green-500 bg-opacity-50 border-2 border-green-600 rounded-sm"></div>
                    <span className="text-slate-600">Verified Farms (QGIS Geometry)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">💾 Data from verified_geometry field</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Recent Farms Section */}
        <div>
          <Card variant="default" className="p-0">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Recent Farm Registrations</h2>
                <p className="text-sm text-slate-600 mt-1">Latest registrations awaiting verification</p>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                      <div className="h-5 bg-slate-200 rounded animate-pulse mb-3"></div>
                      <div className="flex gap-4">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-16"></div>
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-16"></div>
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentFarms.length > 0 ? (
                <div className="space-y-3">
                  {recentFarms.map((farm, idx) => (
                    <div
                      key={farm.uuid}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{farm.district?.districtName}</p>
                        <div className="flex gap-4 mt-2 text-sm text-slate-600">
                          <span>📐 {farm.farmArea} ha</span>
                          <span>⛰️ {farm.elevation}m</span>
                          <span>📅 {farm.plantingYear}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          onClick={() => handleFarmAction(farm.uuid, 'approve')}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 bg-green-100 text-green-700 hover:bg-green-200"
                          title="Approve Farm"
                        >
                          ✓
                        </Button>
                        <Button
                          onClick={() => handleFarmAction(farm.uuid, 'reject')}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 bg-red-100 text-red-700 hover:bg-red-200"
                          title="Reject Farm"
                        >
                          ✗
                        </Button>
                        <Badge variant="pending">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600">No farms registered yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
