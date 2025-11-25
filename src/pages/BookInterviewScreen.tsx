/**
 * @file pages/BookInterviewScreen.tsx
 * @description Screen for candidates to browse interviewers and book live interview sessions
 */

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Badge } from '../components/Badge';
import { InterviewerReviews } from '../components/InterviewerReviews';
import { PaymentCheckout } from '../components/PaymentCheckout';
import { FavoriteButton } from '../components/FavoriteButton';
import type { UserProfile } from '../types';
import { INTERVIEW_DURATIONS } from '../utils/constants';
import { BookingService } from '../services/booking';
import { NotificationService } from '../services/notifications';
import { getFirebaseInstances } from '../services/firebase';
import { getInterviewerService, type InterviewerWithProfile } from '../services/interviewer';
import { getRatingService } from '../services/rating';
import { getPaymentService } from '../services/payment';
import { createLogger } from '../utils/logger';
import { Star } from 'lucide-react';

const logger = createLogger('book-interview-screen');

interface BookInterviewScreenProps {
  onBookingCreated: (bookingId: string) => void;
  currentUser: UserProfile;
}

export const BookInterviewScreen: React.FC<BookInterviewScreenProps> = ({
  onBookingCreated,
  currentUser,
}) => {
  const [interviewers, setInterviewers] = useState<InterviewerWithProfile[]>([]);
  const [filteredInterviewers, setFilteredInterviewers] = useState<InterviewerWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInterviewer, setSelectedInterviewer] = useState<InterviewerWithProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(45);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [minExperience, setMinExperience] = useState(0);
  const [isBooking, setIsBooking] = useState(false);
  const [interviewerRatings, setInterviewerRatings] = useState<Record<string, { rating: number; count: number }>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Fetch real interviewers from Firestore
  useEffect(() => {
    const fetchInterviewers = async () => {
      logger.info({}, '🔵 [BOOKING-SCREEN] Starting to fetch interviewers');
      setIsLoading(true);
      try {
        const interviewerService = getInterviewerService();
        logger.info({}, '🔵 [BOOKING-SCREEN] Calling getAvailableInterviewers');
        const result = await interviewerService.getAvailableInterviewers({}, 50);
        
        logger.info({ count: result.interviewers.length }, '🟢 [BOOKING-SCREEN] Loaded interviewers - count: ' + result.interviewers.length);
        
        if (result.interviewers.length === 0) {
          logger.warn({}, '🟡 [BOOKING-SCREEN] No interviewers found! This is the issue.');
        } else {
          logger.info({ interviewerIds: result.interviewers.map(i => i.id) }, '🟢 [BOOKING-SCREEN] Interviewers found: ' + result.interviewers.map(i => i.id).join(', '));
        }
        
        setInterviewers(result.interviewers);
        setFilteredInterviewers(result.interviewers);
        
        // Load ratings for each interviewer
        const ratingService = getRatingService();
        const ratings: Record<string, { rating: number; count: number }> = {};
        
        for (const interviewer of result.interviewers) {
          try {
            const rating = await ratingService.getInterviewerRating(interviewer.id);
            if (rating) {
              ratings[interviewer.id] = {
                rating: rating.averageRating,
                count: rating.totalReviews,
              };
            }
          } catch (error) {
            logger.error({ error, interviewerId: interviewer.id }, 'Failed to load rating');
          }
        }
        
        setInterviewerRatings(ratings);
        logger.info({}, '🟢 [BOOKING-SCREEN] Fetch complete');
      } catch (error) {
        logger.error({ error }, '🔴 [BOOKING-SCREEN] Error fetching interviewers');
        console.error('Error fetching interviewers:', error);
        // Fallback to empty array on error
        setInterviewers([]);
        setFilteredInterviewers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviewers();
  }, []);

  // Filter interviewers based on criteria
  useEffect(() => {
    let filtered = [...interviewers];

    if (selectedSpecialization) {
      filtered = filtered.filter(interviewer =>
        interviewer.interviewerProfile.specializations.includes(selectedSpecialization)
      );
    }

    if (minExperience > 0) {
      filtered = filtered.filter(
        interviewer => interviewer.interviewerProfile.yearsOfExperience >= minExperience
      );
    }

    // Sort by rating
    filtered.sort((a, b) => (b.interviewerProfile.rating || 0) - (a.interviewerProfile.rating || 0));

    setFilteredInterviewers(filtered);
  }, [selectedSpecialization, minExperience, interviewers]);

  // Clear booking state when interviewer changes
  useEffect(() => {
    if (selectedInterviewer) {
      setSelectedDate('');
      setSelectedTime('');
      setAvailableTimeSlots([]);
    }
  }, [selectedInterviewer?.id]);

  const handleBookInterview = async () => {
    if (!selectedInterviewer || !selectedDate || !selectedTime) {
      alert('Please select a date and time');
      return;
    }

    // Validate that the selected time is within available slots
    if (!isTimeSlotAvailable(selectedDate, selectedTime)) {
      alert('The selected time is not available. Please choose from the suggested time slots.');
      return;
    }

    // Store booking data and show payment screen
    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
    setPendingBookingData({
      candidateId: currentUser.id,
      candidateName: currentUser.email?.split('@')[0] || 'Candidate',
      candidateEmail: currentUser.email || '',
      interviewerId: selectedInterviewer.id,
      interviewerName: selectedInterviewer.email?.split('@')[0] || 'Interviewer',
      interviewerEmail: selectedInterviewer.email || '',
      type: 'live',
      scheduledDateTime,
      durationMinutes: selectedDuration,
      timezone: 'UTC',
      role: currentUser.role,
      skills: currentUser.skills,
      difficulty: 'intermediate',
      status: 'pending',
      hourlyRate: selectedInterviewer.interviewerProfile.hourlyRate,
    });
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    if (!pendingBookingData) return;

    setIsBooking(true);
    try {
      const { db } = getFirebaseInstances();
      const bookingService = new BookingService(db);
      const notificationService = new NotificationService(db);
      const paymentService = getPaymentService();
      
      // Calculate payment details
      const pricing = paymentService.calculatePricing(
        pendingBookingData.hourlyRate,
        pendingBookingData.durationMinutes,
        'USD'
      );

      // Create booking with payment info
      const bookingId = await bookingService.createBooking({
        ...pendingBookingData,
        paymentAmount: pricing.total,
        paymentCurrency: pricing.currency,
        paymentStatus: 'completed',
        platformFee: pricing.platformFee,
        interviewerEarnings: pricing.interviewerEarnings,
      });

      // Send notification to interviewer
      await notificationService.sendBookingRequestNotification(
        pendingBookingData.interviewerId,
        bookingId,
        pendingBookingData.candidateName,
        pendingBookingData.scheduledDateTime
      );
      
      onBookingCreated(bookingId);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsBooking(false);
      setShowPayment(false);
      setPendingBookingData(null);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Helper function to get available time slots for a selected date
  const getAvailableTimeSlotsForDate = (date: string): string[] => {
    if (!selectedInterviewer || !date) return [];

    try {
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get interviewer's availability for this day of week
      const availability = selectedInterviewer.interviewerProfile.availability || [];
      const dayAvailability = availability.find(slot => slot.dayOfWeek === dayOfWeek);

      if (!dayAvailability) {
        // Interviewer not available this day
        return [];
      }

      // Generate time slots between start and end time (in 15-minute intervals)
      const slots: string[] = [];
      const [startHour, startMin] = dayAvailability.startTime.split(':').map(Number);
      const [endHour, endMin] = dayAvailability.endTime.split(':').map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        slots.push(timeStr);

        // Add 15 minutes for next slot
        currentMin += 15;
        if (currentMin >= 60) {
          currentMin -= 60;
          currentHour += 1;
        }
      }

      return slots;
    } catch (error) {
      console.error('Error calculating available time slots:', error);
      return [];
    }
  };

  // Check if selected time is within available time slots
  const isTimeSlotAvailable = (date: string, time: string): boolean => {
    const availableSlots = getAvailableTimeSlotsForDate(date);
    return availableSlots.length > 0 && availableSlots.includes(time);
  };

  // Get day name and available hours for display
  const getAvailabilityDisplay = (date: string): string => {
    if (!selectedInterviewer || !date) return '';

    try {
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      const availability = selectedInterviewer.interviewerProfile.availability || [];
      const dayAvailability = availability.find(slot => slot.dayOfWeek === dayOfWeek);

      if (!dayAvailability) {
        return `${dayNames[dayOfWeek]} - Not available`;
      }

      const timezone = dayAvailability.timezone || 'UTC';
      return `${dayNames[dayOfWeek]} - Available ${dayAvailability.startTime} to ${dayAvailability.endTime} (${timezone})`;
    } catch (error) {
      return '';
    }
  };

  const allSpecializations = Array.from(
    new Set(interviewers.flatMap(i => i.interviewerProfile.specializations))
  ).sort();

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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Book a Live Interview
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Connect with experienced professionals for personalized interview practice
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 sticky top-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">🔍 Filters</h2>

                {/* Specialization Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specialization
                  </label>
                  <select
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Specializations</option>
                    {allSpecializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Minimum Experience
                  </label>
                  <select
                    value={minExperience}
                    onChange={(e) => setMinExperience(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="0">Any</option>
                    <option value="3">3+ years</option>
                    <option value="5">5+ years</option>
                    <option value="8">8+ years</option>
                    <option value="10">10+ years</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>{filteredInterviewers.length}</strong> interviewers available
                  </p>
                </div>
              </div>
            </div>

            {/* Interviewers List */}
            <div className="lg:col-span-2">
              {filteredInterviewers.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-white/20">
                  <div className="text-6xl mb-4">😔</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No interviewers found</h3>
                  <p className="text-gray-600">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredInterviewers.map((interviewer) => (
                    <div
                      key={interviewer.id}
                      className={`
                        bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 transition-all duration-300
                        ${
                          selectedInterviewer?.id === interviewer.id
                            ? 'border-blue-500 shadow-2xl'
                            : 'border-white/20 hover:border-blue-300'
                        }
                      `}
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-2xl font-bold text-gray-800">
                                  {(() => {
                                    const displayName = interviewer.name || interviewer.email?.split('@')[0] || 'Unknown';
                                    console.log('[BookInterviewScreen] Displaying name for interviewer:', { id: interviewer.id, name: interviewer.name, email: interviewer.email, displayName });
                                    return displayName;
                                  })()}
                                </h3>
                                <FavoriteButton
                                  candidateId={currentUser.id}
                                  interviewerId={interviewer.id}
                                  interviewerName={interviewer.name || interviewer.email?.split('@')[0] || 'Unknown'}
                                  interviewerTitle={interviewer.interviewerProfile.title}
                                  interviewerCompany={interviewer.interviewerProfile.company}
                                  interviewerRating={interviewerRatings[interviewer.id]?.rating}
                                  size="md"
                                />
                              </div>
                              <p className="text-gray-600 font-medium">
                                {interviewer.interviewerProfile.title || interviewer.role || 'Interviewer'}
                                {interviewer.interviewerProfile.company && ` at ${interviewer.interviewerProfile.company}`}
                              </p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-1">
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">
                                {interviewerRatings[interviewer.id]?.rating?.toFixed(1) || interviewer.interviewerProfile.rating || 'N/A'}
                              </span>
                            </div>
                            <div className="text-gray-600">
                              {interviewerRatings[interviewer.id]?.count || interviewer.interviewerProfile.totalReviews || 0} reviews
                            </div>
                            <div className="text-gray-600">
                              {interviewer.interviewerProfile.yearsOfExperience} years exp
                            </div>
                          </div>

                          {/* Bio */}
                          <p className="text-gray-700 mb-4 leading-relaxed">
                            {interviewer.interviewerProfile.bio}
                          </p>

                          {/* Specializations */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {interviewer.interviewerProfile.specializations.slice(0, 3).map((spec) => (
                              <Badge key={spec} label={spec} variant="secondary" />
                            ))}
                            {interviewer.interviewerProfile.specializations.length > 3 && (
                              <Badge 
                                label={`+${interviewer.interviewerProfile.specializations.length - 3} more`}
                                variant="secondary" 
                              />
                            )}
                          </div>

                          {/* Technical Skills */}
                          {interviewer.interviewerProfile.skills && interviewer.interviewerProfile.skills.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Technical Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {interviewer.interviewerProfile.skills.slice(0, 5).map((skill) => (
                                  <span 
                                    key={skill}
                                    className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {interviewer.interviewerProfile.skills.length > 5 && (
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                    +{interviewer.interviewerProfile.skills.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Availability */}
                          {interviewer.interviewerProfile.availability && interviewer.interviewerProfile.availability.length > 0 && (
                            <div className="text-sm text-gray-600">
                              <strong>Available:</strong>{' '}
                              {interviewer.interviewerProfile.availability.map((a: any) => {
                                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                const dayName = days[a.dayOfWeek];
                                return `${dayName} ${a.startTime}-${a.endTime}`;
                              }).join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Booking Panel */}
                        <div className="md:w-72">
                          <button
                            onClick={() => setSelectedInterviewer(interviewer)}
                            className={`
                              w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300
                              ${
                                selectedInterviewer?.id === interviewer.id
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
                              }
                            `}
                          >
                            {selectedInterviewer?.id === interviewer.id ? 'Selected ✓' : 'Select'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking Modal */}
          {selectedInterviewer && !showPayment && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Book Interview</h2>
                  <p className="text-gray-600">with {selectedInterviewer.name || selectedInterviewer.email?.split('@')[0] || 'Unknown'}</p>
                  </div>
                  <button
                    onClick={() => setSelectedInterviewer(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Date Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Date *
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime(''); // Reset time when date changes
                      setAvailableTimeSlots(getAvailableTimeSlotsForDate(e.target.value));
                    }}
                    min={getMinDate()}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                  {selectedDate && (
                    <p className="text-sm text-gray-600 mt-2">
                      {getAvailabilityDisplay(selectedDate)}
                    </p>
                  )}
                </div>

                {/* Time Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Time *
                  </label>
                  {selectedDate ? (
                    availableTimeSlots.length > 0 ? (
                      <>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-3">
                          {availableTimeSlots.map((timeSlot) => (
                            <button
                              key={timeSlot}
                              onClick={() => setSelectedTime(timeSlot)}
                              className={`
                                px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                ${
                                  selectedTime === timeSlot
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                                }
                              `}
                            >
                              {timeSlot}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Click a time slot to select. Showing all available times for this day.
                        </p>
                      </>
                    ) : (
                      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                        <p className="text-red-700 font-medium">
                          ❌ Interviewer is not available on this date
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          Please select a different date
                        </p>
                      </div>
                    )
                  ) : (
                    <input
                      type="time"
                      disabled
                      value={selectedTime}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-400"
                      placeholder="Select a date first"
                    />
                  )}
                </div>

                {/* Duration Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Interview Duration
                  </label>
                  <div className="flex gap-3">
                    {INTERVIEW_DURATIONS.map((duration) => (
                      <button
                        key={duration}
                        onClick={() => setSelectedDuration(duration)}
                        className={`
                          flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200
                          ${
                            selectedDuration === duration
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Booking Summary</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>📅 {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No date selected'}</p>
                    <p>⏰ {selectedTime || 'No time selected'}</p>
                    <p>⏱️ Duration: {selectedDuration} minutes</p>
                    <p>💰 Rate: ${selectedInterviewer.interviewerProfile.hourlyRate}/hour</p>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Reviews & Ratings</h3>
                  <InterviewerReviews 
                    interviewerId={selectedInterviewer.id} 
                    maxReviews={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedInterviewer(null)}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookInterview}
                    disabled={!selectedDate || !selectedTime || !isTimeSlotAvailable(selectedDate, selectedTime) || isBooking}
                    className="flex-1 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    title={!isTimeSlotAvailable(selectedDate, selectedTime) ? 'Selected time is not within interviewer availability' : ''}
                  >
                    {isBooking ? 'Booking...' : 'Continue to Payment'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payment Modal */}
          {showPayment && pendingBookingData && selectedInterviewer && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <PaymentCheckout
                  bookingId="pending"
                  interviewerName={selectedInterviewer.name || selectedInterviewer.email?.split('@')[0] || 'Unknown'}
                  hourlyRate={selectedInterviewer.interviewerProfile.hourlyRate || 100}
                  durationMinutes={selectedDuration}
                  onPaymentSuccess={handlePaymentSuccess}
                  onCancel={() => {
                    setShowPayment(false);
                    setPendingBookingData(null);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

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

export default BookInterviewScreen;
