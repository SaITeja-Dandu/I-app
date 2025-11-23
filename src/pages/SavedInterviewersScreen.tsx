/**
 * @file pages/SavedInterviewersScreen.tsx
 * @description Screen to view and manage saved/favorite interviewers
 */

import React from 'react';
import { FavoriteInterviewers } from '../components/FavoriteInterviewers';
import { Button } from '../components/Button';
import { ArrowLeft } from 'lucide-react';
import type { UserProfile } from '../types';

interface SavedInterviewersScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
  onBookInterview: (interviewerId: string) => void;
}

export const SavedInterviewersScreen: React.FC<SavedInterviewersScreenProps> = ({
  currentUser,
  onBack,
  onBookInterview,
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
              Saved Interviewers
            </h1>
            <p className="text-gray-600 mt-2">
              Your favorite interviewers for quick access
            </p>
          </div>
        </div>

        {/* Favorites List */}
        <FavoriteInterviewers
          userId={currentUser.id}
          onBookInterview={onBookInterview}
        />
      </div>
    </div>
  );
};
