/**
 * @file services/video-conferencing.ts
 * @description Service for generating and managing video conference links
 * Supports multiple providers: Daily.co, Zoom, Google Meet
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('VideoConferencingService');

export type VideoProvider = 'daily' | 'zoom' | 'google-meet' | 'custom';

export interface VideoMeetingLink {
  url: string;
  provider: VideoProvider;
  roomName?: string;
  meetingId?: string;
  password?: string;
  expiresAt?: Date;
}

export interface CreateMeetingOptions {
  provider: VideoProvider;
  bookingId: string;
  scheduledTime: Date;
  duration: number; // in minutes
  participantNames: string[];
  customUrl?: string; // For custom provider
}

/**
 * Video Conferencing Service
 * Generates meeting links for different video providers
 */
export class VideoConferencingService {
  private dailyApiKey: string | null = null;
  private zoomApiKey: string | null = null;
  private googleMeetApiKey: string | null = null;

  constructor() {
    // Load API keys from environment variables
    this.dailyApiKey = import.meta.env.VITE_DAILY_API_KEY || null;
    this.zoomApiKey = import.meta.env.VITE_ZOOM_API_KEY || null;
    this.googleMeetApiKey = import.meta.env.VITE_GOOGLE_MEET_API_KEY || null;
  }

  /**
   * Create a video meeting link
   */
  async createMeeting(options: CreateMeetingOptions): Promise<VideoMeetingLink> {
    try {
      switch (options.provider) {
        case 'daily':
          return await this.createDailyMeeting(options);
        case 'zoom':
          return await this.createZoomMeeting(options);
        case 'google-meet':
          return await this.createGoogleMeetMeeting(options);
        case 'custom':
          return this.createCustomMeeting(options);
        default:
          throw new Error(`Unsupported video provider: ${options.provider}`);
      }
    } catch (error) {
      logger.error({ error, options }, 'Failed to create video meeting');
      throw error;
    }
  }

  /**
   * Create Daily.co meeting room
   * Daily.co provides free video conferencing with simple API
   */
  private async createDailyMeeting(options: CreateMeetingOptions): Promise<VideoMeetingLink> {
    const roomName = this.generateRoomName(options.bookingId);

    if (!this.dailyApiKey) {
      // Fallback: Use public Daily.co room (no API key required)
      logger.warn('Daily.co API key not configured, using public room');
      return {
        url: `https://interview-navigator.daily.co/${roomName}`,
        provider: 'daily',
        roomName,
      };
    }

    try {
      // Create private Daily.co room with API
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.dailyApiKey}`,
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'private',
          properties: {
            enable_screenshare: true,
            enable_chat: true,
            enable_knocking: true,
            enable_prejoin_ui: true,
            start_video_off: false,
            start_audio_off: false,
            exp: Math.floor(options.scheduledTime.getTime() / 1000) + (options.duration * 60) + 3600, // Expires 1 hour after meeting ends
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Daily.co API error: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info({ roomName, url: data.url }, 'Created Daily.co meeting');
      
      return {
        url: data.url,
        provider: 'daily',
        roomName: data.name,
        expiresAt: new Date(data.config.exp * 1000),
      };
    } catch (error) {
      logger.error({ error }, 'Failed to create Daily.co meeting, using fallback');
      // Fallback to public room
      return {
        url: `https://interview-navigator.daily.co/${roomName}`,
        provider: 'daily',
        roomName,
      };
    }
  }

  /**
   * Create Zoom meeting (placeholder - requires OAuth setup)
   */
  private async createZoomMeeting(options: CreateMeetingOptions): Promise<VideoMeetingLink> {
    if (!this.zoomApiKey) {
      logger.warn('Zoom API not configured, using placeholder');
      return {
        url: `https://zoom.us/j/placeholder-${options.bookingId}`,
        provider: 'zoom',
        meetingId: `placeholder-${options.bookingId}`,
      };
    }

    // TODO: Implement actual Zoom API integration
    // Requires Zoom OAuth app setup and access token management
    logger.info('Zoom integration not fully implemented, using placeholder');
    return {
      url: `https://zoom.us/j/placeholder-${options.bookingId}`,
      provider: 'zoom',
      meetingId: `placeholder-${options.bookingId}`,
      password: this.generatePassword(),
    };
  }

  /**
   * Create Google Meet meeting (placeholder - requires Google Calendar API)
   */
  private async createGoogleMeetMeeting(options: CreateMeetingOptions): Promise<VideoMeetingLink> {
    if (!this.googleMeetApiKey) {
      logger.warn('Google Meet API not configured, using placeholder');
      return {
        url: `https://meet.google.com/placeholder-${options.bookingId}`,
        provider: 'google-meet',
        meetingId: `placeholder-${options.bookingId}`,
      };
    }

    // TODO: Implement actual Google Meet API integration
    // Requires Google Calendar API and OAuth setup
    logger.info('Google Meet integration not fully implemented, using placeholder');
    return {
      url: `https://meet.google.com/placeholder-${options.bookingId}`,
      provider: 'google-meet',
      meetingId: `placeholder-${options.bookingId}`,
    };
  }

  /**
   * Create custom meeting link
   */
  private createCustomMeeting(options: CreateMeetingOptions): VideoMeetingLink {
    if (!options.customUrl) {
      throw new Error('Custom URL is required for custom provider');
    }

    logger.info({ url: options.customUrl }, 'Using custom meeting URL');
    
    return {
      url: options.customUrl,
      provider: 'custom',
    };
  }

  /**
   * Delete a Daily.co meeting room
   */
  async deleteDailyRoom(roomName: string): Promise<void> {
    if (!this.dailyApiKey) {
      logger.warn('Daily.co API key not configured, cannot delete room');
      return;
    }

    try {
      const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.dailyApiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete Daily.co room: ${response.status}`);
      }

      logger.info({ roomName }, 'Deleted Daily.co room');
    } catch (error) {
      logger.error({ error, roomName }, 'Failed to delete Daily.co room');
    }
  }

  /**
   * Get available video providers based on configuration
   */
  getAvailableProviders(): VideoProvider[] {
    const providers: VideoProvider[] = ['daily', 'custom']; // Daily.co works without API key
    
    if (this.zoomApiKey) {
      providers.push('zoom');
    }
    
    if (this.googleMeetApiKey) {
      providers.push('google-meet');
    }

    return providers;
  }

  /**
   * Validate video meeting URL
   */
  isValidMeetingUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const validDomains = [
        'daily.co',
        'zoom.us',
        'meet.google.com',
        'teams.microsoft.com',
        'whereby.com',
        'jitsi.org',
      ];

      return validDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  /**
   * Generate room name from booking ID
   */
  private generateRoomName(bookingId: string): string {
    // Create URL-safe room name
    return `interview-${bookingId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  /**
   * Generate random meeting password
   */
  private generatePassword(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Format meeting link for display
   */
  formatMeetingLink(link: VideoMeetingLink): string {
    let formatted = link.url;
    
    if (link.password) {
      formatted += `\nPassword: ${link.password}`;
    }
    
    if (link.meetingId) {
      formatted += `\nMeeting ID: ${link.meetingId}`;
    }

    return formatted;
  }
}

// Singleton instance
let videoServiceInstance: VideoConferencingService | null = null;

export function initializeVideoConferencingService(): void {
  videoServiceInstance = new VideoConferencingService();
  logger.info('Video conferencing service initialized');
}

export function getVideoConferencingService(): VideoConferencingService {
  if (!videoServiceInstance) {
    throw new Error('VideoConferencingService not initialized. Call initializeVideoConferencingService first.');
  }
  return videoServiceInstance;
}
