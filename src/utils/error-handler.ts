/**
 * @file utils/error-handler.ts
 * @description Centralized error handling
 */

import type { ApiError } from '../types';
import { ERROR_CODES } from './constants';
import { createLogger } from './logger';

const logger = createLogger('error-handler');

export class AppError extends Error {
  code: string;
  status?: number;
  originalError?: unknown;

  constructor(
    code: string,
    message: string,
    status?: number,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.originalError = originalError;
  }
}

export const handleError = (error: unknown): ApiError => {
  logger.error({ error }, 'Handling error');

  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      timestamp: new Date(),
    };
  }

  if (error instanceof Error) {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message,
      timestamp: new Date(),
    };
  }

  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: 'An unknown error occurred',
    timestamp: new Date(),
  };
};

export const getErrorMessage = (error: ApiError): string => {
  const messages: Record<string, string> = {
    [ERROR_CODES.AUTH_FAILED]: 'Authentication failed. Please try again.',
    [ERROR_CODES.DB_ERROR]: 'Database error. Please check your connection.',
    [ERROR_CODES.API_ERROR]: 'API request failed. Please try again.',
    [ERROR_CODES.VALIDATION_ERROR]: 'Invalid input provided.',
    [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection.',
    [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
    [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred.',
  };

  return messages[error.code] || error.message;
};
