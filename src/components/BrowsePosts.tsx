import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  game: string;
  platform: string;
  tags: string[];
  description: string;
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: any;
  isActive?: boolean;
  authorId?: string;
  authorName?: string;
  profilePicture?: string;
}

const GAMES = [
  'All Games', 'Valorant', 'Counter-Strike 2', 'League of Legends', 'Apex Legends', 
  'Fortnite', 'Call of Duty', 'Overwatch 2', 'Rocket League', 
  'Minecraft', 'Among Us', 'Fall Guys', 'PUBG', 'Other'
];

const PLATFORMS = ['All Platforms', 'PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'];

export default function BrowsePosts() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const [filters, setFilters] = useState({
    game: 'All Games',
    platform: 'All Platforms'
  });

  // Fetch posts from Firestore
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(postsQuery);
        const postsData = await Promise.all(
          querySnapshot.docs.map(async (postDoc) => {
            const postData = { id: postDoc.id, ...postDoc.data() } as Post;
            
            // Fetch user profile picture if we have authorId
            const userId = postData.authorId || postData.userId;
            if (userId) {
              try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  postData.profilePicture = userData.profilePicture;
                  // Update userName if we have displayName from user profile
                  if (userData.displayName) {
                    postData.userName = userData.displayName;
                  }
                }
              } catch (error) {
                console.warn('Failed to fetch user data for post:', postData.id, error);
              }
            }
            
            return postData;
          })
        );
        
        setPosts(postsData);
        setFilteredPosts(postsData);
      } catch (error: any) {
        setError('Failed to fetch posts: ' + error.message);
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = posts;

    // Apply search keyword filter
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(post => 
        post.game.toLowerCase().includes(keyword) ||
        post.platform.toLowerCase().includes(keyword) ||
        post.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
        post.description.toLowerCase().includes(keyword)
      );
    }

    // Apply game filter
    if (filters.game !== 'All Games') {
      filtered = filtered.filter(post => post.game === filters.game);
    }

    // Apply platform filter
    if (filters.platform !== 'All Platforms') {
      filtered = filtered.filter(post => post.platform === filters.platform);
    }

    // Only show active posts
    filtered = filtered.filter(post => post.isActive !== false);

    setFilteredPosts(filtered);
  }, [filters, posts, searchKeyword]);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  const handleConnect = (userId: string) => {
    if (!currentUser?.uid || !userId || userId === currentUser.uid) {
      console.warn('Cannot connect: invalid user ID or attempting self-connect');
      return;
    }
    
    // Navigate to chat with the specific user
    navigate(`/dashboard/chat/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          select option {
            background-color: #374151 !important;
            color: white !important;
          }
          
          select::-ms-expand {
            display: none;
          }
          
          select {
            direction: ltr !important;
          }
        `}
      </style>
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 transform hover:rotate-12 transition-transform duration-500">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Browse Gaming Posts
            </h1>
            <p className="text-xl text-gray-400">
              Discover gaming crews and find your perfect gaming partners
            </p>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-600 text-red-200 px-6 py-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Filters Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 mb-8 transform transition-all duration-300 hover:shadow-indigo-500/10">
            <div className="flex items-center mb-6">
              <svg className="h-6 w-6 text-indigo-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="text-xl font-semibold text-white">Search & Filters</h3>
            </div>
            
            {/* Search Bar */}
            <div className="mb-6">
              <label className="block text-lg font-medium text-white mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by game name, platform, tags, or description..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 pr-12 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Game Filter */}
              <div className="space-y-2">
                <label className="block text-lg font-medium text-white">Game</label>
                <div className="relative">
                  <select
                    value={filters.game}
                    onChange={(e) => handleFilterChange('game', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 pr-10 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300 appearance-none cursor-pointer"
                    style={{ 
                      backgroundImage: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    {GAMES.map(game => (
                      <option key={game} value={game} className="bg-gray-700 text-white">{game}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Platform Filter */}
              <div className="space-y-2">
                <label className="block text-lg font-medium text-white">Platform</label>
                <div className="relative">
                  <select
                    value={filters.platform}
                    onChange={(e) => handleFilterChange('platform', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 pr-10 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300 appearance-none cursor-pointer"
                    style={{ 
                      backgroundImage: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    {PLATFORMS.map(platform => (
                      <option key={platform} value={platform} className="bg-gray-700 text-white">{platform}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results Counter */}
            <div className="mt-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-white font-medium">
                    Showing {filteredPosts.length} of {posts.length} posts
                  </span>
                </div>
                {filteredPosts.length !== posts.length && (
                  <button
                    onClick={() => {
                      setFilters({ game: 'All Games', platform: 'All Platforms' });
                      setSearchKeyword('');
                    }}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center mb-6">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No posts found</h3>
              <p className="text-gray-400 mb-6">No posts match your current filters.</p>
              <button
                onClick={() => {
                  setFilters({ game: 'All Games', platform: 'All Platforms' });
                  setSearchKeyword('');
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-lg p-6 hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 transform hover:scale-105">
                  {/* Post Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{post.game}</h3>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-indigo-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-indigo-300 text-sm font-medium">{post.platform}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-xs font-medium text-green-400">ACTIVE</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-4">
                    <p className="text-gray-300 leading-relaxed line-clamp-3">{post.description}</p>
                  </div>
                  
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="px-3 py-1 bg-gray-600 text-gray-300 text-xs font-medium rounded-full">
                            +{post.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {post.profilePicture ? (
                          <img
                            src={post.profilePicture}
                            alt={post.userName}
                            className="h-8 w-8 rounded-full object-cover border-2 border-gray-600 mr-3"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-semibold">
                              {post.userName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium text-sm">{post.userName}</p>
                          <p className="text-gray-400 text-xs">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                      {(post.userId !== currentUser?.uid && post.authorId !== currentUser?.uid) && (
                        <button 
                          onClick={() => {
                            const targetUserId = post.userId || post.authorId;
                            if (targetUserId) handleConnect(targetUserId);
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
