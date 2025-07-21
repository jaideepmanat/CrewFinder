import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-gray-800 border-r border-gray-700 z-30 flex flex-col transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className={`text-xl font-bold text-white transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
              CrewFinder
            </h1>
          </div>
        </div>

        {/* Navigation Section - Takes up remaining space */}
        <nav className="mt-6 flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-3 space-y-2">
            <Link
              to="/dashboard"
              className="group/item flex items-center px-3 py-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 hover:scale-105 transition-all duration-200"
            >
              <svg className="text-gray-400 group-hover/item:text-indigo-400 h-6 w-6 flex-shrink-0 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
              </svg>
              <span className={`ml-3 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
                Dashboard
              </span>
            </Link>
            
            <Link
              to="/dashboard/create-post"
              className="group/item flex items-center px-3 py-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 hover:scale-105 transition-all duration-200"
            >
              <svg className="text-gray-400 group-hover/item:text-indigo-400 h-6 w-6 flex-shrink-0 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className={`ml-3 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
                Create Post
              </span>
            </Link>
            
            <Link
              to="/dashboard/browse-posts"
              className="group/item flex items-center px-3 py-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 hover:scale-105 transition-all duration-200"
            >
              <svg className="text-gray-400 group-hover/item:text-indigo-400 h-6 w-6 flex-shrink-0 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className={`ml-3 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
                Browse Posts
              </span>
            </Link>
            
            <Link
              to="/dashboard/profile"
              className="group/item flex items-center px-3 py-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 hover:scale-105 transition-all duration-200"
            >
              <svg className="text-gray-400 group-hover/item:text-indigo-400 h-6 w-6 flex-shrink-0 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className={`ml-3 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
                Profile
              </span>
            </Link>
            
            <Link
              to="/dashboard/chat"
              className="group/item flex items-center px-3 py-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 hover:scale-105 transition-all duration-200"
            >
              <svg className="text-gray-400 group-hover/item:text-indigo-400 h-6 w-6 flex-shrink-0 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className={`ml-3 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
                Messages
              </span>
            </Link>
          </div>
        </nav>

        {/* Sign Out Button - Always at bottom */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="group/item w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg text-gray-300 hover:text-red-300 hover:bg-red-900/20 hover:scale-105 transition-all duration-200"
          >
            <svg className="text-gray-400 group-hover/item:text-red-400 h-6 w-6 flex-shrink-0 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={`ml-3 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-x-hidden transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
