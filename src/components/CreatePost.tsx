import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, addDoc, collection, getDoc, updateDoc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Game and Platform constants
const GAMES = [
  'League of Legends',
  'Valorant',
  'CS2',
  'Dota 2',
  'Apex Legends',
  'Overwatch 2',
  'Fortnite',
  'Call of Duty',
  'Rainbow Six Siege',
  'Rocket League',
  'Minecraft',
  'Among Us',
  'Fall Guys',
  'PUBG',
  'Warzone',
  'FIFA',
  'NBA 2K',
  'Grand Theft Auto V',
  'Rust',
  'Destiny 2',
  'World of Warcraft',
  'Final Fantasy XIV',
  'Genshin Impact',
  'Other'
];

const PLATFORMS = [
  'PC',
  'PlayStation 5',
  'PlayStation 4',
  'Xbox Series X/S',
  'Xbox One',
  'Nintendo Switch',
  'Mobile',
  'Cross-platform'
];

interface FormData {
  game: string;
  platform: string;
  description: string;
  tags: string[];
  isActive: boolean;
  customGame: string;
  tagsInput: string;
}

interface OfflinePost {
  id: string;
  data: FormData;
  timestamp: number;
}

const CreatePost: React.FC = () => {
  const { currentUser: user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    game: '',
    platform: '',
    description: '',
    tags: [],
    isActive: true,
    customGame: '',
    tagsInput: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [showQuickOption, setShowQuickOption] = useState(false);
  const [verifiedGames, setVerifiedGames] = useState<string[]>([]);

  // Load verified games from Firestore and populate initial games
  useEffect(() => {
    const loadVerifiedGames = async () => {
      try {
        // First, populate predefined games as verified if they don't exist
        for (const game of GAMES) {
          if (game !== 'Other') {
            const gameDocId = game.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const gameDocRef = doc(db, 'games', gameDocId);
            const gameDoc = await getDoc(gameDocRef);
            
            if (!gameDoc.exists()) {
              await setDoc(gameDocRef, {
                name: game,
                isVerified: true,
                submittedBy: 'system',
                submittedAt: new Date(),
                category: 'Popular Games'
              });
            }
          }
        }
        
        // Load verified games
        const gamesQuery = query(collection(db, 'games'), where('isVerified', '==', true));
        const unsubscribe = onSnapshot(gamesQuery, (snapshot) => {
          const games: string[] = [];
          snapshot.forEach((doc) => {
            const gameData = doc.data();
            games.push(gameData.name);
          });
          games.sort();
          setVerifiedGames(games);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error loading verified games:', error);
        // Fallback to predefined games
        setVerifiedGames(GAMES.filter(game => game !== 'Other'));
      }
    };

    loadVerifiedGames();
  }, []);

  // Check for offline posts on component mount
  useEffect(() => {
    const checkOfflinePosts = () => {
      try {
        const offlinePosts = localStorage.getItem('offlinePosts');
        if (offlinePosts) {
          const posts: OfflinePost[] = JSON.parse(offlinePosts);
          if (posts.length > 0) {
            console.log(`Found ${posts.length} offline posts`);
          }
        }
      } catch (error) {
        console.error('Error checking offline posts:', error);
      }
    };

    checkOfflinePosts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleTagsInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      tagsInput: value
    }));

    // Process tags when comma is detected
    if (value.includes(',')) {
      const newTags = value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      const uniqueTags = [...new Set([...formData.tags, ...newTags])];
      
      setFormData(prev => ({
        ...prev,
        tags: uniqueTags,
        tagsInput: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.game) {
      setError('Please select a game');
      return false;
    }
    
    if (formData.game === 'Other' && !formData.customGame.trim()) {
      setError('Please enter a custom game name');
      return false;
    }
    
    if (!formData.platform) {
      setError('Please select a platform');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Please provide a description');
      return false;
    }
    
    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return false;
    }
    
    return true;
  };

  const createPostData = () => {
    const gameTitle = formData.game === 'Other' ? formData.customGame : formData.game;
    
    return {
      game: gameTitle,
      platform: formData.platform,
      description: formData.description.trim(),
      tags: formData.tags,
      isActive: formData.isActive,
      authorId: user?.uid,
      authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
      authorEmail: user?.email,
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: 0
    };
  };

  const saveCustomGameToDatabase = async (gameName: string) => {
    try {
      if (!user?.uid || !gameName.trim()) return;
      
      // Use the game name as the document ID to avoid duplicates
      const gameDocId = gameName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const gameDocRef = doc(db, 'games', gameDocId);
      
      // Check if game already exists
      const gameDoc = await getDoc(gameDocRef);
      
      if (!gameDoc.exists()) {
        // Save new custom game for admin verification
        await setDoc(gameDocRef, {
          name: gameName.trim(),
          isVerified: false,
          submittedBy: user.uid,
          submittedAt: new Date(),
          category: 'User Submitted'
        });
        console.log('Custom game saved for admin verification:', gameName);
      }
    } catch (error) {
      console.error('Error saving custom game:', error);
      // Don't throw error - this shouldn't block post creation
    }
  };

  const updateUserStats = async () => {
    try {
      if (!user?.uid) return;
      
      setProgress('Updating user activity...');
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          lastActivity: new Date()
        });
      } else {
        // Create basic user document if it doesn't exist
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          lastActivity: new Date(),
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.warn('Could not update user stats:', error);
    }
  };

  const saveOfflinePost = (): string => {
    try {
      const offlinePost: OfflinePost = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: formData,
        timestamp: Date.now()
      };
      
      const existingPosts = localStorage.getItem('offlinePosts');
      const posts: OfflinePost[] = existingPosts ? JSON.parse(existingPosts) : [];
      posts.push(offlinePost);
      
      localStorage.setItem('offlinePosts', JSON.stringify(posts));
      return offlinePost.id;
    } catch (error) {
      console.error('Error saving offline post:', error);
      throw new Error('Could not save post offline');
    }
  };

  const syncOfflinePosts = async () => {
    try {
      const offlinePosts = localStorage.getItem('offlinePosts');
      if (!offlinePosts) return;
      
      const posts: OfflinePost[] = JSON.parse(offlinePosts);
      if (posts.length === 0) return;
      
      console.log(`Syncing ${posts.length} offline posts...`);
      
      for (const offlinePost of posts) {
        try {
          const gameTitle = offlinePost.data.game === 'Other' ? offlinePost.data.customGame : offlinePost.data.game;
          
          const postData = {
            game: gameTitle,
            platform: offlinePost.data.platform,
            description: offlinePost.data.description.trim(),
            tags: offlinePost.data.tags,
            isActive: offlinePost.data.isActive,
            authorId: user?.uid,
            authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
            authorEmail: user?.email,
            createdAt: new Date(offlinePost.timestamp),
            updatedAt: new Date(),
            responses: 0,
            syncedAt: new Date()
          };
          
          await addDoc(collection(db, 'posts'), postData);
          console.log(`Synced offline post: ${offlinePost.id}`);
        } catch (error) {
          console.error(`Failed to sync offline post ${offlinePost.id}:`, error);
        }
      }
      
      localStorage.removeItem('offlinePosts');
      console.log('All offline posts synced and cleared from local storage');
    } catch (error) {
      console.error('Error syncing offline posts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress('');
    setShowQuickOption(false);
    
    try {
      setProgress('Creating your post...');
      
      // Save custom game to database if it's a custom game
      if (formData.game === 'Other' && formData.customGame.trim()) {
        await saveCustomGameToDatabase(formData.customGame);
      }
      
      const postData = createPostData();
      
      await addDoc(collection(db, 'posts'), postData);
      
      await updateUserStats();
      await syncOfflinePosts();
      
      setProgress('Post created successfully!');
      setSuccess('Your post has been created successfully! Redirecting to dashboard...');
      
      setFormData({
        game: '',
        platform: '',
        description: '',
        tags: [],
        isActive: true,
        customGame: '',
        tagsInput: ''
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      let errorMessage = 'Failed to create post. ';
      
      if (error.code === 'permission-denied') {
        errorMessage += 'You do not have permission to create posts. Please check your account status.';
      } else if (error.code === 'unavailable' || error.message?.includes('Failed to get document')) {
        errorMessage += 'Firestore seems to be unavailable. Check your internet connection and try again.';
      } else if (error.code === 'cancelled') {
        errorMessage += 'The operation was cancelled. Please try again.';
      } else if (error.code === 'deadline-exceeded') {
        errorMessage += 'The operation timed out. Please check your connection and try again.';
      } else {
        errorMessage += error.message || 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
      setShowQuickOption(true);
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPost = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setProgress('Creating quick post...');
    
    try {
      const postData = createPostData();
      
      const simplifiedPost = {
        game: postData.game,
        platform: postData.platform,
        description: postData.description,
        authorId: user?.uid,
        authorName: postData.authorName,
        createdAt: new Date(),
        isActive: true,
        tags: formData.tags.slice(0, 3),
        quickPost: true
      };
      
      await addDoc(collection(db, 'posts'), simplifiedPost);
      
      setSuccess('Quick post created successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
      
    } catch (error: any) {
      console.error('Quick post error:', error);
      setError('Quick post also failed. Try saving offline instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfflinePost = () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setProgress('Saving post offline...');
      
      const offlineId = saveOfflinePost();
      
      setSuccess(`Post saved offline with ID: ${offlineId}. It will be synced when connection is restored.`);
      
      setFormData({
        game: '',
        platform: '',
        description: '',
        tags: [],
        isActive: true,
        customGame: '',
        tagsInput: ''
      });
      
    } catch (error: any) {
      console.error('Offline save error:', error);
      setError('Failed to save post offline: ' + error.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-600 flex items-center justify-center">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-8">You must be logged in to create a post.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Go to Login
          </button>
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
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 transform hover:rotate-12 transition-transform duration-500">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Create Your Gaming Post
          </h1>
          <p className="text-xl text-gray-400">
            Find your perfect gaming crew by sharing what you're looking for
          </p>
        </div>

        {authLoading ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg">Loading user information...</p>
            </div>
          </div>
        ) : (
        
        /* Main Card */
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 transform transition-all duration-300 hover:shadow-indigo-500/10">
          
          {/* Error Messages */}
          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-600 text-red-200 px-6 py-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">{error}</p>
                  
                  {/* Quick Options */}
                  {showQuickOption && (
                    <div className="mt-3 pt-3 border-t border-red-600">
                      <p className="text-sm text-red-300 mb-2">
                        Try alternative creation methods:
                      </p>
                      <button
                        onClick={handleQuickPost}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50 mr-3 transition-colors duration-200"
                      >
                        {loading ? 'Creating...' : 'Create Quick Post'}
                      </button>
                    </div>
                  )}
                  
                  {error.includes('Firestore seems to be unavailable') && (
                    <div className="mt-3 pt-3 border-t border-red-600">
                      <p className="text-sm text-red-300 mb-2">
                        Save your post offline and sync later when connection is restored:
                      </p>
                      <button
                        onClick={handleOfflinePost}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors duration-200"
                      >
                        Save Offline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-900/50 border border-green-600 text-green-200 px-6 py-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {progress && loading && (
            <div className="mb-6 bg-indigo-900/50 border border-indigo-600 text-indigo-200 px-6 py-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400 mr-3"></div>
                <p className="font-medium">{progress}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Game Selection */}
            <div className="space-y-2">
              <label htmlFor="game" className="block text-lg font-medium text-white">
                Game *
              </label>
              <div className="relative">
                <select
                  id="game"
                  name="game"
                  value={formData.game}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 pr-10 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300 appearance-none cursor-pointer"
                  style={{ 
                    backgroundImage: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none'
                  }}
                >
                  <option value="" className="bg-gray-700 text-white">Select a game</option>
                  {verifiedGames.map(game => (
                    <option key={game} value={game} className="bg-gray-700 text-white">{game}</option>
                  ))}
                  <option value="Other" className="bg-gray-700 text-white">Other (Add Custom Game)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Custom Game Field */}
            {formData.game === 'Other' && (
              <div className="space-y-2">
                <label htmlFor="customGame" className="block text-lg font-medium text-white">
                  Custom Game Name *
                </label>
                <input
                  type="text"
                  id="customGame"
                  name="customGame"
                  value={formData.customGame}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300"
                  placeholder="Enter custom game name"
                />
              </div>
            )}

            {/* Platform Selection */}
            <div className="space-y-2">
              <label htmlFor="platform" className="block text-lg font-medium text-white">
                Platform *
              </label>
              <div className="relative">
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 pr-10 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300 appearance-none cursor-pointer"
                  style={{ 
                    backgroundImage: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none'
                  }}
                >
                  <option value="" className="bg-gray-700 text-white">Select a platform</option>
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

            {/* Tags Section */}
            <div className="space-y-4">
              {/* Display current tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-white hover:text-red-300 transition-colors duration-200"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="tagsInput" className="block text-lg font-medium text-white">
                  Tags (separate with commas)
                </label>
                <textarea
                  id="tagsInput"
                  name="tagsInput"
                  value={formData.tagsInput}
                  onChange={handleTagsInput}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300 resize-none"
                  placeholder="Type your tags and add a comma after each one"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-lg font-medium text-white">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300 resize-none"
                placeholder="Describe what kind of crew you're looking for, your playstyle, preferred times, etc."
              />
            </div>

            {/* Post Status Toggle Switch */}
            <div className="p-6 bg-gray-700/30 rounded-xl border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Post Visibility
                  </h3>
                  <p className="text-sm text-gray-400">
                    {formData.isActive 
                      ? "Your post is active - others can see and respond to it" 
                      : "Your post is inactive - only you can see it"}
                  </p>
                </div>
                
                {/* Custom Toggle Switch */}
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${!formData.isActive ? 'text-red-400' : 'text-gray-400'}`}>
                    OFF
                  </span>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                      formData.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                    </div>
                  </label>
                  
                  <span className={`text-sm font-medium ${formData.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                    ON
                  </span>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="mt-4 flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${formData.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-medium ${formData.isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 border-2 border-gray-600 rounded-xl text-gray-300 bg-transparent hover:bg-gray-700 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 transform hover:scale-105 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 border-2 border-transparent rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-medium"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Post...
                  </div>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </form>
        </div>
        )}
      </div>
      </div>
    </>
  );
};

export default CreatePost;
