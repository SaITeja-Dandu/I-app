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

  constructor(db: Firestore) {
    this.db = db;
    logger.info('InterviewerService initialized');
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
      const usersRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.USERS}`
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
      logger.info({ count: snapshot.size }, 'Fetched interviewer profiles');

      // Convert documents to profiles
      let interviewers: InterviewerWithProfile[] = [];
      const docs: DocumentSnapshot[] = [];

      for (const docSnap of snapshot.docs) {
        const profileDoc = await getDoc(
          doc(docSnap.ref, 'profile/settings')
        );

        if (profileDoc.exists()) {
          const data = profileDoc.data();
          
          // Only include active interviewers with complete profiles
          if (
            data.interviewerProfile &&
            data.interviewerProfile.isActive !== false
          ) {
            const interviewer: InterviewerWithProfile = {
              id: docSnap.id,
              email: data.email,
              userType: 'interviewer',
              role: data.role || '',
              skills: data.skills || [],
              interviewerProfile: data.interviewerProfile,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            };

            interviewers.push(interviewer);
            docs.push(docSnap);
          }
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
        { filteredCount: interviewers.length, hasMore },
        'Filtered interviewers'
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
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.USERS}/${interviewerId}/profile/settings`
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
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.BOOKINGS}`
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
