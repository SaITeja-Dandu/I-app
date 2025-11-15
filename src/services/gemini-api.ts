/**
 * @file services/gemini-api.ts
 * @description Gemini API integration with structured output
 */

import axios, { type AxiosInstance } from 'axios';
import { createLogger } from '../utils/logger';
import { withExponentialBackoff } from '../utils/retry';
import {
  validateQuestion,
  validateEvaluation,
} from '../utils/validation';
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
    askedTopics: string[],
    questionIndex: number,
    totalQuestions: number
  ): Promise<GeminiQuestionResponse> {
    return withExponentialBackoff(async () => {
      try {
        const systemPrompt =
          'You are a senior technical interviewer for a major tech company. Your task is to generate a diverse, challenging, and relevant question based on the candidate\'s skills. Ensure that the question is formatted as a single JSON object. Vary the question type between conceptual and coding challenges. DO NOT repeat topics already asked.';

        let userQuery = `I am a ${role}. My skills are: ${skills.join(', ')}. `;
        if (questionIndex > 0) {
          userQuery += `I have already been asked questions on: ${askedTopics.join(', ')}. Ask a new question on a different core skill area. This is question number ${questionIndex + 1} of ${totalQuestions}.`;
        } else {
          userQuery += `Ask the first question. This is question number 1 of ${totalQuestions}.`;
        }

        const payload = {
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                question: {
                  type: 'STRING',
                  description:
                    'The technical interview question, which may be conceptual or a coding challenge.',
                },
                isCoding: {
                  type: 'BOOLEAN',
                  description: 'True if this is a coding question, False otherwise.',
                },
                category: {
                  type: 'STRING',
                  description:
                    'The skill/topic this question relates to (e.g., C#, Database, Algorithm).',
                },
              },
              required: ['question', 'isCoding', 'category'],
            },
          },
        };

        const response = await this.client.post(
          this.getUrl('generateContent'),
          payload
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
        const validated = validateQuestion(parsedData);

        logger.info(
          { category: validated.category },
          'Question generated successfully'
        );

        return validated;
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
    });
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
