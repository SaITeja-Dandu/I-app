/**
 * @file pages/InterviewerDashboardScreen.tsx
 * @description Dashboard for interviewers to manage bookings, requests, and availability
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { VideoMeetingInfo } from '../components/VideoMeetingInfo';
import type { InterviewBooking, UserProfile } from '../types';
import { BOOKING_STATUS } from '../utils/constants';
import { BookingService } from '../services/booking';
import { NotificationService } from '../services/notifications';
import { getFirebaseInstances } from '../services/firebase';
import { createLogger } from '../utils/logger';

const logger = createLogger('interviewer-dashboard');

interface InterviewerDashboardScreenProps {
  currentUser: UserProfile;
  onStartInterview: (bookingId: string) => void;
  onBack: () => void;
  onManageAvailability?: () => void;
  onViewEarnings?: () => void;
  onViewAnalytics?: () => void;
  onOpenMessages?: () => void;
  onManageFiles?: () => void;
}

type TabType = 'pending' | 'upcoming' | 'completed';

export const InterviewerDashboardScreen: React.FC<InterviewerDashboardScreenProps> = ({
  currentUser,
  onStartInterview,
  onBack,
  onManageAvailability,
  onViewEarnings,
  onViewAnalytics,
  onOpenMessages,
  onManageFiles,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [bookings, setBookings] = useState<InterviewBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<InterviewBooking | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch bookings with real-time updates
  useEffect(() => {
    logger.info({ userId: currentUser.id }, 'Fetching bookings');
    const { db } = getFirebaseInstances();
    const bookingService = new BookingService(db);
    
    // Subscribe to real-time booking updates
    const unsubscribe = bookingService.subscribeToUserBookings(
      currentUser.id,
      (updatedBookings: InterviewBooking[]) => {
        logger.info({ bookingCount: updatedBookings.length }, 'Bookings updated');
        setBookings(updatedBookings);
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser.id]);

  const handleAcceptBooking = async (bookingId: string) => {
    logger.info({ bookingId }, 'Accept booking initiated');
    setIsProcessing(true);
    try {
      const { db } = getFirebaseInstances();
      const bookingService = new BookingService(db);
      const notificationService = new NotificationService(db);
      
      // Generate meeting link (in production, use actual video service)
      const meetingLink = `https://meet.example.com/${bookingId.slice(0, 8)}`;
      logger.debug({ bookingId, meetingLink }, 'Meeting link generated');
      
      // Accept the booking
      await bookingService.acceptBooking(bookingId, meetingLink);
      logger.info({ bookingId }, 'Booking accepted successfully');
      
      // Get booking details for notification
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        logger.debug({ candidateId: booking.candidateId }, 'Sending acceptance notification');
        // Send notification to candidate
        await notificationService.sendBookingAcceptedNotification(
          booking.candidateId,
          bookingId,
          currentUser.email?.split('@')[0] || 'Your interviewer',
          booking.scheduledDateTime
        );
      }
      
      setSelectedBooking(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ bookingId, error: errorMsg }, 'Failed to accept booking');
      console.error('Error accepting booking:', error);
      alert('Failed to accept booking. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineBooking = async (bookingId: string, reason?: string) => {
    setIsProcessing(true);
    try {
      const { db } = getFirebaseInstances();
      const bookingService = new BookingService(db);
      
      // Cancel the booking
      await bookingService.cancelBooking(
        bookingId,
        'interviewer',
        reason || 'Declined by interviewer'
      );
      
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error declining booking:', error);
      alert('Failed to decline booking. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFilteredBookings = (): InterviewBooking[] => {
    switch (activeTab) {
      case 'pending':
        return bookings.filter(b => b.status === BOOKING_STATUS.PENDING);
      case 'upcoming':
        return bookings.filter(
          b =>
            (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.ACCEPTED) &&
            new Date(b.scheduledDateTime) > new Date()
        );
      case 'completed':
        return bookings.filter(
          b =>
            b.status === BOOKING_STATUS.COMPLETED ||
            b.status === BOOKING_STATUS.CANCELLED ||
            b.status === BOOKING_STATUS.NO_SHOW
        );
      default:
        return [];
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case BOOKING_STATUS.PENDING:
        return <Badge variant="info" label="Pending" />;
      case BOOKING_STATUS.CONFIRMED:
        return <Badge variant="success" label="Confirmed" />;
      case BOOKING_STATUS.COMPLETED:
        return <Badge variant="success" label="Completed" />;
      case BOOKING_STATUS.CANCELLED:
        return <Badge variant="danger" label="Cancelled" />;
      default:
        return <Badge variant="secondary" label={status} />;
    }
  };

  const getStats = () => {
    return {
      pending: bookings.filter(b => b.status === BOOKING_STATUS.PENDING).length,
      upcoming: bookings.filter(
        b =>
          (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.ACCEPTED) &&
          new Date(b.scheduledDateTime) > new Date()
      ).length,
      completed: bookings.filter(b => b.status === BOOKING_STATUS.COMPLETED).length,
      totalEarnings: bookings.filter(b => b.status === BOOKING_STATUS.COMPLETED).length * 100, // Mock calculation
    };
  };

  const stats = getStats();
  const filteredBookings = getFilteredBookings();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 mb-4">
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                {onManageAvailability && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      logger.info({}, 'Manage availability clicked');
                      onManageAvailability();
                    }}
                    className="px-3 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
                  >
                    📅 <span className="hidden sm:inline">Manage </span>Availability
                  </button>
                )}
                {onViewEarnings && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      logger.info({}, 'View earnings clicked');
                      onViewEarnings();
                    }}
                    className="px-3 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
                  >
                    💰 <span className="hidden sm:inline">View </span>Earnings
                  </button>
                )}
                {onViewAnalytics && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      logger.info({}, 'View analytics clicked');
                      onViewAnalytics();
                    }}
                    className="px-3 py-2 text-sm sm:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
                  >
                    📊 <span className="hidden sm:inline">View </span>Analytics
                  </button>
                )}
                {onOpenMessages && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      logger.info({}, 'Messages clicked');
                      onOpenMessages();
                    }}
                    className="px-3 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
                  >
                    💬 Messages
                  </button>
                )}
                {onManageFiles && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      logger.info({}, 'Manage files clicked');
                      onManageFiles();
                    }}
                    className="px-3 py-2 text-sm sm:text-base bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
                  >
                    📁 <span className="hidden sm:inline">Manage </span>Files
                  </button>
                )}
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Interviewer Dashboard
              </span>
            </h1>
            <p className="text-base sm:text-xl text-gray-600">Manage your interview requests and schedule</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="text-2xl sm:text-3xl">⏳</div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="text-2xl sm:text-3xl">📅</div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Upcoming</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.upcoming}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="text-2xl sm:text-3xl">✅</div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Completed</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.completed}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="text-2xl sm:text-3xl">💰</div>
                <div>
                  <p className="text-xs sm:text-sm text-white/90 font-medium">Earnings</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">${stats.totalEarnings}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            <div className="flex flex-col sm:flex-row border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => {
                  logger.debug({}, 'Switched to pending tab');
                  setActiveTab('pending');
                }}
                className={`
                  flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-200 whitespace-nowrap
                  ${
                    activeTab === 'pending'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                Pending{stats.pending > 0 && ` (${stats.pending})`}
              </button>
              <button
                onClick={() => {
                  logger.debug({}, 'Switched to upcoming tab');
                  setActiveTab('upcoming');
                }}
                className={`
                  flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-200 whitespace-nowrap
                  ${
                    activeTab === 'upcoming'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                Upcoming{stats.upcoming > 0 && ` (${stats.upcoming})`}
              </button>
              <button
                onClick={() => {
                  logger.debug({}, 'Switched to completed tab');
                  setActiveTab('completed');
                }}
                className={`
                  flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-200 whitespace-nowrap
                  ${
                    activeTab === 'completed'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                History
              </button>
            </div>

            {/* Bookings List */}
            <div className="p-6">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">
                    {activeTab === 'pending' && '📭'}
                    {activeTab === 'upcoming' && '📅'}
                    {activeTab === 'completed' && '📊'}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {activeTab === 'pending' && 'No pending requests'}
                    {activeTab === 'upcoming' && 'No upcoming interviews'}
                    {activeTab === 'completed' && 'No completed interviews'}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'pending' && 'New requests will appear here'}
                    {activeTab === 'upcoming' && 'Accepted interviews will show up here'}
                    {activeTab === 'completed' && 'Your interview history will be displayed here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white/60 rounded-xl shadow p-6 border border-gray-200 hover:border-blue-300 transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {booking.candidateName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">{booking.candidateName}</h3>
                              <p className="text-gray-600">{booking.role}</p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-500">Date & Time</p>
                              <p className="font-semibold text-gray-800">
                                {new Date(booking.scheduledDateTime).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-gray-600">
                                {new Date(booking.scheduledDateTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500">Duration</p>
                              <p className="font-semibold text-gray-800">{booking.durationMinutes} minutes</p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500">Difficulty</p>
                              <p className="font-semibold text-gray-800 capitalize">
                                {booking.difficulty}
                              </p>
                            </div>
                          </div>

                          {booking.skills && (
                            <div className="flex flex-wrap gap-2">
                              {booking.skills.slice(0, 4).map((skill: string) => (
                                <Badge key={skill} variant="primary" label={skill} />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 sm:w-48 w-full">
                          {booking.status === BOOKING_STATUS.PENDING && (
                            <>
                              <button
                                onClick={() => setSelectedBooking(booking)}
                                className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all duration-200"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => handleDeclineBooking(booking.id)}
                                disabled={isProcessing}
                                className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg font-semibold bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {booking.status === BOOKING_STATUS.CONFIRMED && (
                            <>
                              <button
                                onClick={() => onStartInterview(booking.id)}
                                className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg transition-all duration-200"
                              >
                                Start Interview
                              </button>
                              {booking.meetingLink && (
                                <a
                                  href={booking.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg font-semibold text-center bg-white text-blue-600 border-2 border-blue-300 hover:bg-blue-50 transition-all duration-200"
                                >
                                  Meeting Link
                                </a>
                              )}
                            </>
                          )}

                          {booking.status === BOOKING_STATUS.COMPLETED && (
                            <button className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg font-semibold bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200">
                              View Details
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Review Request</h2>
                <p className="text-gray-600">Interview with {selectedBooking.candidateName}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Candidate Details */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">Candidate Profile</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Target Role</p>
                  <p className="font-semibold text-gray-800">{selectedBooking.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Difficulty</p>
                  <p className="font-semibold text-gray-800 capitalize">
                    {selectedBooking.difficulty}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Skills</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedBooking.skills?.map((skill: string) => (
                      <Badge key={skill} variant="primary" label={skill} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Details */}
            <div className="mb-6 p-6 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">Interview Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Scheduled Date & Time</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(selectedBooking.scheduledDateTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(selectedBooking.scheduledDateTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Duration</p>
                  <p className="font-semibold text-gray-800">{selectedBooking.durationMinutes} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(selectedBooking.createdAt).toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>
            </div>

            {/* Video Meeting Info */}
            {selectedBooking.meetingLink && (
              <div className="mb-6">
                <VideoMeetingInfo booking={selectedBooking} showJoinButton={false} />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeclineBooking(selectedBooking.id, 'Not available at this time')}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 rounded-xl font-semibold bg-white text-red-600 border-2 border-red-300 hover:bg-red-50 transition-all duration-300 disabled:opacity-50"
              >
                {isProcessing ? 'Declining...' : 'Decline'}
              </button>
              <button
                onClick={() => handleAcceptBooking(selectedBooking.id)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {isProcessing ? 'Accepting...' : 'Accept & Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default InterviewerDashboardScreen;
