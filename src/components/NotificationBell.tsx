/**
 * @file components/NotificationBell.tsx
 * @description Notification bell component with dropdown for viewing notifications
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Notification } from '../types';
import { NotificationService } from '../services/notifications';
import { getFirebaseInstances } from '../services/firebase';

interface NotificationBellProps {
  userId: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Subscribe to notifications
  useEffect(() => {
    const { db } = getFirebaseInstances();
    const notificationService = new NotificationService(db);
    
    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      (updatedNotifications: Notification[]) => {
        setNotifications(updatedNotifications);
        setUnreadCount(updatedNotifications.filter((n: Notification) => !n.read).length);
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { db } = getFirebaseInstances();
      const notificationService = new NotificationService(db);
      await notificationService.markAsRead(userId, notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { db } = getFirebaseInstances();
      const notificationService = new NotificationService(db);
      const unreadNotifications = notifications.filter(n => !n.read);
      
      await Promise.all(
        unreadNotifications.map(n => notificationService.markAsRead(userId, n.id))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate to action URL if present
    if (notification.actionUrl) {
      // TODO: Add navigation logic based on actionUrl
      console.log('Navigate to:', notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: Notification['type']): string => {
    switch (type) {
      case 'booking_request':
        return '📨';
      case 'booking_accepted':
        return '✅';
      case 'booking_confirmed':
        return '🎉';
      case 'booking_cancelled':
        return '❌';
      case 'reminder_24h':
      case 'reminder_1h':
        return '⏰';
      case 'interview_starting':
        return '🚀';
      case 'interview_completed':
        return '🏆';
      case 'rating_request':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notifications"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-4 sm:right-0 sm:left-auto mt-2 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base sm:text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-white/90 text-xs sm:text-sm hover:text-white underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs sm:text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <span className="text-4xl sm:text-5xl mb-3 block">🔕</span>
                <p className="font-medium text-sm sm:text-base">No notifications</p>
                <p className="text-xs sm:text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      w-full p-3 sm:p-4 text-left hover:bg-gray-50 transition-all duration-200
                      ${!notification.read ? 'bg-blue-50/50' : ''}
                    `}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      {/* Icon */}
                      <div className="text-xl sm:text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.createdAt)}
                          </span>
                          {notification.actionUrl && (
                            <span className="text-xs text-blue-600 font-medium">
                              View →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 sm:p-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to notifications page
                  console.log('View all notifications');
                }}
                className="w-full text-center text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
