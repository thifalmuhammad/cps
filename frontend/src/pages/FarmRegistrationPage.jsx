import React, { useState } from 'react';
import { farmAPI, districtAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Card from '../components/Card';

export default function FarmRegistrationPage() {
  const { user } = useAuth();
  const [districts, setDistricts] = React.useState([]);
  const [formData, setFormData] = useState({
    districtId: '',
    farmArea: '',
    elevation: '',
    inputCoordinates: '',
    plantingYear: new Date().getFullYear(),
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
    const [pendingFarms, setPendingFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPendingFarms = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = farmAPI.pendingFarms();

            if (response.data.success) {
                setPendingFarms(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching pending farms:', err);
            setError('Failed to load pending farms');
        } finally {
            setLoading(false);
        }
    };

  React.useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await districtAPI.getAll();
        setDistricts(res.data || []);
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };
    fetchDistricts();
    fetchPendingFarms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        farmerId: user?.uuid
      };

      const response = await farmAPI.create(dataToSubmit);
      if (response.success) {
        setMessageType('success');
        setMessage('Farm registered successfully! Admin will map your farm soon.');
        setFormData({
          districtId: '',
          farmArea: '',
          elevation: '',
          inputCoordinates: '',
          plantingYear: new Date().getFullYear(),
        });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessageType('error');
        setMessage(`Error: ${response.message}`);
      }
    } catch (error) {
      setMessageType('error');
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Register Your Farm</h1>
        <p className="text-slate-600 text-sm">Add your farm details for admin mapping</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-8">
        <Card variant="default">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Farmer Info Display */}
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Registered Farmer</p>
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-600">{user?.email}</p>
            </div>

            {/* District Selection */}
            <div>
              <label className="label">District *</label>
              <select
                name="districtId"
                value={formData.districtId}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select your district</option>
                {districts.map((district) => (
                  <option key={district.uuid} value={district.uuid}>
                    {district.districtName} ({district.districtCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Farm Area */}
            <Input
              label="Farm Area (hectares) *"
              name="farmArea"
              type="number"
              step="0.01"
              value={formData.farmArea}
              onChange={handleChange}
              placeholder="e.g., 5.5"
              required
            />

            {/* Elevation */}
            <Input
              label="Elevation (meters) *"
              name="elevation"
              type="number"
              step="0.01"
              value={formData.elevation}
              onChange={handleChange}
              placeholder="e.g., 1200"
              required
            />

            {/* Input Coordinates */}
            <Input
              label="Location Coordinates (GeoJSON)"
              name="inputCoordinates"
              type="text"
              value={formData.inputCoordinates}
              onChange={handleChange}
              placeholder='{"type":"Point","coordinates":[106.8456,-6.2088]}'
            />

            {/* Planting Year */}
            <Input
              label="Planting Year *"
              name="plantingYear"
              type="number"
              value={formData.plantingYear}
              onChange={handleChange}
              required
            />

            <button
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-2.5"
            >
              {loading ? 'Registering...' : 'Register Farm'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-3"><strong>Note:</strong></p>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>✓ Your farm will be automatically linked to your account</li>
              <li>✓ Admin will verify and map your farm location</li>
              <li>✓ You can view your farm on the map once mapping is complete</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
