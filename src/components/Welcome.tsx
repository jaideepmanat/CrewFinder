import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-white sm:text-7xl">
            Find Your Perfect{' '}
            <span className="relative whitespace-nowrap text-indigo-400">
              <span className="relative">Gaming Crew</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-gray-300">
            Connect with fellow gamers, create posts for your favorite games, and build the ultimate gaming crew.
          </p>
          <div className="mt-10 flex justify-center gap-x-6">
            <Link
              to="/register"
              className="group relative inline-flex items-center justify-center rounded-xl py-4 px-8 text-lg font-semibold transition-all duration-300 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 border-2 border-indigo-400 text-indigo-400 hover:bg-indigo-400 hover:text-white transform hover:scale-105 hover:shadow-lg focus-visible:outline-indigo-400"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 rounded-xl bg-indigo-400 transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
            </Link>
            <Link
              to="/login"
              className="group relative inline-flex items-center justify-center rounded-xl py-4 px-8 text-lg font-semibold transition-all duration-300 focus:outline-none border-2 border-gray-400 text-gray-300 hover:bg-gray-400 hover:text-gray-900 transform hover:scale-105 hover:shadow-lg focus-visible:outline-indigo-400 focus-visible:ring-gray-400"
            >
              <span className="relative z-10">Sign In</span>
              <div className="absolute inset-0 rounded-xl bg-gray-400 transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
            </Link>
          </div>
        </div>
        
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Create Posts Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-8 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25 cursor-pointer">
              {/* Background fill effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 transform scale-0 group-hover:scale-100 transition-transform duration-700 ease-out rounded-2xl"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-500">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors duration-300">Create Posts</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Post about games you want to play and find like-minded gamers for epic sessions.
                </p>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 transform scale-0 group-hover:scale-100 transition-transform duration-700"></div>
            </div>
            
            {/* Browse & Filter Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-8 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 cursor-pointer">
              {/* Background fill effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 transform scale-0 group-hover:scale-100 transition-transform duration-700 ease-out rounded-2xl"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-500">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">Browse & Filter</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Find posts by game, platform, and tags to join the perfect crew for your gaming style.
                </p>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 transform scale-0 group-hover:scale-100 transition-transform duration-700"></div>
            </div>
            
            {/* Build Your Crew Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-8 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 cursor-pointer">
              {/* Background fill effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 transform scale-0 group-hover:scale-100 transition-transform duration-700 ease-out rounded-2xl"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-500">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-200 transition-colors duration-300">Build Your Crew</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Connect with gamers and build lasting gaming relationships that go beyond single matches.
                </p>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 transform scale-0 group-hover:scale-100 transition-transform duration-700"></div>
            </div>
          </div>
        </div>
        
        {/* Admin Access */}
        <div className="mt-16 text-center">
          <Link
            to="/admin-login"
            className="inline-flex items-center space-x-2 text-gray-500 hover:text-gray-300 transition-colors duration-300 text-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Admin Access</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
