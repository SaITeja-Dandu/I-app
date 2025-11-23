/**
 * @file pages/InterviewHistoryScreen.tsx
 * @description Screen to view interview history with ratings
 */

import React from 'react';
import { InterviewHistory } from '../components/InterviewHistory';
import { Button } from '../components/Button';
import { ArrowLeft } from 'lucide-react';
import type { UserProfile } from '../types';

interface InterviewHistoryScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
  onRateInterview: (bookingId: string) => void;
}

export const InterviewHistoryScreen: React.FC<InterviewHistoryScreenProps> = ({
  currentUser,
  onBack,
  onRateInterview,
}) => {
  return (
    <div className="min-h-screen bg-gradient-mesh py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Interview History
            </h1>
            <p className="text-gray-600 mt-2">
              Review your past interviews and ratings
            </p>
          </div>
        </div>

        {/* History List */}
        <InterviewHistory
          userId={currentUser.id}
          userRole={currentUser.userType || 'candidate'}
          onRateInterview={onRateInterview}
        />
      </div>
    </div>
  );
};
