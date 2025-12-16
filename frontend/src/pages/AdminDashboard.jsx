import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, GeoJSON as GeoJSONLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RefreshCw, MapPin, Users, Warehouse, TrendingUp, CheckCircle2, AlertCircle, Download } from 'lucide-react';
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
  const [districtBoundaries, setDistrictBoundaries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [center] = useState([-6.2088, 106.8456]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const mapRef = useRef(null);
  const layerRefs = useRef({});

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
      console.log('📊 Verified farms count:', verifiedData.data?.length || 0);

      if (verifiedData.success) {
        console.log('📊 Verified farms count:', verifiedData.data?.length || 0);

        // Debug: if no verified farms, show all farms info
        if (!verifiedData.data || verifiedData.data.length === 0) {
          console.warn('⚠️ No verified farms. All farms in system:');
          allFarmsData.forEach((farm, idx) => {
            console.log(`   ${idx + 1}. ${farm.district?.districtName} - Status: ${farm.status}, HasGeometry: ${!!farm.verifiedGeometry}`);
          });
        }

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
    fetch('/districts.geojson')
      .then(res => res.json())
      .then(data => setDistrictBoundaries(data))
      .catch(err => console.log('District boundaries not loaded:', err));
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

  const handleFarmClick = (farm) => {
    setSelectedFarmId(farm.uuid);
    
    const geometryString = farm.verifiedGeometry || farm.inputCoordinates;
    
    if (!geometryString || !mapRef.current) return;
    
    try {
      const geom = JSON.parse(geometryString);
      let coords = null;
      
      if (farm.verifiedGeometry) {
        let geometry = geom;
        
        if (geom.type === 'FeatureCollection' && geom.features?.[0]) {
          geometry = geom.features[0].geometry;
        } else if (geom.type === 'Feature') {
          geometry = geom.geometry;
        }
        
        let coordinates = geometry.coordinates;
        
        if (geometry.type === 'MultiPolygon') {
          coordinates = coordinates[0];
        }
        
        if (coordinates && coordinates[0] && Array.isArray(coordinates[0])) {
          const ring = coordinates[0];
          const lngs = ring.map(c => c[0]).filter(v => !isNaN(v));
          const lats = ring.map(c => c[1]).filter(v => !isNaN(v));
          
          if (lats.length > 0 && lngs.length > 0) {
            const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
            const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
            coords = [centerLat, centerLng];
          }
        }
      } else {
        if (geom.type === 'Point' && geom.coordinates && geom.coordinates.length === 2) {
          const lng = parseFloat(geom.coordinates[0]);
          const lat = parseFloat(geom.coordinates[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            coords = [lat, lng];
          }
        }
      }
      
      if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
        mapRef.current.setView(coords, 16);
        
        setTimeout(() => {
          const layer = layerRefs.current[farm.uuid];
          if (layer && layer.openPopup) {
            layer.openPopup();
          }
        }, 300);
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
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
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
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
                <AlertCircle className="h-5 w-5 text-red-600" />
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

        {/* Map and Info Cards Grid */}
        {!loading && (verifiedFarms.length > 0 || allFarms.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column: Map + Verified Farms Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map Card */}
              <Card variant="default" className="p-0 overflow-hidden">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-slate-600" />
                        {verifiedFarms.length > 0 ? 'Verified Farms Location' : 'All Farms (Pending Verification)'}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        {verifiedFarms.length > 0
                          ? `${verifiedFarms.length} ${verifiedFarms.length === 1 ? 'farm' : 'farms'} with verified geometry`
                          : `${allFarms.length} farm(s) registered (awaiting verification)`
                        }
                      </p>
                    </div>
                    <Button
                      onClick={() => fetchData(true)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-900 gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Update Map
                    </Button>
                  </div>
                </div>
                <MapContainer
                  center={[2.5, 99.5]}
                  zoom={9}
                  style={{ height: '500px', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  />
                  {districtBoundaries && (
                    <GeoJSONLayer
                      data={districtBoundaries}
                      style={{
                        color: '#ffffff',
                        weight: 2,
                        opacity: 0.6,
                        fillOpacity: 0
                      }}
                      onEachFeature={(feature, layer) => {
                        if (feature.properties?.NAME_3) {
                          const bounds = layer.getBounds();
                          const center = bounds.getCenter();
                          const label = L.marker(center, {
                            icon: L.divIcon({
                              className: 'district-label',
                              html: `<div style="background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; white-space: nowrap; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${feature.properties.NAME_3}</div>`,
                              iconSize: null
                            })
                          });
                          label.addTo(layer._map || window.map);
                        }
                      }}
                    />
                  )}
                  {(verifiedFarms.length > 0 ? verifiedFarms : allFarms).map((farm) => {
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
                              layerRefs.current[farm.uuid] = layer;
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
                          <Marker 
                            key={farm.uuid} 
                            position={coords}
                            ref={(ref) => {
                              if (ref) layerRefs.current[farm.uuid] = ref;
                            }}
                          >
                            <Popup>
                              <div className="p-3 min-w-48">
                                <h3 className="font-bold text-slate-900">{farm.farmer?.name || 'Unknown'}</h3>
                                <p className="text-sm text-slate-600">{farm.district?.districtName}</p>
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

              {/* Verified Farms Card - Below Map */}
              <Card variant="elevated" className="bg-gradient-to-br from-green-50 to-green-100">
                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-green-900">Verified Farms</p>
                      <p className="text-3xl font-bold text-green-900 mt-2">{verifiedFarms.length}</p>
                      <p className="text-xs text-green-700 mt-1">Farms with verified geometry data</p>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-green-200 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7 text-green-700" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Sidebar: Info Cards */}
            <div className="space-y-4">

              {/* Registered Farms Card */}
              <Card variant="elevated">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Farms</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{stats.farms}</p>
                      <p className="text-xs text-slate-500 mt-1">Registered</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-slate-900" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Districts Card */}
              <Card variant="elevated">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Districts</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{stats.districts}</p>
                      <p className="text-xs text-slate-500 mt-1">Coverage</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-slate-900" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Users Card */}
              <Card variant="elevated">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Users</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{stats.users}</p>
                      <p className="text-xs text-slate-500 mt-1">Accounts</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-slate-900" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Productivity Card */}
              <Card variant="elevated">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Productivity</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{stats.productivities}</p>
                      <p className="text-xs text-slate-500 mt-1">Records</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-slate-900" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Warehouses Card */}
              <Card variant="elevated">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Warehouses</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{stats.warehouses}</p>
                      <p className="text-xs text-slate-500 mt-1">Operational</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Warehouse className="h-5 w-5 text-slate-900" />
                    </div>
                  </div>
                </div>
              </Card>


            </div>
          </div>
        )}

        {/* Registered Farms Section */}
        <div className="mt-8">
          <Card variant="default" className="p-0">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-600" />
                Registered Farms
              </h2>
              <p className="text-sm text-slate-600 mt-1">All farms registered by farmers with their verification status</p>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
                  <p className="text-slate-600 mt-4">Loading farms...</p>
                </div>
              ) : allFarms.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-600">No farms registered yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Farmer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">District</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Area (ha)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {allFarms
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((farm) => (
                      <tr 
                        key={farm.uuid} 
                        onClick={() => handleFarmClick(farm)}
                        className="hover:bg-slate-50 cursor-pointer"
                        style={selectedFarmId === farm.uuid ? { backgroundColor: '#eff6ff' } : {}}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{farm.farmer?.name || 'Unknown'}</div>
                          <div className="text-xs text-slate-500">{farm.farmer?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {farm.district?.districtName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {farm.farmArea.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={farm.status === 'VERIFIED' ? 'success' : farm.status === 'PENDING_VERIFICATION' ? 'warning' : 'error'}>
                            {farm.status?.replace(/_/g, ' ') || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(farm.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Total: {allFarms.length} farm(s)
                </div>
                {allFarms.length > itemsPerPage && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-600">
                      Page {currentPage} of {Math.ceil(allFarms.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(allFarms.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(allFarms.length / itemsPerPage)}
                      className="px-3 py-1 text-sm border rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
