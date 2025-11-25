/**
 * @file services/firestore.ts
 * @description Firestore database operations
 */

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  limit,
  orderBy,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { createLogger } from '../utils/logger';
import { AppError } from '../utils/error-handler';
import { ERROR_CODES } from '../utils/constants';
import { FIRESTORE_PATHS } from '../utils/constants';
import type { UserProfile, InterviewSession } from '../types';

const logger = createLogger('firestore');

export class FirestoreService {
  private db: Firestore;
  private appId: string;

  constructor(db: Firestore) {
    this.db = db;
    this.appId =
      import.meta.env.VITE_APP_ID ||
      (typeof (window as any).__app_id !== 'undefined'
        ? (window as any).__app_id
        : 'default-app-id');
    logger.info({ appId: this.appId }, '🔵 [FIRESTORE] Service initialized with appId');
  }

  private getProfilePath(userId: string): string {
    return `${FIRESTORE_PATHS.ARTIFACTS}/${this.appId}/${FIRESTORE_PATHS.USERS}/${userId}/${FIRESTORE_PATHS.PROFILE}`;
  }

  private getInterviewsPath(userId: string): string {
    return `${FIRESTORE_PATHS.ARTIFACTS}/${this.appId}/${FIRESTORE_PATHS.USERS}/${userId}/${FIRESTORE_PATHS.INTERVIEWS}`;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileRef = doc(
        this.db,
        this.getProfilePath(userId),
        FIRESTORE_PATHS.SETTINGS
      );
      const docSnap = await getDoc(profileRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('[FirestoreService.getUserProfile] Profile retrieved with fields:', { name: data.name, email: data.email, phoneNumber: data.phoneNumber });
        logger.debug({ userId, data }, 'Profile document retrieved');
        return {
          ...data,
          id: userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile;
      }

      console.log('[FirestoreService.getUserProfile] No profile document found for user:', userId);
      logger.warn({ userId }, 'No profile document found for user');
      return null;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get user profile');
      throw new AppError(
        ERROR_CODES.DB_ERROR,
        'Failed to fetch user profile',
        undefined,
        error
      );
    }
  }

  async saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
    console.log('[FirestoreService.saveUserProfile] Called with profile object keys:', Object.keys(profile));
    console.log('[FirestoreService.saveUserProfile] Profile content:', { name: profile.name, email: profile.email, phoneNumber: profile.phoneNumber, userType: profile.userType });
    try {
      // Root user document path (used by interviewer listing queries)
      const userRootRef = doc(
        this.db,
        `${FIRESTORE_PATHS.ARTIFACTS}/${this.appId}/${FIRESTORE_PATHS.USERS}/${userId}`
      );

      const profileRef = doc(
        this.db,
        this.getProfilePath(userId),
        FIRESTORE_PATHS.SETTINGS
      );

      // Prepare root doc FIRST (only safe, shallow fields – exclude large nested objects)
      // This MUST be created before or at the same time as the nested profile
      const rootData: Record<string, any> = {
        uid: userId, // Include uid for reference
        userType: profile.userType, // CRITICAL: Query filters on this
        role: profile.role,
        updatedAt: new Date(),
      };
      if (profile.email) rootData.email = profile.email;
      if (profile.name) rootData.name = profile.name; // IMPORTANT: Save name to root doc
      if (profile.createdAt) rootData.createdAt = profile.createdAt;
      // Store a minimal interviewer flag for faster querying
      if (profile.interviewerProfile) {
        rootData.isInterviewer = true;
        // Active marker (default true unless explicitly false)
        rootData.isActive = profile.interviewerProfile.isActive !== false;
      }

      logger.debug({ 
        userId,
        profileUserType: profile.userType,
        hasInterviewerProfile: !!profile.interviewerProfile,
        rootDataToSave: rootData,
        name: profile.name
      }, 'Preparing to save root document with name');

      // Save root document FIRST - this is what getAvailableInterviewers queries
      logger.info({ userId, rootPath: `artifacts/${this.appId}/users/${userId}` }, '🔵 [FIRESTORE] About to save root document');
      console.log('[FirestoreService] About to save root doc with:', { email: rootData.email, name: rootData.name, userType: rootData.userType });
      try {
        await setDoc(userRootRef, rootData, { merge: true });
        logger.info({ userId, rootPath: `artifacts/${this.appId}/users/${userId}` }, '🟢 [FIRESTORE] Root document saved successfully');
      } catch (rootDocError) {
        logger.error({ error: rootDocError, userId, rootPath: `artifacts/${this.appId}/users/${userId}` }, '🔴 [FIRESTORE] Failed to save root document');
        throw rootDocError;
      }
      
      logger.debug({ 
        userId, 
        userType: rootData.userType,
        rootFields: Object.keys(rootData)
      }, 'Root user document saved');

      // Filter out undefined values - Firestore doesn't allow undefined fields
      const data: Record<string, any> = {
        uid: userId, // Always save the uid
        role: profile.role,
        skills: profile.skills,
        userType: profile.userType,
        createdAt: profile.createdAt || new Date(),
        updatedAt: new Date(),
      };

      // Only add optional fields if they're defined
      if (profile.email) {
        data.email = profile.email;
      } else {
        console.log('[FirestoreService] WARNING: email is undefined in profile object:', { profile });
      }
      if (profile.name) {
        data.name = profile.name; // Save name to nested profile too
      } else {
        console.log('[FirestoreService] WARNING: name is undefined in profile object:', { profile });
      }
      if (profile.phoneNumber) {
        data.phoneNumber = profile.phoneNumber;
      }
      if (profile.resumeUrl) {
        data.resumeUrl = profile.resumeUrl;
      }
      if (profile.interviewerProfile) {
        data.interviewerProfile = profile.interviewerProfile;
      }

      logger.debug({ 
        userId, 
        userType: data.userType,
        name: data.name,
        hasEmail: !!data.email,
        hasResumeUrl: !!data.resumeUrl,
        hasInterviewerProfile: !!data.interviewerProfile,
        dataKeys: Object.keys(data)
      }, 'About to save user profile to Firestore');
      
      // Then save the nested profile document
      console.log('[FirestoreService] About to save nested profile with:', { email: data.email, name: data.name, userType: data.userType });
      await setDoc(profileRef, data, { merge: true });
      
      logger.info({ 
        userId, 
        userType: profile.userType, 
        hasInterviewerProfile: !!profile.interviewerProfile,
        savedFields: Object.keys(data)
      }, 'User profile saved successfully');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to save user profile');
      throw new AppError(
        ERROR_CODES.DB_ERROR,
        'Failed to save user profile',
        undefined,
        error
      );
    }
  }

  async saveInterviewSession(userId: string, session: InterviewSession): Promise<string> {
    try {
      const sessionsRef = collection(this.db, this.getInterviewsPath(userId));

      const sessionData = {
        role: session.role,
        skills: session.skills,
        date: Timestamp.fromDate(session.date),
        score: session.score,
        duration: session.duration,
        questions: session.questions,
        status: session.status,
        metrics: session.metrics,
      };

      const docRef = await addDoc(sessionsRef, sessionData);
      logger.info({ userId, sessionId: docRef.id }, 'Interview session saved');
      return docRef.id;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to save interview session');
      throw new AppError(
        ERROR_CODES.DB_ERROR,
        'Failed to save interview session',
        undefined,
        error
      );
    }
  }

  subscribeToInterviewHistory(
    userId: string,
    onData: (sessions: InterviewSession[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const sessionsRef = collection(this.db, this.getInterviewsPath(userId));
      const q = query(
        sessionsRef,
        orderBy('date', 'desc'),
        limit(10)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const sessions: InterviewSession[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              userId,
              role: data.role,
              skills: data.skills,
              date: data.date?.toDate() || new Date(),
              score: data.score,
              duration: data.duration,
              questions: data.questions || [],
              status: data.status || 'completed',
              metrics: data.metrics,
            } as InterviewSession;
          });

          onData(sessions);
        },
        (error) => {
          logger.error({ error, userId }, 'Failed to listen to interview history');
          if (onError) {
            onError(
              new AppError(
                ERROR_CODES.DB_ERROR,
                'Failed to load interview history',
                undefined,
                error
              )
            );
          }
        }
      );
    } catch (error) {
      logger.error({ error, userId }, 'Failed to subscribe to interview history');
      if (onError) {
        onError(
          new AppError(
            ERROR_CODES.DB_ERROR,
            'Failed to subscribe to interview history',
            undefined,
            error
          )
        );
      }
      return () => {};
    }
  }
}

export let firestoreService: FirestoreService | null = null;
let isFirestoreServiceReady = false;

export const initializeFirestoreService = (db: Firestore): void => {
  firestoreService = new FirestoreService(db);
  isFirestoreServiceReady = true;
  logger.info('Firestore service initialized and ready');
};

export const getFirestoreService = (): FirestoreService => {
  if (!firestoreService) {
    throw new AppError(
      ERROR_CODES.DB_ERROR,
      'Firestore service not initialized'
    );
  }
  return firestoreService;
};

/**
 * Check if Firestore service is initialized
 */
export const isFirestoreServiceInitialized = (): boolean => {
  return isFirestoreServiceReady && firestoreService !== null;
};

/**
 * Wait for Firestore service to be initialized
 * @param maxWaitMs Maximum time to wait in milliseconds (default 30s)
 * @throws AppError if service doesn't initialize within timeout
 */
export const waitForFirestoreService = async (maxWaitMs = 30000): Promise<FirestoreService> => {
  // If already initialized, return immediately
  if (isFirestoreServiceReady && firestoreService) {
    return firestoreService;
  }

  const startTime = Date.now();
  let lastLogTime = startTime;
  
  while (!isFirestoreServiceReady || !firestoreService) {
    const elapsed = Date.now() - startTime;
    
    // Log progress every 2 seconds
    if (Date.now() - lastLogTime > 2000) {
      logger.debug(`Waiting for Firestore service... ${elapsed}ms elapsed`);
      lastLogTime = Date.now();
    }
    
    if (elapsed > maxWaitMs) {
      logger.error(`Firestore service initialization timeout after ${elapsed}ms`);
      throw new AppError(
        ERROR_CODES.DB_ERROR,
        'Firestore service took too long to initialize. Please refresh the page.'
      );
    }
    
    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  logger.debug('Firestore service is ready');
  return firestoreService;
};
