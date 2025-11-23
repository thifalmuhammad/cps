import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { farmAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';

export default function FarmVerificationPage() {
  const [pendingFarms, setPendingFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [geometryInput, setGeometryInput] = useState('');

  useEffect(() => {
    fetchPendingFarms();
  }, []);

  const fetchPendingFarms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/farms/pending');
      const data = await response.json();
      
      if (data.success) {
        setPendingFarms(data.data);
      }
    } catch (error) {
      console.error('Error fetching pending farms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFarm = async () => {
    if (!selectedFarm || !geometryInput.trim()) return;

    try {
      setVerifying(true);
      const response = await fetch(`/api/farms/${selectedFarm.uuid}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verifiedGeometry: geometryInput.trim(),
          farmArea: selectedFarm.farmArea
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Farm verified successfully!');
        setSelectedFarm(null);
        setGeometryInput('');
        fetchPendingFarms();
      } else {
        alert('Error verifying farm: ' + data.message);
      }
    } catch (error) {
      console.error('Error verifying farm:', error);
      alert('Error verifying farm');
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectFarm = async (farmUuid, reason) => {
    try {
      const response = await fetch(`/api/farms/${farmUuid}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Farm rejected');
        fetchPendingFarms();
      } else {
        alert('Error rejecting farm: ' + data.message);
      }
    } catch (error) {
      console.error('Error rejecting farm:', error);
      alert('Error rejecting farm');
    }
  };

  const parseInputCoordinates = (coordinates) => {
    try {
      const geom = JSON.parse(coordinates);
      if (geom.type === 'Point' && geom.coordinates) {
        return [geom.coordinates[1], geom.coordinates[0]];
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white">
        <div className="px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Farm Verification</h1>
              <p className="text-sm text-slate-600 mt-1">
                Verify and map farmer registrations using QGIS data
              </p>
            </div>
            <Button onClick={fetchPendingFarms} variant="outline">
              🔄 Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Farms List */}
          <div>
            <Card className="p-0">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Pending Verification ({pendingFarms.length})
                </h2>
                
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                        <div className="h-5 bg-slate-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : pendingFarms.length > 0 ? (
                  <div className="space-y-3">
                    {pendingFarms.map((farm) => (
                      <div
                        key={farm.uuid}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedFarm?.uuid === farm.uuid
                            ? 'bg-slate-200'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                        onClick={() => setSelectedFarm(farm)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900">
                              {farm.farmName || 'Unnamed Farm'}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                              Farmer: {farm.farmer.name}
                            </p>
                            <p className="text-sm text-slate-600">
                              District: {farm.district.districtName}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                              <span>📐 {farm.farmArea} ha</span>
                              <span>⛰️ {farm.elevation}m</span>
                              <span>📅 {farm.plantingYear}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge variant="pending">Pending</Badge>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                const reason = prompt('Reason for rejection:');
                                if (reason) {
                                  handleRejectFarm(farm.uuid, reason);
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-center py-8">
                    No pending farms for verification
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Verification Panel */}
          <div>
            {selectedFarm ? (
              <Card className="p-0">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Verify: {selectedFarm.farmName || 'Unnamed Farm'}
                  </h2>
                  
                  {/* Farm Details */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Farmer:</span>
                        <p>{selectedFarm.farmer.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>
                        <p>{selectedFarm.farmer.email}</p>
                      </div>
                      <div>
                        <span className="font-medium">District:</span>
                        <p>{selectedFarm.district.districtName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Area:</span>
                        <p>{selectedFarm.farmArea} hectares</p>
                      </div>
                    </div>
                  </div>

                  {/* QGIS Geometry Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      QGIS Polygon Geometry (GeoJSON)
                    </label>
                    <textarea
                      value={geometryInput}
                      onChange={(e) => setGeometryInput(e.target.value)}
                      placeholder='{"type":"Polygon","coordinates":[[[lng,lat],[lng,lat],...]]}'
                      className="w-full h-32 px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Paste the GeoJSON polygon coordinates from QGIS export
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleVerifyFarm}
                      disabled={!geometryInput.trim() || verifying}
                      className="flex-1"
                    >
                      {verifying ? 'Verifying...' : '✓ Verify Farm'}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedFarm(null);
                        setGeometryInput('');
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-0">
                <div className="p-6 text-center">
                  <div className="text-slate-400 mb-4">
                    <span className="text-4xl">🗺️</span>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Select a Farm to Verify
                  </h3>
                  <p className="text-sm text-slate-600">
                    Choose a pending farm from the list to start the verification process
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}