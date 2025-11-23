/**
 * @file services/preferences.ts
 * @description Service for managing user notification and application preferences
 */

import { Firestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { createLogger } from '../utils/logger';

const logger = createLogger('preferences-service');

export interface NotificationPreferences {
  email: {
    bookingConfirmation: boolean;
    bookingReminder: boolean;
    bookingCancellation: boolean;
    reviewReceived: boolean;
    paymentConfirmation: boolean;
    promotions: boolean;
  };
  push: {
    bookingConfirmation: boolean;
    bookingReminder: boolean;
    bookingCancellation: boolean;
    reviewReceived: boolean;
    paymentConfirmation: boolean;
  };
  reminderTiming: {
    hours24: boolean;
    hours1: boolean;
    minutes15: boolean;
  };
}

export interface ApplicationPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
  defaultDuration: number;
  defaultSpecialization?: string;
}

export interface UserPreferences {
  userId: string;
  notifications: NotificationPreferences;
  application: ApplicationPreferences;
  updatedAt: Date;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: {
    bookingConfirmation: true,
    bookingReminder: true,
    bookingCancellation: true,
    reviewReceived: true,
    paymentConfirmation: true,
    promotions: false,
  },
  push: {
    bookingConfirmation: true,
    bookingReminder: true,
    bookingCancellation: true,
    reviewReceived: false,
    paymentConfirmation: true,
  },
  reminderTiming: {
    hours24: true,
    hours1: true,
    minutes15: true,
  },
};

const DEFAULT_APPLICATION_PREFERENCES: ApplicationPreferences = {
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  theme: 'auto',
  defaultDuration: 45,
};

class PreferencesService {
  private db: Firestore;
  private initialized: boolean = false;

  constructor(db: Firestore) {
    this.db = db;
    this.initialized = true;
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    if (!this.initialized) {
      throw new Error('PreferencesService not initialized');
    }

    try {
      const prefsRef = doc(this.db, 'user_preferences', userId);
      const snapshot = await getDoc(prefsRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          userId,
          notifications: data.notifications || DEFAULT_NOTIFICATION_PREFERENCES,
          application: data.application || DEFAULT_APPLICATION_PREFERENCES,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }

      // Return defaults if not found
      return {
        userId,
        notifications: DEFAULT_NOTIFICATION_PREFERENCES,
        application: DEFAULT_APPLICATION_PREFERENCES,
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get preferences');
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('PreferencesService not initialized');
    }

    try {
      const prefsRef = doc(this.db, 'user_preferences', userId);
      const current = await this.getPreferences(userId);

      const updated: UserPreferences = {
        ...current,
        notifications: {
          ...current.notifications,
          ...preferences,
          email: { ...current.notifications.email, ...(preferences.email || {}) },
          push: { ...current.notifications.push, ...(preferences.push || {}) },
          reminderTiming: { ...current.notifications.reminderTiming, ...(preferences.reminderTiming || {}) },
        },
        updatedAt: new Date(),
      };

      await setDoc(prefsRef, updated, { merge: true });
      logger.info({ userId }, 'Notification preferences updated');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to update notification preferences');
      throw error;
    }
  }

  /**
   * Update application preferences
   */
  async updateApplicationPreferences(
    userId: string,
    preferences: Partial<ApplicationPreferences>
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('PreferencesService not initialized');
    }

    try {
      const prefsRef = doc(this.db, 'user_preferences', userId);
      const current = await this.getPreferences(userId);

      const updated: UserPreferences = {
        ...current,
        application: {
          ...current.application,
          ...preferences,
        },
        updatedAt: new Date(),
      };

      await setDoc(prefsRef, updated, { merge: true });
      logger.info({ userId }, 'Application preferences updated');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to update application preferences');
      throw error;
    }
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(userId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('PreferencesService not initialized');
    }

    try {
      const prefsRef = doc(this.db, 'user_preferences', userId);
      
      const defaults: UserPreferences = {
        userId,
        notifications: DEFAULT_NOTIFICATION_PREFERENCES,
        application: DEFAULT_APPLICATION_PREFERENCES,
        updatedAt: new Date(),
      };

      await setDoc(prefsRef, defaults);
      logger.info({ userId }, 'Preferences reset to defaults');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to reset preferences');
      throw error;
    }
  }

  /**
   * Check if user should receive notification based on preferences
   */
  async shouldNotify(
    userId: string,
    channel: 'email' | 'push',
    type: string
  ): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(userId);
      const channelPrefs = prefs.notifications[channel];
      return (channelPrefs as any)[type] !== undefined ? (channelPrefs as any)[type] : true;
    } catch (error) {
      logger.error({ error, userId, channel, type }, 'Failed to check notification preference');
      return true; // Default to sending if error
    }
  }
}

let preferencesServiceInstance: PreferencesService | null = null;

export function initializePreferencesService(db: Firestore): PreferencesService {
  if (!preferencesServiceInstance) {
    preferencesServiceInstance = new PreferencesService(db);
    logger.info('PreferencesService initialized');
  }
  return preferencesServiceInstance;
}

export function getPreferencesService(): PreferencesService {
  if (!preferencesServiceInstance) {
    throw new Error('PreferencesService not initialized. Call initializePreferencesService first.');
  }
  return preferencesServiceInstance;
}
