/**
 * @file services/reminder-scheduler.ts
 * @description Background service for scheduling and sending interview reminders
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  type Firestore 
} from 'firebase/firestore';
import { createLogger } from '../utils/logger';
import { NotificationService } from './notifications';
import type { InterviewBooking } from '../types';

const logger = createLogger('reminder-scheduler');

const FIRESTORE_PATHS = {
  APP_ID: 'interview-navigator',
  BOOKINGS: 'bookings',
};

export class ReminderScheduler {
  private db: Firestore;
  private notificationService: NotificationService;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  constructor(firestore: Firestore) {
    this.db = firestore;
    this.notificationService = new NotificationService(firestore);
    logger.info('ReminderScheduler initialized');
  }

  /**
   * Start the reminder scheduler
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('ReminderScheduler already running');
      return;
    }

    logger.info('Starting ReminderScheduler');
    
    // Run immediately on start
    this.checkAndSendReminders();

    // Then run every CHECK_INTERVAL
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop the reminder scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('ReminderScheduler stopped');
    }
  }

  /**
   * Check for bookings that need reminders and send them
   */
  private async checkAndSendReminders(): Promise<void> {
    try {
      logger.info('Checking for bookings that need reminders');

      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const bookingsRef = collection(
        this.db, 
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.BOOKINGS}`
      );

      // Query for confirmed bookings only (simpler query without index requirement)
      // We'll filter by date range in memory
      const confirmedQuery = query(
        bookingsRef,
        where('status', '==', 'confirmed')
      );

      const snapshot = await getDocs(confirmedQuery);
      
      if (snapshot.empty) {
        logger.info('No confirmed bookings found');
        return;
      }

      logger.info(`Found ${snapshot.size} confirmed bookings to check`);

      const remindersToSend: Array<{
        booking: InterviewBooking;
        type: '24h' | '1h';
      }> = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Skip if no scheduled date
        if (!data.scheduledDateTime) {
          return;
        }

        const booking: InterviewBooking = {
          id: doc.id,
          candidateId: data.candidateId,
          candidateName: data.candidateName,
          candidateEmail: data.candidateEmail,
          interviewerId: data.interviewerId,
          interviewerName: data.interviewerName,
          interviewerEmail: data.interviewerEmail,
          type: data.type,
          scheduledDateTime: data.scheduledDateTime.toDate(),
          durationMinutes: data.durationMinutes,
          timezone: data.timezone,
          role: data.role,
          skills: data.skills,
          focusAreas: data.focusAreas,
          difficulty: data.difficulty,
          status: data.status,
          meetingLink: data.meetingLink,
          meetingId: data.meetingId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          reminderSentAt: data.reminderSentAt?.toDate(),
        };

        const scheduledTime = booking.scheduledDateTime.getTime();
        const nowTime = now.getTime();

        // Filter: Only check bookings within next 25 hours
        if (scheduledTime < nowTime || scheduledTime > twentyFiveHoursFromNow.getTime()) {
          return;
        }

        // Check if we need to send 24h reminder
        // Send if between 24-25 hours away and hasn't been sent yet
        const is24hWindow = 
          scheduledTime >= twentyFourHoursFromNow.getTime() &&
          scheduledTime <= twentyFiveHoursFromNow.getTime() &&
          !booking.reminderSentAt;

        if (is24hWindow) {
          logger.info(`Booking ${booking.id} needs 24h reminder`);
          remindersToSend.push({ booking, type: '24h' });
        }

        // Check if we need to send 1h reminder
        // Send if between 1-2 hours away and reminderSentAt is more than 2 hours ago
        const is1hWindow = 
          scheduledTime >= oneHourFromNow.getTime() &&
          scheduledTime <= twoHoursFromNow.getTime() &&
          (!booking.reminderSentAt || 
           (nowTime - booking.reminderSentAt.getTime()) > 2 * 60 * 60 * 1000);

        if (is1hWindow) {
          logger.info(`Booking ${booking.id} needs 1h reminder`);
          remindersToSend.push({ booking, type: '1h' });
        }
      });

      // Send all reminders
      if (remindersToSend.length > 0) {
        logger.info(`Sending ${remindersToSend.length} reminders`);
        
        await Promise.all(
          remindersToSend.map(({ booking, type }) => 
            this.sendReminder(booking, type)
          )
        );

        logger.info(`Successfully sent ${remindersToSend.length} reminders`);
      } else {
        logger.info('No reminders need to be sent at this time');
      }
    } catch (error) {
      logger.error({ error }, 'Error checking and sending reminders');
    }
  }

  /**
   * Send a reminder notification for a booking
   */
  private async sendReminder(
    booking: InterviewBooking, 
    type: '24h' | '1h'
  ): Promise<void> {
    try {
      logger.info({ bookingId: booking.id, type }, 'Sending reminder');

      if (type === '24h') {
        // Send 24h reminder to both candidate and interviewer
        await Promise.all([
          this.notificationService.sendReminder24h(
            booking.candidateId,
            booking.id,
            booking.scheduledDateTime
          ),
          this.notificationService.sendReminder24h(
            booking.interviewerId || '',
            booking.id,
            booking.scheduledDateTime
          ),
        ]);
      } else {
        // Send 1h reminder to both candidate and interviewer
        await Promise.all([
          this.notificationService.sendReminder1h(
            booking.candidateId,
            booking.id,
            booking.scheduledDateTime
          ),
          this.notificationService.sendReminder1h(
            booking.interviewerId || '',
            booking.id,
            booking.scheduledDateTime
          ),
        ]);
      }

      logger.info({ bookingId: booking.id, type }, 'Reminder sent successfully');
    } catch (error) {
      logger.error({ error, bookingId: booking.id, type }, 'Error sending reminder');
    }
  }

  /**
   * Manually trigger reminder check (useful for testing)
   */
  async triggerCheck(): Promise<void> {
    logger.info('Manual reminder check triggered');
    await this.checkAndSendReminders();
  }
}

let schedulerInstance: ReminderScheduler | null = null;

/**
 * Initialize the reminder scheduler singleton
 */
export function initializeReminderScheduler(firestore: Firestore): ReminderScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new ReminderScheduler(firestore);
    schedulerInstance.start();
  }
  return schedulerInstance;
}

/**
 * Get the reminder scheduler instance
 */
export function getReminderScheduler(): ReminderScheduler {
  if (!schedulerInstance) {
    throw new Error('ReminderScheduler not initialized');
  }
  return schedulerInstance;
}

/**
 * Stop the reminder scheduler
 */
export function stopReminderScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance = null;
  }
}
