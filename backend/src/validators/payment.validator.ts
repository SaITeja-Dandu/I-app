/**
 * @file validators/payment.validator.ts
 * @description Zod schemas for payment validation
 */

import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID required'),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3, 'Currency must be 3-letter code').default('USD'),
    metadata: z.record(z.string()).optional(),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z.string().min(1, 'Payment intent ID required'),
    paymentMethodId: z.string().min(1, 'Payment method ID required'),
  }),
});

export const processRefundSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID required'),
    amount: z.number().positive().optional(),
    reason: z.string().optional(),
  }),
});

export const getEarningsSchema = z.object({
  query: z.object({
    interviewerId: z.string().min(1, 'Interviewer ID required'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const requestPayoutSchema = z.object({
  body: z.object({
    interviewerId: z.string().min(1, 'Interviewer ID required'),
    amount: z.number().positive('Amount must be positive').min(50, 'Minimum payout is $50'),
  }),
});
