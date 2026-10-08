import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported, logEvent, Analytics } from 'firebase/analytics';
import appletConfig from '../../firebase-applet-config.json';

// Canonical Firebase Web App configuration provided by the user as single source of truth
export const firebaseConfig = {
  apiKey: "AIzaSyC2SDgR1jsvq4TnaVvLu-8mFvKgLsZJv1s",
  authDomain: "genius-course.firebaseapp.com",
  projectId: "genius-course",
  storageBucket: "genius-course.firebasestorage.app",
  messagingSenderId: "465240710133",
  appId: "1:465240710133:web:92b9f4b555ff3d915e5ebc",
  measurementId: "G-9D3T2506L5"
};

// Exactly ONE central Firebase app initialization across the entire application
const existingApps = getApps();
export const app: FirebaseApp = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);

// Canonical services using the SAME app instance
export const auth = getAuth(app);
export const db = appletConfig.firestoreDatabaseId
  ? getFirestore(app, appletConfig.firestoreDatabaseId)
  : getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider configured for popups / account selection
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Non-blocking Firebase Analytics
let analyticsInstance: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        try {
          analyticsInstance = getAnalytics(app);
        } catch (error) {
          console.warn('[Firebase Analytics] Init error:', error);
        }
      }
    })
    .catch(() => {});
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (analyticsInstance) {
    try {
      logEvent(analyticsInstance, eventName, params);
    } catch {
      // Non-blocking analytics
    }
  }
}

/**
 * Formats Firebase Authentication error codes into human-actionable messages.
 */
export function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  const message = error?.message || '';
  const activeProjectId = auth.app.options.projectId;

  if (
    code === 'auth/operation-not-allowed' ||
    message.includes('auth/operation-not-allowed') ||
    message.includes('OPERATION_NOT_ALLOWED') ||
    message.includes('PASSWORD_LOGIN_DISABLED')
  ) {
    return `Firebase: Error (auth/operation-not-allowed). The Email/Password sign-in provider is not enabled in your Firebase project (${activeProjectId}). Please verify Email/Password provider status in Firebase Console.`;
  }

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/requires-recent-login':
      return 'This action requires recent authentication. Please sign in again.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return `Firebase API key is invalid or restricted for project ${activeProjectId}. Please check your Firebase project configuration.`;
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in operation was cancelled.';
    default:
      return error?.message || 'Authentication error. Please try again.';
  }
}
