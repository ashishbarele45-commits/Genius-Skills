import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import appletConfig from '../../firebase-applet-config.json';

export const AUTHORIZED_ADMIN_EMAIL = 'admin.geniusskills@gmail.com';

// Initialize Firebase Admin for server-side authorization and processing
const apps = getApps();
let app: any;

if (apps.length > 0) {
  app = apps[0];
} else {
  let credentialConfig: any = undefined;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      credentialConfig = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
    } catch (e) {
      console.warn('[FirebaseAdmin] Could not parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  }

  app = initializeApp({
    projectId: 'genius-course',
    storageBucket: 'genius-course.firebasestorage.app',
    ...(credentialConfig ? { credential: credentialConfig } : {}),
  });
}

console.log(`[FirebaseAdmin] Initialized for project: genius-course, databaseId: ${appletConfig.firestoreDatabaseId || '(default)'}`);

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app, appletConfig.firestoreDatabaseId);
export const adminStorage = getStorage(app);

export async function setAdminClaimsForUser(uid: string): Promise<boolean> {
  try {
    await adminAuth.setCustomUserClaims(uid, {
      admin: true,
      role: 'ADMIN',
    });
    console.log(`[FirebaseAdmin] Set custom claims { admin: true, role: 'ADMIN' } for UID: ${uid}`);
    return true;
  } catch (err: any) {
    console.warn(`[FirebaseAdmin] Notice: setCustomUserClaims for UID ${uid}:`, err.message);
    return false;
  }
}

export async function initAdminClaims(): Promise<void> {
  console.log(`[FirebaseAdmin] Ready for project genius-course with admin: ${AUTHORIZED_ADMIN_EMAIL}`);
}

export default app;
