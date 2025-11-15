/**
 * @file App.tsx
 * @description Main application component
 */

import { useEffect, useState, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Alert } from './components/Alert';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { SetupScreen } from './pages/SetupScreen';
import LandingPage from './pages/LandingPage';
import LobbyScreen from './pages/LobbyScreen';
import { SpeechInterviewScreen } from './pages/SpeechInterviewScreen';
import { FeedbackModal } from './pages/FeedbackModal';
import { useAuth } from './hooks/useAuth';
import { useInterview } from './hooks/useInterview';
import { initializeFirebase, getFirebaseInstances } from './services/firebase';
import {
  initializeFirestoreService,
  getFirestoreService,
} from './services/firestore';
import { createLogger } from './utils/logger';
import type { AlertState, UserProfile } from './types';

const logger = createLogger('app');

type AppScreen = 'landing' | 'loading' | 'setup' | 'lobby' | 'interview' | 'error';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  const [interviewUnsubscribe, setInterviewUnsubscribe] = useState<
    (() => void) | null
  >(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const {
    userId,
    isAuthReady,
    error: authError,
  } = useAuth();

  const {
    currentSession,
    isLoading: isInterviewLoading,
    startInterview,
    submitAnswer,
    nextQuestion,
    finishInterview,
    abandonInterview,
  } = useInterview(userProfile, userId);

  // Initialize Firebase and Firestore
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeFirebase();
        const { db } = getFirebaseInstances();
        initializeFirestoreService(db);
        logger.info('Firebase initialized successfully');
      } catch (error) {
        logger.error({ error }, 'Firebase initialization failed');
        setScreen('error');
      }
    };

    initialize();
  }, []);

  // Load user profile
  useEffect(() => {
    if (isAuthReady && userId) {
      const loadProfile = async () => {
        try {
          const firestoreService = getFirestoreService();
          const profile = await firestoreService.getUserProfile(userId);
          setUserProfile(profile);

          // Subscribe to interview history
          if (profile) {
            const unsubscribe = firestoreService.subscribeToInterviewHistory(
              userId,
              (sessions) => setInterviewHistory(sessions),
              (error) => {
                logger.error({ error }, 'Failed to load interview history');
              }
            );
            setInterviewUnsubscribe(() => unsubscribe);
          }
        } catch (error) {
          logger.error({ error }, 'Failed to load profile');
        } finally {
          setIsLoadingProfile(false);
        }
      };

      loadProfile();
    } else if (isAuthReady) {
      setIsLoadingProfile(false);
    }
  }, [isAuthReady, userId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (interviewUnsubscribe) {
        interviewUnsubscribe();
      }
    };
  }, [interviewUnsubscribe]);

  // Determine current screen
  useEffect(() => {
    if (authError) {
      setScreen('error');
      return;
    }

    if (!isAuthReady || isLoadingProfile) {
      setScreen('loading');
      return;
    }

    if (currentSession) {
      setScreen('interview');
    } else if (!userProfile) {
      setScreen('setup');
    } else {
      setScreen('lobby');
    }
  }, [authError, isAuthReady, isLoadingProfile, currentSession, userProfile]);

  const showAlert = useCallback((alert: AlertState) => {
    setAlert(alert);
  }, []);

  const handleSaveProfile = useCallback(
    async (profileData: Partial<UserProfile>) => {
      if (!userId) {
        showAlert({
          message: 'User not authenticated',
          type: 'error',
        });
        return;
      }

      try {
        const firestoreService = getFirestoreService();
        const fullProfile: UserProfile = {
          id: userId,
          role: profileData.role || '',
          skills: profileData.skills || [],
          createdAt: userProfile?.createdAt || new Date(),
          updatedAt: new Date(),
          email: profileData.email,
          resumeUrl: profileData.resumeUrl,
        };

        await firestoreService.saveUserProfile(userId, fullProfile);
        setUserProfile(fullProfile);
        showAlert({
          message: 'Profile saved successfully!',
          type: 'success',
        });
        logger.info('Profile saved');
      } catch (error) {
        logger.error({ error }, 'Failed to save profile');
        showAlert({
          message: 'Failed to save profile. Please try again.',
          type: 'error',
        });
      }
    },
    [userId, userProfile, showAlert]
  );

  const handleStartInterview = useCallback(async () => {
    try {
      await startInterview();
      logger.info('Interview started');
    } catch (error) {
      logger.error({ error }, 'Failed to start interview');
      showAlert({
        message: 'Failed to start interview. Please try again.',
        type: 'error',
      });
    }
  }, [startInterview, showAlert]);

  const handleSubmitAnswer = useCallback(
    async (answer: string) => {
      try {
        await submitAnswer(answer);
      } catch (error) {
        logger.error({ error }, 'Failed to submit answer');
        showAlert({
          message: 'Failed to evaluate answer. Please try again.',
          type: 'error',
        });
      }
    },
    [submitAnswer, showAlert]
  );

  const handleNextQuestion = useCallback(async () => {
    if (!currentSession) {
      showAlert({
        message: 'No active interview',
        type: 'error',
      });
      return;
    }

    try {
      if (currentSession.questions.length < 5) {
        // More questions to answer
        await nextQuestion();
      } else {
        // All questions answered, finish interview
        await finishInterview();
        abandonInterview();
        showAlert({
          message: 'Interview completed! Check your history for results.',
          type: 'success',
        });
      }
    } catch (error) {
      logger.error({ error }, 'Failed to proceed with interview');
      showAlert({
        message: 'Failed to continue interview. Please try again.',
        type: 'error',
      });
    }
  }, [
    currentSession,
    nextQuestion,
    finishInterview,
    abandonInterview,
    showAlert,
  ]);

  const renderContent = () => {
    switch (screen) {
      case 'landing':
        return (
          <LandingPage onGetStarted={() => setScreen('loading')} />
        );

      case 'error':
        return (
          <div className="flex items-center justify-center min-h-screen bg-gradient-mesh">
            <Card className="p-10 max-w-md text-center animate-scale-in" shadow="xl">
              <div className="text-6xl mb-6">⚠️</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                {authError?.message || 'An error occurred. Please try refreshing the page.'}
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                size="lg"
              >
                🔄 Refresh Page
              </Button>
            </Card>
          </div>
        );

      case 'loading':
        return (
          <div className="flex items-center justify-center min-h-screen bg-gradient-mesh">
            <div className="text-center">
              <LoadingSpinner message="Initializing application..." size="lg" />
            </div>
          </div>
        );

      case 'setup':
        return (
          <div className="min-h-screen bg-gradient-mesh py-12 px-4">
            <SetupScreen
              onProfileSave={handleSaveProfile}
              isLoading={isInterviewLoading}
              initialProfile={userProfile || undefined}
            />
          </div>
        );

      case 'lobby':
        return (
          <div className="min-h-screen bg-gradient-mesh py-12 px-4">
            <LobbyScreen
              profile={userProfile!}
              history={interviewHistory}
              onStartInterview={handleStartInterview}
              onEditProfile={() => setScreen('setup')}
              isLoading={isInterviewLoading}
            />
          </div>
        );

      case 'interview':
        return (
          <div className="min-h-screen bg-gradient-mesh py-12 px-4">
            {currentSession && (
              <>
                <SpeechInterviewScreen
                  session={currentSession}
                  onSubmitAnswer={handleSubmitAnswer}
                  onExit={() => {
                    abandonInterview();
                    setScreen('lobby');
                    showAlert({
                      message: 'Interview cancelled.',
                      type: 'info',
                    });
                  }}
                />

                {currentSession.questions[currentSession.questions.length - 1]
                  ?.score && (
                  <FeedbackModal
                    score={
                      currentSession.questions.length > 0
                        ? parseFloat(
                            (
                              currentSession.questions.reduce(
                                (sum, q) => sum + (q.score || 0),
                                0
                              ) / currentSession.questions.length
                            ).toFixed(1)
                          )
                        : 0
                    }
                    feedback={currentSession.questions
                      .filter((q) => q.feedback)
                      .map((q) => ({
                        question: q.qText,
                        score: q.score || 0,
                        feedback: q.feedback || '',
                        improvements: q.improvementSuggestions,
                      }))}
                    role={currentSession.role}
                    onRetake={handleNextQuestion}
                    onExit={() => setScreen('lobby')}
                    isLoading={isInterviewLoading}
                  />
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-mesh">
        {/* Header */}
        {isAuthReady && userId && screen !== 'error' && screen !== 'loading' && isInterviewLoading && (
          <div className="glass border-b border-white/20 px-6 py-4 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto flex justify-end items-center">
              <div className="flex items-center gap-3 glass px-4 py-2 rounded-full border border-white/30">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-gray-700">Processing...</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {renderContent()}

        {/* Alert System */}
        {alert && (
          <Alert {...alert} onClose={() => setAlert(null)} />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
