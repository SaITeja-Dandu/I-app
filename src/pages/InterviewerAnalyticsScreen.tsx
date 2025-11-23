/**
 * @file pages/InterviewerAnalyticsScreen.tsx
 * @description Screen for interviewer analytics and insights
 */

import React from 'react';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import type { UserProfile } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('analytics-screen');

interface InterviewerAnalyticsScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
}

export const InterviewerAnalyticsScreen: React.FC<InterviewerAnalyticsScreenProps> = ({
  currentUser,
  onBack,
}) => {
  // Set page title when component mounts
  React.useEffect(() => {
    document.title = 'Analytics & Insights - Intervuu';
    return () => {
      document.title = 'Intervuu';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              logger.info({}, 'Back to dashboard clicked');
              onBack();
            }}
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2 transition-colors font-semibold"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">📊</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
              <p className="text-gray-600">Track your performance and earnings</p>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard interviewerId={currentUser.id} />
      </div>
    </div>
  );
};
