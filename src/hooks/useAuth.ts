/**
 * @file hooks/useAuth.ts
 * @description Hook for authentication management
 */

import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { createLogger } from '../utils/logger';
import { handleError } from '../utils/error-handler';
import { getFirebaseInstances } from '../services/firebase';
import type { UserProfile, ApiError } from '../types';

const logger = createLogger('useAuth');

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const setupAuth = async () => {
      try {
        // Add a small delay to ensure Firebase is initialized in App.tsx first
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { auth } = getFirebaseInstances();

        unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
          if (firebaseUser) {
            setUserId(firebaseUser.uid);
            setIsAuthenticated(true);
            // Don't load profile here - let App.tsx handle it after Firestore is initialized
          } else {
            setUserId(null);
            setUser(null);
            setIsAuthenticated(false);
          }

          setIsAuthReady(true);
        });
      } catch (err) {
        // Retry if Firebase is not yet initialized
        timeoutId = setTimeout(setupAuth, 200);
      }
    };

    setupAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      const { auth } = getFirebaseInstances();
      await signOut(auth);
      setUser(null);
      setUserId(null);
      setIsAuthenticated(false);
      logger.info('User logged out');
    } catch (err) {
      const appError = handleError(err);
      setError(appError);
      throw appError;
    }
  }, []);

  return {
    user,
    userId,
    isAuthReady,
    isAuthenticated,
    error,
    logout,
  };
};
