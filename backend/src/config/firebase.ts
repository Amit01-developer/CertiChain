import admin from 'firebase-admin';
import { env } from './env';

if (!admin.apps.length) {
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey:  env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID || 'certichain-dev' });
  }
}

export default admin;
