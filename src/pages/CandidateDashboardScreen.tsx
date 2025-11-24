/**
 * @file pages/CandidateDashboardScreen.tsx
 * @description Dashboard for candidates to view their bookings and join interviews
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { VideoMeetingInfo } from '../components/VideoMeetingInfo';
import type { InterviewBooking, UserProfile } from '../types';
import { BookingService } from '../services/booking';
import { getFirebaseInstances } from '../services/firebase';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface CandidateDashboardScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
  onSubmitReview?: (bookingId: string, interviewerId: string, interviewerName: string) => void;
  onViewSavedInterviewers?: () => void;
  onViewHistory?: () => void;
  onManageFiles?: () => void;
}

type TabType = 'upcoming' | 'completed' | 'all';

export const CandidateDashboardScreen: React.FC<CandidateDashboardScreenProps> = ({
  currentUser,
  onBack,
  onSubmitReview,
  onViewSavedInterviewers,
  onViewHistory,
  onManageFiles,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [bookings, setBookings] = useState<InterviewBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<InterviewBooking | null>(null);

  // Fetch bookings with real-time updates
  useEffect(() => {
    const { db } = getFirebaseInstances();
    const bookingService = new BookingService(db);
    
    // Subscribe to real-time booking updates
    const unsubscribe = bookingService.subscribeToUserBookings(
      currentUser.id,
      (updatedBookings: InterviewBooking[]) => {
        setBookings(updatedBookings);
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser.id]);

  const filterBookings = (bookings: InterviewBooking[]) => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return bookings.filter(
          b => b.status === 'confirmed' && new Date(b.scheduledDateTime) > now
        );
      case 'completed':
        return bookings.filter(
          b => b.status === 'completed' || new Date(b.scheduledDateTime) < now
        );
      case 'all':
        return bookings;
      default:
        return bookings;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' }> = {
      pending: { label: 'Pending', variant: 'warning' },
      confirmed: { label: 'Confirmed', variant: 'success' },
      completed: { label: 'Completed', variant: 'secondary' },
      cancelled: { label: 'Cancelled', variant: 'danger' },
      declined: { label: 'Declined', variant: 'danger' },
    };

    const config = variants[status] || { label: status, variant: 'secondary' };
    return <Badge label={config.label} variant={config.variant} />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
      case 'declined':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const filteredBookings = filterBookings(bookings);

  const stats = {
    upcoming: bookings.filter(b => b.status === 'confirmed' && new Date(b.scheduledDateTime) > new Date()).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    total: bookings.length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading your bookings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Interview Schedule
            </span>
          </h1>
          <p className="text-xl text-gray-600">Manage your upcoming interviews and review past sessions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">📅</div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Upcoming</p>
                <p className="text-3xl font-bold text-gray-800">{stats.upcoming}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">✅</div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-800">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">📊</div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {(onViewSavedInterviewers || onViewHistory || onManageFiles) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {onViewSavedInterviewers && (
              <button
                onClick={onViewSavedInterviewers}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-3xl sm:text-4xl flex-shrink-0">⭐</div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-1 truncate">Saved Interviewers</h3>
                    <p className="text-xs sm:text-sm text-gray-600">View your favorite interviewers</p>
                  </div>
                </div>
              </button>
            )}
            
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-3xl sm:text-4xl flex-shrink-0">📚</div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-1 truncate">Interview History</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Review past interviews and ratings</p>
                  </div>
                </div>
              </button>
            )}
            
            {onManageFiles && (
              <button
                onClick={onManageFiles}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-3xl sm:text-4xl flex-shrink-0">📁</div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-1 truncate">Manage Files</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Upload and manage your documents</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-1 sm:p-2 inline-flex gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto">
          {(['upcoming', 'completed', 'all'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 capitalize whitespace-nowrap
                ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No {activeTab} interviews
              </h3>
              <p className="text-gray-600">
                {activeTab === 'upcoming' 
                  ? "You don't have any upcoming interviews scheduled."
                  : "No interviews found in this category."}
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(booking.status)}
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {booking.type === 'ai' ? 'AI Practice Interview' : `Interview with ${booking.interviewerName}`}
                          </h3>
                          <p className="text-gray-600">{booking.role}</p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {new Date(booking.scheduledDateTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {new Date(booking.scheduledDateTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {' · '}
                          {booking.durationMinutes} min
                        </span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {booking.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} label={skill} variant="secondary" size="sm" />
                      ))}
                      {booking.skills.length > 4 && (
                        <Badge label={`+${booking.skills.length - 4} more`} variant="secondary" size="sm" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
                      >
                        View Details
                      </button>
                      {booking.status === 'completed' && booking.interviewerId && onSubmitReview && (
                        <button
                          onClick={() => onSubmitReview(booking.id, booking.interviewerId!, booking.interviewerName || 'Interviewer')}
                          className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors"
                        >
                          Write Review
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Video Meeting Info (Compact) */}
                  {booking.meetingLink && booking.status === 'confirmed' && (
                    <div className="lg:w-80">
                      <VideoMeetingInfo booking={booking} compact={true} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Interview Details</h2>
                <p className="text-gray-600">
                  {selectedBooking.type === 'ai' ? 'AI Practice Interview' : `With ${selectedBooking.interviewerName}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Status */}
            <div className="mb-6">
              {getStatusBadge(selectedBooking.status)}
            </div>

            {/* Video Meeting */}
            {selectedBooking.meetingLink && (
              <div className="mb-6">
                <VideoMeetingInfo booking={selectedBooking} />
              </div>
            )}

            {/* Interview Info */}
            <div className="mb-6 p-6 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">Interview Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-semibold text-gray-800">{selectedBooking.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Difficulty Level</p>
                  <p className="font-semibold text-gray-800 capitalize">{selectedBooking.difficulty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Skills</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedBooking.skills.map((skill) => (
                      <Badge key={skill} label={skill} variant="primary" size="sm" />
                    ))}
                  </div>
                </div>
                {selectedBooking.focusAreas && selectedBooking.focusAreas.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Focus Areas</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedBooking.focusAreas.map((area) => (
                        <Badge key={area} label={area} variant="secondary" size="sm" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboardScreen;
