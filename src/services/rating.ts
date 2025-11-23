/**
 * @file services/rating.ts
 * @description Service for managing interviewer ratings and reviews
 */

import {
  type Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { createLogger } from '../utils/logger';
import { FIRESTORE_PATHS } from '../utils/constants';

const logger = createLogger('RatingService');

/**
 * Individual rating/review for an interviewer
 */
export interface InterviewerReview {
  id: string;
  interviewerId: string;
  candidateId: string;
  candidateName?: string;
  bookingId: string;
  rating: number; // 1-5 stars
  comment?: string;
  categories?: {
    technical?: number; // 1-5
    communication?: number; // 1-5
    professionalism?: number; // 1-5
    helpfulness?: number; // 1-5
  };
  wouldRecommend: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregated rating statistics for an interviewer
 */
export interface InterviewerRating {
  interviewerId: string;
  averageRating: number; // Overall average
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages?: {
    technical?: number;
    communication?: number;
    professionalism?: number;
    helpfulness?: number;
  };
  recommendationRate: number; // Percentage who would recommend
  lastUpdated: Date;
}

/**
 * Input for creating a new review
 */
export interface CreateReviewInput {
  interviewerId: string;
  candidateId: string;
  candidateName?: string;
  bookingId: string;
  rating: number;
  comment?: string;
  categories?: {
    technical?: number;
    communication?: number;
    professionalism?: number;
    helpfulness?: number;
  };
  wouldRecommend: boolean;
}

export class RatingService {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Submit a review for an interviewer
   */
  async submitReview(input: CreateReviewInput): Promise<string> {
    try {
      // Validate rating
      if (input.rating < 1 || input.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Validate category ratings if provided
      if (input.categories) {
        for (const [key, value] of Object.entries(input.categories)) {
          if (value !== undefined && (value < 1 || value > 5)) {
            throw new Error(`Category rating '${key}' must be between 1 and 5`);
          }
        }
      }

      // Check if review already exists for this booking
      const existingReview = await this.getReviewByBookingId(input.bookingId);
      if (existingReview) {
        throw new Error('A review has already been submitted for this booking');
      }

      const reviewId = this.generateReviewId(input.interviewerId, input.candidateId, input.bookingId);
      const reviewPath = `${FIRESTORE_PATHS.ARTIFACTS}/${FIRESTORE_PATHS.APP_ID}/reviews/${reviewId}`;
      const reviewRef = doc(this.db, reviewPath);

      const now = new Date();
      const review: Omit<InterviewerReview, 'id'> = {
        interviewerId: input.interviewerId,
        candidateId: input.candidateId,
        candidateName: input.candidateName,
        bookingId: input.bookingId,
        rating: input.rating,
        comment: input.comment,
        categories: input.categories,
        wouldRecommend: input.wouldRecommend,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(reviewRef, {
        ...review,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

      // Update aggregated rating statistics
      await this.updateInterviewerRating(input.interviewerId);

      logger.info({ reviewId, interviewerId: input.interviewerId }, 'Review submitted');
      return reviewId;
    } catch (error) {
      logger.error({ error, input }, 'Failed to submit review');
      throw error;
    }
  }

  /**
   * Get a review by booking ID
   */
  async getReviewByBookingId(bookingId: string): Promise<InterviewerReview | null> {
    try {
      const reviewsPath = `${FIRESTORE_PATHS.ARTIFACTS}/${FIRESTORE_PATHS.APP_ID}/reviews`;
      const reviewsRef = collection(this.db, reviewsPath);
      const q = query(reviewsRef, where('bookingId', '==', bookingId), limit(1));
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return this.mapReviewFromFirestore(doc.id, doc.data());
    } catch (error) {
      logger.error({ error, bookingId }, 'Failed to get review by booking ID');
      return null;
    }
  }

  /**
   * Get all reviews for an interviewer
   */
  async getInterviewerReviews(
    interviewerId: string,
    limitCount: number = 50
  ): Promise<InterviewerReview[]> {
    try {
      const reviewsPath = `${FIRESTORE_PATHS.ARTIFACTS}/${FIRESTORE_PATHS.APP_ID}/reviews`;
      const reviewsRef = collection(this.db, reviewsPath);
      const q = query(
        reviewsRef,
        where('interviewerId', '==', interviewerId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => this.mapReviewFromFirestore(doc.id, doc.data()));

      logger.info({ interviewerId, count: reviews.length }, 'Fetched interviewer reviews');
      return reviews;
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to get interviewer reviews');
      return [];
    }
  }

  /**
   * Get aggregated rating statistics for an interviewer
   */
  async getInterviewerRating(interviewerId: string): Promise<InterviewerRating | null> {
    try {
      const ratingPath = `${FIRESTORE_PATHS.ARTIFACTS}/${FIRESTORE_PATHS.APP_ID}/ratings/${interviewerId}`;
      const ratingRef = doc(this.db, ratingPath);
      const ratingDoc = await getDoc(ratingRef);

      if (!ratingDoc.exists()) {
        // No rating exists yet, calculate from reviews
        await this.updateInterviewerRating(interviewerId);
        const updatedDoc = await getDoc(ratingRef);
        if (!updatedDoc.exists()) {
          return null;
        }
        return this.mapRatingFromFirestore(updatedDoc.data());
      }

      return this.mapRatingFromFirestore(ratingDoc.data());
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to get interviewer rating');
      return null;
    }
  }

  /**
   * Update aggregated rating statistics for an interviewer
   */
  async updateInterviewerRating(interviewerId: string): Promise<void> {
    try {
      const reviews = await this.getInterviewerReviews(interviewerId, 1000);
      
      if (reviews.length === 0) {
        logger.info({ interviewerId }, 'No reviews to aggregate');
        return;
      }

      // Calculate statistics
      const totalReviews = reviews.length;
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / totalReviews;

      const ratingDistribution = {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length,
      };

      // Calculate category averages
      const categoryAverages: InterviewerRating['categoryAverages'] = {};
      const categoryKeys = ['technical', 'communication', 'professionalism', 'helpfulness'] as const;
      
      for (const key of categoryKeys) {
        const reviewsWithCategory = reviews.filter(r => r.categories?.[key] !== undefined);
        if (reviewsWithCategory.length > 0) {
          const total = reviewsWithCategory.reduce((sum, r) => sum + (r.categories![key] || 0), 0);
          categoryAverages[key] = total / reviewsWithCategory.length;
        }
      }

      // Calculate recommendation rate
      const recommendCount = reviews.filter(r => r.wouldRecommend).length;
      const recommendationRate = (recommendCount / totalReviews) * 100;

      const now = new Date();
      const rating: Omit<InterviewerRating, 'interviewerId'> = {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
        ratingDistribution,
        categoryAverages: Object.keys(categoryAverages).length > 0 ? categoryAverages : undefined,
        recommendationRate: Math.round(recommendationRate * 10) / 10,
        lastUpdated: now,
      };

      const ratingPath = `${FIRESTORE_PATHS.ARTIFACTS}/${FIRESTORE_PATHS.APP_ID}/ratings/${interviewerId}`;
      const ratingRef = doc(this.db, ratingPath);

      await setDoc(ratingRef, {
        interviewerId,
        ...rating,
        lastUpdated: Timestamp.fromDate(now),
      });

      logger.info(
        { interviewerId, averageRating, totalReviews },
        'Updated interviewer rating'
      );
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to update interviewer rating');
      throw new Error('Failed to update rating statistics');
    }
  }

  /**
   * Get reviews by candidate
   */
  async getCandidateReviews(candidateId: string): Promise<InterviewerReview[]> {
    try {
      const reviewsPath = `${FIRESTORE_PATHS.ARTIFACTS}/${FIRESTORE_PATHS.APP_ID}/reviews`;
      const reviewsRef = collection(this.db, reviewsPath);
      const q = query(
        reviewsRef,
        where('candidateId', '==', candidateId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const reviews = snapshot.docs.map(doc => this.mapReviewFromFirestore(doc.id, doc.data()));

      logger.info({ candidateId, count: reviews.length }, 'Fetched candidate reviews');
      return reviews;
    } catch (error) {
      logger.error({ error, candidateId }, 'Failed to get candidate reviews');
      return [];
    }
  }

  /**
   * Delete a review (admin only or within edit window)
   */
  async deleteReview(reviewId: string): Promise<void> {
    try {
      const reviewPath = `${FIRESTORE_PATHS.ARTIFACTS}/${FIRESTORE_PATHS.APP_ID}/reviews/${reviewId}`;
      const reviewRef = doc(this.db, reviewPath);
      const reviewDoc = await getDoc(reviewRef);

      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }

      const review = this.mapReviewFromFirestore(reviewDoc.id, reviewDoc.data());
      
      // Delete review
      const batch = writeBatch(this.db);
      batch.delete(reviewRef);
      await batch.commit();

      // Update aggregated statistics
      await this.updateInterviewerRating(review.interviewerId);

      logger.info({ reviewId }, 'Review deleted');
    } catch (error) {
      logger.error({ error, reviewId }, 'Failed to delete review');
      throw new Error('Failed to delete review');
    }
  }

  /**
   * Helper: Generate review ID
   */
  private generateReviewId(interviewerId: string, candidateId: string, bookingId: string): string {
    return `${interviewerId}_${candidateId}_${bookingId}`;
  }

  /**
   * Helper: Map Firestore document to InterviewerReview
   */
  private mapReviewFromFirestore(id: string, data: any): InterviewerReview {
    return {
      id,
      interviewerId: data.interviewerId,
      candidateId: data.candidateId,
      candidateName: data.candidateName,
      bookingId: data.bookingId,
      rating: data.rating,
      comment: data.comment,
      categories: data.categories,
      wouldRecommend: data.wouldRecommend,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Helper: Map Firestore document to InterviewerRating
   */
  private mapRatingFromFirestore(data: any): InterviewerRating {
    return {
      interviewerId: data.interviewerId,
      averageRating: data.averageRating,
      totalReviews: data.totalReviews,
      ratingDistribution: data.ratingDistribution,
      categoryAverages: data.categoryAverages,
      recommendationRate: data.recommendationRate,
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
    };
  }
}

// Singleton instance
let ratingServiceInstance: RatingService | null = null;

export function initializeRatingService(db: Firestore): void {
  ratingServiceInstance = new RatingService(db);
  logger.info('Rating service initialized');
}

export function getRatingService(): RatingService {
  if (!ratingServiceInstance) {
    throw new Error('RatingService not initialized. Call initializeRatingService first.');
  }
  return ratingServiceInstance;
}
