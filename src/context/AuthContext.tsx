import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { getUserProfile, createUserProfile, updateUserProfile, FirestoreUserProfile } from '../services/firebaseService';
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

const AUTHORIZED_ADMIN_UID = 'Bj7qBJUBTvY97fQFAn1wpZEATUq2';
const AUTHORIZED_ADMIN_EMAIL = 'ashishbarele45@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<FirestoreUserProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Real Firebase onAuthStateChanged listener on central canonical auth instance
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        let userProf: FirestoreUserProfile | null = null;
        let isAdmin = false;

        try {
          userProf = await getUserProfile(fbUser.uid);
          if (!userProf) {
            userProf = await createUserProfile(fbUser.uid, {
              displayName: fbUser.displayName || 'Student',
              email: fbUser.email || '',
              emailVerified: fbUser.emailVerified,
              photoURL: fbUser.photoURL || null,
            });
          }
        } catch (err) {
          console.warn('[Auth] Error fetching or creating Firestore user profile:', err);
        }

        try {
          let idToken = await fbUser.getIdToken();
          let tokenResult = await fbUser.getIdTokenResult();
          
          // Secure admin check: authorized Firebase UID / Email and custom claims
          const isExactAdminAccount =
            fbUser.uid === AUTHORIZED_ADMIN_UID ||
            (fbUser.email || '').toLowerCase() === AUTHORIZED_ADMIN_EMAIL;

          const hasAdminClaim = Boolean(
            tokenResult.claims?.admin === true ||
            tokenResult.claims?.role === 'ADMIN'
          );

          isAdmin = isExactAdminAccount || hasAdminClaim;

          // If exact authorized admin account, request trusted backend sync
          if (isExactAdminAccount) {
            try {
              const syncRes = await fetch('/api/auth/sync-admin-claim', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                  'Content-Type': 'application/json',
                },
              });
              if (syncRes.ok) {
                tokenResult = await fbUser.getIdTokenResult(true);
                idToken = await fbUser.getIdToken();
              }
            } catch (syncErr) {
              console.warn('[Auth] Error syncing admin custom claim:', syncErr);
            }
          }

          localStorage.setItem('genius_token', idToken);
        } catch (err) {
          console.warn('[Auth] Error obtaining token:', err);
        }

        const resolvedName = userProf?.displayName && userProf.displayName !== 'Student'
          ? userProf.displayName
          : (isAdmin ? (fbUser.displayName || 'Ashish Barele') : (fbUser.displayName || 'Student'));

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

      let userProf: FirestoreUserProfile | null = null;
      try {
        userProf = await getUserProfile(fbUser.uid);
        if (!userProf) {
          userProf = await createUserProfile(fbUser.uid, {
            displayName: fbUser.displayName || 'Student',
            email: fbUser.email || '',
          });
        }
      } catch (err) {
        console.warn('[Auth] Profile fetch fallback in login:', err);
      }

      let isAdmin = false;
      try {
        let idToken = await fbUser.getIdToken();
        let tokenResult = await fbUser.getIdTokenResult();
        
        const isExactAdminAccount =
          fbUser.uid === AUTHORIZED_ADMIN_UID ||
          (fbUser.email || '').toLowerCase() === AUTHORIZED_ADMIN_EMAIL;

        const hasAdminClaim = Boolean(
          tokenResult.claims?.admin === true ||
          tokenResult.claims?.role === 'ADMIN'
        );

        isAdmin = isExactAdminAccount || hasAdminClaim;

        if (isExactAdminAccount) {
          try {
            const syncRes = await fetch('/api/auth/sync-admin-claim', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
              },
            });
            if (syncRes.ok) {
              tokenResult = await fbUser.getIdTokenResult(true);
              idToken = await fbUser.getIdToken();
            }
          } catch (syncErr) {
            console.warn('[Auth] Error syncing admin custom claim during login:', syncErr);
          }
        }

        localStorage.setItem('genius_token', idToken);
      } catch (err) {
        console.warn('[Auth] Token error in login:', err);
      }

      const resolvedName = userProf?.displayName && userProf.displayName !== 'Student'
        ? userProf.displayName
        : (isAdmin ? (fbUser.displayName || 'Ashish Barele') : (fbUser.displayName || 'Student'));

      const mappedUser: User = {
        id: fbUser.uid,
        name: resolvedName,
        email: fbUser.email || '',
        role: isAdmin ? 'ADMIN' : 'STUDENT',
      };

      setProfile(userProf);
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

      let userProf: FirestoreUserProfile | null = null;
      try {
        userProf = await getUserProfile(fbUser.uid);
        if (!userProf) {
          userProf = await createUserProfile(fbUser.uid, {
            displayName: fbUser.displayName || 'Student',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || null,
            emailVerified: fbUser.emailVerified,
          });
        }
      } catch (err) {
        console.warn('[Auth] Google Profile fetch fallback:', err);
      }

      let isAdmin = false;
      try {
        let idToken = await fbUser.getIdToken();
        let tokenResult = await fbUser.getIdTokenResult();
        
        const isExactAdminAccount =
          fbUser.uid === AUTHORIZED_ADMIN_UID ||
          (fbUser.email || '').toLowerCase() === AUTHORIZED_ADMIN_EMAIL;

        const hasAdminClaim = Boolean(
          tokenResult.claims?.admin === true ||
          tokenResult.claims?.role === 'ADMIN'
        );

        isAdmin = isExactAdminAccount || hasAdminClaim;

        if (isExactAdminAccount) {
          try {
            const syncRes = await fetch('/api/auth/sync-admin-claim', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
              },
            });
            if (syncRes.ok) {
              tokenResult = await fbUser.getIdTokenResult(true);
              idToken = await fbUser.getIdToken();
            }
          } catch (syncErr) {
            console.warn('[Auth] Error syncing admin custom claim during Google login:', syncErr);
          }
        }

        localStorage.setItem('genius_token', idToken);
      } catch (err) {
        console.warn('[Auth] Token error in Google login:', err);
      }

      const resolvedName = userProf?.displayName && userProf.displayName !== 'Student'
        ? userProf.displayName
        : (isAdmin ? (fbUser.displayName || 'Ashish Barele') : (fbUser.displayName || 'Student'));

      const mappedUser: User = {
        id: fbUser.uid,
        name: resolvedName,
        email: fbUser.email || '',
        role: isAdmin ? 'ADMIN' : 'STUDENT',
      };

      setProfile(userProf);
      setUser(mappedUser);
      trackEvent('login', { method: 'google' });
      return mappedUser;
    } catch (error: any) {
      throw new Error(formatFirebaseAuthError(error));
    }
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCred.user;

      try {
        await updateProfile(fbUser, { displayName: name.trim() });
      } catch (err) {
        console.warn('[Auth] Failed to update display name on user:', err);
      }

      let userProf: FirestoreUserProfile | null = null;
      try {
        userProf = await createUserProfile(fbUser.uid, {
          displayName: name.trim(),
          email: fbUser.email || '',
          role: 'STUDENT',
          emailVerified: fbUser.emailVerified,
        });
      } catch (err) {
        console.warn('[Auth] Profile creation in Firestore fallback:', err);
      }

      const mappedUser: User = {
        id: fbUser.uid,
        name: name.trim(),
        email: fbUser.email || '',
        role: 'STUDENT',
      };

      try {
        const idToken = await fbUser.getIdToken();
        localStorage.setItem('genius_token', idToken);
      } catch {}

      try {
        await sendEmailVerification(fbUser);
      } catch {
        // Verification email is non-fatal
      }

      setProfile(userProf);
      setUser(mappedUser);
      trackEvent('sign_up', { method: 'password' });
      return mappedUser;
    } catch (error: any) {
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
        isAdmin: Boolean(user?.role === 'ADMIN' && user?.id === AUTHORIZED_ADMIN_UID),
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
