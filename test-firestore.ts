import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

const apps = getApps();
const app = apps.length > 0 ? apps[0] : initializeApp({
  projectId: 'ais-asia-east1-bc45373c6fb24a2'
});

const adminDb = getFirestore(app, 'ai-studio-geniusskills-f2da509d-52b5-43d4-91f4-07c7883272ae');

async function testFirestore() {
  try {
    console.log('Testing Firestore (Explicit Provisioned) connection...');
    const collections = await adminDb.listCollections();
    console.log('Available collections:', collections.map(c => c.id));
  } catch (error: any) {
    console.error('Firestore test error:', error);
  }
}

testFirestore();
