/**
 * @file controllers/availability.controller.ts
 * @description Availability validation and management
 */

import { Response } from 'express';
import { getFirestore } from '../config/firebase';
import { AppError, asyncHandler } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

export const validateAvailability = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { interviewerId, slots } = req.body;

    const db = getFirestore();

    // Verify interviewer exists
    const userDoc = await db.collection('users').doc(interviewerId).get();
    
    if (!userDoc.exists) {
      throw new AppError('Interviewer not found', 404);
    }

    const userData = userDoc.data();
    if (userData?.userType !== 'interviewer') {
      throw new AppError('User is not an interviewer', 400);
    }

    // Validate slot format
    if (!Array.isArray(slots) || slots.length === 0) {
      throw new AppError('Invalid slots format', 400);
    }

    for (const slot of slots) {
      if (!slot.dayOfWeek || typeof slot.dayOfWeek !== 'number' || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        throw new AppError('Invalid day of week', 400);
      }

      if (!slot.startTime || !slot.endTime) {
        throw new AppError('Start time and end time required', 400);
      }

      // Validate time format (HH:mm)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        throw new AppError('Invalid time format (use HH:mm)', 400);
      }

      // Validate end time is after start time
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        throw new AppError('End time must be after start time', 400);
      }
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: 'Availability slots are valid',
    });
  }
);

export const checkSlotConflicts = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { interviewerId, startTime, endTime } = req.body;

    const db = getFirestore();

    // Check for existing bookings in this time range
    const bookingsSnapshot = await db
      .collection('bookings')
      .where('interviewerId', '==', interviewerId)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const conflicts = bookingsSnapshot.docs.filter((doc) => {
      const booking = doc.data();
      const bookingStart = booking.scheduledDateTime.toDate();
      const bookingEnd = new Date(bookingStart.getTime() + booking.durationMinutes * 60000);

      return (
        (startDate >= bookingStart && startDate < bookingEnd) ||
        (endDate > bookingStart && endDate <= bookingEnd) ||
        (startDate <= bookingStart && endDate >= bookingEnd)
      );
    });

    res.status(200).json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
      conflicts: conflicts.map((doc) => ({
        id: doc.id,
        scheduledDateTime: doc.data().scheduledDateTime.toDate(),
        durationMinutes: doc.data().durationMinutes,
      })),
    });
  }
);
