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
        logger.debug({ userId, data }, 'Profile document retrieved');
        return {
          ...data,
          id: userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile;
      }

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
    try {
      const profileRef = doc(
        this.db,
        this.getProfilePath(userId),
        FIRESTORE_PATHS.SETTINGS
      );

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
        hasEmail: !!data.email,
        hasResumeUrl: !!data.resumeUrl,
        hasInterviewerProfile: !!data.interviewerProfile,
        dataKeys: Object.keys(data)
      }, 'About to save user profile to Firestore');
      
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

export const initializeFirestoreService = (db: Firestore): void => {
  firestoreService = new FirestoreService(db);
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
