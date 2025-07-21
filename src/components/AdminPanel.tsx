import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';interface User {
  id: string;
  email: string;
  displayName?: string;
  name?: string;
  bio?: string;
  profilePicture?: string;
  platforms?: string[];
  location?: string;
  discordId?: string;
  lastActivity?: any;
}

interface Post {
  id: string;
  title: string;
  game: string;
  description: string;
  authorId: string;
  authorName: string;
  gameMode: string;
  skillLevel: string;
  platform: string;
  region: string;
  isActive: boolean;
  createdAt: any;
  tags?: string[];
}

interface GameEntry {
  id: string;
  name: string;
  category?: string;
  isVerified: boolean;
  submittedBy?: string;
  submittedAt?: any;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'games' | 'posts'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [games, setGames] = useState<GameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase auth state changed:', user);
      setFirebaseUser(user);
      setAuthChecked(true);
    });

    return unsubscribe;
  }, []);

  // Check admin authentication
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }
    
    // Wait for auth check to complete
    if (authChecked && !firebaseUser) {
      console.log('No Firebase user authenticated, redirecting to login');
      navigate('/admin-login');
    }
  }, [navigate, firebaseUser, authChecked]);

  // Load users
  useEffect(() => {
    if (!firebaseUser || !authChecked) {
      console.log('Waiting for Firebase auth...');
      return;
    }

    const loadUsers = async () => {
      try {
        console.log('Loading users from Firebase with authenticated user:', firebaseUser.email);
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log('Users snapshot received, docs count:', usersSnapshot.docs.length);
        
        const usersList: User[] = [];
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          console.log('User data:', doc.id, userData);
          usersList.push({ id: doc.id, ...userData } as User);
        });
        
        console.log('Setting users:', usersList);
        setUsers(usersList);
      } catch (error) {
        console.error('Error loading users:', error);
        alert('Error loading users from Firebase. Check console for details.');
      }
    };

    loadUsers();
  }, [firebaseUser, authChecked]);

  // Load posts
  useEffect(() => {
    if (!firebaseUser || !authChecked) {
      return;
    }

    const loadPosts = async () => {
      try {
        console.log('Loading posts from Firebase with authenticated user:', firebaseUser.email);
        const postsSnapshot = await getDocs(collection(db, 'posts'));
        console.log('Posts snapshot received, docs count:', postsSnapshot.docs.length);
        
        const postsList: Post[] = [];
        postsSnapshot.forEach((doc) => {
          const postData = doc.data();
          console.log('Post data:', doc.id, postData);
          postsList.push({ id: doc.id, ...postData } as Post);
        });
        
        const sortedPosts = postsList.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
        console.log('Setting posts:', sortedPosts);
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
        alert('Error loading posts from Firebase. Check console for details.');
      }
    };

    loadPosts();
  }, [firebaseUser, authChecked]);

  // Load games with real-time updates
  useEffect(() => {
    if (!firebaseUser || !authChecked) {
      return;
    }

    console.log('Setting up games listener with authenticated user:', firebaseUser.email);
    const gamesQuery = collection(db, 'games');
    const unsubscribe = onSnapshot(gamesQuery, (snapshot) => {
      console.log('Games snapshot received, docs count:', snapshot.docs.length);
      const gamesList: GameEntry[] = [];
      snapshot.forEach((doc) => {
        const gameData = doc.data();
        console.log('Game data:', doc.id, gameData);
        gamesList.push({
          id: doc.id,
          name: gameData.name || doc.id,
          category: gameData.category,
          isVerified: gameData.isVerified || false,
          submittedBy: gameData.submittedBy,
          submittedAt: gameData.submittedAt
        });
      });
      const sortedGames = gamesList.sort((a, b) => a.name.localeCompare(b.name));
      console.log('Setting games:', sortedGames);
      setGames(sortedGames);
      setLoading(false);
    }, (error) => {
      console.error('Error loading games:', error);
      alert('Error loading games from Firebase. Check console for details.');
      setLoading(false);
    });

    return unsubscribe;
  }, [firebaseUser, authChecked]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setActionLoading(userId);
    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      
      // Delete user's posts
      const userPostsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
      const userPostsSnapshot = await getDocs(userPostsQuery);
      const deletePostPromises = userPostsSnapshot.docs.map(postDoc => deleteDoc(postDoc.ref));
      await Promise.all(deletePostPromises);
      
      // Delete user's chats (both as participant)
      const userChatsQuery = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
      const userChatsSnapshot = await getDocs(userChatsQuery);
      const deleteChatPromises = userChatsSnapshot.docs.map(chatDoc => deleteDoc(chatDoc.ref));
      await Promise.all(deleteChatPromises);
      
      // Remove user from local state
      setUsers(users.filter(user => user.id !== userId));
      setPosts(posts.filter(post => post.authorId !== userId));
      
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyGame = async (gameId: string, verify: boolean) => {
    setActionLoading(gameId);
    try {
      let deletedPostsCount = 0;
      
      if (!verify) {
        // If unverifying, also delete all posts with this game
        const gameName = games.find(g => g.id === gameId)?.name;
        if (gameName) {
          const postsWithGameQuery = query(collection(db, 'posts'), where('game', '==', gameName));
          const postsSnapshot = await getDocs(postsWithGameQuery);
          
          if (postsSnapshot.docs.length > 0) {
            const confirmDelete = confirm(`This will unverify the game and delete ${postsSnapshot.docs.length} post(s) that use this game. Continue?`);
            if (!confirmDelete) {
              setActionLoading(null);
              return;
            }
            
            // Delete all posts with this game
            const deletePostPromises = postsSnapshot.docs.map(postDoc => deleteDoc(postDoc.ref));
            await Promise.all(deletePostPromises);
            
            // Update local posts state
            const deletedPostIds = postsSnapshot.docs.map(doc => doc.id);
            setPosts(posts.filter(post => !deletedPostIds.includes(post.id)));
            deletedPostsCount = postsSnapshot.docs.length;
          }
        }
      }
      
      // Update game verification status in Firestore
      await updateDoc(doc(db, 'games', gameId), {
        isVerified: verify
      });
      
      // Update local state
      setGames(games.map(game => 
        game.id === gameId ? { ...game, isVerified: verify } : game
      ));
      
      const message = `Game ${verify ? 'verified' : 'unverified'} successfully${deletedPostsCount > 0 ? ` and ${deletedPostsCount} related post(s) deleted` : ''}`;
      alert(message);
    } catch (error) {
      console.error('Error updating game verification:', error);
      alert('Error updating game verification. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return;
    }

    setActionLoading(gameId);
    try {
      // First, find and delete all posts with this game
      const gameName = games.find(g => g.id === gameId)?.name;
      let deletedPostsCount = 0;
      
      if (gameName) {
        const postsWithGameQuery = query(collection(db, 'posts'), where('game', '==', gameName));
        const postsSnapshot = await getDocs(postsWithGameQuery);
        
        if (postsSnapshot.docs.length > 0) {
          const confirmDeletePosts = confirm(`This game is used in ${postsSnapshot.docs.length} post(s). Deleting the game will also delete these posts. Continue?`);
          if (!confirmDeletePosts) {
            setActionLoading(null);
            return;
          }
          
          // Delete all posts with this game
          const deletePostPromises = postsSnapshot.docs.map(postDoc => deleteDoc(postDoc.ref));
          await Promise.all(deletePostPromises);
          
          // Update local posts state
          const deletedPostIds = postsSnapshot.docs.map(doc => doc.id);
          setPosts(posts.filter(post => !deletedPostIds.includes(post.id)));
          deletedPostsCount = postsSnapshot.docs.length;
        }
      }
      
      // Delete game document from Firestore
      await deleteDoc(doc(db, 'games', gameId));
      
      // Remove from local state
      setGames(games.filter(game => game.id !== gameId));
      
      const message = `Game deleted successfully${deletedPostsCount > 0 ? ` along with ${deletedPostsCount} related post(s)` : ''}`;
      alert(message);
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Error deleting game. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setActionLoading(postId);
    try {
      // Delete post document from Firestore
      await deleteDoc(doc(db, 'posts', postId));
      
      // Remove from local state
      setPosts(posts.filter(post => post.id !== postId));
      
      alert('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin-login');
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">
            {!authChecked ? 'Checking authentication...' : 'Loading admin panel...'}
          </p>
          {firebaseUser && (
            <p className="text-gray-500 text-sm mt-2">
              Authenticated as: {firebaseUser.email}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-400">Manage users, games, and content</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Back to App
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-xl">
          {[
            { id: 'users', label: 'Users', count: users.length },
            { id: 'games', label: 'Games', count: games.length },
            { id: 'posts', label: 'Posts', count: posts.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6">
          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">User Management</h2>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No users found</p>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.displayName || user.name || 'User'}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {(user.displayName || user.name || user.email || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-white">
                              {user.displayName || user.name || 'Unnamed User'}
                            </h3>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                            {user.bio && (
                              <p className="text-gray-500 text-sm mt-1 max-w-md truncate">{user.bio}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          {actionLoading === user.id ? 'Deleting...' : 'Delete User'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'games' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Games Management</h2>
              <div className="space-y-4">
                {games.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No games found</p>
                ) : (
                  games.map((game) => (
                    <div key={game.id} className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded-full ${game.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <div>
                            <h3 className="font-semibold text-white">{game.name}</h3>
                            <p className="text-gray-400 text-sm">
                              {game.isVerified ? 'Verified' : 'Pending Verification'}
                              {game.category && ` • ${game.category}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!game.isVerified && (
                            <button
                              onClick={() => handleVerifyGame(game.id, true)}
                              disabled={actionLoading === game.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              {actionLoading === game.id ? 'Verifying...' : 'Verify'}
                            </button>
                          )}
                          {game.isVerified && (
                            <button
                              onClick={() => handleVerifyGame(game.id, false)}
                              disabled={actionLoading === game.id}
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              {actionLoading === game.id ? 'Unverifying...' : 'Unverify'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteGame(game.id)}
                            disabled={actionLoading === game.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            {actionLoading === game.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Posts Overview</h2>
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No posts found</p>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-white">{post.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              post.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {post.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{post.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">{post.game}</span>
                            <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">{post.platform}</span>
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">{post.skillLevel}</span>
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">{post.region}</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-2">
                            By {post.authorName} • {post.createdAt?.toDate?.()?.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            disabled={actionLoading === post.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            {actionLoading === post.id ? 'Deleting...' : 'Delete Post'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
