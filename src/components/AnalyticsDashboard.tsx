/**
 * @file components/AnalyticsDashboard.tsx
 * @description Analytics dashboard component for interviewers
 */

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { getAnalyticsService, type InterviewerAnalytics, type AnalyticsTimeRange } from '../services/analytics';
import { createLogger } from '../utils/logger';
import { TrendingUp, DollarSign, Star, Clock, Users, Calendar, Award, BarChart } from 'lucide-react';

const logger = createLogger('analytics-dashboard');

interface AnalyticsDashboardProps {
  interviewerId: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  interviewerId,
}) => {
  const [analytics, setAnalytics] = useState<InterviewerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('month');

  useEffect(() => {
    loadAnalytics();
  }, [interviewerId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const analyticsService = getAnalyticsService();
      const data = await analyticsService.getInterviewerAnalytics(interviewerId, timeRange);
      setAnalytics(data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load analytics';
      logger.error({ error }, 'Failed to load analytics');
      setError(errorMsg);
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" message="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12 border-red-200 bg-red-50 p-6">
        <BarChart className="h-16 w-16 text-red-300 mx-auto mb-4" />
        <p className="text-red-700 font-semibold mb-2">Unable to Load Analytics</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={() => loadAnalytics()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="text-center py-12 p-6">
        <BarChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available yet</p>
        <p className="text-gray-500 text-sm mt-2">Complete interviews to see your analytics</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'quarter', 'year', 'all'] as AnalyticsTimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all capitalize
              ${
                timeRange === range
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Earnings */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-green-900">
                ${analytics.totalEarnings.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">
                ${analytics.averageSessionRate.toFixed(0)} avg/session
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>

        {/* Average Rating */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-yellow-900">
                {analytics.averageRating.toFixed(1)}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {analytics.totalReviews} review{analytics.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
              <Star className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
        </Card>

        {/* Completed Interviews */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Completed</p>
              <p className="text-3xl font-bold text-blue-900">
                {analytics.completedInterviews}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {analytics.completionRate.toFixed(0)}% completion rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>

        {/* Total Hours */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">Total Hours</p>
              <p className="text-3xl font-bold text-purple-900">
                {analytics.totalHoursCompleted.toFixed(0)}h
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {analytics.averageSessionDuration.toFixed(0)}m avg session
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Rating Distribution
          </h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = analytics.ratingDistribution[rating as keyof typeof analytics.ratingDistribution];
              const percentage = analytics.totalReviews > 0 ? (count / analytics.totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="font-semibold text-gray-700">{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Performance Stats */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Performance Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Response Time</span>
              <span className="font-semibold text-gray-900">
                {analytics.responseTime.toFixed(1)} hours
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rebook Rate</span>
              <span className="font-semibold text-gray-900">
                {analytics.rebookRate.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Upcoming Interviews</span>
              <span className="font-semibold text-gray-900">
                {analytics.upcomingInterviews}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cancelled</span>
              <span className="font-semibold text-gray-900">
                {analytics.cancelledInterviews}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Specializations */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-500" />
          Top Specializations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics.topSpecializations.slice(0, 3).map((spec, index) => (
            <div
              key={spec.name}
              className={`
                p-4 rounded-xl border-2 transition-all
                ${
                  index === 0
                    ? 'bg-yellow-50 border-yellow-300'
                    : index === 1
                    ? 'bg-gray-50 border-gray-300'
                    : 'bg-orange-50 border-orange-300'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-700">
                    {spec.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{spec.name}</h4>
              <p className="text-sm text-gray-600">{spec.count} interview{spec.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly Trends */}
      {analytics.monthlyStats.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Monthly Trends (Last 6 Months)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Month</th>
                  <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">Interviews</th>
                  <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">Hours</th>
                  <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyStats.slice(0, 6).map((stat) => (
                  <tr key={stat.month} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{stat.month}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{stat.interviews}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{stat.hours.toFixed(1)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-semibold">
                      ${stat.earnings.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Best Time Slots */}
      {analytics.bestTimeSlots.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Most Popular Time Slots
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {analytics.bestTimeSlots.map((slot, index) => (
              <div
                key={`${slot.day}-${slot.time}`}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200"
              >
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">#{index + 1}</p>
                  <p className="font-semibold text-gray-900">{slot.day}</p>
                  <p className="text-sm text-gray-700">{slot.time}</p>
                  <Badge label={`${slot.count} sessions`} variant="secondary" size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
