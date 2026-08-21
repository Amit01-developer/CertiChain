import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY     || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID  || 'certichain-3068f',
  storageBucket:     'certichain-3068f.firebasestorage.app',
  messagingSenderId: '507631200441',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID      || '',
  measurementId:     'G-ZF324F21QE',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth           = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
