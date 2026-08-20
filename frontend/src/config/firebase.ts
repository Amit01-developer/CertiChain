import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY    || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID  || 'htl-34e13',
  storageBucket:     'htl-34e13.firebasestorage.app',
  messagingSenderId: '507374991528',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID      || '',
  measurementId:     'G-K68NK5VPBV',
};

// Prevent duplicate initialization (e.g. HMR in dev)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth           = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
