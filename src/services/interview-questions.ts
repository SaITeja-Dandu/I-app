/**
 * @file services/interview-questions.ts
 * @description Fetch real interview questions from internet using Gemini AI with web search
 * Questions are sourced from LeetCode, HackerRank, company interviews, and industry standards
 */

import axios from 'axios';
import { createLogger } from '../utils/logger';
import { AppError } from '../utils/error-handler';
import { ERROR_CODES, GEMINI_API_URL, GEMINI_MODEL } from '../utils/constants';

const logger = createLogger('interview-questions');

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  type: 'conceptual' | 'coding' | 'design';
  source: string; // e.g., "LeetCode", "HackerRank", "Company Interview"
}

class InterviewQuestionsService {
  private apiKey: string;
  private questionCache: Map<string, InterviewQuestion[]> = new Map();

  constructor() {
    this.apiKey =
      import.meta.env.VITE_GEMINI_API_KEY ||
      (typeof (window as any).__gemini_api_key !== 'undefined'
        ? (window as any).__gemini_api_key
        : '');

    if (!this.apiKey) {
      logger.warn('Gemini API key not configured');
    }
  }

  private getUrl(action: string): string {
    return `${GEMINI_API_URL}/${GEMINI_MODEL}:${action}?key=${this.apiKey}`;
  }

  /**
   * Fetch most asked interview questions for a specific role and difficulty level
   * Uses Gemini with web search to find real questions from various sources
   */
  async getQuestionsForRole(
    role: string,
    skills: string[],
    difficulty: 'basic' | 'intermediate' | 'advanced',
    count: number = 5
  ): Promise<InterviewQuestion[]> {
    // Check cache first
    const cacheKey = `${role}-${difficulty}-${count}`;
    if (this.questionCache.has(cacheKey)) {
      return this.questionCache.get(cacheKey)!;
    }

    try {
      const prompt = `Search the internet and find the TOP ${count} most frequently asked "${difficulty}" level interview questions for a "${role}" position.

Include questions that are commonly asked in real interviews from sources like:
- LeetCode
- HackerRank  
- Company interviews (Google, Amazon, Microsoft, Facebook, etc.)
- GeeksforGeeks
- Interview.io
- Blind
- Stack Overflow

The candidate has experience with: ${skills.join(', ')}

Return ONLY a JSON array with this exact structure, no other text:
[
  {
    "question": "The interview question",
    "category": "Topic/Skill",
    "type": "conceptual" or "coding" or "design",
    "source": "Where this question comes from (e.g., 'LeetCode', 'Company Interview', 'HackerRank')"
  }
]

Make sure the questions are:
1. REAL questions from actual sources, not made up
2. Most frequently asked in interviews
3. Relevant to their skills and role
4. Specific and detailed, not generic
5. Appropriate for "${difficulty}" level`;

      const payload = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                question: { type: 'STRING' },
                category: { type: 'STRING' },
                type: {
                  type: 'STRING',
                  enum: ['conceptual', 'coding', 'design'],
                },
                source: { type: 'STRING' },
              },
              required: ['question', 'category', 'type', 'source'],
            },
          },
        },
      };

      const response = await axios.post(this.getUrl('generateContent'), payload, {
        timeout: 30000,
      });

      const jsonText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!jsonText) {
        throw new AppError(
          ERROR_CODES.API_ERROR,
          'Empty response from Gemini API'
        );
      }

      const parsedQuestions = JSON.parse(jsonText);
      
      // Transform to add IDs and validate
      const questions: InterviewQuestion[] = parsedQuestions.map(
        (q: any, index: number) => ({
          id: `${role}-${difficulty}-${index}-${Date.now()}`,
          question: q.question,
          category: q.category,
          difficulty,
          type: q.type || 'conceptual',
          source: q.source,
        })
      );

      // Cache the results
      this.questionCache.set(cacheKey, questions);
      logger.info(
        { role, difficulty, count },
        'Questions fetched successfully'
      );

      return questions;
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error({ error }, 'Failed to fetch interview questions');
      throw new AppError(
        ERROR_CODES.API_ERROR,
        'Failed to fetch interview questions',
        (error as any)?.response?.status,
        error
      );
    }
  }

  /**
   * Get random question from fetched questions
   */
  getRandomQuestion(questions: InterviewQuestion[]): InterviewQuestion | null {
    if (questions.length === 0) return null;
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Clear cache if needed
   */
  clearCache(): void {
    this.questionCache.clear();
  }
}

export const interviewQuestionsService = new InterviewQuestionsService();

