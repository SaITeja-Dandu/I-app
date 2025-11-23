/**
 * @file services/booking.ts
 * @description Service for managing interview bookings
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import { createLogger } from '../utils/logger';
import type { InterviewBooking, BookingStatus, BookingFilters } from '../types';
import { getVideoConferencingService } from './video-conferencing';

const logger = createLogger('booking-service');

const FIRESTORE_PATHS = {
  APP_ID: 'interview-navigator',
  BOOKINGS: 'bookings',
} as const;

export class BookingService {
  private db: Firestore;

  constructor(firestore: Firestore) {
    this.db = firestore;
    logger.info('BookingService initialized');
  }

  /**
   * Create a new interview booking
   */
  async createBooking(bookingData: Partial<InterviewBooking>): Promise<string> {
    try {
      const bookingId = doc(collection(this.db, `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.BOOKINGS}`)).id;
      
      // Generate video meeting link for live interviews
      let meetingLink: string | undefined;
      let meetingId: string | undefined;
      let meetingPassword: string | undefined;
      let videoProvider: 'daily' | 'zoom' | 'google-meet' | 'custom' | undefined;

      if (bookingData.type === 'live' && bookingData.interviewerId) {
        try {
          const videoService = getVideoConferencingService();
          const meeting = await videoService.createMeeting({
            provider: 'daily', // Default to Daily.co
            bookingId,
            scheduledTime: bookingData.scheduledDateTime!,
            duration: bookingData.durationMinutes || 45,
            participantNames: [
              bookingData.candidateName!,
              bookingData.interviewerName || 'Interviewer',
            ],
          });

          meetingLink = meeting.url;
          meetingId = meeting.meetingId;
          meetingPassword = meeting.password;
          videoProvider = meeting.provider;

          logger.info({ bookingId, meetingLink, provider: meeting.provider }, 'Video meeting created');
        } catch (error) {
          logger.error({ error, bookingId }, 'Failed to create video meeting, booking will proceed without link');
          // Continue with booking creation even if video link generation fails
        }
      }
      
      const booking: InterviewBooking = {
        id: bookingId,
        candidateId: bookingData.candidateId!,
        candidateName: bookingData.candidateName!,
        candidateEmail: bookingData.candidateEmail!,
        interviewerId: bookingData.interviewerId,
        interviewerName: bookingData.interviewerName,
        interviewerEmail: bookingData.interviewerEmail,
        type: bookingData.type || 'ai',
        scheduledDateTime: bookingData.scheduledDateTime!,
        durationMinutes: bookingData.durationMinutes || 45,
        timezone: bookingData.timezone || 'UTC',
        role: bookingData.role!,
        skills: bookingData.skills || [],
        focusAreas: bookingData.focusAreas,
        difficulty: bookingData.difficulty || 'intermediate',
        status: bookingData.type === 'ai' ? 'confirmed' : 'pending',
        meetingLink,
        meetingId,
        meetingPassword,
        videoProvider,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bookingRef = doc(this.db, `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.BOOKINGS}`, bookingId);
      await setDoc(bookingRef, {
        ...booking,
        scheduledDateTime: Timestamp.fromDate(booking.scheduledDateTime),
        createdAt: Timestamp.fromDate(booking.createdAt),
        updatedAt: Timestamp.fromDate(booking.updatedAt),
      });

      logger.info({ bookingId, type: booking.type, hasMeetingLink: !!meetingLink }, 'Booking created successfully');
      return bookingId;
    } catch (error) {
      logger.error({ error }, 'Failed to create booking');
      throw new Error('Failed to create booking');
    }
  }

  /**
   * Get a booking by ID
   */
  async getBookingById(bookingId: string): Promise<InterviewBooking | null> {
    try {
      const bookingRef = doc(this.db, `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.BOOKINGS}`, bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        return null;
      }

      return this.convertFirestoreBooking(bookingSnap.data());
    } catch (error) {
      logger.error({ error, bookingId }, 'Failed to get booking');
      throw new Error('Failed to get booking');
    }
  }

  /**
   * Get all bookings for a user (candidate or interviewer)
   */
  async getUserBookings(
    userId: string,
    filters?: BookingFilters
  ): Promise<InterviewBooking[]> {
    try {
      const bookingsRef = collection(this.db, `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.BOOKINGS}`);
      
      // Build query based on filters
      let q = query(
        bookingsRef,
        where('candidateId', '==', userId)
      );

      // Also get bookings where user is the interviewer
      const interviewerQuery = query(
        bookingsRef,
        where('interviewerId', '==', userId)
      );

      // Execute both queries
      const [candidateSnap, interviewerSnap] = await Promise.all([
        getDocs(q),
        getDocs(interviewerQuery),
      ]);

      const bookings: InterviewBooking[] = [];
      
      candidateSnap.forEach(doc => {
        bookings.push(this.convertFirestoreBooking(doc.data()));
      });
      
      interviewerSnap.forEach(doc => {
        bookings.push(this.convertFirestoreBooking(doc.data()));
      });

      // Apply filters
      let filteredBookings = bookings;

      if (filters?.status && filters.status.length > 0) {
        filteredBookings = filteredBookings.filter(b => filters.status!.includes(b.status));
      }

      if (filters?.type) {
        filteredBookings = filteredBookings.filter(b => b.type === filters.type);
      }

      if (filters?.startDate) {
        filteredBookings = filteredBookings.filter(
          b => b.scheduledDateTime >= filters.startDate!
        );
      }

      if (filters?.endDate) {
        filteredBookings = filteredBookings.filter(
          b => b.scheduledDateTime <= filters.endDate!
        );
      }

      // Sort by scheduled date
      filteredBookings.sort((a, b) => 
        a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime()
      );

      logger.info({ userId, count: filteredBookings.length }, 'Retrieved user bookings');
      return filteredBookings;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get user bookings');
      throw new Error('Failed to get user bookings');
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    updates?: Partial<InterviewBooking>
  ): Promise<void> {
    try {
      const bookingRef = doc(this.db, `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.BOOKINGS}`, bookingId);
      
      const updateData: any = {
        status,
        updatedAt: Timestamp.now(),
        ...updates,
      };

      // Convert Date fields to Timestamp
      if (updates?.scheduledDateTime) {
        updateData.scheduledDateTime = Timestamp.fromDate(updates.scheduledDateTime);
      }
      if (updates?.cancelledAt) {
        updateData.cancelledAt = Timestamp.fromDate(updates.cancelledAt);
      }

      await updateDoc(bookingRef, updateData);
      logger.info({ bookingId, status }, 'Booking status updated');
    } catch (error) {
      logger.error({ error, bookingId, status }, 'Failed to update booking status');
      throw new Error('Failed to update booking status');
    }
  }

  /**
   * Accept a booking (for interviewers)
   */
  async acceptBooking(bookingId: string, meetingLink?: string): Promise<void> {
    try {
      await this.updateBookingStatus(bookingId, 'accepted', {
        meetingLink,
      });
      logger.info({ bookingId }, 'Booking accepted');
    } catch (error) {
      logger.error({ error, bookingId }, 'Failed to accept booking');
      throw new Error('Failed to accept booking');
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    bookingId: string,
    cancelledBy: 'candidate' | 'interviewer' | 'system',
    reason?: string
  ): Promise<void> {
    try {
      await this.updateBookingStatus(bookingId, 'cancelled', {
        cancelledBy,
        cancellationReason: reason,
        cancelledAt: new Date(),
      });
      logger.info({ bookingId, cancelledBy }, 'Booking cancelled');
    } catch (error) {
      logger.error({ error, bookingId }, 'Failed to cancel booking');
      throw new Error('Failed to cancel booking');
    }
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(bookingId: string, newDateTime: Date): Promise<void> {
    try {
      await this.updateBookingStatus(bookingId, 'pending', {
        scheduledDateTime: newDateTime,
      });
      logger.info({ bookingId, newDateTime }, 'Booking rescheduled');
    } catch (error) {
      logger.error({ error, bookingId }, 'Failed to reschedule booking');
      throw new Error('Failed to reschedule booking');
    }
  }

  /**
   * Complete a booking
   */
  async completeBooking(bookingId: string, sessionId?: string, interviewerNotes?: string): Promise<void> {
    try {
      await this.updateBookingStatus(bookingId, 'completed', {
        sessionId,
        interviewerNotes,
      });
      logger.info({ bookingId, sessionId }, 'Booking completed');
    } catch (error) {
      logger.error({ error, bookingId }, 'Failed to complete booking');
      throw new Error('Failed to complete booking');
    }
  }

  /**
   * Subscribe to real-time updates for user bookings
   */
  subscribeToUserBookings(
    userId: string,
    onUpdate: (bookings: InterviewBooking[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const bookingsRef = collection(this.db, `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.BOOKINGS}`);
    
    // Subscribe to bookings where user is candidate (no orderBy to avoid index requirement)
    const candidateQuery = query(
      bookingsRef,
      where('candidateId', '==', userId)
    );

    // Subscribe to bookings where user is interviewer (no orderBy to avoid index requirement)
    const interviewerQuery = query(
      bookingsRef,
      where('interviewerId', '==', userId)
    );

    let candidateBookings: InterviewBooking[] = [];
    let interviewerBookings: InterviewBooking[] = [];

    const sortAndUpdate = () => {
      // Combine and sort bookings in memory by scheduledDateTime (descending)
      const combined = [...candidateBookings, ...interviewerBookings].sort((a, b) => {
        const timeA = a.scheduledDateTime instanceof Date ? a.scheduledDateTime.getTime() : 0;
        const timeB = b.scheduledDateTime instanceof Date ? b.scheduledDateTime.getTime() : 0;
        return timeB - timeA; // Descending order
      });
      onUpdate(combined);
    };

    const unsubCandidate = onSnapshot(
      candidateQuery,
      (snapshot) => {
        candidateBookings = snapshot.docs.map(doc => this.convertFirestoreBooking(doc.data()));
        sortAndUpdate();
      },
      (error) => {
        logger.error({ error, userId }, 'Error in candidate bookings subscription');
        if (onError) onError(error as Error);
      }
    );

    const unsubInterviewer = onSnapshot(
      interviewerQuery,
      (snapshot) => {
        interviewerBookings = snapshot.docs.map(doc => this.convertFirestoreBooking(doc.data()));
        sortAndUpdate();
      },
      (error) => {
        logger.error({ error, userId }, 'Error in interviewer bookings subscription');
        if (onError) onError(error as Error);
      }
    );

    // Return combined unsubscribe function
    return () => {
      unsubCandidate();
      unsubInterviewer();
    };
  }

  /**
   * Subscribe to real-time updates for a specific booking
   */
  subscribeToBooking(
    bookingId: string,
    onUpdate: (booking: InterviewBooking) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const bookingRef = doc(this.db, `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.BOOKINGS}`, bookingId);

    return onSnapshot(
      bookingRef,
      (doc) => {
        if (doc.exists()) {
          onUpdate(this.convertFirestoreBooking(doc.data()));
        }
      },
      (error) => {
        logger.error({ error, bookingId }, 'Error in booking subscription');
        if (onError) onError(error as Error);
      }
    );
  }

  /**
   * Convert Firestore document data to InterviewBooking
   */
  private convertFirestoreBooking(data: any): InterviewBooking {
    return {
      ...data,
      scheduledDateTime: data.scheduledDateTime?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      cancelledAt: data.cancelledAt?.toDate(),
      reminderSentAt: data.reminderSentAt?.toDate(),
    };
  }
}

// Singleton instance
let bookingServiceInstance: BookingService | null = null;

export const initializeBookingService = (firestore: Firestore): void => {
  if (!bookingServiceInstance) {
    bookingServiceInstance = new BookingService(firestore);
  }
};

export const getBookingService = (): BookingService => {
  if (!bookingServiceInstance) {
    throw new Error('BookingService not initialized');
  }
  return bookingServiceInstance;
};
