/**
 * @file hooks/useInterview.ts
 * @description Hook for managing interview sessions
 */

import { useState, useCallback, useRef } from 'react';
import { createLogger } from '../utils/logger';
import { handleError } from '../utils/error-handler';
import { geminiApiService } from '../services/gemini-api';
import { getFirestoreService } from '../services/firestore';
import { INTERVIEW_LENGTH } from '../utils/constants';
import type {
  InterviewSession,
  InterviewQuestion,
  ApiError,
  UserProfile,
} from '../types';

const logger = createLogger('useInterview');

export const useInterview = (userProfile: UserProfile | null, userId: string | null) => {
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const sessionStartTime = useRef<number | null>(null);

  const startInterview = useCallback(async () => {
    if (!userProfile || !userId) {
      setError(handleError(new Error('Missing profile or user ID')));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      sessionStartTime.current = Date.now();

      const newSession: InterviewSession = {
        id: '',
        userId,
        role: userProfile.role,
        skills: userProfile.skills,
        date: new Date(),
        score: 0,
        duration: 0,
        questions: [],
        status: 'in-progress',
      };

      setCurrentSession(newSession);

      // Generate first question
      const question = await geminiApiService.generateQuestion(
        userProfile.role,
        userProfile.skills,
        [],
        0,
        INTERVIEW_LENGTH
      );

      const firstQuestion: InterviewQuestion = {
        qText: question.question,
        isCoding: question.isCoding,
        category: question.category,
      };

      setCurrentSession((prev) =>
        prev ? { ...prev, questions: [firstQuestion] } : null
      );

      logger.info('Interview started');
    } catch (err) {
      const appError = handleError(err);
      setError(appError);
      setCurrentSession(null);
      logger.error({ error: err }, 'Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, userId]);

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!currentSession) {
        setError(handleError(new Error('No active interview')));
        return;
      }

      const currentQuestionIndex = currentSession.questions.length - 1;
      if (currentQuestionIndex < 0) {
        setError(handleError(new Error('Invalid question index')));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const currentQuestion = currentSession.questions[currentQuestionIndex];
        const evaluation = await geminiApiService.evaluateAnswer(
          currentSession.skills,
          currentQuestion.qText,
          answer
        );

        setCurrentSession((prev) => {
          if (!prev) return null;

          const updatedQuestions = [...prev.questions];
          updatedQuestions[currentQuestionIndex] = {
            ...updatedQuestions[currentQuestionIndex],
            answerText: answer,
            feedback: evaluation.feedback,
            score: evaluation.score,
            improvementSuggestions: evaluation.improvementSuggestions,
          };

          return { ...prev, questions: updatedQuestions };
        });

        logger.info(
          { questionIndex: currentQuestionIndex, score: evaluation.score },
          'Answer evaluated'
        );
      } catch (err) {
        const appError = handleError(err);
        setError(appError);
        logger.error({ error: err }, 'Failed to submit answer');
      } finally {
        setIsLoading(false);
      }
    },
    [currentSession]
  );

  const nextQuestion = useCallback(async () => {
    if (!currentSession) {
      setError(handleError(new Error('No active interview')));
      return;
    }

    const nextIndex = currentSession.questions.length;

    if (nextIndex >= INTERVIEW_LENGTH) {
      // All questions answered
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const askedTopics = currentSession.questions.map((q) => q.category);
      const question = await geminiApiService.generateQuestion(
        currentSession.role,
        currentSession.skills,
        askedTopics,
        nextIndex,
        INTERVIEW_LENGTH
      );

      const newQuestion: InterviewQuestion = {
        qText: question.question,
        isCoding: question.isCoding,
        category: question.category,
      };

      setCurrentSession((prev) =>
        prev
          ? { ...prev, questions: [...prev.questions, newQuestion] }
          : null
      );

      logger.info({ questionIndex: nextIndex }, 'Next question loaded');
    } catch (err) {
      const appError = handleError(err);
      setError(appError);
      logger.error({ error: err }, 'Failed to load next question');
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const finishInterview = useCallback(async () => {
    if (!currentSession || !userId) {
      setError(handleError(new Error('No active interview or user')));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const totalScore = currentSession.questions.reduce(
        (sum, q) => sum + (q.score || 0),
        0
      );
      const averageScore = totalScore / currentSession.questions.length;
      const duration = sessionStartTime.current
        ? Math.floor((Date.now() - sessionStartTime.current) / 1000)
        : 0;

      const completedSession: InterviewSession = {
        ...currentSession,
        score: parseFloat(averageScore.toFixed(1)),
        duration,
        status: 'completed',
        metrics: {
          averageScore: parseFloat(averageScore.toFixed(1)),
          completionTime: duration,
          averageTimePerQuestion: Math.floor(
            duration / currentSession.questions.length
          ),
        },
      };

      const firestoreService = getFirestoreService();
      const sessionId = await firestoreService.saveInterviewSession(
        userId,
        completedSession
      );

      setCurrentSession((prev) => (prev ? { ...prev, id: sessionId } : null));

      logger.info(
        {
          sessionId,
          score: completedSession.score,
          duration,
        },
        'Interview completed and saved'
      );
    } catch (err) {
      const appError = handleError(err);
      setError(appError);
      logger.error({ error: err }, 'Failed to finish interview');
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, userId]);

  const abandonInterview = useCallback(() => {
    setCurrentSession(null);
    setError(null);
    sessionStartTime.current = null;
    logger.info('Interview abandoned');
  }, []);

  return {
    currentSession,
    isLoading,
    error,
    startInterview,
    submitAnswer,
    nextQuestion,
    finishInterview,
    abandonInterview,
  };
};
