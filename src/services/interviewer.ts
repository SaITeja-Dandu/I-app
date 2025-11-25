/**
 * @file services/interviewer.ts
 * @description Service for managing interviewer-related operations
 */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  limit,
  startAfter,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { createLogger } from '../utils/logger';
import { FIRESTORE_PATHS } from '../utils/constants';

const logger = createLogger('interviewer-service');

export interface InterviewerWithProfile {
  id: string;
  email?: string;
  name?: string;
  userType: 'interviewer';
  role: string;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
  interviewerProfile: {
    yearsOfExperience: number;
    specializations: string[];
    bio: string;
    company?: string;
    title?: string;
    linkedIn?: string;
    hourlyRate?: number;
    availability?: any;
    rating?: number;
    totalReviews?: number;
    isActive?: boolean;
  };
}

export interface InterviewerFilters {
  specializations?: string[];
  minExperience?: number;
  minRating?: number;
  maxHourlyRate?: number;
}

export interface InterviewerSearchResult {
  interviewers: InterviewerWithProfile[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export class InterviewerService {
  private db: Firestore;
  private appId: string;

  constructor(db: Firestore) {
    this.db = db;
    this.appId =
      import.meta.env.VITE_APP_ID ||
      (typeof (window as any).__app_id !== 'undefined'
        ? (window as any).__app_id
        : 'interview-navigator');
    logger.info({ appId: this.appId }, '🔵 [INTERVIEWER-SERVICE] Service initialized with appId');
  }

  /**
   * Get available interviewers with filtering and pagination
   */
  async getAvailableInterviewers(
    filters: InterviewerFilters = {},
    pageSize: number = 10,
    lastDocument?: DocumentSnapshot
  ): Promise<InterviewerSearchResult> {
    try {
      logger.info({ pageSize }, '🔵 [INTERVIEWER-SEARCH] Starting getAvailableInterviewers');
      
      const usersRef = collection(
        this.db,
        `artifacts/${this.appId}/${FIRESTORE_PATHS.USERS}`
      );

      // Build base query for interviewers
      let q = query(
        usersRef,
        where('userType', '==', 'interviewer'),
        limit(pageSize + 1) // Fetch one extra to check if there are more
      );

      // Add pagination
      if (lastDocument) {
        q = query(q, startAfter(lastDocument));
      }

      const snapshot = await getDocs(q);
      logger.info({ count: snapshot.size }, '🔵 [INTERVIEWER-SEARCH] Fetched interviewer root documents via query');

      // Debug: Log all root documents found
      if (snapshot.size === 0) {
        logger.warn({}, '🟡 [INTERVIEWER-SEARCH] No interviewer root documents found - checking if any users exist in database');
        // Try to find ANY users to debug
        const allUsersQuery = query(collection(this.db, `artifacts/${this.appId}/${FIRESTORE_PATHS.USERS}`));
        const allUsers = await getDocs(allUsersQuery);
        logger.debug({ 
          totalUsersFound: allUsers.size,
          userIds: allUsers.docs.map(d => ({ id: d.id, userType: d.data().userType }))
        }, 'All users in database');
      }

      // Convert documents to profiles
      let interviewers: InterviewerWithProfile[] = [];
      const docs: DocumentSnapshot[] = [];

      logger.info({ rootDocCount: snapshot.docs.length }, '🔵 [INTERVIEWER-SEARCH] Processing root documents');
      
      for (const docSnap of snapshot.docs) {
        try {
          logger.debug({ userId: docSnap.id }, '🔵 [INTERVIEWER-SEARCH] Loading nested profile for root doc');
          const profileDoc = await getDoc(
            doc(docSnap.ref, 'profile/settings')
          );
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            console.log('[InterviewerService] Profile data loaded:', { userId: docSnap.id, name: data.name, email: data.email, hasInterviewerProfile: !!data.interviewerProfile });
            logger.debug({ userId: docSnap.id, hasInterviewerProfile: !!data.interviewerProfile, isActive: data.interviewerProfile?.isActive }, '🔵 [INTERVIEWER-SEARCH] Profile exists');
            
            if (data.interviewerProfile && data.interviewerProfile.isActive !== false) {
              console.log('[InterviewerService] Creating InterviewerWithProfile:', { id: docSnap.id, name: data.name, email: data.email });
              logger.debug({ userId: docSnap.id }, '🟢 [INTERVIEWER-SEARCH] Adding interviewer to results');
              interviewers.push({
                id: docSnap.id,
                email: data.email,
                name: data.name,
                userType: 'interviewer',
                role: data.role || '',
                skills: data.skills || [],
                interviewerProfile: data.interviewerProfile,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              });
              docs.push(docSnap);
            }
          } else {
            logger.debug({ userId: docSnap.id }, '🟡 [INTERVIEWER-SEARCH] No nested profile document found');
          }
        } catch (err) {
          logger.warn({ error: err, userId: docSnap.id }, '🔴 [INTERVIEWER-SEARCH] Failed to load nested profile for root doc');
        }
      }

      logger.info({ foundCount: interviewers.length }, '🟢 [INTERVIEWER-SEARCH] Processed all root documents');

      // Fallback: if no interviewers found via root docs, search profile documents directly
      // This handles case where interviewers exist but root documents weren't created
      if (interviewers.length === 0) {
        logger.warn({}, '🟡 [INTERVIEWER-SEARCH] No interviewers found via root docs - attempting fallback search in profile documents');
        try {
          const profilesCollection = collection(
            this.db,
            `artifacts/${this.appId}/${FIRESTORE_PATHS.USERS}`
          );
          const allUsersQuery = query(profilesCollection);
          const allUsersDocs = await getDocs(allUsersQuery);
          
          logger.info({ 
            totalUserDocs: allUsersDocs.size,
            userIds: allUsersDocs.docs.map(d => d.id)
          }, '🔵 [INTERVIEWER-SEARCH-FALLBACK] Checking all user documents');

          if (allUsersDocs.size === 0) {
            logger.warn({}, '🟡 [INTERVIEWER-SEARCH-FALLBACK] No user root documents found - database may be empty');
          } else {
            logger.info({ count: allUsersDocs.size }, '🔵 [INTERVIEWER-SEARCH-FALLBACK] Found user root documents, checking profiles...');
          }

          for (const userDoc of allUsersDocs.docs) {
            try {
              logger.debug({ userId: userDoc.id }, '🔵 [INTERVIEWER-SEARCH-FALLBACK] Processing user');
              
              // Get the nested profile document which actually has the user data
              const profileRef = doc(this.db, `artifacts/${this.appId}/${FIRESTORE_PATHS.USERS}/${userDoc.id}/profile/settings`);
              const profileDoc = await getDoc(profileRef);
              
              if (profileDoc.exists()) {
                const data = profileDoc.data();
                logger.debug({ userId: userDoc.id, userType: data.userType, hasInterviewerProfile: !!data.interviewerProfile, isActive: data.interviewerProfile?.isActive }, '🔵 [INTERVIEWER-SEARCH-FALLBACK] Profile data');
                
                // Look for interviewer profile - either userType is 'interviewer' OR has interviewerProfile with availability
                if ((data.userType === 'interviewer' || (data.interviewerProfile && data.interviewerProfile.isActive !== false)) && data.interviewerProfile) {
                  logger.info({ userId: userDoc.id }, '🟢 [INTERVIEWER-SEARCH-FALLBACK] Found interviewer profile - adding to results');
                  interviewers.push({
                    id: userDoc.id,
                    email: data.email,
                    name: data.name,
                    userType: 'interviewer',
                    role: data.role || '',
                    skills: data.skills || [],
                    interviewerProfile: data.interviewerProfile,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                  });
                } else {
                  logger.debug({ userId: userDoc.id }, '🟡 [INTERVIEWER-SEARCH-FALLBACK] Profile exists but not an interviewer');
                }
              } else {
                logger.debug({ userId: userDoc.id }, '🟡 [INTERVIEWER-SEARCH-FALLBACK] No nested profile document found');
              }
            } catch (err) {
              logger.debug({ error: err, userId: userDoc.id }, '🔴 [INTERVIEWER-SEARCH-FALLBACK] Could not load profile for user');
            }
          }
          
          if (interviewers.length > 0) {
            logger.info({ count: interviewers.length }, '🟢 [INTERVIEWER-SEARCH-FALLBACK] Found interviewers via fallback profile search');
          } else {
            logger.warn({}, '🔴 [INTERVIEWER-SEARCH-FALLBACK] Fallback search completed but found no interviewers');
          }
        } catch (fallbackError) {
          logger.warn({ error: fallbackError }, '🔴 [INTERVIEWER-SEARCH-FALLBACK] Fallback profile search failed');
        }
      }

      // Apply client-side filters
      interviewers = this.applyFilters(interviewers, filters);

      // Check if there are more results
      const hasMore = interviewers.length > pageSize;
      if (hasMore) {
        interviewers = interviewers.slice(0, pageSize);
      }

      const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;

      logger.info(
        { filteredCount: interviewers.length, hasMore, totalFound: interviewers.length },
        '🟢 [INTERVIEWER-SEARCH] Search complete - returning results'
      );

      return {
        interviewers,
        lastDoc,
        hasMore,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get available interviewers');
      throw new Error('Failed to fetch interviewers');
    }
  }

  /**
   * Get a specific interviewer by ID
   */
  async getInterviewerById(interviewerId: string): Promise<InterviewerWithProfile | null> {
    try {
      const profileRef = doc(
        this.db,
        `artifacts/${this.appId}/${FIRESTORE_PATHS.USERS}/${interviewerId}/profile/settings`
      );

      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        logger.warn({ interviewerId }, 'Interviewer not found');
        return null;
      }

      const data = profileDoc.data();

      if (data.userType !== 'interviewer' || !data.interviewerProfile) {
        logger.warn({ interviewerId }, 'User is not an interviewer');
        return null;
      }

      const interviewer: InterviewerWithProfile = {
        id: interviewerId,
        email: data.email,
        name: data.name,
        userType: 'interviewer',
        role: data.role || '',
        skills: data.skills || [],
        interviewerProfile: data.interviewerProfile,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };

      logger.info({ interviewerId }, 'Fetched interviewer profile');
      return interviewer;
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to get interviewer');
      throw new Error('Failed to fetch interviewer');
    }
  }

  /**
   * Search interviewers by name or email (case-insensitive partial match)
   */
  async searchInterviewers(
    searchTerm: string,
    filters: InterviewerFilters = {},
    pageSize: number = 10
  ): Promise<InterviewerWithProfile[]> {
    try {
      // Get all interviewers (Firestore doesn't support case-insensitive search)
      const result = await this.getAvailableInterviewers(filters, 100);
      
      const searchLower = searchTerm.toLowerCase();
      
      // Filter by search term
      const filtered = result.interviewers.filter((interviewer) => {
        const emailMatch = interviewer.email?.toLowerCase().includes(searchLower);
        const bioMatch = interviewer.interviewerProfile.bio?.toLowerCase().includes(searchLower);
        const companyMatch = interviewer.interviewerProfile.company?.toLowerCase().includes(searchLower);
        const titleMatch = interviewer.interviewerProfile.title?.toLowerCase().includes(searchLower);
        
        return emailMatch || bioMatch || companyMatch || titleMatch;
      });

      logger.info(
        { searchTerm, resultCount: filtered.length },
        'Searched interviewers'
      );

      return filtered.slice(0, pageSize);
    } catch (error) {
      logger.error({ error, searchTerm }, 'Failed to search interviewers');
      throw new Error('Failed to search interviewers');
    }
  }

  /**
   * Apply filters to interviewer list
   */
  private applyFilters(
    interviewers: InterviewerWithProfile[],
    filters: InterviewerFilters
  ): InterviewerWithProfile[] {
    let filtered = [...interviewers];

    // Filter by specializations
    if (filters.specializations && filters.specializations.length > 0) {
      filtered = filtered.filter((interviewer) => {
        const specs = interviewer.interviewerProfile.specializations || [];
        return filters.specializations!.some((spec) =>
          specs.some((s) => s.toLowerCase().includes(spec.toLowerCase()))
        );
      });
    }

    // Filter by minimum experience
    if (filters.minExperience !== undefined) {
      filtered = filtered.filter(
        (interviewer) =>
          (interviewer.interviewerProfile.yearsOfExperience || 0) >= filters.minExperience!
      );
    }

    // Filter by minimum rating
    if (filters.minRating !== undefined) {
      filtered = filtered.filter(
        (interviewer) =>
          (interviewer.interviewerProfile.rating || 0) >= filters.minRating!
      );
    }

    // Filter by maximum hourly rate
    if (filters.maxHourlyRate !== undefined) {
      filtered = filtered.filter(
        (interviewer) =>
          (interviewer.interviewerProfile.hourlyRate || 0) <= filters.maxHourlyRate!
      );
    }

    return filtered;
  }

  /**
   * Get interviewer statistics
   */
  async getInterviewerStats(interviewerId: string): Promise<{
    totalBookings: number;
    completedBookings: number;
    rating: number;
    totalReviews: number;
  }> {
    try {
      const bookingsRef = collection(
        this.db,
        `artifacts/${this.appId}/${FIRESTORE_PATHS.BOOKINGS}`
      );

      const q = query(bookingsRef, where('interviewerId', '==', interviewerId));
      const snapshot = await getDocs(q);

      const totalBookings = snapshot.size;
      const completedBookings = snapshot.docs.filter(
        (doc) => doc.data().status === 'completed'
      ).length;

      // TODO: Calculate actual rating from ratings collection when implemented
      const rating = 0;
      const totalReviews = 0;

      logger.info({ interviewerId, stats: { totalBookings, completedBookings } }, 'Fetched interviewer stats');

      return {
        totalBookings,
        completedBookings,
        rating,
        totalReviews,
      };
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to get interviewer stats');
      return {
        totalBookings: 0,
        completedBookings: 0,
        rating: 0,
        totalReviews: 0,
      };
    }
  }
}

// Singleton instance
let interviewerService: InterviewerService | null = null;

export const initializeInterviewerService = (db: Firestore): void => {
  interviewerService = new InterviewerService(db);
};

export const getInterviewerService = (): InterviewerService => {
  if (!interviewerService) {
    throw new Error('InterviewerService not initialized. Call initializeInterviewerService first.');
  }
  return interviewerService;
};
