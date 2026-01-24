'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  role?: 'user' | 'admin';
  promotionEnabled?: boolean;
  accountType: 'personal' | 'business';
  // Business fields
  businessName?: string;
  cui?: string;
  nrRegistruComert?: string; // J12/1234/2024
  adresaSediu?: string;
  oras?: string;
  judet?: string;
  codPostal?: string;
  tara?: string;
  iban?: string;
  banca?: string;
  reprezentantLegal?: string;
  telefonFirma?: string;
  emailFirma?: string;
  website?: string;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  createdAt: Date;
  stats: {
    selling: number;
    sold: number;
    favorites: number;
    views: number;
    followers?: number;
    following?: number;
  };
  settings?: {
    profileVisible?: boolean;
    showPhone?: boolean;
    showOnline?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    // Cargar perfil de caché inmediatamente para carga instantánea
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('user-profile-cache');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  // Handle redirect result from Google sign-in
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('Redirect result received, handling user...');
          // User profile will be handled by onAuthStateChanged
        }
      } catch (error: any) {
        console.error('Redirect result error:', error);
      }
    };
    handleRedirectResult();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      // If no user, profile loading is also done (it's null)
      if (!firebaseUser) {
        setProfileLoading(false);
        setUserProfile(null);
      } else {
        // If user exists, we start loading profile
        setProfileLoading(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        // Try to fetch profile with retries for newly created accounts
        let profile: UserProfile | null = null;
        
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              profile = docSnap.data() as UserProfile;
              break;
            } else {
              if (attempt < 4) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            if (attempt < 4) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (profile) {
          setUserProfile(profile);
          // Guardar en caché para carga instantánea
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('user-profile-cache', JSON.stringify(profile));
            } catch {}
          }
        } else {
            // Self-repair: Create a default profile if it is missing after retries
            const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: 'user',
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

            try {
                await setDoc(doc(db, 'users', user.uid), {
                  ...newProfile,
                  createdAt: serverTimestamp(),
                });
                setUserProfile(newProfile);
                // Guardar en caché
                if (typeof window !== 'undefined') {
                  try {
                    sessionStorage.setItem('user-profile-cache', JSON.stringify(newProfile));
                  } catch {}
                }
            } catch (createError) {
                console.error('Failed to create default profile:', createError);
                setUserProfile(null);
            }
        }
        setProfileLoading(false);
      } else {
        setUserProfile(null);
        // Limpiar caché cuando no hay usuario
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('user-profile-cache');
          } catch {}
        }
        setProfileLoading(false);
      }
    }

    if (!loading) {
      if (user) {
        fetchProfile();
      }
    }
  }, [user, loading]);

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Update display name
    if (userData.displayName) {
      await updateProfile(user, { displayName: userData.displayName });
    }

    // Create user profile in Firestore (exclude undefined values for Firestore)
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName || null,
      photoURL: user.photoURL,
      phone: userData.phone || '',
      location: userData.location || '',
      bio: '',
      role: 'user',
      accountType: userData.accountType || 'personal',
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

    // Only add business fields if they have values (Firestore doesn't accept undefined)
    if (userData.businessName) {
      newProfile.businessName = userData.businessName;
    }
    if (userData.cui) {
      newProfile.cui = userData.cui;
    }

    await setDoc(doc(db, 'users', user.uid), {
      ...newProfile,
      createdAt: serverTimestamp(),
    });

    setUserProfile(newProfile);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    // Try popup first, fall back to redirect if it fails
    try {
      const result = await signInWithPopup(auth, provider);
      await handleGoogleUser(result.user);
    } catch (popupError: any) {
      console.log('Popup failed, trying redirect...', popupError.code);
      // If popup is blocked or fails, use redirect
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request' ||
          popupError.code === 'auth/unauthorized-domain') {
        await signInWithRedirect(auth, provider);
      } else {
        throw popupError;
      }
    }
  };

  const handleGoogleUser = async (user: User) => {
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
        role: 'user',
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
    } else {
      // Profile exists, set it
      setUserProfile(docSnap.data() as UserProfile);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    // Limpiar caché
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('user-profile-cache');
      } catch {}
    }
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
    profileLoading,
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
