/**
 * @file middleware/auth.ts
 * @description Firebase authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import { AppError } from './error-handler';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;

    next();
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      next(new AppError('Token expired', 401));
    } else if (error.code === 'auth/argument-error') {
      next(new AppError('Invalid token', 401));
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};
