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
  ARTIFACTS: 'artifacts',
  USERS: 'users',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  INTERVIEWS: 'interviews',
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
