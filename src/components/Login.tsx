import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to sign in';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please register first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 transform transition-all duration-300 hover:shadow-indigo-500/10">
          {/* Go Back Button */}
          <div className="flex justify-start mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Homepage</span>
            </button>
          </div>
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400">
              Sign in to continue your gaming journey
            </p>
          </div>
          <form className="space-y-8" onSubmit={handleSubmit}>
            {successMessage && (
              <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-xl backdrop-blur-sm">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-10">
              {/* Email Field */}
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="peer w-full bg-transparent border-0 border-b-2 border-gray-600 text-white text-lg py-3 px-0 focus:outline-none focus:border-indigo-400 transition-colors duration-300 placeholder-transparent"
                  placeholder="Email address"
                />
                <label
                  htmlFor="email"
                  className="absolute left-0 top-3 text-gray-400 text-lg transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-focus:-top-7 peer-focus:text-sm peer-focus:text-indigo-400 peer-valid:-top-7 peer-valid:text-sm"
                >
                  Email address
                </label>
              </div>

              {/* Password Field */}
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="peer w-full bg-transparent border-0 border-b-2 border-gray-600 text-white text-lg py-3 px-0 focus:outline-none focus:border-indigo-400 transition-colors duration-300 placeholder-transparent"
                  placeholder="Password"
                />
                <label
                  htmlFor="password"
                  className="absolute left-0 top-3 text-gray-400 text-lg transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-focus:-top-7 peer-focus:text-sm peer-focus:text-indigo-400 peer-valid:-top-7 peer-valid:text-sm"
                >
                  Password
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full inline-flex items-center justify-center rounded-xl py-4 px-8 text-lg font-semibold transition-all duration-300 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 border-2 border-indigo-400 text-indigo-400 hover:bg-indigo-400 hover:text-white transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10">{loading ? 'Signing in...' : 'Sign In'}</span>
                <div className="absolute inset-0 rounded-xl bg-indigo-400 transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
              </button>
            </div>

            <div className="text-center pt-4">
              <span className="text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
                  Create one here
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
