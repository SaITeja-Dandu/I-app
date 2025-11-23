/**
 * @file pages/InterviewerEarningsScreen.tsx
 * @description Screen for interviewers to view earnings and request payouts
 */

import React from 'react';
import { EarningsDashboard } from '../components/EarningsDashboard';
import type { UserProfile } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('earnings-screen');

interface InterviewerEarningsScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
}

export const InterviewerEarningsScreen: React.FC<InterviewerEarningsScreenProps> = ({
  currentUser,
  onBack,
}) => {
  // Set page title when component mounts
  React.useEffect(() => {
    document.title = 'Your Earnings - Intervuu';
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
            <div className="text-4xl">💰</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Earnings</h1>
              <p className="text-gray-600">Track your income and manage payouts</p>
            </div>
          </div>
        </div>

        {/* Earnings Dashboard Component */}
        <EarningsDashboard interviewerId={currentUser.id} />
      </div>
    </div>
  );
};

export default InterviewerEarningsScreen;
