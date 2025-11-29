import React, { useState } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';

export default function LoginPage() {
  const { login } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false,
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
    setMessage('');
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value,
    });
    setMessage('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await userAPI.getAll();
      const users = res.data || [];
      const user = users.find(u => u.email === loginData.email);

      if (user) {
        login(user);
        setMessageType('success');
        setMessage('✅ Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        setMessageType('error');
        setMessage('❌ Invalid email or password');
      }
    } catch (error) {
      setMessageType('error');
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate inputs
      if (!registerData.name || !registerData.email || !registerData.password) {
        setMessageType('error');
        setMessage('❌ Please fill in all fields');
        setLoading(false);
        return;
      }

      if (registerData.password.length < 6) {
        setMessageType('error');
        setMessage('❌ Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const response = await userAPI.register(registerData);

      if (response.success) {
        setMessageType('success');
        setMessage('✅ Registration successful! You can now login.');
        setTimeout(() => {
          setIsRegisterMode(false);
          setRegisterData({ name: '', email: '', password: '', isAdmin: false });
          setLoginData({ email: registerData.email, password: '' });
          setMessage('');
        }, 2000);
      } else {
        setMessageType('error');
        setMessage(`❌ Error: ${response.message}`);
      }
    } catch (error) {
      setMessageType('error');
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card variant="elevated" className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-3xl font-bold text-slate-900">CPS</h1>
          <p className="text-slate-600 mt-2">Coffee Production System</p>
          <p className="text-sm text-slate-500 mt-1">Coffee Farm Management Platform</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setIsRegisterMode(false);
              setMessage('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${!isRegisterMode
              ? 'bg-white text-blue-600 shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsRegisterMode(true);
              setMessage('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${isRegisterMode
              ? 'bg-white text-blue-600 shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
          >
            Sign Up
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-3 rounded-md text-sm font-medium ${messageType === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {message}
          </div>
        )}

        {/* Login Form */}
        {!isRegisterMode ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                name="email"
                type="email"
                value={loginData.email}
                onChange={handleLoginChange}
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
                value={loginData.password}
                onChange={handleLoginChange}
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
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input
                name="name"
                type="text"
                value={registerData.name}
                onChange={handleRegisterChange}
                placeholder="Your name"
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                name="email"
                type="email"
                value={registerData.email}
                onChange={handleRegisterChange}
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
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="••••••••"
                required
                className="input"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Demo Credentials - only show in login mode */}
        {!isRegisterMode && (
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
        )}

        {/* Registration Info */}
        {isRegisterMode && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-600 text-center">
              🌾 Farmer? Create your account to register your coffee farms and track productivity.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
