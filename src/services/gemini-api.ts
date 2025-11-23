/**
 * @file services/gemini-api.ts
 * @description Gemini API integration with structured output
 */

import axios, { type AxiosInstance } from 'axios';
import { createLogger } from '../utils/logger';
import { withExponentialBackoff } from '../utils/retry';
import { validateEvaluation } from '../utils/validation';
import type {
  GeminiQuestionResponse,
  GeminiEvaluationResponse,
} from '../types';
import {
  GEMINI_API_URL,
  GEMINI_MODEL,
  QUESTION_GENERATION_TIMEOUT_MS,
  ANSWER_EVALUATION_TIMEOUT_MS,
} from '../utils/constants';
import { AppError } from '../utils/error-handler';
import { ERROR_CODES } from '../utils/constants';
import { interviewQuestionsService } from './interview-questions';

const logger = createLogger('gemini-api');

export class GeminiApiService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey =
      import.meta.env.VITE_GEMINI_API_KEY ||
      (typeof (window as any).__gemini_api_key !== 'undefined'
        ? (window as any).__gemini_api_key
        : '');

    if (!this.apiKey) {
      logger.warn('Gemini API key not configured');
    }

    this.client = axios.create({
      timeout: QUESTION_GENERATION_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private getUrl(action: string): string {
    return `${GEMINI_API_URL}/${GEMINI_MODEL}:${action}?key=${this.apiKey}`;
  }

  async generateQuestion(
    role: string,
    skills: string[],
    _askedTopics: string[],
    questionIndex: number,
    totalQuestions: number,
    _resumeExperience?: string
  ): Promise<GeminiQuestionResponse> {
    try {
      // Determine question stage for progressive difficulty
      let difficulty: 'basic' | 'intermediate' | 'advanced' = 'basic';
      if (questionIndex >= Math.ceil(totalQuestions * 0.6)) {
        difficulty = 'advanced';
      } else if (questionIndex >= Math.ceil(totalQuestions * 0.3)) {
        difficulty = 'intermediate';
      }

      // Fetch real interview questions from internet using Gemini
      const questions = await interviewQuestionsService.getQuestionsForRole(
        role,
        skills,
        difficulty,
        1
      );

      if (questions.length === 0) {
        throw new AppError(
          ERROR_CODES.API_ERROR,
          'No interview questions found for this role and difficulty'
        );
      }

      const question = questions[0];

      logger.info(
        { category: question.category, difficulty, source: question.source },
        'Question fetched successfully'
      );

      return {
        question: question.question,
        isCoding: question.type === 'coding',
        category: question.category,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error({ error }, 'Failed to generate question');
      throw new AppError(
        ERROR_CODES.API_ERROR,
        'Failed to generate interview question',
        (error as any)?.response?.status,
        error
      );
    }
  }

  async evaluateAnswer(
    skills: string[],
    question: string,
    answer: string
  ): Promise<GeminiEvaluationResponse> {
    return withExponentialBackoff(
      async () => {
        try {
          const systemPrompt =
            'You are a senior technical interviewer. Evaluate the candidate\'s answer based on technical accuracy, depth, and clarity. Provide a score from 1 (poor) to 5 (excellent). Your response MUST be a single JSON object.';

          const userQuery = `Candidate's skills: ${skills.join(', ')}. \n\nOriginal Question: ${question}\n\nCandidate's Answer: ${answer}`;

          const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  score: {
                    type: 'INTEGER',
                    description:
                      'A numerical score from 1 (poor) to 5 (excellent).',
                  },
                  feedback: {
                    type: 'STRING',
                    description:
                      "A summary of the answer's strengths and weaknesses.",
                  },
                  improvementSuggestions: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                    description:
                      '3-5 actionable suggestions for improving the answer or related knowledge.',
                  },
                },
                required: ['score', 'feedback', 'improvementSuggestions'],
              },
            },
          };

          const response = await this.client.post(
            this.getUrl('generateContent'),
            payload,
            {
              timeout: ANSWER_EVALUATION_TIMEOUT_MS,
            }
          );

          const jsonText =
            response.data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!jsonText) {
            throw new AppError(
              ERROR_CODES.API_ERROR,
              'Empty response from Gemini API'
            );
          }

          const parsedData = JSON.parse(jsonText);
          const validated = validateEvaluation(parsedData);

          logger.info(
            { score: validated.score },
            'Answer evaluated successfully'
          );

          return validated;
        } catch (error) {
          if (error instanceof AppError) throw error;

          logger.error({ error }, 'Failed to evaluate answer');
          throw new AppError(
            ERROR_CODES.API_ERROR,
            'Failed to evaluate answer',
            (error as any)?.response?.status,
            error
          );
        }
      },
      { maxRetries: 3 }
    );
  }
}

export const geminiApiService = new GeminiApiService();
