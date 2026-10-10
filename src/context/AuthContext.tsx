import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, formatFirebaseAuthError, trackEvent } from '../lib/firebase';
import { getUserProfile, createUserProfile, updateUserProfile, isPlatformAdminEmail, verifyAdminStatus, FirestoreUserProfile } from '../services/firebaseService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  profile: FirestoreUserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
}

const AUTHORIZED_ADMIN_EMAILS = [
  'admin.geniusskills@gmail.com',
  'ashishbarele45@gmail.com',
];

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return AUTHORIZED_ADMIN_EMAILS.includes(clean);
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<FirestoreUserProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pendingRegistrationNameRef = useRef<string | null>(null);

  useEffect(() => {
    // Single centralized onAuthStateChanged listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        let userProf: FirestoreUserProfile | null = null;

        // Strict role validation: Custom claims, admins/{uid} registry document, and authorized UID
        const isAdmin = await verifyAdminStatus(fbUser);

        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('genius_token', idToken);

          if (isAdmin) {
            fetch('/api/auth/sync-admin-claim', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
              },
            }).catch(() => {});
          }
        } catch (tokenErr) {
          console.warn('[Auth] Token notice:', tokenErr);
        }

        // Fast profile fetch with fallback
        try {
          userProf = await getUserProfile(fbUser.uid);
          if (!userProf) {
            const fallbackName = pendingRegistrationNameRef.current || fbUser.displayName || (isAdmin ? 'Administrator' : 'Student');
            userProf = await createUserProfile(fbUser.uid, {
              displayName: fallbackName,
              email: fbUser.email || '',
              role: isAdmin ? 'ADMIN' : 'STUDENT',
              photoURL: fbUser.photoURL || null,
              emailVerified: fbUser.emailVerified,
            });
          }
        } catch (err) {
          console.warn('[Auth] Profile sync notice:', err);
        }

        const resolvedName = pendingRegistrationNameRef.current
          || (userProf?.displayName && userProf.displayName !== 'Student' ? userProf.displayName : null)
          || (isAdmin ? (fbUser.displayName || 'Administrator') : (fbUser.displayName || 'Student'));

        const mappedUser: User = {
          id: fbUser.uid,
          name: resolvedName,
          email: fbUser.email || '',
          role: isAdmin ? 'ADMIN' : 'STUDENT',
        };

        setProfile(userProf);
        setUser(mappedUser);
      } else {
        setFirebaseUser(null);
        setProfile(null);
        setUser(null);
        localStorage.removeItem('genius_token');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCred.user;
      const isAdmin = await verifyAdminStatus(fbUser);

      try {
        const idToken = await fbUser.getIdToken();
        localStorage.setItem('genius_token', idToken);
      } catch {}

      const mappedUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || (isAdmin ? 'Administrator' : 'Student'),
        email: fbUser.email || '',
        role: isAdmin ? 'ADMIN' : 'STUDENT',
      };

      setUser(mappedUser);
      trackEvent('login', { method: 'password' });
      return mappedUser;
    } catch (error: any) {
      throw new Error(formatFirebaseAuthError(error));
    }
  };

  const loginWithGoogle = async (): Promise<User> => {
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      const fbUser = userCred.user;
      const isAdmin = await verifyAdminStatus(fbUser);

      try {
        const idToken = await fbUser.getIdToken();
        localStorage.setItem('genius_token', idToken);
      } catch {}

      // Fast non-blocking profile creation for Google user (default role STUDENT unless verified admin)
      createUserProfile(fbUser.uid, {
        displayName: fbUser.displayName || (isAdmin ? 'Administrator' : 'Student'),
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || null,
        emailVerified: fbUser.emailVerified,
        role: isAdmin ? 'ADMIN' : 'STUDENT',
      }).catch((err) => console.warn('[Auth] Google profile background notice:', err));

      const mappedUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || (isAdmin ? 'Administrator' : 'Student'),
        email: fbUser.email || '',
        role: isAdmin ? 'ADMIN' : 'STUDENT',
      };

      setUser(mappedUser);
      trackEvent('login', { method: 'google' });
      return mappedUser;
    } catch (error: any) {
      throw new Error(formatFirebaseAuthError(error));
    }
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    try {
      const cleanName = name.trim();
      const cleanEmail = email.trim();
      pendingRegistrationNameRef.current = cleanName;

      // 1. Create authentication user in Firebase
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCred.user;

      // 2. Set Firebase Auth display name and cache token in parallel
      const updatePromise = updateProfile(fbUser, { displayName: cleanName }).catch((err) =>
        console.warn('[Auth] Update profile notice:', err)
      );

      const tokenPromise = fbUser.getIdToken().then((idToken) => {
        localStorage.setItem('genius_token', idToken);
      }).catch(() => {});

      // 3. Create Firestore profile
      const firestorePromise = createUserProfile(fbUser.uid, {
        displayName: cleanName,
        email: fbUser.email || cleanEmail,
        role: 'STUDENT',
        emailVerified: fbUser.emailVerified,
      }).catch((err) => {
        console.warn('[Auth] Firestore profile creation notice:', err);
      });

      // 4. Non-blocking verification email
      sendEmailVerification(fbUser).catch(() => {});

      await Promise.all([updatePromise, tokenPromise, firestorePromise]);
      pendingRegistrationNameRef.current = null;

      const mappedUser: User = {
        id: fbUser.uid,
        name: cleanName,
        email: fbUser.email || cleanEmail,
        role: 'STUDENT',
      };

      setUser(mappedUser);
      trackEvent('sign_up', { method: 'password' });
      return mappedUser;
    } catch (error: any) {
      pendingRegistrationNameRef.current = null;
      throw new Error(formatFirebaseAuthError(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('genius_token');
    setUser(null);
    setProfile(null);
    setFirebaseUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error: any) {
      throw new Error(formatFirebaseAuthError(error));
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (error: any) {
        throw new Error(formatFirebaseAuthError(error));
      }
    }
  };

  const updateProfileName = async (name: string) => {
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: name.trim() });
        await updateUserProfile(auth.currentUser.uid, { displayName: name.trim() });
        setUser((prev) => (prev ? { ...prev, name: name.trim() } : null));
      } catch (err: any) {
        throw new Error(err.message || 'Failed to update profile.');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        profile,
        isAdmin: Boolean(user?.role === 'ADMIN'),
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        resendVerificationEmail,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
