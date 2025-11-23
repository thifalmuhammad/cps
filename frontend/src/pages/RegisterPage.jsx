import React, { useState } from 'react';
import { userAPI } from '../services/api';
import Input from '../components/Input';
import Card from '../components/Card';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false,
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await userAPI.register(formData);
      if (response.success) {
        setMessage('User registered successfully!');
        setFormData({ name: '', email: '', password: '', isAdmin: false });
      } else {
        setMessage(`Error: ${response.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Register User</h1>
        <p className="text-slate-600 text-sm">Create a new user account</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-8">
        <Card>
          {message && (
            <div className={`mb-4 p-4 rounded-lg border ${message.includes('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleChange}
                  className="mr-2 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-900">Register as Admin</span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
