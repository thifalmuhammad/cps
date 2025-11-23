import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { farmAPI } from '../services/api';
import Card from '../components/Card';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapViewPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center] = useState([-6.2088, 106.8456]); // Default: Jakarta

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await farmAPI.getAll();
        setFarms(res.data || []);
      } catch (error) {
        console.error('Error fetching farms:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFarms();
  }, []);

  const parseCoordinates = (geomCoordinates) => {
    try {
      const geom = JSON.parse(geomCoordinates);
      if (geom.type === 'Point' && geom.coordinates) {
        return [geom.coordinates[1], geom.coordinates[0]]; // Leaflet uses [lat, lng]
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Farm Mapping</h1>
        <p className="text-slate-600 text-sm">View all registered farms on the map</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        {loading ? (
          <Card>
            <p className="text-center text-slate-600">Loading map data...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="p-0 overflow-hidden">
                <MapContainer
                  center={center}
                  zoom={10}
                  style={{ height: '500px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {farms.map((farm) => {
                    const coords = parseCoordinates(farm.geomCoordinates);
                    return coords ? (
                      <Marker key={farm.uuid} position={coords}>
                        <Popup>
                          <div>
                            <h3 className="font-bold">{farm.district?.districtName}</h3>
                            <p>Area: {farm.farmArea} ha</p>
                            <p>Elevation: {farm.elevation}m</p>
                            <p>Year: {farm.plantingYear}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ) : null;
                  })}
                </MapContainer>
              </Card>
            </div>

            {/* Farm List */}
            <div>
              <Card>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Registered Farms ({farms.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {farms.map((farm) => (
                    <div
                      key={farm.uuid}
                      className="p-3 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <p className="font-semibold text-sm text-slate-900">{farm.district?.districtName}</p>
                      <p className="text-xs text-slate-600">Area: {farm.farmArea} ha</p>
                      <p className="text-xs text-slate-600">Elevation: {farm.elevation}m</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
