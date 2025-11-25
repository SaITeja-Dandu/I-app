import React, { useState, useEffect } from 'react';
import { getAvailabilityService, type AvailabilitySlot, type DayAvailability } from '../services/availability';
import { getFirestoreService } from '../services/firestore';
import { getAuth } from 'firebase/auth';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { createLogger } from '../utils/logger';
import { AlertCircle, Clock, Plus, Trash2, Save, Calendar } from 'lucide-react';

const logger = createLogger('InterviewerAvailabilityScreen');

interface InterviewerAvailabilityScreenProps {
  onBack?: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_TO_NUMBER: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};
const NUMBER_TO_DAY: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};
// Timezone selection removed – currently fixed to India (IST)

interface TimeSlotInput {
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlotInput[];
}

type WeekSchedule = Record<string, DaySchedule>;

export const InterviewerAvailabilityScreen: React.FC<InterviewerAvailabilityScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Fixed timezone for all availability (India Standard Time)
  const timezone = 'Asia/Kolkata';
  const [existingSlots, setExistingSlots] = useState<AvailabilitySlot[]>([]);
  
  // Set page title when component mounts
  React.useEffect(() => {
    document.title = 'Manage Availability - Intervuu';
    return () => {
      document.title = 'Intervuu';
    };
  }, []);
  
  // Weekly schedule state
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>({
    Monday: { enabled: false, slots: [{ startTime: '09:00', endTime: '17:00' }] },
    Tuesday: { enabled: false, slots: [{ startTime: '09:00', endTime: '17:00' }] },
    Wednesday: { enabled: false, slots: [{ startTime: '09:00', endTime: '17:00' }] },
    Thursday: { enabled: false, slots: [{ startTime: '09:00', endTime: '17:00' }] },
    Friday: { enabled: false, slots: [{ startTime: '09:00', endTime: '17:00' }] },
    Saturday: { enabled: false, slots: [{ startTime: '09:00', endTime: '17:00' }] },
    Sunday: { enabled: false, slots: [{ startTime: '09:00', endTime: '17:00' }] },
  });

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Load existing availability
  useEffect(() => {
    if (!userId) {
      logger.warn({}, 'No userId available');
      setLoading(false);
      return;
    }

    const loadAvailability = async () => {
      try {
        logger.info({ userId }, 'Loading availability');
        setLoading(true);
        setError(null);
        
        // Ensure interviewer profile exists (auto-create if needed)
        const firestoreService = getFirestoreService();
        let currentProfile = await firestoreService.getUserProfile(userId);
        
        // If no profile exists at all, create a minimal one
        if (!currentProfile) {
          logger.info({ userId }, 'No profile found, creating minimal profile for discoverability');
          const minimalProfile: any = {
            uid: userId,
            email: 'Interviewer',
            userType: 'interviewer',
            role: 'Interviewer',
            skills: [],
            interviewerProfile: {
              yearsOfExperience: 0,
              specializations: [],
              skills: [],
              bio: 'Interviewer',
              availability: [],
              isActive: true,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await firestoreService.saveUserProfile(userId, minimalProfile);
          logger.info({ userId }, 'Minimal interviewer profile created');
          currentProfile = minimalProfile;
        }
        // If profile exists but no interviewerProfile, add one
        else if (!currentProfile.interviewerProfile) {
          logger.info({ userId }, 'Profile exists but no interviewerProfile, adding it for discoverability');
          const updatedProfile = {
            ...currentProfile,
            interviewerProfile: {
              yearsOfExperience: 0,
              specializations: [],
              skills: [],
              bio: 'Interviewer',
              availability: [],
              isActive: true,
            },
          };
          await firestoreService.saveUserProfile(userId, updatedProfile);
          logger.info({ userId }, 'Interviewer profile added to existing profile');
        }
        
        const availabilityService = getAvailabilityService();
        const slots = await availabilityService.getInterviewerAvailability(userId);
        logger.info({ slotsCount: slots.length }, 'Loaded existing availability');
        setExistingSlots(slots);

        // Convert existing slots to week schedule format
        const newSchedule: WeekSchedule = { ...weekSchedule };
        
        // Group slots by day
        const slotsByDay: Record<string, AvailabilitySlot[]> = {};
        slots.forEach(slot => {
          if (slot.isRecurring && slot.dayOfWeek !== undefined) {
            const dayName = NUMBER_TO_DAY[slot.dayOfWeek];
            if (dayName) {
              if (!slotsByDay[dayName]) {
                slotsByDay[dayName] = [];
              }
              slotsByDay[dayName].push(slot);
            }
          }
        });

        // Update schedule with existing slots
        DAYS_OF_WEEK.forEach(day => {
          const daySlots = slotsByDay[day] || [];
          if (daySlots.length > 0) {
            newSchedule[day] = {
              enabled: true,
              slots: daySlots.map(slot => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
              })),
            };
            // Use timezone from first slot
            // Ignoring stored timezone – always using Asia/Kolkata
          }
        });

        setWeekSchedule(newSchedule);
        logger.info({ slotsCount: slots.length }, 'Loaded existing availability');
      } catch (err) {
        logger.error({ error: err }, 'Failed to load availability');
        setError('Failed to load your availability. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [userId]);

  const handleDayToggle = (day: string) => {
    setWeekSchedule(prev => {
      const isEnabled = !prev[day].enabled;
      logger.debug({ day, isEnabled }, 'Day availability toggled');
      return {
        ...prev,
        [day]: {
          ...prev[day],
          enabled: isEnabled,
        },
      };
    });
  };

  const handleAddSlot = (day: string) => {
    logger.debug({ day }, 'Adding time slot');
    setWeekSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { startTime: '09:00', endTime: '17:00' }],
      },
    }));
  };

  const handleRemoveSlot = (day: string, slotIndex: number) => {
    logger.debug({ day, slotIndex }, 'Removing time slot');
    setWeekSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, index) => index !== slotIndex),
      },
    }));
  };

  const handleSlotChange = (
    day: string,
    slotIndex: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setWeekSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const validateSchedule = (): string | null => {
    const enabledDays = DAYS_OF_WEEK.filter(day => weekSchedule[day].enabled);
    
    if (enabledDays.length === 0) {
      return 'Please enable at least one day of the week.';
    }

    for (const day of enabledDays) {
      const daySchedule = weekSchedule[day];
      
      if (daySchedule.slots.length === 0) {
        return `${day} is enabled but has no time slots. Please add at least one time slot or disable the day.`;
      }

      for (let i = 0; i < daySchedule.slots.length; i++) {
        const slot = daySchedule.slots[i];
        
        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return `Invalid time format in ${day}, slot ${i + 1}. Use HH:MM format (e.g., 09:00).`;
        }

        // Validate start < end
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const [endHour, endMin] = slot.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
          return `Invalid time range in ${day}, slot ${i + 1}. Start time must be before end time.`;
        }

        // Check for overlaps within the same day
        for (let j = i + 1; j < daySchedule.slots.length; j++) {
          const otherSlot = daySchedule.slots[j];
          const [otherStartHour, otherStartMin] = otherSlot.startTime.split(':').map(Number);
          const [otherEndHour, otherEndMin] = otherSlot.endTime.split(':').map(Number);
          const otherStartMinutes = otherStartHour * 60 + otherStartMin;
          const otherEndMinutes = otherEndHour * 60 + otherEndMin;

          const overlaps =
            (startMinutes < otherEndMinutes && endMinutes > otherStartMinutes) ||
            (otherStartMinutes < endMinutes && otherEndMinutes > startMinutes);

          if (overlaps) {
            return `Overlapping time slots in ${day}: slot ${i + 1} and slot ${j + 1}.`;
          }
        }
      }
    }

    return null;
  };

  const handleSaveSchedule = async () => {
    logger.info({}, 'Save schedule initiated');
    if (!userId) {
      setError('Not authenticated. Please log in again.');
      logger.warn({}, 'Cannot save - no userId');
      return;
    }

    // Validate
    const validationError = validateSchedule();
    if (validationError) {
      setError(validationError);
      logger.warn({ error: validationError }, 'Schedule validation failed');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Convert week schedule to DayAvailability format
      const schedule: DayAvailability[] = DAYS_OF_WEEK
        .filter(day => weekSchedule[day].enabled)
        .map(day => ({
          dayOfWeek: DAY_TO_NUMBER[day],
          slots: weekSchedule[day].slots.map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        }));

      logger.debug({ enabledDays: schedule.length, timezone }, 'Converting schedule (fixed Asia/Kolkata)');
      const availabilityService = getAvailabilityService();
      
      logger.info({ userId, scheduleLength: schedule.length }, '🔵 [AVAILABILITY] Starting to set weekly schedule');
      await availabilityService.setWeeklySchedule(userId, schedule, timezone);
      logger.info({ userId }, '🟢 [AVAILABILITY] Weekly schedule set successfully');

      // Ensure interviewer profile exists and userType is set so they appear in listings
      const firestoreService = getFirestoreService();
      logger.info({ userId }, '🔵 [PROFILE] Loading current profile from Firestore');
      const currentProfile = await firestoreService.getUserProfile(userId);
      logger.info({ userId, hasProfile: !!currentProfile, profileUserType: currentProfile?.userType }, '🔵 [PROFILE] Current profile loaded');
      
      // CRITICAL: Always ensure userType is set to 'interviewer' - this is required for root document creation
      // which is what booking search queries on
      const updatedProfile = {
        ...(currentProfile || {}),
        uid: userId,
        id: userId,
        userType: 'interviewer',
        email: currentProfile?.email,
        createdAt: currentProfile?.createdAt || new Date(),
        updatedAt: new Date(),
        interviewerProfile: currentProfile?.interviewerProfile || {
          yearsOfExperience: 0,
          specializations: [],
          skills: [],
          bio: 'Interviewer',
        },
      };
      
      logger.info({ userId, profileToSave: JSON.stringify({ userType: updatedProfile.userType, hasInterviewerProfile: !!updatedProfile.interviewerProfile }) }, '🔵 [PROFILE] Saving profile with userType=interviewer');
      await firestoreService.saveUserProfile(userId, updatedProfile);
      logger.info({ userId }, '🟢 [PROFILE] Profile saved successfully with userType=interviewer');

      setSuccess('Your availability has been saved successfully!');
      logger.info({ daysCount: schedule.length, timezone }, 'Saved weekly schedule');

      // Reload to confirm
      const updatedSlots = await availabilityService.getInterviewerAvailability(userId);
      setExistingSlots(updatedSlots);

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error({ error: err }, 'Failed to save availability');
      setError('Failed to save your availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Loading your availability...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <button
              onClick={() => {
                logger.info({}, 'Back button clicked');
                onBack();
              }}
              className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2 font-semibold transition-colors"
            >
              ← Back to Dashboard
            </button>
          )}
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">📅</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Your Availability</h1>
              <p className="text-gray-600">
                Set your weekly schedule so candidates can book interviews during your available hours.
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <Calendar className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Fixed Timezone Notice */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Timezone</h2>
          <p className="text-sm text-gray-600">
            All times use <span className="font-semibold">India Standard Time (IST, UTC+05:30)</span>.
          </p>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h2>
          
          <div className="space-y-6">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="border border-gray-200 rounded-lg p-4">
                {/* Day Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={weekSchedule[day].enabled}
                      onChange={() => handleDayToggle(day)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                    />
                    <h3 className="text-lg font-medium text-gray-900">{day}</h3>
                  </div>
                  
                  {weekSchedule[day].enabled && (
                    <Button
                      onClick={() => handleAddSlot(day)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Time Slot
                    </Button>
                  )}
                </div>

                {/* Time Slots */}
                {weekSchedule[day].enabled && (
                  <div className="space-y-3 ml-8">
                    {weekSchedule[day].slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center gap-4">
                        <Clock className="h-5 w-5 text-gray-400" />
                        
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            handleSlotChange(day, slotIndex, 'startTime', e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        
                        <span className="text-gray-500">to</span>
                        
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            handleSlotChange(day, slotIndex, 'endTime', e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />

                        {weekSchedule[day].slots.length > 1 && (
                          <button
                            onClick={() => handleRemoveSlot(day, slotIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove time slot"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {weekSchedule[day].slots.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        No time slots. Click "Add Time Slot" to create one.
                      </p>
                    )}
                  </div>
                )}

                {!weekSchedule[day].enabled && (
                  <p className="text-sm text-gray-500 ml-8">Not available on this day</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={handleSaveSchedule}
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Availability
              </>
            )}
          </Button>
        </div>

        {/* Summary */}
        {existingSlots.length > 0 && (
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-200 mt-6">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Current Availability
                </h3>
                <p className="text-sm text-blue-700">
                  You have {existingSlots.filter(s => s.isRecurring).length} recurring time slots set up across{' '}
                  {new Set(existingSlots.filter(s => s.isRecurring).map(s => s.dayOfWeek)).size} days.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
