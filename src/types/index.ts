/**
 * @file types/index.ts
 * @description Type definitions for the Interview Navigator application
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserType = 'candidate' | 'interviewer';

export interface TimeSlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  timezone: string; // "America/New_York"
}

export interface InterviewerProfile {
  yearsOfExperience: number;
  specializations: string[]; // e.g., ['Frontend', 'Backend', 'System Design']
  companyName?: string;
  currentTitle?: string;
  bio?: string;
  linkedInUrl?: string;
  hourlyRate?: number; // For future payment integration
  availability: TimeSlot[]; // When they're available
  rating?: number; // Average rating from candidates (0-5)
  totalInterviews?: number; // Number of interviews conducted
  verified?: boolean; // Platform verification status
}

export interface CandidateProfile {
  targetRoles: string[];
  experienceLevel: 'entry' | 'mid' | 'senior';
  preferredInterviewTopics: string[];
  timezone: string;
}

export interface UserProfile {
  id: string;
  userType: UserType; // NEW
  role: string;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
  email?: string;
  resumeUrl?: string;
  
  // Type-specific profiles
  interviewerProfile?: InterviewerProfile;
  candidateProfile?: CandidateProfile;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export type BookingStatus = 
  | 'pending'       // Created, waiting for interviewer
  | 'accepted'      // Interviewer accepted
  | 'confirmed'     // Both parties confirmed
  | 'in-progress'   // Interview is happening
  | 'completed'     // Interview finished
  | 'cancelled'     // Cancelled by either party
  | 'no-show';      // Someone didn't show up

export type InterviewType = 'ai' | 'live';

export interface InterviewBooking {
  id: string;
  
  // Participants
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  interviewerId?: string; // null for AI interviews
  interviewerName?: string;
  interviewerEmail?: string;
  
  // Interview Details
  type: InterviewType; // AI practice or live with interviewer
  scheduledDateTime: Date;
  durationMinutes: number; // 30, 45, 60
  timezone: string;
  
  // Technical Details
  role: string;
  skills: string[];
  focusAreas?: string[]; // Specific topics to cover
  difficulty: 'basic' | 'intermediate' | 'advanced';
  
  // Status Management
  status: BookingStatus;
  cancelledBy?: 'candidate' | 'interviewer' | 'system';
  cancellationReason?: string;
  cancelledAt?: Date;
  
  // Meeting Details
  meetingLink?: string; // Video call URL
  meetingId?: string;
  meetingPassword?: string;
  videoProvider?: 'daily' | 'zoom' | 'google-meet' | 'custom';
  
  // Results (populated after interview)
  sessionId?: string; // Reference to InterviewSession
  interviewerNotes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  reminderSentAt?: Date;
  
  // Payment
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;
  transactionId?: string;
  platformFee?: number;
  interviewerEarnings?: number;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType =
  | 'booking_request'      // Interviewer receives new request
  | 'booking_accepted'     // Candidate gets acceptance
  | 'booking_confirmed'    // Both parties get confirmation
  | 'booking_cancelled'    // Cancellation notice
  | 'reminder_24h'         // 24 hours before
  | 'reminder_1h'          // 1 hour before
  | 'interview_starting'   // Interview about to start
  | 'interview_completed'  // Results available
  | 'rating_request';      // Request to rate interviewer/candidate

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  
  title: string;
  message: string;
  actionUrl?: string; // Deep link to relevant page
  
  relatedBookingId?: string;
  relatedUserId?: string; // Other participant
  
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// RATING TYPES
// ============================================================================

export interface CandidateRating {
  score: number; // 1-5
  review?: string;
  helpful: boolean;
  professional: boolean;
  wouldRecommend: boolean;
}

export interface InterviewerRating {
  score: number; // 1-5
  strengths: string[];
  improvements: string[];
  hireRecommendation: 'strong-yes' | 'yes' | 'maybe' | 'no';
}

export interface Rating {
  id: string;
  bookingId: string;
  interviewerId: string;
  candidateId: string;
  
  // Rating by candidate for interviewer
  candidateRating?: CandidateRating;
  
  // Rating by interviewer for candidate (optional)
  interviewerRating?: InterviewerRating;
  
  createdAt: Date;
}

// ============================================================================
// INTERVIEW SESSION TYPES
// ============================================================================

export interface InterviewQuestion {
  qText: string;
  isCoding: boolean;
  category: string;
  answerText?: string | null;
  feedback?: string | null;
  score?: number;
  improvementSuggestions?: string[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  
  // NEW: Interview context
  bookingId?: string; // Link to booking if from live interview
  interviewType: InterviewType; // NEW
  interviewerId?: string; // NEW: If live interview
  
  role: string;
  skills: string[];
  resumeExperience?: string; // Summary of experience from resume
  date: Date;
  score: number;
  duration: number; // in seconds
  questions: InterviewQuestion[];
  status: 'in-progress' | 'completed' | 'abandoned';
  metrics?: SessionMetrics;
  
  // NEW: Live interview specific
  interviewerFeedback?: string; // Overall feedback from human interviewer
  interviewerRating?: number; // 1-5 rating from interviewer
  recordingUrl?: string; // Video recording storage URL
}

export interface SessionMetrics {
  averageScore: number;
  bestQuestion?: string;
  worstQuestion?: string;
  completionTime: number; // in seconds
  averageTimePerQuestion: number;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface GeminiQuestionResponse {
  question: string;
  isCoding: boolean;
  category: string;
}

export interface GeminiEvaluationResponse {
  score: number;
  feedback: string;
  improvementSuggestions: string[];
}

export interface Question {
  question: string;
  context?: string;
}

export interface QuestionFeedback {
  question: string;
  score: number;
  feedback: string;
  improvements?: string[];
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  timestamp: Date;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface AuthContextType {
  user: UserProfile | null;
  userId: string | null;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  error: ApiError | null;
  logout: () => Promise<void>;
}

export interface InterviewContextType {
  currentSession: InterviewSession | null;
  isLoading: boolean;
  error: ApiError | null;
  startInterview: () => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  nextQuestion: () => Promise<void>;
  finishInterview: () => Promise<void>;
  abandonInterview: () => void;
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface AlertState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface InterviewerFilters {
  specializations?: string[];
  minRating?: number;
  maxRating?: number;
  minExperience?: number;
  verified?: boolean;
  availability?: {
    date: Date;
    timeSlot?: TimeSlot;
  };
}

export interface BookingFilters {
  status?: BookingStatus[];
  type?: InterviewType;
  startDate?: Date;
  endDate?: Date;
}
