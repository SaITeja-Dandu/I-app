/**
 * @file pages/SettingsScreen.tsx
 * @description User settings and preferences screen
 */

import React from 'react';
import { PreferencesSettings } from '../components/PreferencesSettings';
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
    <div className="min-h-screen bg-gradient-mesh py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your preferences and notifications
          </p>
        </div>

        {/* Settings Component */}
        <PreferencesSettings userId={currentUser.id} />
      </div>
    </div>
  );
};
