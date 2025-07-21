
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Post {
  id: string;
  game: string;
  platform: string;
  tags: string[];
  description: string;
  createdAt: any;
  isActive?: boolean;
}

export default function Dashboard() {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Fetch user's posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!currentUser) {
        console.log('No current user, skipping posts fetch');
        return;
      }

      console.log('Fetching posts for user:', currentUser.uid);

      try {
        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(postsQuery);
        console.log('Found posts:', querySnapshot.docs.length);
        
        const postsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Post data:', doc.id, data);
          return {
            id: doc.id,
            ...data
          };
        }) as Post[];
        
        console.log('Setting posts:', postsData);
        setPosts(postsData);
      } catch (error: any) {
        setError('Failed to fetch your posts: ' + error.message);
      }

      setLoading(false);
    };

    fetchUserPosts();
  }, [currentUser]);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    setDeleteLoading(postId);
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error: any) {
      setError('Failed to delete post: ' + error.message);
    }
    setDeleteLoading(null);
  };

  const handleToggleActive = async (postId: string, currentStatus: boolean) => {
    setToggleLoading(postId);
    try {
      await updateDoc(doc(db, 'posts', postId), {
        isActive: !currentStatus
      });
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, isActive: !currentStatus } : post
      ));
    } catch (error: any) {
      setError('Failed to update post: ' + error.message);
    }
    setToggleLoading(null);
  };

  const navigateToCreatePost = () => navigate('/dashboard/create-post');
  const navigateToBrowsePosts = () => navigate('/dashboard/browse-posts');
  const navigateToProfile = () => navigate('/dashboard/profile');

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome back, {userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-xl text-gray-400">
            Ready to find your next gaming crew?
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Create Post Card */}
          <div 
            onClick={navigateToCreatePost}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-8 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25 cursor-pointer"
          >
            {/* Background fill effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 transform scale-0 group-hover:scale-100 transition-transform duration-700 ease-out rounded-2xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-500">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors duration-300">Create Post</h3>
              <p className="text-gray-400 group-hover:text-gray-200 transition-colors duration-300">
                Start building your gaming crew
              </p>
            </div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 transform scale-0 group-hover:scale-100 transition-transform duration-700"></div>
          </div>

          {/* Browse Posts Card */}
          <div 
            onClick={navigateToBrowsePosts}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-8 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 cursor-pointer"
          >
            {/* Background fill effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 transform scale-0 group-hover:scale-100 transition-transform duration-700 ease-out rounded-2xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-500">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">Browse Posts</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Find crews to join
              </p>
            </div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 transform scale-0 group-hover:scale-100 transition-transform duration-700"></div>
          </div>

          {/* Profile Card */}
          <div 
            onClick={navigateToProfile}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-8 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer"
          >
            {/* Background fill effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-teal-600/20 transform scale-0 group-hover:scale-100 transition-transform duration-700 ease-out rounded-2xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-500">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-200 transition-colors duration-300">View Profile</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Manage your profile
              </p>
            </div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0 transform scale-0 group-hover:scale-100 transition-transform duration-700"></div>
          </div>
        </div>

        {/* My Posts Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">My Posts</h2>
            <button
              onClick={navigateToCreatePost}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-800 hover:text-black transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Create New Post
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
              <p className="text-gray-400 mt-2">Loading your posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-4">You haven't created any gaming crew posts yet.</p>
              <button
                onClick={navigateToCreatePost}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-800 hover:text-black transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <div key={post.id} className="bg-gray-700/50 border border-gray-600 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{post.game}</h3>
                      <p className="text-sm text-gray-400">{post.platform}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.isActive ? 'bg-green-900/50 text-green-300 border border-green-600' : 'bg-red-900/50 text-red-300 border border-red-600'
                    }`}>
                      {post.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{post.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs rounded-lg border border-indigo-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(post.id, post.isActive || false)}
                      disabled={toggleLoading === post.id}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                        post.isActive 
                          ? 'bg-red-900/50 text-red-300 border border-red-600 hover:bg-red-900' 
                          : 'bg-green-900/50 text-green-300 border border-green-600 hover:bg-green-900'
                      }`}
                    >
                      {toggleLoading === post.id ? 'Updating...' : (post.isActive ? 'Deactivate' : 'Activate')}
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleteLoading === post.id}
                      className="px-3 py-2 bg-red-900/50 text-red-300 border border-red-600 text-sm rounded-lg hover:bg-red-900 transition-colors duration-200"
                    >
                      {deleteLoading === post.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
