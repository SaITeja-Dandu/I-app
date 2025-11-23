/**
 * @file utils/constants.ts
 * @description Application constants
 */

export const INTERVIEW_LENGTH = 5;
export const API_TIMEOUT_MS = 30000;
export const ALERT_DURATION_MS = 4000;
export const QUESTION_GENERATION_TIMEOUT_MS = 20000;
export const ANSWER_EVALUATION_TIMEOUT_MS = 15000;

export const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const FIRESTORE_PATHS = {
  APP_ID: 'interview-navigator',
  ARTIFACTS: 'artifacts',
  USERS: 'users',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  INTERVIEWS: 'interviews',
  BOOKINGS: 'bookings',
  NOTIFICATIONS: 'notifications',
  RATINGS: 'ratings',
  REVIEWS: 'reviews',
  AVAILABILITY: 'availability',
} as const;

export const USER_TYPES = {
  CANDIDATE: 'candidate',
  INTERVIEWER: 'interviewer',
} as const;

export const INTERVIEW_TYPES = {
  AI: 'ai',
  LIVE: 'live',
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
} as const;

export const INTERVIEW_DURATIONS = [30, 45, 60] as const; // minutes

export const NOTIFICATION_TYPES = {
  BOOKING_REQUEST: 'booking_request',
  BOOKING_ACCEPTED: 'booking_accepted',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  REMINDER_24H: 'reminder_24h',
  REMINDER_1H: 'reminder_1h',
  INTERVIEW_STARTING: 'interview_starting',
  INTERVIEW_COMPLETED: 'interview_completed',
  RATING_REQUEST: 'rating_request',
} as const;

export const ERROR_CODES = {
  AUTH_FAILED: 'AUTH_FAILED',
  DB_ERROR: 'DB_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const SCORE_RANGES = {
  EXCELLENT: { min: 4, label: 'Excellent', color: '#16a34a' },
  GOOD: { min: 3, label: 'Good', color: '#0066cc' },
  FAIR: { min: 2, label: 'Fair', color: '#d97706' },
  POOR: { min: 1, label: 'Poor', color: '#dc2626' },
} as const;
