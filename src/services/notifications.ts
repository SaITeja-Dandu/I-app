/**
 * @file services/notifications.ts
 * @description Service for managing in-app notifications
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import { createLogger } from '../utils/logger';
import type { Notification } from '../types';

const logger = createLogger('notification-service');

const FIRESTORE_PATHS = {
  APP_ID: 'interview-navigator',
  USERS: 'users',
  NOTIFICATIONS: 'notifications',
} as const;

export class NotificationService {
  private db: Firestore;

  constructor(firestore: Firestore) {
    this.db = firestore;
    logger.info('NotificationService initialized');
  }

  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    notificationData: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<string> {
    try {
      const notificationsRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.USERS}/${userId}/${FIRESTORE_PATHS.NOTIFICATIONS}`
      );
      const notificationDoc = doc(notificationsRef);
      const notificationId = notificationDoc.id;

      const notification: Notification = {
        id: notificationId,
        userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        actionUrl: notificationData.actionUrl,
        relatedBookingId: notificationData.relatedBookingId,
        relatedUserId: notificationData.relatedUserId,
        read: false,
        createdAt: new Date(),
        expiresAt: notificationData.expiresAt,
      };

      await setDoc(notificationDoc, {
        ...notification,
        createdAt: Timestamp.fromDate(notification.createdAt),
        expiresAt: notification.expiresAt ? Timestamp.fromDate(notification.expiresAt) : null,
      });

      logger.info({ notificationId, userId, type: notification.type }, 'Notification created');
      return notificationId;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to create notification');
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limitCount?: number
  ): Promise<Notification[]> {
    try {
      const notificationsRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.USERS}/${userId}/${FIRESTORE_PATHS.NOTIFICATIONS}`
      );

      let q = query(notificationsRef, orderBy('createdAt', 'desc'));

      if (unreadOnly) {
        q = query(q, where('read', '==', false));
      }

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs
        .map(doc => this.convertFirestoreNotification(doc.data()))
        .filter(notif => {
          // Filter out expired notifications
          if (notif.expiresAt && notif.expiresAt < new Date()) {
            return false;
          }
          return true;
        });

      logger.info({ userId, count: notifications.length, unreadOnly }, 'Retrieved user notifications');
      return notifications;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get user notifications');
      throw new Error('Failed to get user notifications');
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notificationsRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.USERS}/${userId}/${FIRESTORE_PATHS.NOTIFICATIONS}`
      );

      const q = query(notificationsRef, where('read', '==', false));
      const snapshot = await getDocs(q);

      // Filter out expired
      const validNotifications = snapshot.docs.filter(doc => {
        const data = doc.data();
        if (data.expiresAt) {
          const expiresAt = data.expiresAt.toDate();
          return expiresAt > new Date();
        }
        return true;
      });

      return validNotifications.length;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get unread count');
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.USERS}/${userId}/${FIRESTORE_PATHS.NOTIFICATIONS}`,
        notificationId
      );

      await updateDoc(notificationRef, {
        read: true,
      });

      logger.info({ userId, notificationId }, 'Notification marked as read');
    } catch (error) {
      logger.error({ error, userId, notificationId }, 'Failed to mark notification as read');
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.USERS}/${userId}/${FIRESTORE_PATHS.NOTIFICATIONS}`
      );

      const q = query(notificationsRef, where('read', '==', false));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return;
      }

      const batch = writeBatch(this.db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
      logger.info({ userId, count: snapshot.docs.length }, 'All notifications marked as read');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to mark all notifications as read');
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.USERS}/${userId}/${FIRESTORE_PATHS.NOTIFICATIONS}`,
        notificationId
      );

      await deleteDoc(notificationRef);
      logger.info({ userId, notificationId }, 'Notification deleted');
    } catch (error) {
      logger.error({ error, userId, notificationId }, 'Failed to delete notification');
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Delete all read notifications
   */
  async deleteReadNotifications(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.USERS}/${userId}/${FIRESTORE_PATHS.NOTIFICATIONS}`
      );

      const q = query(notificationsRef, where('read', '==', true));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return;
      }

      const batch = writeBatch(this.db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.info({ userId, count: snapshot.docs.length }, 'Read notifications deleted');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to delete read notifications');
      throw new Error('Failed to delete read notifications');
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  subscribeToNotifications(
    userId: string,
    onUpdate: (notifications: Notification[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const notificationsRef = collection(
      this.db,
      `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.USERS}/${userId}/${FIRESTORE_PATHS.NOTIFICATIONS}`
    );

    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs
          .map(doc => this.convertFirestoreNotification(doc.data()))
          .filter(notif => {
            // Filter out expired notifications
            if (notif.expiresAt && notif.expiresAt < new Date()) {
              return false;
            }
            return true;
          });

        onUpdate(notifications);
      },
      (error) => {
        logger.error({ error, userId }, 'Error in notifications subscription');
        if (onError) onError(error as Error);
      }
    );
  }

  /**
   * Helper method to send common notification types
   */
  async sendBookingRequestNotification(
    interviewerId: string,
    bookingId: string,
    candidateName: string,
    scheduledDateTime: Date
  ): Promise<void> {
    await this.createNotification(interviewerId, {
      type: 'booking_request',
      title: '🎯 New Interview Request',
      message: `${candidateName} has requested an interview on ${scheduledDateTime.toLocaleDateString()} at ${scheduledDateTime.toLocaleTimeString()}`,
      actionUrl: `/bookings/${bookingId}`,
      relatedBookingId: bookingId,
    });
  }

  async sendBookingAcceptedNotification(
    candidateId: string,
    bookingId: string,
    interviewerName: string,
    scheduledDateTime: Date
  ): Promise<void> {
    await this.createNotification(candidateId, {
      type: 'booking_accepted',
      title: '✅ Interview Accepted!',
      message: `${interviewerName} has accepted your interview request for ${scheduledDateTime.toLocaleDateString()}`,
      actionUrl: `/bookings/${bookingId}`,
      relatedBookingId: bookingId,
    });
  }

  async sendBookingConfirmedNotification(
    userId: string,
    bookingId: string,
    scheduledDateTime: Date
  ): Promise<void> {
    await this.createNotification(userId, {
      type: 'booking_confirmed',
      title: '📅 Interview Confirmed',
      message: `Your interview is confirmed for ${scheduledDateTime.toLocaleDateString()} at ${scheduledDateTime.toLocaleTimeString()}`,
      actionUrl: `/bookings/${bookingId}`,
      relatedBookingId: bookingId,
    });
  }

  async sendBookingCancelledNotification(
    userId: string,
    bookingId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<void> {
    await this.createNotification(userId, {
      type: 'booking_cancelled',
      title: '❌ Interview Cancelled',
      message: reason 
        ? `Interview cancelled by ${cancelledBy}. Reason: ${reason}`
        : `Interview cancelled by ${cancelledBy}`,
      actionUrl: `/bookings/${bookingId}`,
      relatedBookingId: bookingId,
    });
  }

  async sendReminder24h(
    userId: string,
    bookingId: string,
    scheduledDateTime: Date
  ): Promise<void> {
    await this.createNotification(userId, {
      type: 'reminder_24h',
      title: '⏰ Interview Tomorrow',
      message: `Reminder: You have an interview tomorrow at ${scheduledDateTime.toLocaleTimeString()}`,
      actionUrl: `/bookings/${bookingId}`,
      relatedBookingId: bookingId,
      expiresAt: scheduledDateTime,
    });
  }

  async sendReminder1h(
    userId: string,
    bookingId: string,
    scheduledDateTime: Date
  ): Promise<void> {
    await this.createNotification(userId, {
      type: 'reminder_1h',
      title: '🔔 Interview Starting Soon',
      message: `Your interview starts in 1 hour at ${scheduledDateTime.toLocaleTimeString()}`,
      actionUrl: `/bookings/${bookingId}`,
      relatedBookingId: bookingId,
      expiresAt: scheduledDateTime,
    });
  }

  async sendInterviewCompletedNotification(
    userId: string,
    bookingId: string
  ): Promise<void> {
    await this.createNotification(userId, {
      type: 'interview_completed',
      title: '🎉 Interview Completed',
      message: 'Your interview has been completed. View your feedback and results.',
      actionUrl: `/bookings/${bookingId}`,
      relatedBookingId: bookingId,
    });
  }

  async sendRatingRequestNotification(
    candidateId: string,
    bookingId: string,
    interviewerName: string
  ): Promise<void> {
    await this.createNotification(candidateId, {
      type: 'rating_request',
      title: '⭐ Rate Your Interview',
      message: `How was your interview with ${interviewerName}? Share your feedback!`,
      actionUrl: `/bookings/${bookingId}/rate`,
      relatedBookingId: bookingId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    });
  }

  /**
   * Convert Firestore document data to Notification
   */
  private convertFirestoreNotification(data: any): Notification {
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate(),
    };
  }
}

// Singleton instance
let notificationServiceInstance: NotificationService | null = null;

export const initializeNotificationService = (firestore: Firestore): void => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService(firestore);
  }
};

export const getNotificationService = (): NotificationService => {
  if (!notificationServiceInstance) {
    throw new Error('NotificationService not initialized');
  }
  return notificationServiceInstance;
};
