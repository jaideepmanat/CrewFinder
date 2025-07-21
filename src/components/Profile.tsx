import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  bio?: string;
  profilePicture?: string;
  platforms?: string[];
  location?: string;
  discordId?: string;
  totalPosts?: number;
  lastActivity?: any;
  createdAt?: any;
}

const GAMING_PLATFORMS = [
  'PC',
  'PlayStation 5',
  'PlayStation 4',
  'Xbox Series X/S',
  'Xbox One',
  'Nintendo Switch',
  'Mobile',
  'Cross-platform'
];

const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [realTimePostsCount, setRealTimePostsCount] = useState<number>(0);
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    discordId: '',
    platforms: [] as string[]
  });

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  // Real-time posts count listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      setRealTimePostsCount(snapshot.docs.length);
    });

    return unsubscribe;
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!currentUser?.uid) return;
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setProfile(userData);
        setFormData({
          displayName: userData.displayName || '',
          bio: userData.bio || '',
          location: userData.location || '',
          discordId: userData.discordId || '',
          platforms: userData.platforms || []
        });
      } else {
        // Create a basic profile if none exists
        const basicProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
          totalPosts: 0,
          createdAt: new Date()
        };
        setProfile(basicProfile);
        setFormData({
          displayName: basicProfile.displayName,
          bio: '',
          location: '',
          discordId: '',
          platforms: []
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfile(prev => prev ? { ...prev, profilePicture: result } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      if (!currentUser?.uid) return;
      
      const updatedProfile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        ...profile,
        ...formData,
        profilePicture: profile?.profilePicture,
        updatedAt: new Date(),
        // Ensure we have a createdAt if this is a new document
        createdAt: profile?.createdAt || new Date()
      };
      
      // Use setDoc with merge to create document if it doesn't exist
      await setDoc(doc(db, 'users', currentUser.uid), updatedProfile, { merge: true });
      
      setProfile(updatedProfile as UserProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!currentUser?.uid) return;
      
      // Delete user document
      await deleteDoc(doc(db, 'users', currentUser.uid));
      
      // Sign out user
      await logout();
      
      // Redirect to home
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Profile Not Found</h2>
          <p className="text-gray-400 mb-8">Unable to load profile information.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 transform hover:rotate-12 transition-transform duration-500">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Profile</h1>
          <p className="text-xl text-gray-400">Manage your gaming profile and preferences</p>
        </div>

        {/* Error Message */}
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

        {/* Main Profile Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Profile Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Picture Section */}
            <div className="lg:col-span-1">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  {profile.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-600"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-gray-600">
                      <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors duration-200">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{profile.displayName}</h3>
                <p className="text-gray-400">{profile.email}</p>
                <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">Total Posts</p>
                  <p className="text-2xl font-bold text-indigo-400">{realTimePostsCount}</p>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-lg font-medium text-white mb-2">Display Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300"
                    placeholder="Enter your display name"
                  />
                ) : (
                  <p className="text-lg text-gray-300 py-3 px-4 bg-gray-700/50 rounded-lg">{profile.displayName}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-lg font-medium text-white mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300 resize-none"
                    placeholder="Tell us about yourself and your gaming preferences..."
                  />
                ) : (
                  <p className="text-lg text-gray-300 py-3 px-4 bg-gray-700/50 rounded-lg min-h-[100px]">
                    {profile.bio || 'No bio provided'}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-lg font-medium text-white mb-2">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300"
                    placeholder="Your location (optional)"
                  />
                ) : (
                  <p className="text-lg text-gray-300 py-3 px-4 bg-gray-700/50 rounded-lg">
                    {profile.location || 'No location provided'}
                  </p>
                )}
              </div>

              {/* Discord ID */}
              <div>
                <label className="block text-lg font-medium text-white mb-2">Discord ID</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="discordId"
                    value={formData.discordId}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 text-white text-lg py-3 px-4 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300"
                    placeholder="Your Discord username (e.g., username#1234)"
                  />
                ) : (
                  <p className="text-lg text-gray-300 py-3 px-4 bg-gray-700/50 rounded-lg">
                    {profile.discordId || 'No Discord ID provided'}
                  </p>
                )}
              </div>

              {/* Gaming Platforms */}
              <div>
                <label className="block text-lg font-medium text-white mb-4">Gaming Platforms</label>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-3">
                    {GAMING_PLATFORMS.map(platform => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => handlePlatformToggle(platform)}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                          formData.platforms.includes(platform)
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {profile.platforms && profile.platforms.length > 0 ? (
                      profile.platforms.map(platform => (
                        <span
                          key={platform}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium"
                        >
                          {platform}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400 py-3 px-4 bg-gray-700/50 rounded-lg">No platforms selected</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-4 mt-8 pt-8 border-t border-gray-700">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 border-2 border-gray-600 rounded-xl text-gray-300 bg-transparent hover:bg-gray-700 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 border-2 border-transparent rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          )}

          {/* Danger Zone */}
          {!isEditing && (
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h3 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h3>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete Account
              </button>
            </div>
          )}
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Delete Account</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
