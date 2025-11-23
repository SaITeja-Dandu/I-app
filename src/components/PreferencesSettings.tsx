/**
 * @file components/PreferencesSettings.tsx
 * @description User preferences and notification settings component
 */

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { 
  getPreferencesService, 
  type NotificationPreferences, 
  type ApplicationPreferences 
} from '../services/preferences';
import { createLogger } from '../utils/logger';
import { Bell, Settings, Globe, Moon, Clock, RefreshCw } from 'lucide-react';

const logger = createLogger('preferences-settings');

interface PreferencesSettingsProps {
  userId: string;
}

export const PreferencesSettings: React.FC<PreferencesSettingsProps> = ({ userId }) => {
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [applicationPrefs, setApplicationPrefs] = useState<ApplicationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'application'>('notifications');

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const preferencesService = getPreferencesService();
      const prefs = await preferencesService.getPreferences(userId);
      setNotificationPrefs(prefs.notifications);
      setApplicationPrefs(prefs.application);
    } catch (error) {
      logger.error({ error }, 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!notificationPrefs) return;

    try {
      setIsSaving(true);
      const preferencesService = getPreferencesService();
      await preferencesService.updateNotificationPreferences(userId, notificationPrefs);
      logger.info('Notification preferences saved');
      alert('Notification preferences saved successfully!');
    } catch (error) {
      logger.error({ error }, 'Failed to save notification preferences');
      alert('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApplication = async () => {
    if (!applicationPrefs) return;

    try {
      setIsSaving(true);
      const preferencesService = getPreferencesService();
      await preferencesService.updateApplicationPreferences(userId, applicationPrefs);
      logger.info('Application preferences saved');
      alert('Application preferences saved successfully!');
    } catch (error) {
      logger.error({ error }, 'Failed to save application preferences');
      alert('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPreferences = async () => {
    if (!confirm('Reset all preferences to defaults? This cannot be undone.')) {
      return;
    }

    try {
      setIsSaving(true);
      const preferencesService = getPreferencesService();
      await preferencesService.resetPreferences(userId);
      await loadPreferences();
      logger.info('Preferences reset to defaults');
      alert('Preferences reset successfully!');
    } catch (error) {
      logger.error({ error }, 'Failed to reset preferences');
      alert('Failed to reset preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading preferences..." />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'notifications'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Bell className="inline h-5 w-5 mr-2" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('application')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'application'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Settings className="inline h-5 w-5 mr-2" />
          Application
        </button>
      </div>

      {/* Notification Settings */}
      {activeTab === 'notifications' && notificationPrefs && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h3>

          {/* Email Notifications */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Email Notifications
            </h4>
            <div className="space-y-3">
              {Object.entries(notificationPrefs.email).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        email: { ...notificationPrefs.email, [key]: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Push Notifications */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </h4>
            <div className="space-y-3">
              {Object.entries(notificationPrefs.push).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        push: { ...notificationPrefs.push, [key]: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Reminder Timing */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Interview Reminders
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPrefs.reminderTiming.hours24}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      reminderTiming: { ...notificationPrefs.reminderTiming, hours24: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">24 hours before</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPrefs.reminderTiming.hours1}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      reminderTiming: { ...notificationPrefs.reminderTiming, hours1: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">1 hour before</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPrefs.reminderTiming.minutes15}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      reminderTiming: { ...notificationPrefs.reminderTiming, minutes15: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">15 minutes before</span>
              </label>
            </div>
          </div>

          <Button onClick={handleSaveNotifications} disabled={isSaving} size="lg">
            {isSaving ? 'Saving...' : 'Save Notification Settings'}
          </Button>
        </Card>
      )}

      {/* Application Settings */}
      {activeTab === 'application' && applicationPrefs && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Application Settings</h3>

          <div className="space-y-6">
            {/* Theme */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Moon className="inline h-4 w-4 mr-2" />
                Theme
              </label>
              <select
                value={applicationPrefs.theme}
                onChange={(e) =>
                  setApplicationPrefs({ ...applicationPrefs, theme: e.target.value as any })
                }
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-2" />
                Language
              </label>
              <select
                value={applicationPrefs.language}
                onChange={(e) =>
                  setApplicationPrefs({ ...applicationPrefs, language: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-2" />
                Timezone
              </label>
              <input
                type="text"
                value={applicationPrefs.timezone}
                onChange={(e) =>
                  setApplicationPrefs({ ...applicationPrefs, timezone: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Default Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Default Interview Duration (minutes)
              </label>
              <select
                value={applicationPrefs.defaultDuration}
                onChange={(e) =>
                  setApplicationPrefs({ ...applicationPrefs, defaultDuration: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSaveApplication} disabled={isSaving} size="lg">
              {isSaving ? 'Saving...' : 'Save Application Settings'}
            </Button>
            <Button
              onClick={handleResetPreferences}
              disabled={isSaving}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
