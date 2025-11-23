/**
 * @file controllers/payment.controller.ts
 * @description Payment processing with Stripe
 */

import { Response } from 'express';
import { getStripe } from '../config/stripe';
import { getFirestore } from '../config/firebase';
import { AppError, asyncHandler } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% platform fee

export const createPaymentIntent = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { bookingId, amount, currency = 'USD', metadata = {} } = req.body;
    const userId = req.userId;

    const db = getFirestore();
    const stripe = getStripe();

    // Verify booking exists and belongs to user
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingDoc.data();
    
    if (booking?.candidateId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        bookingId,
        candidateId: userId || '',
        interviewerId: booking?.interviewerId || '',
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment intent in database
    await db.collection('payment_transactions').add({
      bookingId,
      candidateId: userId,
      interviewerId: booking?.interviewerId,
      amount,
      currency,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });
  }
);

export const confirmPayment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { paymentIntentId, paymentMethodId } = req.body;
    const stripe = getStripe();

    // Confirm payment with Stripe
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    const db = getFirestore();

    // Update transaction status
    const transactionSnapshot = await db
      .collection('payment_transactions')
      .where('stripePaymentIntentId', '==', paymentIntentId)
      .get();

    if (!transactionSnapshot.empty) {
      const transactionDoc = transactionSnapshot.docs[0];
      await transactionDoc.ref.update({
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
        updatedAt: new Date(),
      });

      // Update booking with payment info
      const transaction = transactionDoc.data();
      if (transaction.bookingId && paymentIntent.status === 'succeeded') {
        await db.collection('bookings').doc(transaction.bookingId).update({
          paymentStatus: 'completed',
          paymentAmount: transaction.amount,
          paymentCurrency: transaction.currency,
          paymentIntentId: paymentIntentId,
          transactionId: transactionDoc.id,
          status: 'confirmed',
          updatedAt: new Date(),
        });
      }
    }

    res.status(200).json({
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
    });
  }
);

export const processRefund = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { bookingId, amount, reason } = req.body;
    const userId = req.userId;

    const db = getFirestore();
    const stripe = getStripe();

    // Get booking
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingDoc.data();

    // Authorization check
    if (booking?.candidateId !== userId && booking?.interviewerId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Get payment transaction
    const transactionSnapshot = await db
      .collection('payment_transactions')
      .where('bookingId', '==', bookingId)
      .where('status', '==', 'completed')
      .get();

    if (transactionSnapshot.empty) {
      throw new AppError('No completed payment found for this booking', 404);
    }

    const transactionDoc = transactionSnapshot.docs[0];
    const transaction = transactionDoc.data();

    // Process refund with Stripe
    const refundAmount = amount ? Math.round(amount * 100) : undefined;
    
    const refund = await stripe.refunds.create({
      payment_intent: transaction.stripePaymentIntentId,
      amount: refundAmount,
      reason: reason || 'requested_by_customer',
    });

    // Update transaction
    await transactionDoc.ref.update({
      status: 'refunded',
      refundId: refund.id,
      refundAmount: refund.amount / 100,
      refundReason: reason,
      updatedAt: new Date(),
    });

    // Update booking
    await bookingDoc.ref.update({
      paymentStatus: 'refunded',
      status: 'cancelled',
      updatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
    });
  }
);

export const getInterviewerEarnings = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { interviewerId } = req.query;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const db = getFirestore();

    // Build query
    let query = db
      .collection('payment_transactions')
      .where('interviewerId', '==', interviewerId);

    if (startDate) {
      query = query.where('createdAt', '>=', startDate);
    }
    if (endDate) {
      query = query.where('createdAt', '<=', endDate);
    }

    const snapshot = await query.get();

    // Calculate earnings
    let totalEarnings = 0;
    let pendingEarnings = 0;
    let paidEarnings = 0;

    snapshot.docs.forEach((doc) => {
      const transaction = doc.data();
      const interviewerAmount = transaction.amount * (1 - PLATFORM_FEE_PERCENTAGE);

      if (transaction.status === 'completed') {
        totalEarnings += interviewerAmount;
        pendingEarnings += interviewerAmount;
      } else if (transaction.status === 'paid_out') {
        totalEarnings += interviewerAmount;
        paidEarnings += interviewerAmount;
      }
    });

    res.status(200).json({
      success: true,
      totalEarnings,
      pendingEarnings,
      paidEarnings,
      totalInterviews: snapshot.size,
      currency: 'USD',
    });
  }
);

export const requestPayout = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { interviewerId, amount } = req.body;
    const userId = req.userId;

    // Authorization check
    if (interviewerId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const db = getFirestore();

    // Verify interviewer has sufficient pending earnings
    const transactionsSnapshot = await db
      .collection('payment_transactions')
      .where('interviewerId', '==', interviewerId)
      .where('status', '==', 'completed')
      .get();

    let pendingEarnings = 0;
    transactionsSnapshot.docs.forEach((doc) => {
      const transaction = doc.data();
      pendingEarnings += transaction.amount * (1 - PLATFORM_FEE_PERCENTAGE);
    });

    if (pendingEarnings < amount) {
      throw new AppError('Insufficient pending earnings', 400);
    }

    // Create payout record
    const payoutRef = await db.collection('payouts').add({
      interviewerId,
      amount,
      currency: 'USD',
      status: 'pending',
      transactionIds: transactionsSnapshot.docs.map((doc) => doc.id),
      createdAt: new Date(),
    });

    // Mark transactions as pending payout
    const batch = db.batch();
    transactionsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'pending_payout', payoutId: payoutRef.id });
    });
    await batch.commit();

    res.status(200).json({
      success: true,
      payoutId: payoutRef.id,
      message: 'Payout request submitted successfully',
    });
  }
);

export const getTransaction = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { transactionId } = req.params;
    const userId = req.userId;

    const db = getFirestore();
    const transactionDoc = await db.collection('payment_transactions').doc(transactionId).get();

    if (!transactionDoc.exists) {
      throw new AppError('Transaction not found', 404);
    }

    const transaction = transactionDoc.data();

    // Authorization check
    if (transaction?.candidateId !== userId && transaction?.interviewerId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    res.status(200).json({
      success: true,
      transaction: {
        id: transactionDoc.id,
        ...transaction,
      },
    });
  }
);
