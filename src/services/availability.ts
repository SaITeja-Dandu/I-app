/**
 * @file services/availability.ts
 * @description Service for managing interviewer availability schedules
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { createLogger } from '../utils/logger';
import { FIRESTORE_PATHS } from '../utils/constants';

const logger = createLogger('availability-service');

export interface AvailabilitySlot {
  id: string;
  interviewerId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // Format: "HH:mm" (e.g., "09:00")
  endTime: string; // Format: "HH:mm" (e.g., "17:00")
  timezone: string; // IANA timezone (e.g., "America/New_York")
  isRecurring: boolean; // If true, repeats every week
  specificDate?: Date; // For one-time slots (overrides dayOfWeek)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface DayAvailability {
  dayOfWeek: number;
  slots: TimeSlot[];
}

export class AvailabilityService {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
    logger.info('AvailabilityService initialized');
  }

  /**
   * Add or update an availability slot
   */
  async setAvailabilitySlot(slot: Omit<AvailabilitySlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const slotId = this.generateSlotId(slot);
      const slotRef = doc(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.AVAILABILITY}/${slotId}`
      );

      const existingSlot = await getDoc(slotRef);
      const now = new Date();

      const slotData: AvailabilitySlot = {
        ...slot,
        id: slotId,
        createdAt: existingSlot.exists() ? existingSlot.data().createdAt.toDate() : now,
        updatedAt: now,
        specificDate: slot.specificDate || undefined,
      };

      await setDoc(slotRef, {
        ...slotData,
        createdAt: Timestamp.fromDate(slotData.createdAt),
        updatedAt: Timestamp.fromDate(slotData.updatedAt),
        specificDate: slotData.specificDate ? Timestamp.fromDate(slotData.specificDate) : null,
      });

      logger.info({ slotId, interviewerId: slot.interviewerId }, 'Availability slot saved');
      return slotId;
    } catch (error) {
      logger.error({ error, slot }, 'Failed to save availability slot');
      throw new Error('Failed to save availability slot');
    }
  }

  /**
   * Get all availability slots for an interviewer
   */
  async getInterviewerAvailability(interviewerId: string): Promise<AvailabilitySlot[]> {
    try {
      const availabilityRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.AVAILABILITY}`
      );

      const q = query(
        availabilityRef,
        where('interviewerId', '==', interviewerId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const slots: AvailabilitySlot[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          interviewerId: data.interviewerId,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          timezone: data.timezone,
          isRecurring: data.isRecurring,
          specificDate: data.specificDate?.toDate(),
          isActive: data.isActive,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
      });

      logger.info({ interviewerId, count: slots.length }, 'Fetched availability slots');
      return slots;
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to get availability');
      throw new Error('Failed to fetch availability');
    }
  }

  /**
   * Delete an availability slot
   */
  async deleteAvailabilitySlot(slotId: string): Promise<void> {
    try {
      const slotRef = doc(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/${FIRESTORE_PATHS.AVAILABILITY}/${slotId}`
      );

      await deleteDoc(slotRef);
      logger.info({ slotId }, 'Availability slot deleted');
    } catch (error) {
      logger.error({ error, slotId }, 'Failed to delete availability slot');
      throw new Error('Failed to delete availability slot');
    }
  }

  /**
   * Check if an interviewer is available at a specific time
   */
  async isAvailableAt(
    interviewerId: string,
    dateTime: Date,
    durationMinutes: number
  ): Promise<boolean> {
    try {
      const slots = await this.getInterviewerAvailability(interviewerId);
      const dayOfWeek = dateTime.getDay();
      const timeStr = this.formatTime(dateTime);
      const endTime = new Date(dateTime.getTime() + durationMinutes * 60000);
      const endTimeStr = this.formatTime(endTime);

      // Check recurring slots for that day of week
      const recurringSlots = slots.filter(
        (slot) => slot.isRecurring && slot.dayOfWeek === dayOfWeek
      );

      for (const slot of recurringSlots) {
        if (this.isTimeInRange(timeStr, endTimeStr, slot.startTime, slot.endTime)) {
          return true;
        }
      }

      // Check specific date slots
      const specificSlots = slots.filter((slot) => {
        if (!slot.specificDate) return false;
        const slotDate = new Date(slot.specificDate);
        return (
          slotDate.getFullYear() === dateTime.getFullYear() &&
          slotDate.getMonth() === dateTime.getMonth() &&
          slotDate.getDate() === dateTime.getDate()
        );
      });

      for (const slot of specificSlots) {
        if (this.isTimeInRange(timeStr, endTimeStr, slot.startTime, slot.endTime)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error({ error, interviewerId, dateTime }, 'Failed to check availability');
      return false;
    }
  }

  /**
   * Get available time slots for an interviewer on a specific date
   */
  async getAvailableSlotsForDate(
    interviewerId: string,
    date: Date,
    durationMinutes: number
  ): Promise<TimeSlot[]> {
    try {
      const slots = await this.getInterviewerAvailability(interviewerId);
      const dayOfWeek = date.getDay();
      const availableSlots: TimeSlot[] = [];

      // Get all slots for this day (recurring + specific)
      const daySlots = slots.filter((slot) => {
        if (slot.isRecurring && slot.dayOfWeek === dayOfWeek) return true;
        if (slot.specificDate) {
          const slotDate = new Date(slot.specificDate);
          return (
            slotDate.getFullYear() === date.getFullYear() &&
            slotDate.getMonth() === date.getMonth() &&
            slotDate.getDate() === date.getDate()
          );
        }
        return false;
      });

      // Generate available time slots (e.g., every 30 minutes)
      for (const slot of daySlots) {
        const slots = this.generateTimeSlots(
          slot.startTime,
          slot.endTime,
          durationMinutes
        );
        availableSlots.push(...slots);
      }

      logger.info(
        { interviewerId, date, count: availableSlots.length },
        'Generated available time slots'
      );
      return availableSlots;
    } catch (error) {
      logger.error({ error, interviewerId, date }, 'Failed to get available slots');
      return [];
    }
  }

  /**
   * Set weekly schedule (bulk operation)
   */
  async setWeeklySchedule(
    interviewerId: string,
    schedule: DayAvailability[],
    timezone: string
  ): Promise<void> {
    try {
      // Delete existing recurring slots
      const existingSlots = await this.getInterviewerAvailability(interviewerId);
      const recurringSlots = existingSlots.filter((slot) => slot.isRecurring);

      for (const slot of recurringSlots) {
        await this.deleteAvailabilitySlot(slot.id);
      }

      // Create new recurring slots
      for (const day of schedule) {
        for (const timeSlot of day.slots) {
          await this.setAvailabilitySlot({
            interviewerId,
            dayOfWeek: day.dayOfWeek,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            timezone,
            isRecurring: true,
            isActive: true,
          });
        }
      }

      logger.info({ interviewerId, daysCount: schedule.length }, 'Weekly schedule updated');
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to set weekly schedule');
      throw new Error('Failed to update weekly schedule');
    }
  }

  /**
   * Helper: Generate slot ID based on slot properties
   */
  private generateSlotId(slot: Partial<AvailabilitySlot>): string {
    if (slot.specificDate) {
      const dateStr = slot.specificDate.toISOString().split('T')[0];
      return `${slot.interviewerId}_${dateStr}_${slot.startTime}_${slot.endTime}`;
    }
    return `${slot.interviewerId}_day${slot.dayOfWeek}_${slot.startTime}_${slot.endTime}`;
  }

  /**
   * Helper: Format Date to HH:mm string
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Helper: Check if a time range fits within availability
   */
  private isTimeInRange(
    startTime: string,
    endTime: string,
    slotStart: string,
    slotEnd: string
  ): boolean {
    return startTime >= slotStart && endTime <= slotEnd;
  }

  /**
   * Helper: Generate time slots within a range
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes + durationMinutes <= endMinutes) {
      const slotStart = this.minutesToTime(currentMinutes);
      const slotEnd = this.minutesToTime(currentMinutes + durationMinutes);

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
      });

      currentMinutes += durationMinutes; // Move to next slot
    }

    return slots;
  }

  /**
   * Helper: Convert minutes since midnight to HH:mm format
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

// Singleton instance
let availabilityService: AvailabilityService | null = null;

export const initializeAvailabilityService = (db: Firestore): void => {
  availabilityService = new AvailabilityService(db);
};

export const getAvailabilityService = (): AvailabilityService => {
  if (!availabilityService) {
    throw new Error(
      'AvailabilityService not initialized. Call initializeAvailabilityService first.'
    );
  }
  return availabilityService;
};
