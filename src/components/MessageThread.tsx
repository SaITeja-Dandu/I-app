/**
 * @file components/MessageThread.tsx
 * @description Component for displaying and sending messages in a conversation
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { getMessagingService, type Message } from '../services/messaging';
import { createLogger } from '../utils/logger';
import { Send, MessageCircle } from 'lucide-react';
import type { UserProfile } from '../types';

const logger = createLogger('message-thread');

interface MessageThreadProps {
  conversationId: string;
  currentUser: UserProfile;
  otherUserName: string;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversationId,
  currentUser,
  otherUserName,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();

    // Subscribe to real-time updates
    const messagingService = getMessagingService();
    const unsubscribe = messagingService.subscribeToMessages(
      conversationId,
      (updatedMessages) => {
        setMessages(updatedMessages);
        markAsRead();
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const messagingService = getMessagingService();
      const msgs = await messagingService.getMessages(conversationId);
      setMessages(msgs);
    } catch (error) {
      logger.error({ error }, 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const messagingService = getMessagingService();
      await messagingService.markMessagesAsRead(conversationId, currentUser.id);
    } catch (error) {
      logger.error({ error }, 'Failed to mark messages as read');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const messagingService = getMessagingService();
      
      // Get receiver info from first message in thread
      const receiverId = messages[0]?.senderId === currentUser.id 
        ? messages[0]?.receiverId 
        : messages[0]?.senderId;
      const receiverName = messages[0]?.senderId === currentUser.id
        ? messages[0]?.receiverName
        : messages[0]?.senderName;

      await messagingService.sendMessage({
        conversationId,
        senderId: currentUser.id,
        senderName: currentUser.email?.split('@')[0] || 'User',
        senderRole: currentUser.userType || 'candidate',
        receiverId,
        receiverName,
        content: newMessage.trim(),
      });

      setNewMessage('');
    } catch (error) {
      logger.error({ error }, 'Failed to send message');
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading messages..." />
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {otherUserName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{otherUserName}</h3>
            <p className="text-sm text-gray-500">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-600">No messages yet</p>
            <p className="text-sm text-gray-500">Start the conversation below</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwn = message.senderId === currentUser.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`
                        rounded-2xl px-4 py-2 shadow-sm
                        ${
                          isOwn
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }
                      `}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <div
                      className={`
                        flex items-center gap-2 mt-1 text-xs text-gray-500
                        ${isOwn ? 'justify-end' : 'justify-start'}
                      `}
                    >
                      <span>{formatTime(message.createdAt)}</span>
                      {isOwn && message.read && <span>• Read</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="md"
            className="flex items-center gap-2"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
