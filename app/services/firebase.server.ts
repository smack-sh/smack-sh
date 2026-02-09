import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseConfig = {
  /*
   * Your Firebase config here
   * This should be moved to environment variables
   */
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const isFirebaseConfigured =
  !!firebaseConfig.projectId && !!firebaseConfig.clientEmail && !!firebaseConfig.privateKey;

let db: ReturnType<typeof getFirestore> | null = null;

if (isFirebaseConfigured) {
  const app =
    getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: firebaseConfig.projectId,
            clientEmail: firebaseConfig.clientEmail,
            privateKey: firebaseConfig.privateKey,
          }),
        })
      : getApps()[0];

  db = getFirestore(app);
}

export { db, isFirebaseConfigured };
