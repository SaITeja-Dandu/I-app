/**
 * @file components/VideoMeetingInfo.tsx
 * @description Component to display video meeting information and join button
 */

import React, { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Video, Copy, Check, ExternalLink, Calendar, Clock } from 'lucide-react';
import type { InterviewBooking } from '../types';

interface VideoMeetingInfoProps {
  booking: InterviewBooking;
  showJoinButton?: boolean;
  compact?: boolean;
}

export const VideoMeetingInfo: React.FC<VideoMeetingInfoProps> = ({
  booking,
  showJoinButton = true,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!booking.meetingLink) {
    return null;
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(booking.meetingLink!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleJoinMeeting = () => {
    window.open(booking.meetingLink, '_blank', 'noopener,noreferrer');
  };

  const getProviderName = () => {
    switch (booking.videoProvider) {
      case 'daily':
        return 'Daily.co';
      case 'zoom':
        return 'Zoom';
      case 'google-meet':
        return 'Google Meet';
      case 'custom':
        return 'Video Call';
      default:
        return 'Video Call';
    }
  };

  const getProviderIcon = () => {
    switch (booking.videoProvider) {
      case 'daily':
        return '📹';
      case 'zoom':
        return '💼';
      case 'google-meet':
        return '🎥';
      default:
        return '🎬';
    }
  };

  const isUpcoming = () => {
    const now = new Date();
    const scheduledTime = new Date(booking.scheduledDateTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    
    // Show join button 15 minutes before and during the meeting
    return minutesDiff <= 15 && minutesDiff > -booking.durationMinutes;
  };

  const getTimeUntilMeeting = () => {
    const now = new Date();
    const scheduledTime = new Date(booking.scheduledDateTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff < 0) {
      return 'Meeting is in progress';
    } else if (minutesDiff < 60) {
      return `Starts in ${minutesDiff} minutes`;
    } else if (minutesDiff < 1440) {
      const hours = Math.floor(minutesDiff / 60);
      return `Starts in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutesDiff / 1440);
      return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Video className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">{getProviderName()} Meeting</p>
          <p className="text-xs text-blue-700">{getTimeUntilMeeting()}</p>
        </div>
        {showJoinButton && isUpcoming() && (
          <Button onClick={handleJoinMeeting} size="sm" variant="primary">
            Join
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{getProviderIcon()}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Video className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">{getProviderName()} Video Interview</h3>
          </div>

          {/* Meeting Time */}
          <div className="flex items-center gap-4 mb-3 text-sm text-gray-700">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(booking.scheduledDateTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(booking.scheduledDateTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}
              </span>
            </div>
          </div>

          {/* Time Until Meeting */}
          <p className="text-sm font-medium text-blue-700 mb-3">{getTimeUntilMeeting()}</p>

          {/* Meeting Link */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Meeting Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={booking.meetingLink}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Copy link"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Meeting ID and Password */}
          {(booking.meetingId || booking.meetingPassword) && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {booking.meetingId && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Meeting ID</label>
                  <p className="text-sm font-mono bg-white px-3 py-2 rounded border border-gray-300">
                    {booking.meetingId}
                  </p>
                </div>
              )}
              {booking.meetingPassword && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
                  <p className="text-sm font-mono bg-white px-3 py-2 rounded border border-gray-300">
                    {booking.meetingPassword}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Join Button */}
          {showJoinButton && (
            <div>
              {isUpcoming() ? (
                <Button onClick={handleJoinMeeting} size="lg" className="w-full">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Join Video Interview
                </Button>
              ) : (
                <Button onClick={handleJoinMeeting} variant="outline" size="lg" className="w-full">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open Meeting Link
                </Button>
              )}
            </div>
          )}

          {/* Tips */}
          <div className="mt-4 p-3 bg-blue-100/50 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">💡 Interview Tips:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Join 5 minutes early to test your audio and video</li>
              <li>• Ensure you're in a quiet, well-lit environment</li>
              <li>• Have your resume and notes ready</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};
