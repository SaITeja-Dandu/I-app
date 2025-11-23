/**
 * @file validators/booking.validator.ts
 * @description Zod schemas for booking validation
 */

import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    candidateId: z.string().min(1, 'Candidate ID required'),
    candidateName: z.string().min(1, 'Candidate name required'),
    candidateEmail: z.string().email('Valid email required'),
    interviewerId: z.string().min(1, 'Interviewer ID required'),
    interviewerName: z.string().min(1, 'Interviewer name required'),
    interviewerEmail: z.string().email('Valid email required'),
    scheduledDateTime: z.string().datetime('Valid ISO datetime required'),
    durationMinutes: z.number().int().min(15).max(180, 'Duration must be 15-180 minutes'),
    timezone: z.string().min(1, 'Timezone required'),
    type: z.enum(['live', 'practice']),
    role: z.string().optional(),
    skills: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  params: z.object({
    bookingId: z.string().min(1, 'Booking ID required'),
  }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
    reason: z.string().optional(),
  }),
});

export const getBookingSchema = z.object({
  params: z.object({
    bookingId: z.string().min(1, 'Booking ID required'),
  }),
});

export const validateBookingTimeSchema = z.object({
  body: z.object({
    interviewerId: z.string().min(1, 'Interviewer ID required'),
    scheduledDateTime: z.string().datetime('Valid ISO datetime required'),
    durationMinutes: z.number().int().min(15).max(180),
  }),
});
