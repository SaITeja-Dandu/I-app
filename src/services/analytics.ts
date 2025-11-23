/**
 * @file services/analytics.ts
 * @description Service for interviewer analytics and performance tracking
 */

import {
  type Firestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { createLogger } from '../utils/logger';
import { FIRESTORE_PATHS } from '../utils/constants';
import type { InterviewBooking } from '../types';

const logger = createLogger('analytics-service');

/**
 * Analytics data for an interviewer
 */
export interface InterviewerAnalytics {
  // Overview
  totalInterviews: number;
  completedInterviews: number;
  cancelledInterviews: number;
  upcomingInterviews: number;
  
  // Rating metrics
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  
  // Financial metrics
  totalEarnings: number;
  pendingPayouts: number;
  averageSessionRate: number;
  
  // Time metrics
  totalHoursCompleted: number;
  averageSessionDuration: number;
  
  // Performance metrics
  completionRate: number; // % of interviews completed vs cancelled
  responseTime: number; // Average time to confirm bookings (hours)
  rebookRate: number; // % of candidates who booked again
  
  // Trend data
  monthlyStats: MonthlyStats[];
  recentBookings: InterviewBooking[];
  
  // Top performing areas
  topSpecializations: Array<{ name: string; count: number; rating: number }>;
  bestTimeSlots: Array<{ day: string; time: string; count: number }>;
}

/**
 * Monthly statistics
 */
export interface MonthlyStats {
  month: string; // YYYY-MM
  interviews: number;
  earnings: number;
  averageRating: number;
  hours: number;
}

/**
 * Time range for analytics
 */
export type AnalyticsTimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

export class AnalyticsService {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Get comprehensive analytics for an interviewer
   */
  async getInterviewerAnalytics(
    interviewerId: string,
    timeRange: AnalyticsTimeRange = 'all'
  ): Promise<InterviewerAnalytics> {
    try {
      const startDate = this.getStartDate(timeRange);
      
      // Fetch all bookings for the interviewer
      const bookings = await this.getInterviewerBookings(interviewerId, startDate);
      
      // Fetch ratings
      const ratings = await this.getInterviewerRatings(interviewerId);
      
      // Fetch earnings
      const earnings = await this.getInterviewerEarnings(interviewerId, startDate);
      
      // Calculate metrics
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
      const upcomingBookings = bookings.filter(
        b => b.status === 'confirmed' && new Date(b.scheduledDateTime) > new Date()
      );
      
      // Calculate rating distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRatingSum = 0;
      ratings.forEach(rating => {
        const score = Math.round(rating.rating);
        if (score >= 1 && score <= 5) {
          ratingDistribution[score as keyof typeof ratingDistribution]++;
          totalRatingSum += rating.rating;
        }
      });
      
      const averageRating = ratings.length > 0 ? totalRatingSum / ratings.length : 0;
      
      // Calculate time metrics
      const totalMinutes = completedBookings.reduce((sum, b) => sum + b.durationMinutes, 0);
      const totalHoursCompleted = totalMinutes / 60;
      const averageSessionDuration = completedBookings.length > 0 
        ? totalMinutes / completedBookings.length 
        : 0;
      
      // Calculate completion rate
      const totalFinished = completedBookings.length + cancelledBookings.length;
      const completionRate = totalFinished > 0 
        ? (completedBookings.length / totalFinished) * 100 
        : 0;
      
      // Calculate response time (average time from booking creation to confirmation)
      const responseTime = this.calculateAverageResponseTime(bookings);
      
      // Calculate rebook rate
      const rebookRate = await this.calculateRebookRate(interviewerId, bookings);
      
      // Generate monthly stats
      const monthlyStats = this.generateMonthlyStats(bookings, earnings);
      
      // Get recent bookings
      const recentBookings = bookings
        .sort((a, b) => new Date(b.scheduledDateTime).getTime() - new Date(a.scheduledDateTime).getTime())
        .slice(0, 10);
      
      // Calculate top specializations
      const topSpecializations = this.calculateTopSpecializations(completedBookings, ratings);
      
      // Calculate best time slots
      const bestTimeSlots = this.calculateBestTimeSlots(completedBookings);
      
      const analytics: InterviewerAnalytics = {
        totalInterviews: bookings.length,
        completedInterviews: completedBookings.length,
        cancelledInterviews: cancelledBookings.length,
        upcomingInterviews: upcomingBookings.length,
        averageRating,
        totalReviews: ratings.length,
        ratingDistribution,
        totalEarnings: earnings.total,
        pendingPayouts: earnings.pending,
        averageSessionRate: earnings.averageRate,
        totalHoursCompleted,
        averageSessionDuration,
        completionRate,
        responseTime,
        rebookRate,
        monthlyStats,
        recentBookings,
        topSpecializations,
        bestTimeSlots,
      };
      
      logger.info({ interviewerId, timeRange }, 'Analytics generated');
      return analytics;
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to generate analytics');
      throw new Error('Failed to generate analytics');
    }
  }

  /**
   * Get interviewer bookings within date range
   */
  private async getInterviewerBookings(
    interviewerId: string,
    startDate: Date
  ): Promise<InterviewBooking[]> {
    const bookingsRef = collection(
      this.db,
      `artifacts/${FIRESTORE_PATHS.APP_ID}/bookings`
    );
    const q = query(
      bookingsRef,
      where('interviewerId', '==', interviewerId),
      where('scheduledDateTime', '>=', Timestamp.fromDate(startDate)),
      orderBy('scheduledDateTime', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const bookings: InterviewBooking[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        ...data,
        scheduledDateTime: data.scheduledDateTime.toDate(),
        createdAt: data.createdAt.toDate(),
        cancelledAt: data.cancelledAt?.toDate(),
      } as InterviewBooking);
    });
    
    return bookings;
  }

  /**
   * Get interviewer ratings
   */
  private async getInterviewerRatings(interviewerId: string): Promise<any[]> {
    const reviewsRef = collection(
      this.db,
      `artifacts/${FIRESTORE_PATHS.APP_ID}/reviews`
    );
    const q = query(
      reviewsRef,
      where('interviewerId', '==', interviewerId)
    );
    
    const snapshot = await getDocs(q);
    const ratings: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      ratings.push({
        id: doc.id,
        rating: data.rating,
        bookingId: data.bookingId,
        createdAt: data.createdAt.toDate(),
      });
    });
    
    return ratings;
  }

  /**
   * Get interviewer earnings
   */
  private async getInterviewerEarnings(
    interviewerId: string,
    startDate: Date
  ): Promise<{ total: number; pending: number; averageRate: number }> {
    // This would integrate with PaymentService
    // For now, return calculated values from bookings
    const bookings = await this.getInterviewerBookings(interviewerId, startDate);
    const completedBookings = bookings.filter(b => b.status === 'completed');
    
    // Assuming rate is stored in booking or calculated
    const total = completedBookings.length * 50; // Placeholder
    const pending = 0; // Would come from payment service
    const averageRate = completedBookings.length > 0 ? total / completedBookings.length : 0;
    
    return { total, pending, averageRate };
  }

  /**
   * Calculate average response time in hours
   */
  private calculateAverageResponseTime(bookings: InterviewBooking[]): number {
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    
    if (confirmedBookings.length === 0) return 0;
    
    // This would require storing confirmation timestamp
    // For now, return placeholder
    return 2.5; // 2.5 hours average
  }

  /**
   * Calculate rebook rate
   */
  private async calculateRebookRate(
    _interviewerId: string,
    bookings: InterviewBooking[]
  ): Promise<number> {
    const uniqueCandidates = new Set(bookings.map(b => b.candidateId));
    const totalCandidates = uniqueCandidates.size;
    
    if (totalCandidates === 0) return 0;
    
    // Count candidates who booked more than once
    const candidateBookingCounts = new Map<string, number>();
    bookings.forEach(b => {
      candidateBookingCounts.set(
        b.candidateId,
        (candidateBookingCounts.get(b.candidateId) || 0) + 1
      );
    });
    
    const rebookingCandidates = Array.from(candidateBookingCounts.values()).filter(
      count => count > 1
    ).length;
    
    return (rebookingCandidates / totalCandidates) * 100;
  }

  /**
   * Generate monthly statistics
   */
  private generateMonthlyStats(
    bookings: InterviewBooking[],
    _earnings: { total: number }
  ): MonthlyStats[] {
    const monthlyMap = new Map<string, MonthlyStats>();
    
    bookings.forEach(booking => {
      const date = new Date(booking.scheduledDateTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          interviews: 0,
          earnings: 0,
          averageRating: 0,
          hours: 0,
        });
      }
      
      const stats = monthlyMap.get(monthKey)!;
      if (booking.status === 'completed') {
        stats.interviews++;
        stats.hours += booking.durationMinutes / 60;
        stats.earnings += 50; // Placeholder rate
      }
    });
    
    return Array.from(monthlyMap.values()).sort((a, b) => 
      b.month.localeCompare(a.month)
    ).slice(0, 12); // Last 12 months
  }

  /**
   * Calculate top specializations
   */
  private calculateTopSpecializations(
    bookings: InterviewBooking[],
    ratings: any[]
  ): Array<{ name: string; count: number; rating: number }> {
    const specializationMap = new Map<string, { count: number; ratingSum: number; ratingCount: number }>();
    
    bookings.forEach(booking => {
      const spec = booking.role; // Using role as specialization
      if (!specializationMap.has(spec)) {
        specializationMap.set(spec, { count: 0, ratingSum: 0, ratingCount: 0 });
      }
      const data = specializationMap.get(spec)!;
      data.count++;
      
      // Find rating for this booking
      const rating = ratings.find(r => r.bookingId === booking.id);
      if (rating) {
        data.ratingSum += rating.rating;
        data.ratingCount++;
      }
    });
    
    return Array.from(specializationMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        rating: data.ratingCount > 0 ? data.ratingSum / data.ratingCount : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Calculate best time slots
   */
  private calculateBestTimeSlots(
    bookings: InterviewBooking[]
  ): Array<{ day: string; time: string; count: number }> {
    const timeSlotMap = new Map<string, number>();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    bookings.forEach(booking => {
      const date = new Date(booking.scheduledDateTime);
      const day = days[date.getDay()];
      const hour = date.getHours();
      const timeSlot = `${day}-${hour}:00`;
      
      timeSlotMap.set(timeSlot, (timeSlotMap.get(timeSlot) || 0) + 1);
    });
    
    return Array.from(timeSlotMap.entries())
      .map(([slot, count]) => {
        const [day, time] = slot.split('-');
        return { day, time, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Get start date based on time range
   */
  private getStartDate(timeRange: AnalyticsTimeRange): Date {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return new Date(0); // Beginning of time
    }
  }
}

// Singleton instance
let analyticsServiceInstance: AnalyticsService | null = null;

export const initializeAnalyticsService = (db: Firestore): void => {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService(db);
    logger.info('AnalyticsService initialized');
  }
};

export const getAnalyticsService = (): AnalyticsService => {
  if (!analyticsServiceInstance) {
    throw new Error('AnalyticsService not initialized. Call initializeAnalyticsService first.');
  }
  return analyticsServiceInstance;
};
