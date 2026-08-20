import admin from 'firebase-admin';
import { env } from './env';

// Only initialize once
if (!admin.apps.length) {
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        // .env stores \n as literal \\n — replace back to real newlines
        privateKey:  env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Dev fallback — fire-admin won't verify tokens but app still boots
    admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID || 'certichain-dev' });
  }
}

export default admin;
