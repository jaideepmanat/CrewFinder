import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string, name: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's profile in Firebase Auth with their name (with timeout)
    try {
      const updateProfilePromise = updateProfile(user, {
        displayName: name
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile update timeout')), 3000)
      );
      
      await Promise.race([updateProfilePromise, timeoutPromise]);
      console.log('User profile updated in Firebase Auth');
    } catch (authError) {
      console.warn('Could not update Firebase Auth profile (timeout or error):', authError);
    }
    
    // Try to store user profile in Firestore with timeout, but don't fail if it doesn't work
    try {
      const firestorePromise = setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        createdAt: new Date().toISOString()
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore save timeout')), 5000)
      );
      
      await Promise.race([firestorePromise, timeoutPromise]);
      console.log('User profile saved to Firestore');
    } catch (firestoreError) {
      console.warn('Could not save to Firestore (timeout or error), continuing anyway:', firestoreError);
      // We'll rely on the fallback profile creation in the auth state listener
    }
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  useEffect(() => {
    // Set a maximum loading time of 5 seconds
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Firebase loading timeout - continuing without auth');
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          // Try to fetch user profile from Firestore, but don't fail if it doesn't work
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserProfile({
                uid: user.uid,
                name: userData.displayName || userData.name || user.displayName || 'User',
                email: userData.email || user.email || ''
              });
            } else {
              // If no profile exists, create a basic one from auth user
              setUserProfile({
                uid: user.uid,
                name: user.displayName || 'User',
                email: user.email || ''
              });
            }
          } catch (firestoreError) {
            console.warn('Firestore not available, using basic profile:', firestoreError);
            // Fallback to basic profile from Firebase Auth
            console.log('User displayName:', user.displayName);
            console.log('User email:', user.email);
            setUserProfile({
              uid: user.uid,
              name: user.displayName || 'User',
              email: user.email || ''
            });
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
