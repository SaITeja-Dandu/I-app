/**
 * @file routes/user.routes.ts
 * @description User API routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserProfile,
  updateUserProfile,
  validateInterviewerProfile,
} from '../controllers/user.controller';

const router = Router();

// Get user profile
router.get('/:userId', authenticate, getUserProfile);

// Update user profile
router.put('/:userId', authenticate, updateUserProfile);

// Validate interviewer profile
router.post('/:userId/validate-interviewer', authenticate, validateInterviewerProfile);

export default router;
