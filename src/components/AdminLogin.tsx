import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check admin credentials
    if (email === 'admin@mail.com' && password === 'jaideep') {
      try {
        // Try to sign in with Firebase Auth
        await signInWithEmailAndPassword(auth, email, password);
        
        // Store admin session
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin-panel');
      } catch (error: any) {
        console.error('Firebase Auth error:', error);
        
        // If admin user doesn't exist, try to create it
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin-panel');
          } catch (createError: any) {
            console.error('Error creating admin user:', createError);
            // If creation fails, still allow admin access but with limited permissions
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('adminMode', 'limited');
            navigate('/admin-panel');
          }
        } else {
          setError('Firebase authentication error: ' + error.message);
        }
      }
    } else {
      setError('Invalid admin credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mb-4 transform hover:rotate-12 transition-transform duration-500">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400">Enter admin credentials to access the panel</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-colors duration-300"
                  placeholder="Enter admin email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-colors duration-300"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-red-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </form>

          {/* Back to app */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              ← Back to CrewFinder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
