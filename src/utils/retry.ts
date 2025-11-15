/**
 * @file utils/retry.ts
 * @description Exponential backoff retry utility for API calls
 */

import { createLogger } from './logger';

const logger = createLogger('retry');

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      const isRateLimited =
        (error as any)?.status === 429 || (error as any)?.code === 'RATE_LIMITED';

      if (!isRateLimited || attempt === config.maxRetries - 1) {
        throw error;
      }

      const delay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt) +
          Math.random() * 1000,
        config.maxDelayMs
      );

      logger.warn(
        { attempt, delay, error: lastError.message },
        'Rate limited, retrying with backoff'
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
