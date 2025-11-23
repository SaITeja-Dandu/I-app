/**
 * @file App.tsx
 * @description Main application component
 */

import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Alert } from './components/Alert';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { NotificationBell } from './components/NotificationBell';
import { useAuth } from './hooks/useAuth';
import { useInterview } from './hooks/useInterview';
import { initializeFirebase, getFirebaseInstances } from './services/firebase';
import {
  initializeFirestoreService,
  getFirestoreService,
} from './services/firestore';
import { initializeReminderScheduler, stopReminderScheduler } from './services/reminder-scheduler';
import { initializeInterviewerService } from './services/interviewer';
import { initializeAvailabilityService } from './services/availability';
import { initializeRatingService } from './services/rating';
import { initializeVideoConferencingService } from './services/video-conferencing';
import { initializePaymentService } from './services/payment';
import { initializeFavoritesService } from './services/favorites';
import { initializePreferencesService } from './services/preferences';
import { initializeMessagingService } from './services/messaging';
import { initializeAnalyticsService } from './services/analytics';
import { initializeFileStorageService } from './services/file-storage';
import { createLogger } from './utils/logger';
import { Logo } from './components/Logo';
import type { AlertState, UserProfile } from './types';

// Lazy load page components for better code splitting
const SetupScreen = lazy(() => import('./pages/SetupScreen').then(m => ({ default: m.SetupScreen })));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LobbyScreen = lazy(() => import('./pages/LobbyScreen'));
const SpeechInterviewScreen = lazy(() => import('./pages/SpeechInterviewScreen').then(m => ({ default: m.SpeechInterviewScreen })));
const FeedbackModal = lazy(() => import('./pages/FeedbackModal').then(m => ({ default: m.FeedbackModal })));
const AuthScreen = lazy(() => import('./pages/AuthScreen'));
const WelcomeScreen = lazy(() => import('./pages/WelcomeScreen'));
const UserTypeScreen = lazy(() => import('./pages/UserTypeScreen').then(m => ({ default: m.UserTypeScreen })));
const InterviewerSetupScreen = lazy(() => import('./pages/InterviewerSetupScreen').then(m => ({ default: m.InterviewerSetupScreen })));
const BookInterviewScreen = lazy(() => import('./pages/BookInterviewScreen').then(m => ({ default: m.BookInterviewScreen })));
const InterviewerDashboardScreen = lazy(() => import('./pages/InterviewerDashboardScreen').then(m => ({ default: m.InterviewerDashboardScreen })));
const InterviewerAvailabilityScreen = lazy(() => import('./pages/InterviewerAvailabilityScreen').then(m => ({ default: m.InterviewerAvailabilityScreen })));
const InterviewerEarningsScreen = lazy(() => import('./pages/InterviewerEarningsScreen').then(m => ({ default: m.InterviewerEarningsScreen })));
const SubmitReviewScreen = lazy(() => import('./pages/SubmitReviewScreen').then(m => ({ default: m.SubmitReviewScreen })));
const CandidateDashboardScreen = lazy(() => import('./pages/CandidateDashboardScreen').then(m => ({ default: m.CandidateDashboardScreen })));
const SavedInterviewersScreen = lazy(() => import('./pages/SavedInterviewersScreen').then(m => ({ default: m.SavedInterviewersScreen })));
const InterviewHistoryScreen = lazy(() => import('./pages/InterviewHistoryScreen').then(m => ({ default: m.InterviewHistoryScreen })));
const SettingsScreen = lazy(() => import('./pages/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const MessagingScreen = lazy(() => import('./pages/MessagingScreen').then(m => ({ default: m.MessagingScreen })));
const InterviewerAnalyticsScreen = lazy(() => import('./pages/InterviewerAnalyticsScreen').then(m => ({ default: m.InterviewerAnalyticsScreen })));
const FileManagementScreen = lazy(() => import('./pages/FileManagementScreen').then(m => ({ default: m.FileManagementScreen })));

const logger = createLogger('app');

type AppScreen = 'landing' | 'loading' | 'welcome' | 'userType' | 'setup' | 'interviewerSetup' | 'auth' | 'lobby' | 'bookInterview' | 'candidateDashboard' | 'interviewerDashboard' | 'interviewerAvailability' | 'interviewerEarnings' | 'interviewerAnalytics' | 'submitReview' | 'savedInterviewers' | 'interviewHistory' | 'settings' | 'messaging' | 'fileManagement' | 'interview' | 'error';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [hasViewedLanding, setHasViewedLanding] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  const [interviewUnsubscribe, setInterviewUnsubscribe] = useState<
    (() => void) | null
  >(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [resumeExperience, setResumeExperience] = useState<string | undefined>(undefined);
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewInterviewerId, setReviewInterviewerId] = useState<string | null>(null);
  const [reviewInterviewerName, setReviewInterviewerName] = useState<string>('');

  const {
    userId,
    isAuthReady,
    error: authError,
    logout,
  } = useAuth();

  const {
    currentSession,
    isLoading: isInterviewLoading,
    startInterview,
    submitAnswer,
    nextQuestion,
    finishInterview,
    abandonInterview,
  } = useInterview(userProfile, userId, resumeExperience);

  // Initialize Firebase and Firestore
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeFirebase();
        const { db } = getFirebaseInstances();
        initializeFirestoreService(db);
        initializeInterviewerService(db);
        initializeAvailabilityService(db);
        initializeRatingService(db);
        initializeVideoConferencingService();
        initializePaymentService();
        initializeFavoritesService(db);
        initializePreferencesService(db);
        initializeMessagingService(db);
        initializeAnalyticsService(db);
        initializeFileStorageService();
        
        // Initialize reminder scheduler for automated notifications
        initializeReminderScheduler(db);
        logger.info('Reminder scheduler initialized');
        
        setIsFirebaseInitialized(true);
        logger.info('Firebase initialized successfully');
      } catch (error) {
        logger.error({ error }, 'Firebase initialization failed');
        setScreen('error');
      }
    };

    initialize();
    
    // Cleanup: Stop reminder scheduler when component unmounts
    return () => {
      stopReminderScheduler();
      logger.info('Reminder scheduler stopped');
    };
  }, []);

  // Load user profile
  useEffect(() => {
    if (!isFirebaseInitialized || !isAuthReady) {
      return;
    }

    if (userId) {
      const loadProfile = async () => {
        try {
          const firestoreService = getFirestoreService();
          const profile = await firestoreService.getUserProfile(userId);
          logger.info({ 
            hasProfile: !!profile, 
            userType: profile?.userType,
            hasRole: !!profile?.role,
            hasInterviewerProfile: !!profile?.interviewerProfile
          }, 'Profile loaded from Firestore');
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
    } else {
      setUserProfile(null);
      setIsLoadingProfile(false);
    }
  }, [isFirebaseInitialized, isAuthReady, userId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (interviewUnsubscribe) {
        interviewUnsubscribe();
      }
    };
  }, [interviewUnsubscribe]);

  // Determine current screen with proper route protection
  useEffect(() => {
    // Critical error
    if (authError) {
      setScreen('error');
      return;
    }

    // Still loading Firebase or auth state
    if (!isFirebaseInitialized || !isAuthReady) {
      setScreen('loading');
      return;
    }

    // Not authenticated - show landing or auth
    if (!userId) {
      // Keep current screen if already on auth screen
      if (screen === 'auth') {
        setScreen('auth');
      } else {
        // Default to landing page for unauthenticated users
        setScreen('landing');
      }
      return;
    }

    // Authenticated - loading user profile
    if (isLoadingProfile) {
      setScreen('loading');
      return;
    }

    // Active interview session
    if (currentSession) {
      setScreen('interview');
      return;
    }

    // Authenticated user hasn't seen welcome screen yet - show it first
    if (!hasSeenWelcome) {
      setScreen('welcome');
      return;
    }

    // After welcome screen, check profile state
    if (!userProfile || !userProfile.userType) {
      // User completed welcome but no profile/type yet - go to setup
      // But don't force it if already on setup screen
      if (screen !== 'setup') {
        setScreen('setup');
      }
      return;
    }

    // Interviewer without profile
    if (userProfile.userType === 'interviewer' && !userProfile.interviewerProfile) {
      // Don't force if already on interviewer setup
      if (screen !== 'interviewerSetup') {
        setScreen('interviewerSetup');
      }
      return;
    }

    // Interviewer with complete profile - show dashboard
    if (userProfile.userType === 'interviewer' && userProfile.interviewerProfile) {
      // Don't force if already on dashboard or other interviewer screens
      if (screen !== 'interviewerDashboard' && screen !== 'interviewerAvailability' && screen !== 'interviewerEarnings' && screen !== 'interviewerAnalytics' && screen !== 'messaging' && screen !== 'fileManagement') {
        setScreen('interviewerDashboard');
      }
      return;
    }

    // Candidate without basic profile
    if (userProfile.userType === 'candidate' && !userProfile.role) {
      // Don't force if already on setup
      if (screen !== 'setup') {
        setScreen('setup');
      }
      return;
    }

    // Handle specific screen requests
    if (screen === 'bookInterview' || screen === 'candidateDashboard' || screen === 'interviewerDashboard' || screen === 'interviewerAvailability' || screen === 'interviewerEarnings' || screen === 'interviewerAnalytics' || screen === 'submitReview' || screen === 'savedInterviewers' || screen === 'interviewHistory' || screen === 'settings' || screen === 'messaging') {
      // Keep current screen
      return;
    }

    // Has complete profile - show lobby
    setScreen('lobby');
  }, [
    authError,
    isFirebaseInitialized,
    isAuthReady,
    userId,
    isLoadingProfile,
    currentSession,
    userProfile,
    hasViewedLanding,
    hasSeenWelcome,
    screen,
  ]);

  const showAlert = useCallback((alert: AlertState) => {
    setAlert(alert);
  }, []);

  const handleUserTypeSelection = useCallback(
    async (userType: 'candidate' | 'interviewer') => {
      if (!userId) {
        showAlert({
          message: 'User not authenticated',
          type: 'error',
        });
        return;
      }

      try {
        const firestoreService = getFirestoreService();
        const updatedProfile: UserProfile = {
          ...userProfile,
          uid: userId,
          id: userId,
          userType,
          createdAt: userProfile?.createdAt || new Date(),
          updatedAt: new Date(),
          email: userProfile?.email,
        } as UserProfile;

        await firestoreService.saveUserProfile(userId, updatedProfile);
        setUserProfile(updatedProfile);
        logger.info({ userType }, 'User type selected');
      } catch (error) {
        logger.error({ error }, 'Failed to save user type');
        showAlert({
          message: 'Failed to save user type. Please try again.',
          type: 'error',
        });
      }
    },
    [userId, userProfile, showAlert]
  );

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
          ...userProfile,
          id: userId,
          uid: userId,
          role: profileData.role || userProfile?.role || '',
          skills: profileData.skills || userProfile?.skills || [],
          createdAt: userProfile?.createdAt || new Date(),
          updatedAt: new Date(),
          email: profileData.email || userProfile?.email,
          resumeUrl: profileData.resumeUrl || userProfile?.resumeUrl,
          userType: profileData.userType || userProfile?.userType || 'candidate',
          interviewerProfile: profileData.interviewerProfile || userProfile?.interviewerProfile,
        } as UserProfile;

        await firestoreService.saveUserProfile(userId, fullProfile);
        setUserProfile(fullProfile);
        
        logger.info({ userType: fullProfile.userType, hasRole: !!fullProfile.role }, 'Profile saved successfully');
        
        showAlert({
          message: 'Profile saved successfully!',
          type: 'success',
        });

        // Navigate to appropriate screen based on profile
        if (fullProfile.userType === 'interviewer' && !fullProfile.interviewerProfile) {
          logger.info({}, 'Navigating to interviewer setup');
          setScreen('interviewerSetup');
        } else if (fullProfile.userType === 'interviewer' && fullProfile.interviewerProfile) {
          logger.info({}, 'Navigating to interviewer dashboard');
          setScreen('interviewerDashboard');
        } else if (fullProfile.userType === 'candidate') {
          logger.info({}, 'Navigating to lobby');
          setScreen('lobby');
        }
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

  const handleInterviewerProfileSave = useCallback(
    async (interviewerProfile: any) => {
      if (!userId || !userProfile) {
        showAlert({
          message: 'User not authenticated',
          type: 'error',
        });
        return;
      }

      try {
        const firestoreService = getFirestoreService();
        const updatedProfile: UserProfile = {
          ...userProfile,
          interviewerProfile,
          updatedAt: new Date(),
        };

        await firestoreService.saveUserProfile(userId, updatedProfile);
        setUserProfile(updatedProfile);
        
        logger.info({}, 'Interviewer profile saved successfully');
        
        showAlert({
          message: 'Interviewer profile saved successfully!',
          type: 'success',
        });
        
        // Navigate to interviewer dashboard
        logger.info({}, 'Navigating to interviewer dashboard');
        setScreen('interviewerDashboard');
      } catch (error) {
        logger.error({ error }, 'Failed to save interviewer profile');
        showAlert({
          message: 'Failed to save interviewer profile. Please try again.',
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
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <LandingPage
              onGetStarted={() => {
                setHasViewedLanding(true);
                setScreen('auth');
              }}
            />
          </Suspense>
        );

      case 'auth':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <div className="min-h-screen bg-gradient-mesh px-4">
              <AuthScreen 
                onSelectUserType={handleUserTypeSelection}
                onBackToLanding={() => setScreen('landing')}
              />
            </div>
          </Suspense>
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

      case 'welcome':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <WelcomeScreen
              onComplete={() => {
                setHasSeenWelcome(true);
                // Go to lobby (home) after welcome screen
                setScreen('lobby');
              }}
              userEmail={userProfile?.email}
            />
          </Suspense>
        );

      case 'userType':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <UserTypeScreen
              onSelectType={handleUserTypeSelection}
              userEmail={userProfile?.email}
            />
          </Suspense>
        );

      case 'interviewerSetup':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <InterviewerSetupScreen
              onComplete={handleInterviewerProfileSave}
              onBack={() => setScreen('userType')}
            />
          </Suspense>
        );

      case 'setup':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading setup..." size="lg" /></div>}>
            <div className="min-h-screen bg-gradient-mesh px-4">
              <SetupScreen
                onProfileSave={handleSaveProfile}
                isLoading={isInterviewLoading}
                initialProfile={userProfile || undefined}
                onResumeAnalyzed={setResumeExperience}
                onSignOut={async () => {
                  try {
                    await logout();
                    setUserProfile(null);
                    setInterviewHistory([]);
                    setHasViewedLanding(false);
                    setIsLoadingProfile(true);
                    if (interviewUnsubscribe) {
                      interviewUnsubscribe();
                      setInterviewUnsubscribe(null);
                    }
                    abandonInterview();
                    setScreen('landing');
                    showAlert({ message: 'Signed out successfully', type: 'info' });
                  } catch (err) {
                    showAlert({ message: 'Failed to sign out', type: 'error' });
                  }
                }}
              />
            </div>
          </Suspense>
        );

      case 'lobby':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading lobby..." size="lg" /></div>}>
            <div className="min-h-screen bg-gradient-mesh px-4">
              <LobbyScreen
                profile={userProfile!}
                history={interviewHistory}
                onStartInterview={handleStartInterview}
                onEditProfile={() => setScreen('setup')}
                onBookInterview={() => setScreen('bookInterview')}
                onViewDashboard={() => setScreen('interviewerDashboard')}
                isLoading={isInterviewLoading}
              />
            </div>
          </Suspense>
        );

      case 'bookInterview':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <BookInterviewScreen
              currentUser={userProfile!}
              onBookingCreated={(_bookingId) => {
                showAlert({
                  message: 'Booking request sent successfully!',
                  type: 'success',
                });
                setScreen('lobby');
              }}
              onBack={() => setScreen('lobby')}
            />
          </Suspense>
        );

      case 'candidateDashboard':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <CandidateDashboardScreen
              currentUser={userProfile!}
              onBack={() => setScreen('lobby')}
              onSubmitReview={(bookingId, interviewerId, interviewerName) => {
                setReviewBookingId(bookingId);
                setReviewInterviewerId(interviewerId);
                setReviewInterviewerName(interviewerName);
                setScreen('submitReview');
              }}
              onViewSavedInterviewers={() => setScreen('savedInterviewers')}
              onViewHistory={() => setScreen('interviewHistory')}
              onManageFiles={() => setScreen('fileManagement')}
            />
          </Suspense>
        );

      case 'savedInterviewers':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <SavedInterviewersScreen
              currentUser={userProfile!}
              onBack={() => setScreen('candidateDashboard')}
              onBookInterview={(_interviewerId) => {
                // Navigate to book interview with pre-selected interviewer
                setScreen('bookInterview');
              }}
            />
          </Suspense>
        );

      case 'interviewHistory':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <InterviewHistoryScreen
              currentUser={userProfile!}
              onBack={() => setScreen('candidateDashboard')}
              onRateInterview={(bookingId) => {
                // Get booking details and navigate to review screen
                setReviewBookingId(bookingId);
                setScreen('submitReview');
              }}
            />
          </Suspense>
        );

      case 'settings':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <SettingsScreen
              currentUser={userProfile!}
              onBack={() => setScreen('lobby')}
            />
          </Suspense>
        );

      case 'interviewerDashboard':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <InterviewerDashboardScreen
              currentUser={userProfile!}
              onStartInterview={(_bookingId) => {
                // TODO: Handle starting live interview with booking
                showAlert({
                  message: 'Starting interview...',
                  type: 'info',
                });
              }}
              onBack={() => setScreen('lobby')}
              onManageAvailability={() => setScreen('interviewerAvailability')}
              onViewEarnings={() => setScreen('interviewerEarnings')}
              onViewAnalytics={() => setScreen('interviewerAnalytics')}
              onOpenMessages={() => setScreen('messaging')}
              onManageFiles={() => setScreen('fileManagement')}
            />
          </Suspense>
        );

      case 'interviewerAvailability':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <InterviewerAvailabilityScreen onBack={() => setScreen('interviewerDashboard')} />
          </Suspense>
        );

      case 'interviewerEarnings':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <InterviewerEarningsScreen
              currentUser={userProfile!}
              onBack={() => setScreen('interviewerDashboard')}
            />
          </Suspense>
        );

      case 'submitReview':
        if (!reviewBookingId || !reviewInterviewerId) {
          setScreen('lobby');
          return null;
        }
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading..." size="lg" /></div>}>
            <SubmitReviewScreen
              bookingId={reviewBookingId}
              interviewerId={reviewInterviewerId}
              interviewerName={reviewInterviewerName}
              onComplete={() => {
                setScreen('lobby');
                setReviewBookingId(null);
                setReviewInterviewerId(null);
                setReviewInterviewerName('');
                showAlert({
                  message: 'Thank you for your review!',
                  type: 'success',
                });
              }}
              onCancel={() => {
                setScreen('lobby');
                setReviewBookingId(null);
                setReviewInterviewerId(null);
                setReviewInterviewerName('');
              }}
            />
          </Suspense>
        );

      case 'messaging':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading messages..." size="lg" /></div>}>
            <MessagingScreen
              currentUser={userProfile!}
              onBack={() => {
                if (userProfile?.role === 'interviewer') {
                  setScreen('interviewerDashboard');
                } else {
                  setScreen('candidateDashboard');
                }
              }}
            />
          </Suspense>
        );

      case 'interviewerAnalytics':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading analytics..." size="lg" /></div>}>
            <InterviewerAnalyticsScreen
              currentUser={userProfile!}
              onBack={() => setScreen('interviewerDashboard')}
            />
          </Suspense>
        );

      case 'fileManagement':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading files..." size="lg" /></div>}>
            <FileManagementScreen
              currentUser={userProfile!}
              onBack={() => {
                if (userProfile?.role === 'interviewer') {
                  setScreen('interviewerDashboard');
                } else {
                  setScreen('candidateDashboard');
                }
              }}
            />
          </Suspense>
        );

      case 'interview':
        return (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-mesh"><LoadingSpinner message="Loading interview..." size="lg" /></div>}>
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
          </Suspense>
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-mesh">
        {/* Header */}
        {isAuthReady && userId && screen !== 'error' && screen !== 'loading' && screen !== 'setup' && screen !== 'welcome' && screen !== 'userType' && screen !== 'interviewerSetup' && (
          <div className="bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-sm px-6 py-2 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Logo size="medium" variant="horizontal" className="cursor-pointer" onClick={() => {
                if (userProfile?.userType === 'interviewer') {
                  setScreen('interviewerDashboard');
                } else {
                  setScreen('candidateDashboard');
                }
              }} />

              <div className="flex items-center gap-3">
                {isInterviewLoading && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 rounded-full border border-blue-200">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-gray-700">Processing...</span>
                  </div>
                )}

                {/* Notification Bell */}
                <NotificationBell userId={userId} />

                {/* Messaging Icon */}
                <button
                  onClick={() => setScreen('messaging')}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-200 relative"
                  title="Messages"
                >
                  💬
                </button>

                {/* Settings Button */}
                <button
                  onClick={() => setScreen('settings')}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  title="Settings"
                >
                  ⚙️
                </button>

                <button
                  onClick={async () => {
                    try {
                      await logout();
                      // Clear local state
                      setUserProfile(null);
                      setInterviewHistory([]);
                      setHasViewedLanding(false);
                      setIsLoadingProfile(true);
                      if (interviewUnsubscribe) {
                        interviewUnsubscribe();
                        setInterviewUnsubscribe(null);
                      }
                      abandonInterview();
                      setScreen('landing');
                      showAlert({ message: 'Signed out successfully', type: 'info' });
                    } catch (err) {
                      showAlert({ message: 'Failed to sign out', type: 'error' });
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Sign Out
                </button>
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
