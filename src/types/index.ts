/**
 * @file types/index.ts
 * @description Type definitions for the Interview Navigator application
 */

export interface UserProfile {
  id: string;
  role: string;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
  email?: string;
  resumeUrl?: string;
}

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
  role: string;
  skills: string[];
  date: Date;
  score: number;
  duration: number; // in seconds
  questions: InterviewQuestion[];
  status: 'in-progress' | 'completed' | 'abandoned';
  metrics?: SessionMetrics;
}

export interface SessionMetrics {
  averageScore: number;
  bestQuestion?: string;
  worstQuestion?: string;
  completionTime: number; // in seconds
  averageTimePerQuestion: number;
}

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

export interface AlertState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}
