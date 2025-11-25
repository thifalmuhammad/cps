import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function FarmVerificationPage() {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    const [pendingFarms, setPendingFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [geometryInput, setGeometryInput] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        fetchPendingFarms();
        const interval = setInterval(fetchPendingFarms, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchPendingFarms = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Fetching pending farms from:', `${API_BASE_URL}/farms/pending`);

            const response = await fetch(`${API_BASE_URL}/farms/pending`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response body:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            console.log('✅ Data received:', data);

            if (data.success) {
                setPendingFarms(data.data || []);
                if (data.count === 0) {
                    setSuccessMessage('No pending farms for verification');
                }
            } else {
                setError(data.message || 'Failed to fetch pending farms');
            }
        } catch (error) {
            console.error('❌ Error fetching pending farms:', error);
            setError('Failed to connect to server: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const validateGeoJSON = (geojsonString) => {
        try {
            const geojson = JSON.parse(geojsonString);

            // Handle FeatureCollection
            if (geojson.type === 'FeatureCollection') {
                if (!Array.isArray(geojson.features) || geojson.features.length === 0) {
                    return { valid: false, error: 'FeatureCollection must have at least one feature' };
                }
                const firstFeature = geojson.features[0];
                if (!firstFeature.geometry) {
                    return { valid: false, error: 'Features must have geometry' };
                }
                if (!firstFeature.geometry.type || !firstFeature.geometry.coordinates) {
                    return { valid: false, error: 'Geometry must have "type" and "coordinates"' };
                }
                return { valid: true };
            }

            // Handle Feature
            if (geojson.type === 'Feature') {
                if (!geojson.geometry) {
                    return { valid: false, error: 'Feature must have a "geometry" property' };
                }
                const geom = geojson.geometry;
                if (!geom.type || !geom.coordinates) {
                    return { valid: false, error: 'Geometry must have "type" and "coordinates" properties' };
                }
                return { valid: true };
            }

            // Handle direct geometry
            if (!geojson.type) {
                return { valid: false, error: 'GeoJSON must have a "type" property' };
            }
            if (!geojson.coordinates) {
                return { valid: false, error: 'GeoJSON must have a "coordinates" property' };
            }

            return { valid: true };
        } catch (e) {
            return { valid: false, error: 'Invalid JSON format: ' + e.message };
        }
    };

    const handleVerifyFarm = async () => {
        if (!selectedFarm || !geometryInput.trim()) {
            setError('Please select a farm and enter geometry');
            return;
        }

        const validation = validateGeoJSON(geometryInput);
        if (!validation.valid) {
            setError('Invalid GeoJSON: ' + validation.error);
            return;
        }

        try {
            setVerifying(true);
            setError(null);

            console.log('🔍 Verifying farm:', selectedFarm.uuid);

            const response = await fetch(`${API_BASE_URL}/farms/${selectedFarm.uuid}/verify`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    verifiedGeometry: geometryInput.trim(),
                    farmArea: selectedFarm.farmArea
                })
            });

            console.log('📊 Verify response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Verify error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            console.log('✅ Verify response:', data);

            if (data.success) {
                setSuccessMessage('Farm verified successfully!');
                setSelectedFarm(null);
                setGeometryInput('');
                setTimeout(() => {
                    setSuccessMessage(null);
                    fetchPendingFarms();
                }, 2000);
            } else {
                setError('Error verifying farm: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error verifying farm:', error);
            setError('Error verifying farm: ' + error.message);
        } finally {
            setVerifying(false);
        }
    };

    const handleRejectFarm = async (farmUuid) => {
        const reason = prompt('Enter reason for rejection:');
        if (!reason || reason.trim().length === 0) {
            return;
        }

        try {
            setRejecting(true);
            setError(null);

            console.log('🔍 Rejecting farm:', farmUuid, 'with reason:', reason);

            const response = await fetch(`${API_BASE_URL}/farms/${farmUuid}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: reason.trim() })
            });

            console.log('📊 Reject response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Reject error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            console.log('✅ Reject response:', data);

            if (data.success) {
                setSuccessMessage('Farm rejected successfully');
                setSelectedFarm(null);
                setGeometryInput('');
                setTimeout(() => {
                    setSuccessMessage(null);
                    fetchPendingFarms();
                }, 2000);
            } else {
                setError('Error rejecting farm: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error rejecting farm:', error);
            setError('Error rejecting farm: ' + error.message);
        } finally {
            setRejecting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Farm Verification</h1>
                            <p className="text-sm text-slate-600 mt-1">
                                Verify and map farmer registrations using QGIS data
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={fetchPendingFarms}
                                disabled={loading}
                                variant="outline"
                            >
                                {loading ? '⏳ Loading...' : '🔄 Refresh'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert Messages */}
            {error && (
                <div className="mx-8 mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    ❌ {error}
                </div>
            )}
            {successMessage && (
                <div className="mx-8 mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                    ✅ {successMessage}
                </div>
            )}

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
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                        {pendingFarms.map((farm) => (
                                            <div
                                                key={farm.uuid}
                                                className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${selectedFarm?.uuid === farm.uuid
                                                    ? 'bg-blue-50 border-blue-300 shadow-md'
                                                    : 'bg-slate-50 hover:bg-slate-100 border-transparent hover:border-slate-200'
                                                    }`}
                                                onClick={() => {
                                                    setSelectedFarm(farm);
                                                    setGeometryInput('');
                                                    setError(null);
                                                }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-900">
                                                            {farm.cropType || 'Unknown Crop'}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            👨‍🌾 {farm.farmer.name}
                                                        </p>
                                                        <p className="text-sm text-slate-600">
                                                            📍 {farm.district.districtName}
                                                        </p>
                                                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                                            <span>📐 {farm.farmArea} ha</span>
                                                            <span>⛰️ {farm.elevation}m</span>
                                                            <span>📅 {farm.plantingYear}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Badge variant="pending">Pending</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-6xl mb-4">✓</p>
                                        <p className="text-slate-600">
                                            No pending farms for verification
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Verification Panel */}
                    <div>
                        {selectedFarm ? (
                            <Card className="p-0 sticky top-8">
                                <div className="p-6">
                                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                        📋 Verify Farm
                                    </h2>

                                    {/* Farm Details */}
                                    <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-3 text-sm">
                                        <div className="border-b border-slate-200 pb-3">
                                            <span className="font-medium text-slate-700">Farmer:</span>
                                            <p className="text-slate-900">{selectedFarm.farmer.name}</p>
                                            <p className="text-slate-600 text-xs">{selectedFarm.farmer.email}</p>
                                        </div>
                                        <div className="border-b border-slate-200 pb-3">
                                            <span className="font-medium text-slate-700">Location:</span>
                                            <p className="text-slate-900">{selectedFarm.district.districtName}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pb-3">
                                            <div>
                                                <span className="font-medium text-slate-700">Area:</span>
                                                <p className="text-slate-900">{selectedFarm.farmArea} ha</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-slate-700">Elevation:</span>
                                                <p className="text-slate-900">{selectedFarm.elevation}m</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="font-medium text-slate-700">Year:</span>
                                                <p className="text-slate-900">{selectedFarm.plantingYear}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-slate-700">Crop Type:</span>
                                                <p className="text-slate-900">{selectedFarm.cropType || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QGIS Geometry Input */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            🗺️ QGIS Polygon Geometry (GeoJSON)
                                        </label>
                                        <textarea
                                            value={geometryInput}
                                            onChange={(e) => {
                                                setGeometryInput(e.target.value);
                                                setError(null);
                                            }}
                                            placeholder='{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[...]]} }]}'
                                            className="w-full h-32 px-3 py-2 border border-slate-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-slate-500 mt-2">
                                            💡 Paste GeoJSON from QGIS. Accepted formats:
                                        </p>
                                        <ul className="text-xs text-slate-500 mt-1 ml-2 space-y-1">
                                            <li>✓ FeatureCollection (QGIS default export)</li>
                                            <li>✓ Single Feature with geometry</li>
                                            <li>✓ Direct Polygon/MultiPolygon</li>
                                        </ul>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleVerifyFarm}
                                            disabled={!geometryInput.trim() || verifying || rejecting}
                                            className="flex-1"
                                        >
                                            {verifying ? '⏳ Verifying...' : '✓ Verify Farm'}
                                        </Button>
                                        <Button
                                            onClick={() => handleRejectFarm(selectedFarm.uuid)}
                                            disabled={rejecting || verifying}
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            {rejecting ? '⏳ Rejecting...' : '✕ Reject'}
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setSelectedFarm(null);
                                            setGeometryInput('');
                                            setError(null);
                                        }}
                                        variant="outline"
                                        className="w-full mt-2"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-0">
                                <div className="p-6 text-center">
                                    <div className="text-slate-300 mb-4">
                                        <span className="text-6xl">🗺️</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
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
