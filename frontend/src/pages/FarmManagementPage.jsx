import React, { useState, useEffect } from 'react';
import { farmAPI } from '../services/api';
import Card from '../components/Card';

export default function FarmManagementPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchFarms();
  }, []);

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

  const handleEdit = (farm) => {
    setEditingId(farm.uuid);
    setEditData(farm);
  };

  const handleSave = async () => {
    try {
      await farmAPI.update(editingId, editData);
      setEditingId(null);
      fetchFarms();
      alert('Farm updated successfully!');
    } catch (error) {
      alert(`Error updating farm: ${error.message}`);
    }
  };

  const handleDelete = async (uuid) => {
    if (window.confirm('Are you sure you want to delete this farm?')) {
      try {
        await farmAPI.delete(uuid);
        fetchFarms();
        alert('Farm deleted successfully!');
      } catch (error) {
        alert(`Error deleting farm: ${error.message}`);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: name === 'farmArea' || name === 'elevation' ? parseFloat(value) : value,
    });
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Farm Management</h1>
        <p className="text-slate-600 text-sm">Manage and verify registered farms</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="space-y-4">
          {farms.length === 0 ? (
            <Card>
              <p className="text-center text-slate-600">No farms registered yet</p>
            </Card>
          ) : (
            farms.map((farm) => (
              <Card key={farm.uuid} className="p-4">
                {editingId === farm.uuid ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="farmArea"
                      value={editData.farmArea}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Farm Area"
                    />
                    <input
                      type="text"
                      name="elevation"
                      value={editData.elevation}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Elevation"
                    />
                    <input
                      type="text"
                      name="geomCoordinates"
                      value={editData.geomCoordinates}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Coordinates"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="btn-primary">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-600">District</p>
                        <p className="font-semibold text-slate-900">{farm.district?.districtName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Farm Area</p>
                        <p className="font-semibold text-slate-900">{farm.farmArea} ha</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Elevation</p>
                        <p className="font-semibold text-slate-900">{farm.elevation}m</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Planting Year</p>
                        <p className="font-semibold text-slate-900">{farm.plantingYear}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Coordinates: {farm.geomCoordinates}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(farm)} className="btn-primary">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(farm.uuid)} className="btn-danger">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
