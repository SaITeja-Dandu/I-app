/**
 * @file utils/validation.ts
 * @description Schema validation using Zod
 */

import { z } from 'zod';
import type { GeminiQuestionResponse, GeminiEvaluationResponse } from '../types';

export const userProfileSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(2).max(100),
  skills: z.array(z.string().min(1)).min(1).max(20),
  email: z.string().email().optional(),
  resumeUrl: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const geminiQuestionSchema = z.object({
  question: z.string().min(10).max(1000),
  isCoding: z.boolean(),
  category: z.string().min(1).max(50),
});

export const geminiEvaluationSchema = z.object({
  score: z.number().int().min(1).max(5),
  feedback: z.string().min(10).max(5000),
  improvementSuggestions: z.array(z.string().min(5)).min(3).max(5),
});

export const validateQuestion = (
  data: unknown
): GeminiQuestionResponse => {
  return geminiQuestionSchema.parse(data);
};

export const validateEvaluation = (
  data: unknown
): GeminiEvaluationResponse => {
  return geminiEvaluationSchema.parse(data);
};
