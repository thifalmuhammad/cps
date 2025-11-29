import React, { useState, useEffect } from 'react';
import { farmAPI, districtAPI } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';

export default function FarmManagementPage() {
  const [farms, setFarms] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [farmsRes, districtsRes] = await Promise.all([
        farmAPI.getAll(),
        districtAPI.getAll(),
      ]);

      setFarms(farmsRes.data || []);
      setDistricts(districtsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (farm) => {
    setEditingId(farm.uuid);
    setEditData({ ...farm });
    setError(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData = {
        districtId: editData.districtId || editData.district?.uuid,
        farmArea: parseFloat(editData.farmArea),
        elevation: parseFloat(editData.elevation),
        inputCoordinates: editData.inputCoordinates,
        plantingYear: parseInt(editData.plantingYear),
      };

      const response = await farmAPI.update(editingId, updateData);

      if (response.success) {
        setSuccess('Farm updated successfully!');
        setEditingId(null);
        setEditData({});
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to update farm');
      }
    } catch (error) {
      console.error('Error saving farm:', error);
      setError(error.message || 'Failed to save farm');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uuid, farmName) => {
    if (window.confirm(`Are you sure you want to delete farm "${farmName}"? This action cannot be undone.`)) {
      try {
        setError(null);
        const response = await farmAPI.delete(uuid);

        if (response.success) {
          setSuccess('Farm deleted successfully!');
          fetchData();
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(response.message || 'Failed to delete farm');
        }
      } catch (error) {
        console.error('Error deleting farm:', error);
        setError(error.message || 'Failed to delete farm');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_VERIFICATION': return 'warning';
      case 'VERIFIED': return 'success';
      case 'REJECTED': return 'error';
      case 'NEEDS_UPDATE': return 'warning';
      default: return 'secondary';
    }
  };

  const filteredFarms = farms.filter(farm => {
    const matchesSearch =
      farm.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.district?.districtName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || farm.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Farm Management</h1>
          <p className="text-slate-600 text-sm">Manage and edit registered farms</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <Card>
            <div className="text-center py-12">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full"></div>
              <p className="text-slate-600 mt-4">Loading farms...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">🌾 Farm Management</h1>
          <p className="text-slate-600 text-sm">Manage and edit registered farms • Total: {farms.length} farms</p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center justify-between">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-900">✕</button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center justify-between">
            <span>✅ {success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-900">✕</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search by farmer name or district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="🔍"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="NEEDS_UPDATE">Needs Update</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Farms List */}
        {filteredFarms.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">
                {farms.length === 0 ? '🚜 No farms registered yet' : '🔍 No farms match your search'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFarms.map((farm) => (
              <Card key={farm.uuid} className="p-0 overflow-hidden hover:shadow-md transition-shadow">
                {editingId === farm.uuid ? (
                  // Edit Mode
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-900">✏️ Edit Farm Details</h3>
                      <span className="text-xs text-slate-500">UUID: {farm.uuid}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Farmer Name (Read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Farmer Name
                        </label>
                        <input
                          type="text"
                          value={farm.farmer?.name || 'N/A'}
                          disabled
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                        />
                      </div>

                      {/* District */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          District *
                        </label>
                        <select
                          name="districtId"
                          value={editData.districtId || editData.district?.uuid || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                          required
                        >
                          <option value="">Select district</option>
                          {districts.map((district) => (
                            <option key={district.uuid} value={district.uuid}>
                              {district.districtName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Farm Area */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Farm Area (hectares) *
                        </label>
                        <input
                          type="number"
                          name="farmArea"
                          step="0.01"
                          value={editData.farmArea}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="e.g., 5.5"
                          required
                        />
                      </div>

                      {/* Elevation */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Elevation (meters) *
                        </label>
                        <input
                          type="number"
                          name="elevation"
                          step="0.01"
                          value={editData.elevation}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="e.g., 1200"
                          required
                        />
                      </div>

                      {/* Planting Year */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Planting Year *
                        </label>
                        <input
                          type="number"
                          name="plantingYear"
                          min="1900"
                          max={new Date().getFullYear()}
                          value={editData.plantingYear}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      {/* Status (Read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Status
                        </label>
                        <input
                          type="text"
                          value={editData.status || 'N/A'}
                          disabled
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                        />
                      </div>
                    </div>

                    {/* Input Coordinates */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Location Coordinates (GeoJSON)
                      </label>
                      <textarea
                        name="inputCoordinates"
                        value={editData.inputCoordinates || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-xs"
                        rows="4"
                        placeholder='{"type":"Point","coordinates":[106.8456,-6.2088]}'
                      />
                      <p className="text-xs text-slate-500 mt-1">Format: GeoJSON Point geometry</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-slate-200">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1"
                      >
                        {saving ? '💾 Saving...' : '💾 Save Changes'}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="flex-1"
                      >
                        ✕ Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-4 border-b border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {farm.farmer?.name || 'Unknown Farmer'}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            📍 {farm.district?.districtName} • 📐 {farm.farmArea} ha
                          </p>
                        </div>
                        <Badge variant={getStatusColor(farm.status)}>
                          {farm.status?.replace(/_/g, ' ') || 'N/A'}
                        </Badge>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Farmer Email */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Farmer Email
                          </p>
                          <p className="text-sm text-slate-900">{farm.farmer?.email || 'N/A'}</p>
                        </div>

                        {/* District */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            District
                          </p>
                          <p className="text-sm text-slate-900">
                            {farm.district?.districtName || 'N/A'}
                          </p>
                        </div>

                        {/* Farm Area */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Farm Area
                          </p>
                          <p className="text-sm text-slate-900">{farm.farmArea} ha</p>
                        </div>

                        {/* Elevation */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Elevation
                          </p>
                          <p className="text-sm text-slate-900">{farm.elevation} m</p>
                        </div>

                        {/* Planting Year */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Planting Year
                          </p>
                          <p className="text-sm text-slate-900">{farm.plantingYear}</p>
                        </div>

                        {/* Status */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Status
                          </p>
                          <p className="text-sm text-slate-900">
                            {farm.status?.replace(/_/g, ' ') || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Coordinates */}
                      {farm.inputCoordinates && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                            Location Coordinates
                          </p>
                          <code className="text-xs text-slate-700 break-all block font-mono">
                            {farm.inputCoordinates}
                          </code>
                        </div>
                      )}

                      {/* Verified Geometry */}
                      {farm.verifiedGeometry && (
                        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-2">
                            ✓ Verified Geometry (QGIS)
                          </p>
                          <code className="text-xs text-green-800 break-all block font-mono line-clamp-3">
                            {farm.verifiedGeometry.substring(0, 200)}...
                          </code>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500 border-t border-slate-200 pt-4">
                        <div>
                          <span className="font-semibold">Created:</span> {new Date(farm.createdAt).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-semibold">Updated:</span> {new Date(farm.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 p-6 bg-slate-50 border-t border-slate-200">
                      <Button
                        onClick={() => handleEdit(farm)}
                        className="flex-1"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(farm.uuid, farm.farmer?.name || 'Farm')}
                        variant="danger"
                        className="flex-1"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
