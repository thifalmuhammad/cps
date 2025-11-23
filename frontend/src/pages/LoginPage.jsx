import React, { useState } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await userAPI.getAll();
      const users = res.data || [];
      const user = users.find(u => u.email === formData.email);
      
      if (user) {
        login(user);
        setMessageType('success');
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        setMessageType('error');
        setMessage('Invalid email or password');
      }
    } catch (error) {
      setMessageType('error');
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card variant="elevated" className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-3xl font-bold text-slate-900">CPS</h1>
          <p className="text-slate-600 mt-2">Coffee Production System</p>
          <p className="text-sm text-slate-500 mt-1">Coffee Farm Management Platform</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-3 rounded-md text-sm font-medium ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Email address</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
              className="input"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wider">Demo Accounts</p>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <p className="text-slate-700 font-medium mb-1">Administrator</p>
              <code className="text-slate-600 font-mono">admin@example.com</code>
            </div>
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <p className="text-slate-700 font-medium mb-1">Farmer</p>
              <code className="text-slate-600 font-mono">farmer@example.com</code>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
