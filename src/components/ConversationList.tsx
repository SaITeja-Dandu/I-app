/**
 * @file components/ConversationList.tsx
 * @description Component for displaying list of conversations
 */

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { getMessagingService, type Conversation } from '../services/messaging';
import { createLogger } from '../utils/logger';
import { MessageCircle, Search } from 'lucide-react';
import type { UserProfile } from '../types';

const logger = createLogger('conversation-list');

interface ConversationListProps {
  currentUser: UserProfile;
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  currentUser,
  onSelectConversation,
  selectedConversationId,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();

    // Subscribe to real-time updates
    const messagingService = getMessagingService();
    const unsubscribe = messagingService.subscribeToConversations(
      currentUser.id,
      currentUser.userType || 'candidate',
      (updatedConversations) => {
        setConversations(updatedConversations);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser.id]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const messagingService = getMessagingService();
      const convs = await messagingService.getUserConversations(
        currentUser.id,
        currentUser.userType || 'candidate'
      );
      setConversations(convs);
    } catch (error) {
      logger.error({ error }, 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const getOtherUserName = (conversation: Conversation) => {
    return currentUser.userType === 'candidate'
      ? conversation.interviewerName
      : conversation.candidateName;
  };

  const getUnreadCount = (conversation: Conversation) => {
    return currentUser.userType === 'candidate'
      ? conversation.unreadCount.candidate
      : conversation.unreadCount.interviewer;
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherName = getOtherUserName(conv).toLowerCase();
    return otherName.includes(searchQuery.toLowerCase());
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading conversations..." />
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Messages</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-600 font-semibold">No conversations yet</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery
                ? 'No conversations match your search'
                : 'Start chatting with interviewers'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => {
              const otherName = getOtherUserName(conversation);
              const unreadCount = getUnreadCount(conversation);
              const isSelected = conversation.id === selectedConversationId;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`
                    w-full p-4 hover:bg-gray-50 transition-colors text-left
                    ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {otherName.charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {otherName}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <Badge
                            label={unreadCount.toString()}
                            variant="primary"
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
