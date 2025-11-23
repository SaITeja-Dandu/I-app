/**
 * @file controllers/booking.controller.ts
 * @description Booking validation and business logic
 */

import { Response } from 'express';
import { getFirestore } from '../config/firebase';
import { AppError, asyncHandler } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

export const validateBooking = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { interviewerId, scheduledDateTime, durationMinutes } = req.body;

    const db = getFirestore();
    const startTime = new Date(scheduledDateTime);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    // Check interviewer exists
    const interviewerDoc = await db.collection('users').doc(interviewerId).get();
    
    if (!interviewerDoc.exists) {
      throw new AppError('Interviewer not found', 404);
    }

    const interviewer = interviewerDoc.data();
    if (interviewer?.userType !== 'interviewer') {
      throw new AppError('User is not an interviewer', 400);
    }

    // Check for conflicting bookings
    const bookingsSnapshot = await db
      .collection('bookings')
      .where('interviewerId', '==', interviewerId)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();

    const hasConflict = bookingsSnapshot.docs.some((doc) => {
      const booking = doc.data();
      const bookingStart = booking.scheduledDateTime.toDate();
      const bookingEnd = new Date(bookingStart.getTime() + booking.durationMinutes * 60000);

      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });

    if (hasConflict) {
      throw new AppError('Time slot not available', 409);
    }

    res.status(200).json({
      success: true,
      available: true,
      message: 'Time slot is available',
    });
  }
);

export const createBooking = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const bookingData = req.body;
    const db = getFirestore();

    // Validate time slot is still available
    const { interviewerId, scheduledDateTime, durationMinutes } = bookingData;
    const startTime = new Date(scheduledDateTime);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const bookingsSnapshot = await db
      .collection('bookings')
      .where('interviewerId', '==', interviewerId)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();

    const hasConflict = bookingsSnapshot.docs.some((doc) => {
      const booking = doc.data();
      const bookingStart = booking.scheduledDateTime.toDate();
      const bookingEnd = new Date(bookingStart.getTime() + booking.durationMinutes * 60000);

      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });

    if (hasConflict) {
      throw new AppError('Time slot no longer available', 409);
    }

    // Create booking
    const bookingRef = await db.collection('bookings').add({
      ...bookingData,
      scheduledDateTime: new Date(scheduledDateTime),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      bookingId: bookingRef.id,
      message: 'Booking created successfully',
    });
  }
);

export const updateBookingStatus = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { bookingId } = req.params;
    const { status, reason } = req.body;
    const userId = req.userId;

    const db = getFirestore();
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingDoc.data();

    // Authorization check
    if (booking?.candidateId !== userId && booking?.interviewerId !== userId) {
      throw new AppError('Unauthorized to update this booking', 403);
    }

    // Update booking
    await bookingRef.update({
      status,
      ...(reason && { cancellationReason: reason }),
      updatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Booking status updated',
    });
  }
);

export const getBooking = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { bookingId } = req.params;
    const userId = req.userId;

    const db = getFirestore();
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();

    if (!bookingDoc.exists) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingDoc.data();

    // Authorization check
    if (booking?.candidateId !== userId && booking?.interviewerId !== userId) {
      throw new AppError('Unauthorized to view this booking', 403);
    }

    res.status(200).json({
      success: true,
      booking: {
        id: bookingDoc.id,
        ...booking,
      },
    });
  }
);
