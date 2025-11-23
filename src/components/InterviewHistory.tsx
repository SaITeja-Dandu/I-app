/**
 * @file components/InterviewHistory.tsx
 * @description Display candidate's interview history with ratings and feedback
 */

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import { getBookingService } from '../services/booking';
import { getRatingService } from '../services/rating';
import { createLogger } from '../utils/logger';
import type { InterviewBooking, Rating } from '../types';
import { Calendar, Clock, Star, MessageSquare, User, Video } from 'lucide-react';

const logger = createLogger('interview-history');

interface InterviewHistoryProps {
  userId: string;
  userRole: 'candidate' | 'interviewer';
  onViewDetails?: (bookingId: string) => void;
  onRateInterview?: (bookingId: string) => void;
}

interface HistoryItem {
  booking: InterviewBooking;
  rating?: Rating;
}

export const InterviewHistory: React.FC<InterviewHistoryProps> = ({
  userId,
  userRole,
  onViewDetails,
  onRateInterview,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadHistory();
  }, [userId, userRole]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const bookingService = getBookingService();
      const ratingService = getRatingService();

      // Get all bookings for the user
      const bookings = await bookingService.getUserBookings(
        userId,
        { status: ['completed', 'cancelled'] }
      );

      // Filter for past bookings only
      const now = new Date();
      const pastBookings = bookings.filter(
        (b: InterviewBooking) => b.scheduledDateTime < now
      );

      // Load ratings for completed bookings
      const historyItems: HistoryItem[] = await Promise.all(
        pastBookings.map(async (booking: InterviewBooking) => {
          if (booking.status === 'completed') {
            try {
              const review = await ratingService.getReviewByBookingId(booking.id);
              // Convert InterviewerReview to Rating format if needed
              if (review) {
                const rating: Rating = {
                  id: review.id,
                  bookingId: review.bookingId,
                  interviewerId: review.interviewerId,
                  candidateId: review.candidateId,
                  candidateRating: {
                    score: review.rating,
                    review: review.comment,
                    helpful: false,
                    professional: false,
                    wouldRecommend: review.wouldRecommend
                  },
                  createdAt: review.createdAt
                };
                return { booking, rating };
              }
            } catch (error) {
              logger.error({ error, bookingId: booking.id }, 'Failed to load rating');
            }
          }
          return { booking };
        })
      );

      // Sort by date (most recent first)
      historyItems.sort(
        (a, b) => b.booking.scheduledDateTime.getTime() - a.booking.scheduledDateTime.getTime()
      );

      setHistory(historyItems);
    } catch (error) {
      logger.error({ error }, 'Failed to load interview history');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (filter === 'completed') return item.booking.status === 'completed';
    if (filter === 'cancelled') return item.booking.status === 'cancelled';
    return true;
  });

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading interview history..." />
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Interview History</h3>
        <p className="text-gray-600">Your completed interviews will appear here</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-semibold transition-colors ${
            filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          All ({history.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 font-semibold transition-colors ${
            filter === 'completed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Completed ({history.filter((h) => h.booking.status === 'completed').length})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 font-semibold transition-colors ${
            filter === 'cancelled'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Cancelled ({history.filter((h) => h.booking.status === 'cancelled').length})
        </button>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600">No {filter} interviews found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <Card
              key={item.booking.id}
              className={`hover:shadow-lg transition-shadow ${
                item.booking.status === 'cancelled' ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Badge
                      variant={item.booking.status === 'completed' ? 'success' : 'secondary'}
                      label={item.booking.status.charAt(0).toUpperCase() + item.booking.status.slice(1)}
                    />
                    <span className="text-sm text-gray-500">
                      {item.booking.scheduledDateTime.toLocaleDateString()}
                    </span>
                  </div>

                  {/* Interviewer/Candidate Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {userRole === 'candidate'
                        ? `Interview with ${item.booking.interviewerName || 'Interviewer'}`
                        : `Interview with ${item.booking.candidateName || 'Candidate'}`}
                    </span>
                  </div>

                  {/* Interview Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {item.booking.scheduledDateTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(item.booking.durationMinutes)}
                    </div>
                    {item.booking.role && (
                      <Badge variant="secondary" label={item.booking.role} />
                    )}
                  </div>

                  {/* Rating Display */}
                  {item.rating && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">
                          {item.rating.candidateRating?.score.toFixed(1) || 'N/A'} / 5.0
                        </span>
                      </div>
                      {item.rating.candidateRating?.review && (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-900">{item.rating.candidateRating.review}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {item.booking.status === 'completed' && !item.rating && (
                    <Button
                      onClick={() => onRateInterview?.(item.booking.id)}
                      size="sm"
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <Star className="h-4 w-4" />
                      Rate Interview
                    </Button>
                  )}
                  
                  {onViewDetails && (
                    <Button
                      onClick={() => onViewDetails(item.booking.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <Video className="h-4 w-4" />
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
