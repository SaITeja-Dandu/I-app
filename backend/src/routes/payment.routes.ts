/**
 * @file routes/payment.routes.ts
 * @description Payment API routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requestValidator } from '../middleware/request-validator';
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
  processRefundSchema,
  getEarningsSchema,
  requestPayoutSchema,
} from '../validators/payment.validator';
import {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getInterviewerEarnings,
  requestPayout,
  getTransaction,
} from '../controllers/payment.controller';

const router = Router();

// Create payment intent
router.post(
  '/create-intent',
  authenticate,
  requestValidator(createPaymentIntentSchema),
  createPaymentIntent
);

// Confirm payment
router.post(
  '/confirm',
  authenticate,
  requestValidator(confirmPaymentSchema),
  confirmPayment
);

// Process refund
router.post(
  '/refund',
  authenticate,
  requestValidator(processRefundSchema),
  processRefund
);

// Get interviewer earnings
router.get(
  '/earnings',
  authenticate,
  requestValidator(getEarningsSchema),
  getInterviewerEarnings
);

// Request payout
router.post(
  '/payout',
  authenticate,
  requestValidator(requestPayoutSchema),
  requestPayout
);

// Get transaction details
router.get(
  '/transaction/:transactionId',
  authenticate,
  getTransaction
);

export default router;
