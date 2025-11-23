/**
 * @file pages/SettingsScreen.tsx
 * @description User settings and preferences screen
 */

import React from 'react';
import { PreferencesSettings } from '../components/PreferencesSettings';
import { Button } from '../components/Button';
import { ArrowLeft } from 'lucide-react';
import type { UserProfile } from '../types';

interface SettingsScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentUser,
  onBack,
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
              Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your preferences and notifications
            </p>
          </div>
        </div>

        {/* Settings Component */}
        <PreferencesSettings userId={currentUser.id} />
      </div>
    </div>
  );
};
