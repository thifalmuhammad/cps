import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON as GeoJSONLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Card from '../components/Card';
import Badge from '../components/Badge';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapViewPage() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [center] = useState([2.5, 99.5]); // Center of Aceh (default for Indonesia farms)
  const [zoom] = useState(9);

  useEffect(() => {
    fetchVerifiedFarms();
  }, []);

  const fetchVerifiedFarms = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching verified farms from:', `${API_BASE_URL}/farms/verified`);

      const response = await fetch(`${API_BASE_URL}/farms/verified`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log('✅ Verified farms received:', data);

      if (data.success) {
        setFarms(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch verified farms');
      }
    } catch (error) {
      console.error('❌ Error fetching verified farms:', error);
      setError('Failed to connect to server: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Parse geometry and convert to GeoJSON for display
  const parseGeometry = (geomString) => {
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

  // Get centroid from geometry for clustering/default position
  const getCentroid = (geometry) => {
    try {
      if (!geometry) return null;

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0];
        const latSum = coords.reduce((sum, coord) => sum + coord[1], 0);
        const lngSum = coords.reduce((sum, coord) => sum + coord[0], 0);
        return [latSum / coords.length, lngSum / coords.length];
      }

      if (geometry.type === 'MultiPolygon') {
        const allCoords = geometry.coordinates.flat(2);
        const latSum = allCoords.reduce((sum, coord) => sum + coord[1], 0);
        const lngSum = allCoords.reduce((sum, coord) => sum + coord[0], 0);
        return [latSum / allCoords.length, lngSum / allCoords.length];
      }
    } catch (e) {
      console.error('Error calculating centroid:', e);
    }
    return null;
  };

  const onEachFeature = (feature, layer) => {
    const farm = farms.find(f => {
      try {
        const geom = parseGeometry(f.verifiedGeometry);
        if (geom.type === 'FeatureCollection') {
          return geom.features.some(feat =>
            JSON.stringify(feat.geometry) === JSON.stringify(feature.geometry)
          );
        }
        return JSON.stringify(geom) === JSON.stringify(feature.geometry);
      } catch (e) {
        return false;
      }
    });

    if (farm) {
      layer.bindPopup(`
        <div class="p-3">
          <h3 class="font-bold text-slate-900">${farm.farmer?.name || 'Unknown Farmer'}</h3>
          <p class="text-sm text-slate-600">${farm.district?.districtName || 'Unknown District'}</p>
          <p class="text-sm text-slate-600">Area: ${farm.farmArea} ha</p>
          <p class="text-sm text-slate-600">Status: <span class="font-semibold">VERIFIED ✓</span></p>
        </div>
      `);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">🗺️ Verified Farms Map</h1>
            <p className="text-slate-600 text-sm">View verified farm locations with QGIS polygon data</p>
          </div>
          <button
            onClick={fetchVerifiedFarms}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          ❌ {error}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pb-8">
        {loading ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-slate-600 mb-4">Loading verified farms...</p>
              <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full"></div>
            </div>
          </Card>
        ) : farms.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="p-0 overflow-hidden">
                <MapContainer
                  center={center}
                  zoom={zoom}
                  style={{ height: '600px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {farms.map((farm) => {
                    try {
                      const geometry = parseGeometry(farm.verifiedGeometry);
                      if (!geometry) return null;

                      // Convert FeatureCollection to simple geometry if needed
                      let displayGeometry = geometry;
                      if (geometry.type === 'FeatureCollection' && geometry.features?.length > 0) {
                        displayGeometry = geometry.features[0].geometry;
                      }

                      return (
                        <GeoJSONLayer
                          key={farm.uuid}
                          data={displayGeometry}
                          style={{
                            color: '#3b82f6',
                            weight: 2,
                            opacity: 0.8,
                            fillColor: '#93c5fd',
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
                      console.error('Error rendering farm geometry:', e);
                      return null;
                    }
                  })}
                </MapContainer>
              </Card>
            </div>

            {/* Farm List */}
            <div>
              <Card>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Verified Farms ({farms.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {farms.map((farm) => (
                    <div
                      key={farm.uuid}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedFarm?.uuid === farm.uuid
                          ? 'bg-blue-50 border-blue-300 shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100 border-transparent hover:border-slate-200'
                        }`}
                      onClick={() => setSelectedFarm(farm)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">
                            {farm.farmer?.name || 'Unknown Farmer'}
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            📍 {farm.district?.districtName}
                          </p>
                          <div className="flex gap-2 mt-2 text-xs text-slate-500">
                            <span>📐 {farm.farmArea} ha</span>
                            <span>📅 {farm.createdAt ? new Date(farm.createdAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                        <Badge variant="success">Verified ✓</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <div className="text-center py-16">
              <div className="text-6xl mb-4 text-slate-300">🗺️</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Verified Farms Yet</h3>
              <p className="text-slate-600">
                Verified farms will appear here once farm verification is complete
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
