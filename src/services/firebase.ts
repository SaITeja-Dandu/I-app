/**
 * @file services/firebase.ts
 * @description Firebase initialization and configuration
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import { createLogger } from '../utils/logger';
import { AppError } from '../utils/error-handler';
import { ERROR_CODES } from '../utils/constants';

const logger = createLogger('firebase');

let auth: Auth | null = null;
let db: Firestore | null = null;

const getFirebaseConfig = (): Record<string, string> => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };

  if (typeof (window as any).__firebase_config !== 'undefined') {
    try {
      const envConfig = JSON.parse((window as any).__firebase_config);
      return { ...config, ...envConfig };
    } catch (e) {
      logger.warn('Failed to parse environment Firebase config');
    }
  }

  return config;
};

export const initializeFirebase = async (): Promise<{
  auth: Auth;
  db: Firestore;
}> => {
  try {
    const config = getFirebaseConfig();

    if (!config.projectId) {
      throw new AppError(
        ERROR_CODES.AUTH_FAILED,
        'Firebase configuration is missing'
      );
    }

    const app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);

    // Set persistence to LOCAL so users stay logged in across sessions
    await setPersistence(auth, browserLocalPersistence);

    logger.info('Firebase initialized successfully');

    // Check for initial auth token (e.g., from server-side rendering)
    const token =
      typeof (window as any).__initial_auth_token !== 'undefined'
        ? (window as any).__initial_auth_token
        : null;

    if (token) {
      await signInWithCustomToken(auth, token);
      logger.info('User authenticated with custom token');
    }
    // Do NOT sign in anonymously - let users stay unauthenticated until they explicitly sign up/login

    return { auth, db };
  } catch (error) {
    logger.error({ error }, 'Firebase initialization failed');
    throw new AppError(
      ERROR_CODES.AUTH_FAILED,
      'Failed to initialize Firebase',
      undefined,
      error
    );
  }
};

export const getFirebaseInstances = (): {
  auth: Auth;
  db: Firestore;
} => {
  if (!auth || !db) {
    throw new AppError(
      ERROR_CODES.DB_ERROR,
      'Firebase not initialized'
    );
  }
  return { auth, db };
};
