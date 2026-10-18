import { initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// Next pre-renders client components on the server. Firebase Auth validates
// the API key during initialization, so defer Auth until the browser and only
// initialize it when the public Firebase configuration is present.
const auth: Auth | null = typeof window !== 'undefined' && firebaseConfig.apiKey
  ? getAuth(app)
  : null;
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
