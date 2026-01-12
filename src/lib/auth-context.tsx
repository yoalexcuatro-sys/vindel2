'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string;
  location?: string;
  bio?: string;
  accountType: 'personal' | 'business';
  businessName?: string;
  cui?: string;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  createdAt: Date;
  stats: {
    selling: number;
    sold: number;
    favorites: number;
    views: number;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchedRef = useRef<string | null>(null);

  // Fetch user profile from Firestore with retry for newly created profiles
  const fetchUserProfile = useCallback(async (uid: string, retries = 5): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        setUserProfile(profile);
        profileFetchedRef.current = uid;
        return profile;
      } else if (retries > 0) {
        // Profile might not be synced yet after registration, retry after a short delay
        console.log(`Profile not found, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 800));
        return fetchUserProfile(uid, retries - 1);
      } else {
        console.log('No user profile found for:', uid);
        setUserProfile(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email || 'no user');
      setUser(firebaseUser);
      if (firebaseUser) {
        // Only fetch profile if we haven't already fetched it for this user
        if (profileFetchedRef.current !== firebaseUser.uid) {
          try {
            await fetchUserProfile(firebaseUser.uid);
          } catch (error) {
            console.error('Error in auth state change:', error);
          }
        }
      } else {
        setUserProfile(null);
        profileFetchedRef.current = null;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Update display name
    if (userData.displayName) {
      await updateProfile(user, { displayName: userData.displayName });
    }

    // Create user profile in Firestore
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName || null,
      photoURL: user.photoURL,
      phone: userData.phone || '',
      location: userData.location || '',
      bio: '',
      accountType: userData.accountType || 'personal',
      businessName: userData.businessName,
      cui: userData.cui,
      verified: false,
      rating: 0,
      reviewsCount: 0,
      createdAt: new Date(),
      stats: {
        selling: 0,
        sold: 0,
        favorites: 0,
        views: 0,
      },
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...newProfile,
      createdAt: serverTimestamp(),
    });

    setUserProfile(newProfile);
    profileFetchedRef.current = user.uid;
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const { user } = result;

    // Check if user profile exists
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Create new profile for Google user
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        accountType: 'personal',
        verified: false,
        rating: 0,
        reviewsCount: 0,
        createdAt: new Date(),
        stats: {
          selling: 0,
          sold: 0,
          favorites: 0,
          views: 0,
        },
      };

      await setDoc(docRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
      });

      setUserProfile(newProfile);
      profileFetchedRef.current = user.uid;
    } else {
      // Profile exists, set it
      setUserProfile(docSnap.data() as UserProfile);
      profileFetchedRef.current = user.uid;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    profileFetchedRef.current = null;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, data, { merge: true });

    // Update local state
    setUserProfile((prev) => (prev ? { ...prev, ...data } : null));

    // Update auth profile if display name or photo changed
    if (data.displayName || data.photoURL) {
      await updateProfile(user, {
        displayName: data.displayName || user.displayName,
        photoURL: data.photoURL || user.photoURL,
      });
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
