/**
 * @file controllers/user.controller.ts
 * @description User profile validation and management
 */

import { Response } from 'express';
import { getFirestore } from '../config/firebase';
import { AppError, asyncHandler } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

export const getUserProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.params;
    const requestingUserId = req.userId;

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new AppError('User not found', 404);
    }

    const userData = userDoc.data();

    // Return limited info if not the user themselves
    if (userId !== requestingUserId) {
      res.status(200).json({
        success: true,
        profile: {
          id: userDoc.id,
          email: userData?.email,
          role: userData?.role,
          userType: userData?.userType,
          skills: userData?.skills,
          interviewerProfile: userData?.interviewerProfile,
        },
      });
      return;
    }

    // Return full profile for the user themselves
    res.status(200).json({
      success: true,
      profile: {
        id: userDoc.id,
        ...userData,
      },
    });
  }
);

export const updateUserProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.params;
    const requestingUserId = req.userId;
    const updates = req.body;

    // Authorization check
    if (userId !== requestingUserId) {
      throw new AppError('Unauthorized to update this profile', 403);
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new AppError('User not found', 404);
    }

    // Prevent updating sensitive fields
    const { uid, id, createdAt, ...allowedUpdates } = updates;

    await userRef.update({
      ...allowedUpdates,
      updatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
    });
  }
);

export const validateInterviewerProfile = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.params;

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new AppError('User not found', 404);
    }

    const userData = userDoc.data();

    if (userData?.userType !== 'interviewer') {
      throw new AppError('User is not an interviewer', 400);
    }

    const interviewerProfile = userData?.interviewerProfile;

    if (!interviewerProfile) {
      throw new AppError('Interviewer profile not found', 404);
    }

    // Validate required fields
    const requiredFields = ['title', 'bio', 'specializations', 'yearsOfExperience', 'hourlyRate'];
    const missingFields = requiredFields.filter((field) => !interviewerProfile[field]);

    if (missingFields.length > 0) {
      throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400);
    }

    // Validate data types and ranges
    if (typeof interviewerProfile.yearsOfExperience !== 'number' || interviewerProfile.yearsOfExperience < 0) {
      throw new AppError('Invalid years of experience', 400);
    }

    if (typeof interviewerProfile.hourlyRate !== 'number' || interviewerProfile.hourlyRate < 0) {
      throw new AppError('Invalid hourly rate', 400);
    }

    if (!Array.isArray(interviewerProfile.specializations) || interviewerProfile.specializations.length === 0) {
      throw new AppError('At least one specialization required', 400);
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: 'Interviewer profile is valid',
    });
  }
);
