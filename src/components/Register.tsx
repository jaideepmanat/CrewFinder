import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      setProgress('Creating your account...');
      
      await signup(formData.email, formData.password, formData.name);
      
      setProgress('Account created successfully!');
      
      // Redirect to login page after successful registration
      navigate('/login', { 
        state: { message: 'Account created successfully! Please log in.' }
      });
    } catch (error: any) {
      setError('Failed to create an account: ' + error.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 transform transition-all duration-300 hover:shadow-purple-500/10">
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
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Join CrewFinder
            </h2>
            <p className="text-gray-400">
              Create your account and start building your gaming crew
            </p>
          </div>
          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm">
                {error}
              </div>
            )}
            
            {progress && (
              <div className="bg-blue-900/50 border border-blue-600 text-blue-200 px-4 py-3 rounded-xl backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                  {progress}
                </div>
              </div>
            )}
            
            <div className="space-y-10">
              {/* Name Field */}
              <div className="relative group">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="peer w-full bg-transparent border-0 border-b-2 border-gray-600 text-white text-lg py-3 px-0 focus:outline-none focus:border-purple-400 transition-colors duration-300 placeholder-transparent"
                  placeholder="Full Name"
                />
                <label
                  htmlFor="name"
                  className="absolute left-0 top-3 text-gray-400 text-lg transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-focus:-top-7 peer-focus:text-sm peer-focus:text-purple-400 peer-valid:-top-7 peer-valid:text-sm"
                >
                  Full Name
                </label>
              </div>

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
                  className="peer w-full bg-transparent border-0 border-b-2 border-gray-600 text-white text-lg py-3 px-0 focus:outline-none focus:border-purple-400 transition-colors duration-300 placeholder-transparent"
                  placeholder="Email address"
                />
                <label
                  htmlFor="email"
                  className="absolute left-0 top-3 text-gray-400 text-lg transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-focus:-top-7 peer-focus:text-sm peer-focus:text-purple-400 peer-valid:-top-7 peer-valid:text-sm"
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="peer w-full bg-transparent border-0 border-b-2 border-gray-600 text-white text-lg py-3 px-0 focus:outline-none focus:border-purple-400 transition-colors duration-300 placeholder-transparent"
                  placeholder="Password"
                />
                <label
                  htmlFor="password"
                  className="absolute left-0 top-3 text-gray-400 text-lg transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-focus:-top-7 peer-focus:text-sm peer-focus:text-purple-400 peer-valid:-top-7 peer-valid:text-sm"
                >
                  Password
                </label>
              </div>

              {/* Confirm Password Field */}
              <div className="relative group">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="peer w-full bg-transparent border-0 border-b-2 border-gray-600 text-white text-lg py-3 px-0 focus:outline-none focus:border-purple-400 transition-colors duration-300 placeholder-transparent"
                  placeholder="Confirm Password"
                />
                <label
                  htmlFor="confirmPassword"
                  className="absolute left-0 top-3 text-gray-400 text-lg transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-focus:-top-7 peer-focus:text-sm peer-focus:text-purple-400 peer-valid:-top-7 peer-valid:text-sm"
                >
                  Confirm Password
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full inline-flex items-center justify-center rounded-xl py-4 px-8 text-lg font-semibold transition-all duration-300 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10">{loading ? 'Creating Account...' : 'Create Account'}</span>
                <div className="absolute inset-0 rounded-xl bg-purple-400 transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
              </button>
            </div>

            <div className="text-center pt-4">
              <span className="text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200">
                  Sign in here
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
