import React, { useState, useEffect } from 'react';
import { districtAPI } from '../services/api';
import Input from '../components/Input';
import Card from '../components/Card';

export default function DistrictManagementPage() {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    districtCode: '',
    districtName: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      const res = await districtAPI.getAll();
      setDistricts(res.data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await districtAPI.update(editingId, formData);
        setMessage('District updated successfully!');
      } else {
        await districtAPI.create(formData);
        setMessage('District created successfully!');
      }
      setFormData({ districtCode: '', districtName: '' });
      setEditingId(null);
      setShowForm(false);
      fetchDistricts();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleEdit = (district) => {
    setEditingId(district.uuid);
    setFormData({
      districtCode: district.districtCode,
      districtName: district.districtName,
    });
    setShowForm(true);
  };

  const handleDelete = async (uuid) => {
    if (window.confirm('Are you sure?')) {
      try {
        await districtAPI.delete(uuid);
        setMessage('District deleted successfully!');
        fetchDistricts();
      } catch (error) {
        setMessage(`Error: ${error.message}`);
      }
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">District Management</h1>
        <p className="text-slate-600 text-sm">Manage farm districts/locations</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        {message && (
          <div className={`mb-4 p-4 rounded-lg border ${message.includes('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="mb-6">
          <button 
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ districtCode: '', districtName: '' });
            }}
            className={`${showForm ? 'btn-secondary' : 'btn-primary'}`}
          >
            {showForm ? 'Cancel' : '+ Add New District'}
          </button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {editingId ? 'Edit District' : 'New District'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="District Code"
                name="districtCode"
                value={formData.districtCode}
                onChange={handleInputChange}
                placeholder="e.g., KEC001"
                required
              />
              <Input
                label="District Name"
                name="districtName"
                value={formData.districtName}
                onChange={handleInputChange}
                placeholder="e.g., Kecamatan Cisarua"
                required
              />
              <button type="submit" className="w-full btn-primary">
                {editingId ? 'Update District' : 'Create District'}
              </button>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {districts.map((district) => (
            <Card key={district.uuid} className="p-4">
              <h3 className="font-bold text-lg text-slate-900 mb-2">{district.districtName}</h3>
              <p className="text-sm text-slate-600 mb-4">Code: {district.districtCode}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(district)}
                  className="flex-1 btn-primary text-sm py-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(district.uuid)}
                  className="flex-1 btn-danger text-sm py-2"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>

        {districts.length === 0 && (
          <Card className="text-center">
            <p className="text-slate-600">No districts yet. Create your first district!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
