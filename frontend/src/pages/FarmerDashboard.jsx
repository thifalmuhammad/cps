import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON as GeoJSONLayer } from 'react-leaflet';
import L from 'leaflet';
import { farmAPI, productivityAPI, districtAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
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
  const [rejectedFarms, setRejectedFarms] = useState([]);
  const [verifiedFarms, setVerifiedFarms] = useState([]);
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalArea: 0,
    totalProductivity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingFarm, setEditingFarm] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [editFormData, setEditFormData] = useState({
    districtId: '',
    farmArea: '',
    elevation: '',
    plantingYear: ''
  });
  const [updateMessage, setUpdateMessage] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📡 Fetching farms for farmer:', user?.uuid);

        const [farmsRes, districtsRes] = await Promise.all([
          farmAPI.getAll(),
          districtAPI.getAll()
        ]);
        setDistricts(districtsRes.data || []);
        const allFarms = farmsRes.data || [];

        // Filter farms for current farmer
        const allMyFarms = allFarms.filter(f => f.farmerId === user?.uuid);
        
        // Separate active farms from rejected farms
        const myFarmsList = allMyFarms.filter(f => 
          f.status !== 'REJECTED' && 
          f.status !== 'NEEDS_UPDATE'
        );
        
        // Get rejected farms separately
        const myRejectedFarms = allMyFarms.filter(f => 
          f.status === 'REJECTED' || f.status === 'NEEDS_UPDATE'
        );
        console.log('🌾 My farms count:', myFarmsList.length);
        console.log('📊 My farms:', myFarmsList.map(f => ({ uuid: f.uuid, status: f.status, hasVerified: !!f.verifiedGeometry, hasInput: !!f.inputCoordinates })));

        setMyFarms(myFarmsList);
        setRejectedFarms(myRejectedFarms);

        // Separate verified farms from all farms
        const myVerifiedFarms = myFarmsList.filter(f => f.status === 'VERIFIED' && f.verifiedGeometry);
        console.log('✅ My verified farms count:', myVerifiedFarms.length);
        setVerifiedFarms(myVerifiedFarms);

        // Calculate stats
        const totalArea = myFarmsList.reduce((sum, f) => sum + (f.farmArea || 0), 0);

        const prodRes = await productivityAPI.getAll();
        const myProds = (prodRes.data || []).filter(p =>
          myFarmsList.some(f => f.uuid === p.farmId)
        );
        const totalProductivity = myProds.reduce((sum, p) => sum + (p.productivity || 0), 0);

        setStats({
          totalFarms: myFarmsList.length,
          totalArea: totalArea.toFixed(2),
          totalProductivity: totalProductivity.toFixed(2),
        });

        console.log('✅ Data loaded successfully');
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        setError('Failed to load farms data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.uuid) {
      fetchData();
    }
  }, [user?.uuid]);

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

  const parseCoordinates = (geomString) => {
    try {
      const geom = JSON.parse(geomString);
      if (geom.type === 'Point' && geom.coordinates) {
        return [geom.coordinates[1], geom.coordinates[0]];
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
    return null;
  };

  const handleFarmClick = (farm) => {
    // Try verified geometry first (verified farms), then input coordinates (pending farms)
    const geometryString = farm.verifiedGeometry || farm.inputCoordinates;
    const coords = geometryString ? parseCoordinates(geometryString) : null;

    if (coords && mapRef.current) {
      console.log(`🗺️ Navigating to farm: ${farm.district?.districtName} at`, coords);
      mapRef.current.setView(coords, 15);
      setSelectedFarmId(farm.uuid);
    }
  };

  const handleEditFarm = (farm) => {
    setEditingFarm(farm);
    setEditFormData({
      districtId: farm.districtId,
      farmArea: farm.farmArea,
      elevation: farm.elevation,
      plantingYear: farm.plantingYear
    });
    setShowEditForm(true);
    setUpdateMessage('');
  };

  const handleUpdateFarm = async (e) => {
    e.preventDefault();
    try {
      await farmAPI.update(editingFarm.uuid, editFormData);
      setUpdateMessage('Farm updated successfully! Waiting for admin verification.');
      setShowEditForm(false);
      setEditingFarm(null);
      // Refresh data
      const farmsRes = await farmAPI.getAll();
      const allFarms = farmsRes.data || [];
      const allMyFarms = allFarms.filter(f => f.farmerId === user?.uuid);
      const myFarmsList = allMyFarms.filter(f => f.status !== 'REJECTED' && f.status !== 'NEEDS_UPDATE');
      const myRejectedFarms = allMyFarms.filter(f => f.status === 'REJECTED' || f.status === 'NEEDS_UPDATE');
      setMyFarms(myFarmsList);
      setRejectedFarms(myRejectedFarms);
      setTimeout(() => setUpdateMessage(''), 5000);
    } catch (error) {
      setUpdateMessage(`Error: ${error.response?.data?.message || error.message}`);
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
        {/* Update Message */}
        {updateMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            updateMessage.includes('Error') 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {updateMessage}
          </div>
        )}

        {/* Edit Form Modal */}
        {showEditForm && editingFarm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Edit Farm</h2>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingFarm(null);
                  }}
                  className="text-slate-600 hover:text-slate-900 text-2xl"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateFarm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">District</label>
                  <select
                    value={editFormData.districtId}
                    onChange={(e) => setEditFormData({ ...editFormData, districtId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.uuid} value={d.uuid}>
                        {d.districtName}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Farm Area (hectares)"
                  type="number"
                  step="0.01"
                  value={editFormData.farmArea}
                  onChange={(e) => setEditFormData({ ...editFormData, farmArea: e.target.value })}
                  required
                />
                <Input
                  label="Elevation (meters)"
                  type="number"
                  step="0.01"
                  value={editFormData.elevation}
                  onChange={(e) => setEditFormData({ ...editFormData, elevation: e.target.value })}
                  required
                />
                <Input
                  label="Planting Year"
                  type="number"
                  value={editFormData.plantingYear}
                  onChange={(e) => setEditFormData({ ...editFormData, plantingYear: e.target.value })}
                  required
                />
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                  >
                    Update Farm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingFarm(null);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-md font-medium hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Card>
          </div>
        )}
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
            {!loading && (myFarms.length > 0) && (
              <Card variant="default" className="p-0 overflow-hidden h-full">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        📍 {verifiedFarms.length > 0 ? 'Your Verified Farms' : 'Your Farms (Pending)'}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        {verifiedFarms.length > 0
                          ? `${verifiedFarms.length} ${verifiedFarms.length === 1 ? 'farm' : 'farms'} with verified geometry`
                          : `${myFarms.length} farm(s) registered (awaiting verification)`
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <MapContainer
                  center={[2.5, 99.5]}
                  zoom={9}
                  style={{ height: '500px', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {(verifiedFarms.length > 0 ? verifiedFarms : myFarms).map((farm) => {
                    try {
                      console.log(`🗺️ Processing farm for map: ${farm.uuid}`);

                      // For verified farms, use verifiedGeometry
                      if (verifiedFarms.length > 0) {
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
                                  <h3 class="font-bold text-slate-900">${farm.district?.districtName}</h3>
                                  <p class="text-sm text-slate-600">${farm.farmer?.name}</p>
                                  <div class="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                                    <span>📐 ${farm.farmArea} ha</span>
                                    <span>✓ Verified</span>
                                  </div>
                                </div>
                              `);
                            }}
                          />
                        );
                      } else {
                        // For all farms (pending), use inputCoordinates
                        const coords = farm.inputCoordinates ?
                          (() => {
                            try {
                              const geom = JSON.parse(farm.inputCoordinates);
                              if (geom.type === 'Point' && geom.coordinates) {
                                return [geom.coordinates[1], geom.coordinates[0]];
                              }
                            } catch (e) { }
                            return null;
                          })()
                          : null;

                        if (!coords) {
                          console.warn(`   ⚠️ No coordinates for farm ${farm.uuid}`);
                          return null;
                        }

                        return (
                          <Marker key={farm.uuid} position={coords}>
                            <Popup>
                              <div className="p-3 min-w-48">
                                <h3 className="font-bold text-slate-900">{farm.district?.districtName}</h3>
                                <p className="text-sm text-slate-600">{farm.farmer?.name}</p>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                                  <span>📐 {farm.farmArea} ha</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${farm.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {farm.status?.replace(/_/g, ' ') || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
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
                      <div className={`w-4 h-3 rounded-sm border-2 ${verifiedFarms.length > 0
                        ? 'bg-green-500 bg-opacity-50 border-green-600'
                        : 'bg-yellow-500 bg-opacity-50 border-yellow-600'
                        }`}></div>
                      <span className="text-slate-600">
                        {verifiedFarms.length > 0 ? 'Verified Farms (QGIS Geometry)' : 'All Farms (Pending - Input Coordinates)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">💾 Data from {verifiedFarms.length > 0 ? 'verified_geometry' : 'input_coordinates'} field</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            {!loading && myFarms.length === 0 && (
              <Card variant="default" className="p-12 text-center">
                <p className="text-4xl mb-4">🌾</p>
                <p className="text-slate-600 mb-2 font-medium">No farms registered yet</p>
                <p className="text-sm text-slate-600">Your farms will appear on the map once you register them</p>
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

        {/* Rejected Farms Section */}
        {rejectedFarms.length > 0 && (
          <div className="mb-6">
            <Card variant="default" className="border-red-200 bg-red-50">
              <div className="border-b border-red-200 pb-4 mb-4">
                <h2 className="text-lg font-bold text-red-900">⚠️ Farms Requiring Update</h2>
                <p className="text-sm text-red-700 mt-1">These farms were rejected and need to be updated</p>
              </div>
              <div className="space-y-3">
                {rejectedFarms.map((farm) => (
                  <div
                    key={farm.uuid}
                    className="p-4 bg-white rounded-lg border border-red-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">{farm.district?.districtName}</p>
                        <p className="text-xs text-red-600 mt-1">Please update your farm information</p>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                        {farm.status === 'NEEDS_UPDATE' ? 'Needs Update' : 'Rejected'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-red-200">
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
                    {farm.status === 'NEEDS_UPDATE' && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <button
                          onClick={() => handleEditFarm(farm)}
                          className="w-full px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
                        >
                          ✏️ Edit Farm
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

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
                    onClick={() => handleFarmClick(farm)}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer hover:shadow-md"
                    style={selectedFarmId === farm.uuid ? { borderColor: '#3b82f6', backgroundColor: '#eff6ff' } : {}}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">{farm.district?.districtName}</p>
                        <p className="text-xs text-slate-600 mt-1">🔗 Click to view on map</p>
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
