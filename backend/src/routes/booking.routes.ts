/**
 * @file routes/booking.routes.ts
 * @description Booking API routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requestValidator } from '../middleware/request-validator';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  getBookingSchema,
  validateBookingTimeSchema,
} from '../validators/booking.validator';
import {
  validateBooking,
  createBooking,
  updateBookingStatus,
  getBooking,
} from '../controllers/booking.controller';

const router = Router();

// Validate time slot availability
router.post(
  '/validate',
  authenticate,
  requestValidator(validateBookingTimeSchema),
  validateBooking
);

// Create new booking
router.post(
  '/',
  authenticate,
  requestValidator(createBookingSchema),
  createBooking
);

// Update booking status
router.patch(
  '/:bookingId/status',
  authenticate,
  requestValidator(updateBookingStatusSchema),
  updateBookingStatus
);

// Get booking details
router.get(
  '/:bookingId',
  authenticate,
  requestValidator(getBookingSchema),
  getBooking
);

export default router;
