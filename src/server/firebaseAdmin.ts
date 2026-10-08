import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import appletConfig from '../../firebase-applet-config.json';

export const AUTHORIZED_ADMIN_UID = 'Bj7qBJUBTvY97fQFAn1wpZEATUq2';
export const AUTHORIZED_ADMIN_EMAIL = 'ashishbarele45@gmail.com';

// Initialize Firebase Admin for server-side authorization and Razorpay webhook processing
const apps = getApps();
const app =
  apps.length > 0
    ? apps[0]
    : initializeApp({
        projectId: 'genius-course',
        storageBucket: 'genius-course.firebasestorage.app',
      });

console.log(`[FirebaseAdmin] Initializing with Canonical Project: genius-course, databaseId: ${appletConfig.firestoreDatabaseId || '(default)'}`);

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app, appletConfig.firestoreDatabaseId);
export const adminStorage = getStorage(app);

export async function initAdminClaims() {
  try {
    await adminAuth.setCustomUserClaims(AUTHORIZED_ADMIN_UID, {
      admin: true,
      role: 'ADMIN',
    });
    console.log(`[FirebaseAdmin] Verified and set custom claim { admin: true } for UID: ${AUTHORIZED_ADMIN_UID}`);
  } catch (err: any) {
    console.warn(`[FirebaseAdmin] Startup claims notice:`, err.message);
  }
}

export default app;
