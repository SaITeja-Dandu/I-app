/**
 * @file config/firebase.ts
 * @description Firebase Admin SDK initialization
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp: admin.app.App;

export const initializeFirebaseAdmin = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Initialize with service account credentials
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    console.log('✅ Firebase Admin initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
  }
};

export const getFirestore = (): admin.firestore.Firestore => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin not initialized');
  }
  return firebaseApp.firestore();
};

export const getAuth = (): admin.auth.Auth => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin not initialized');
  }
  return firebaseApp.auth();
};

export { admin };
