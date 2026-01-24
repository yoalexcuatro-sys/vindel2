import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  memoryLocalCache,
  Firestore 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Clean environment variables (remove any accidental whitespace/newlines)
const cleanEnvVar = (value: string | undefined): string => {
  return value?.trim().replace(/[\n\r]/g, '') || '';
};

const firebaseConfig = {
  apiKey: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  // Use custom domain for authDomain to avoid cross-origin issues
  authDomain: 'vindel-a7069.firebaseapp.com',
  projectId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Use memory cache to avoid localStorage quota issues
  db = initializeFirestore(app, {
    localCache: memoryLocalCache()
  });
} else {
  app = getApps()[0];
  db = getFirestore(app);
}

export const auth = getAuth(app);
export const storage = getStorage(app);
export { db };

export default app;
