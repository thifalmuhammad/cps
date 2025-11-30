import React, { useState } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';

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
  const [showPassword, setShowPassword] = useState(false);

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
    setMessageType('');

    // Client-side validation
    if (!loginData.email || !loginData.password) {
      setMessageType('error');
      setMessage('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      setMessageType('error');
      setMessage('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await userAPI.login(loginData);

      if (response && response.success && response.data) {
        login(response.data);
        setMessageType('success');
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        setMessageType('error');
        setMessage(response?.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessageType('error');
      const errorMessage = error.message || 'Login failed';
      
      // Provide more specific error messages
      if (errorMessage.includes('timeout')) {
        setMessage('Connection timeout. Please check your internet connection.');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setMessage('Cannot connect to server. Please make sure the backend is running.');
      } else if (errorMessage.includes('401') || errorMessage.includes('Invalid')) {
        setMessage('Invalid email or password');
      } else {
        setMessage(errorMessage);
      }
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
        setMessage('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (registerData.password.length < 6) {
        setMessageType('error');
        setMessage('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const response = await userAPI.register(registerData);

      if (response.success) {
        setMessageType('success');
        setMessage('Registration successful! You can now login.');
        setTimeout(() => {
          setIsRegisterMode(false);
          setRegisterData({ name: '', email: '', password: '', isAdmin: false });
          setLoginData({ email: registerData.email, password: '' });
          setMessage('');
        }, 2000);
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-slate-900">CPS</CardTitle>
            <CardDescription className="text-slate-600">
              Coffee Production System
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setMessage('');
                  setShowPassword(false);
                }}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                  !isRegisterMode
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsRegisterMode(true);
                  setMessage('');
                  setShowPassword(false);
                }}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                  isRegisterMode
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Sign Up
              </button>
            </div>

            {/* Message Alert */}
            {message && (
              <div
                className={cn(
                  "mb-4 p-3 rounded-md text-sm",
                  messageType === 'success'
                    ? "bg-slate-100 text-slate-900 border border-slate-200"
                    : "bg-red-50 text-red-900 border border-red-200"
                )}
              >
                {message}
              </div>
            )}

            {/* Login Form */}
            {!isRegisterMode ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-900">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="name@example.com"
                    required
                    className="border-slate-200 focus:border-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-900">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={handleLoginChange}
                      placeholder="••••••••"
                      required
                      className="border-slate-200 focus:border-slate-900 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-900">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    placeholder="Your name"
                    required
                    className="border-slate-200 focus:border-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-email" className="text-sm font-medium text-slate-900">
                    Email
                  </label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="name@example.com"
                    required
                    className="border-slate-200 focus:border-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-sm font-medium text-slate-900">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      placeholder="••••••••"
                      required
                      className="border-slate-200 focus:border-slate-900 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Minimum 6 characters</p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
