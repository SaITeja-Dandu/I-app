/**
 * @file components/InterviewerReviews.tsx
 * @description Component to display reviews and ratings for an interviewer
 */

import React, { useState, useEffect } from 'react';
import { getRatingService, type InterviewerReview, type InterviewerRating } from '../services/rating';
import { Card } from './Card';
import { Badge } from './Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { Star, ThumbsUp } from 'lucide-react';
import { createLogger } from '../utils/logger';

const logger = createLogger('InterviewerReviews');

interface InterviewerReviewsProps {
  interviewerId: string;
  showFullList?: boolean;
  maxReviews?: number;
}

export const InterviewerReviews: React.FC<InterviewerReviewsProps> = ({
  interviewerId,
  showFullList = false,
  maxReviews = 5,
}) => {
  const [rating, setRating] = useState<InterviewerRating | null>(null);
  const [reviews, setReviews] = useState<InterviewerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(showFullList);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const ratingService = getRatingService();

        const [ratingData, reviewsData] = await Promise.all([
          ratingService.getInterviewerRating(interviewerId),
          ratingService.getInterviewerReviews(interviewerId, showAll ? 100 : maxReviews),
        ]);

        setRating(ratingData);
        setReviews(reviewsData);
        logger.info({ interviewerId, reviewsCount: reviewsData.length }, 'Loaded reviews');
      } catch (error) {
        logger.error({ error, interviewerId }, 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [interviewerId, showAll, maxReviews]);

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  if (!rating || rating.totalReviews === 0) {
    return (
      <Card className="bg-gray-50">
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600">This interviewer hasn't received any reviews yet.</p>
        </div>
      </Card>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, maxReviews);

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Rating */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 mb-1">
                {rating.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(rating.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">{rating.totalReviews} reviews</p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = rating.ratingDistribution[stars as keyof typeof rating.ratingDistribution];
                const percentage = rating.totalReviews > 0 ? (count / rating.totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-700 w-8">{stars}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-gray-600 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            {/* Recommendation Rate */}
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rating.recommendationRate}%</p>
                <p className="text-sm text-gray-600">Would recommend</p>
              </div>
            </div>

            {/* Category Averages */}
            {rating.categoryAverages && Object.keys(rating.categoryAverages).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Category Ratings</h4>
                <div className="space-y-1">
                  {Object.entries(rating.categoryAverages).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{key}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-gray-900">{value?.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <Card key={review.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 text-indigo-700 w-10 h-10 rounded-full flex items-center justify-center font-semibold">
                    {review.candidateName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {review.candidateName || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
              )}

              {/* Category Ratings */}
              {review.categories && Object.keys(review.categories).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.entries(review.categories).map(
                    ([key, value]) =>
                      value && (
                        <Badge 
                          key={key} 
                          label={`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}/5`}
                          variant="secondary" 
                          size="sm"
                        />
                      )
                  )}
                </div>
              )}

              {/* Recommendation Badge */}
              {review.wouldRecommend && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="font-medium">Would recommend</span>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Show More Button */}
        {!showFullList && reviews.length > maxReviews && !showAll && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
            >
              Show all {reviews.length} reviews →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
