/**
 * @file routes/availability.routes.ts
 * @description Availability API routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  validateAvailability,
  checkSlotConflicts,
} from '../controllers/availability.controller';

const router = Router();

// Validate availability slots
router.post('/validate', authenticate, validateAvailability);

// Check for slot conflicts
router.post('/check-conflicts', authenticate, checkSlotConflicts);

export default router;
