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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
    if (window.confirm('Are you sure you want to delete this district?')) {
      try {
        await districtAPI.delete(uuid);
        setMessage('District deleted successfully!');
        fetchDistricts();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        if (errorMsg.includes('referenced') || errorMsg.includes('Cannot delete')) {
          setMessage('⚠️ Cannot delete this district! It is currently being used by one or more farms. Please remove or reassign those farms first.');
        } else {
          setMessage(`Error: ${errorMsg}`);
        }
        setTimeout(() => setMessage(''), 5000);
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

        <Card className="p-0">
          <div className="overflow-x-auto">
            {districts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-600">No districts yet. Create your first district!</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">District Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">District Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {districts
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((district) => (
                        <tr key={district.uuid} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {district.districtCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {district.districtName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(district)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(district.uuid)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="p-4 bg-slate-50 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Total: {districts.length} district(s)
                    </div>
                    {districts.length > itemsPerPage && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-slate-600">
                          Page {currentPage} of {Math.ceil(districts.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(districts.length / itemsPerPage)))}
                          disabled={currentPage === Math.ceil(districts.length / itemsPerPage)}
                          className="px-3 py-1 text-sm border rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
