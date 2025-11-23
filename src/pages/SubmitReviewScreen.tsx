/**
 * @file pages/SubmitReviewScreen.tsx
 * @description Screen for candidates to submit reviews after interviews
 */

import React, { useState, useEffect } from 'react';
import { getRatingService, type CreateReviewInput } from '../services/rating';
import { getAuth } from 'firebase/auth';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Textarea } from '../components/Textarea';
import { createLogger } from '../utils/logger';
import { Star, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';

const logger = createLogger('SubmitReviewScreen');

interface SubmitReviewScreenProps {
  bookingId: string;
  interviewerId: string;
  interviewerName: string;
  onComplete: () => void;
  onCancel: () => void;
}

const CATEGORY_LABELS = {
  technical: 'Technical Knowledge',
  communication: 'Communication Skills',
  professionalism: 'Professionalism',
  helpfulness: 'Helpfulness',
};

export const SubmitReviewScreen: React.FC<SubmitReviewScreenProps> = ({
  bookingId,
  interviewerId,
  interviewerName,
  onComplete,
  onCancel,
}) => {
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({
    technical: 0,
    communication: 0,
    professionalism: 0,
    helpfulness: 0,
  });
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const userName = auth.currentUser?.displayName || auth.currentUser?.email || 'Anonymous';

  // Check if review already exists
  useEffect(() => {
    const checkExistingReview = async () => {
      try {
        const ratingService = getRatingService();
        const existingReview = await ratingService.getReviewByBookingId(bookingId);
        if (existingReview) {
          setSubmitted(true);
          setError('You have already submitted a review for this interview.');
        }
      } catch (err) {
        logger.error({ error: err }, 'Failed to check existing review');
      }
    };

    checkExistingReview();
  }, [bookingId]);

  const handleCategoryRating = (category: string, rating: number) => {
    setCategoryRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async () => {
    if (!userId) {
      setError('You must be logged in to submit a review.');
      return;
    }

    if (overallRating === 0) {
      setError('Please provide an overall rating.');
      return;
    }

    if (wouldRecommend === null) {
      setError('Please indicate if you would recommend this interviewer.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const input: CreateReviewInput = {
        interviewerId,
        candidateId: userId,
        candidateName: userName,
        bookingId,
        rating: overallRating,
        comment: comment.trim() || undefined,
        categories: {
          technical: categoryRatings.technical || undefined,
          communication: categoryRatings.communication || undefined,
          professionalism: categoryRatings.professionalism || undefined,
          helpfulness: categoryRatings.helpfulness || undefined,
        },
        wouldRecommend,
      };

      const ratingService = getRatingService();
      await ratingService.submitReview(input);

      setSubmitted(true);
      logger.info({ bookingId, interviewerId }, 'Review submitted successfully');

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      logger.error({ error: err }, 'Failed to submit review');
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
            <p className="text-gray-600">
              Thank you for your feedback. Your review helps other candidates make informed decisions.
            </p>
          </div>
          <Button onClick={onComplete} size="lg" className="w-full">
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-6">
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Your Interview Experience</h1>
          <p className="text-gray-600">
            Share your feedback about your interview with <span className="font-semibold">{interviewerName}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Rating</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setOverallRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-12 w-12 ${
                    star <= (hoveredRating || overallRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-gray-600 text-sm">
            {overallRating === 0 && 'Click to rate'}
            {overallRating === 1 && 'Poor'}
            {overallRating === 2 && 'Fair'}
            {overallRating === 3 && 'Good'}
            {overallRating === 4 && 'Very Good'}
            {overallRating === 5 && 'Excellent'}
          </p>
        </Card>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Ratings</h2>
          <div className="space-y-4">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleCategoryRating(key, star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= categoryRatings[key]
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {categoryRatings[key] === 0 ? 'Not rated' : `${categoryRatings[key]}/5`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Would You Recommend?</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setWouldRecommend(true)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                wouldRecommend === true
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-300'
              }`}
            >
              <ThumbsUp
                className={`h-8 w-8 mx-auto mb-2 ${
                  wouldRecommend === true ? 'text-green-600' : 'text-gray-400'
                }`}
              />
              <p className={`text-center font-medium ${
                wouldRecommend === true ? 'text-green-900' : 'text-gray-700'
              }`}>
                Yes, I would recommend
              </p>
            </button>
            <button
              onClick={() => setWouldRecommend(false)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                wouldRecommend === false
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-red-300'
              }`}
            >
              <ThumbsDown
                className={`h-8 w-8 mx-auto mb-2 ${
                  wouldRecommend === false ? 'text-red-600' : 'text-gray-400'
                }`}
              />
              <p className={`text-center font-medium ${
                wouldRecommend === false ? 'text-red-900' : 'text-gray-700'
              }`}>
                No, I would not recommend
              </p>
            </button>
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Written Review <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </h2>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this interviewer. What did you like? What could be improved?"
            rows={6}
            maxLength={1000}
          />
          <p className="text-sm text-gray-500 mt-2 text-right">{comment.length}/1000 characters</p>
        </Card>

        <div className="flex gap-4">
          <Button onClick={onCancel} variant="outline" size="lg" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || overallRating === 0 || wouldRecommend === null}
            size="lg"
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmitReviewScreen;
