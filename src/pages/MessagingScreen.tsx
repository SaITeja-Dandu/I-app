/**
 * @file pages/MessagingScreen.tsx
 * @description Screen for messaging between candidates and interviewers
 */

import React, { useState } from 'react';
import { ConversationList } from '../components/ConversationList';
import { MessageThread } from '../components/MessageThread';
import type { UserProfile } from '../types';
import type { Conversation } from '../services/messaging';
import { createLogger } from '../utils/logger';

const logger = createLogger('messaging-screen');

interface MessagingScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
}

export const MessagingScreen: React.FC<MessagingScreenProps> = ({
  currentUser,
  onBack,
}) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Set page title when component mounts
  React.useEffect(() => {
    document.title = 'Messages - Intervuu';
    return () => {
      document.title = 'Intervuu';
    };
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    logger.debug({ conversationId: conversation.id }, 'Conversation selected');
    setSelectedConversation(conversation);
  };

  const getOtherUserName = (conversation: Conversation) => {
    return currentUser.userType === 'candidate'
      ? conversation.interviewerName
      : conversation.candidateName;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              logger.info({}, 'Back to dashboard clicked');
              onBack();
            }}
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2 transition-colors font-semibold"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">💬</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600">Chat with {currentUser.userType === 'candidate' ? 'interviewers' : 'candidates'}</p>
            </div>
          </div>
        </div>

        {/* Messages Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <ConversationList
              currentUser={currentUser}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?.id}
            />
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-1">
            {selectedConversation ? (
              <MessageThread
                conversationId={selectedConversation.id}
                currentUser={currentUser}
                otherUserName={getOtherUserName(selectedConversation)}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg font-semibold">Select a conversation</p>
                  <p className="text-sm mt-2">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
