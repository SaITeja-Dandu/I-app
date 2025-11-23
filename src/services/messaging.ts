/**
 * @file services/messaging.ts
 * @description Service for managing messages between candidates and interviewers
 */

import {
  type Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { createLogger } from '../utils/logger';
import { FIRESTORE_PATHS } from '../utils/constants';

const logger = createLogger('messaging-service');

/**
 * Message between candidate and interviewer
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'candidate' | 'interviewer';
  receiverId: string;
  receiverName: string;
  content: string;
  bookingId?: string; // Optional reference to booking
  read: boolean;
  createdAt: Date;
}

/**
 * Conversation thread between two users
 */
export interface Conversation {
  id: string;
  candidateId: string;
  candidateName: string;
  interviewerId: string;
  interviewerName: string;
  bookingId?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: {
    candidate: number;
    interviewer: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new message
 */
export interface CreateMessageInput {
  conversationId?: string; // If not provided, will create new conversation
  senderId: string;
  senderName: string;
  senderRole: 'candidate' | 'interviewer';
  receiverId: string;
  receiverName: string;
  content: string;
  bookingId?: string;
}

export class MessagingService {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Send a message
   */
  async sendMessage(input: CreateMessageInput): Promise<string> {
    try {
      // Get or create conversation
      let conversationId = input.conversationId;
      if (!conversationId) {
        conversationId = await this.getOrCreateConversation(
          input.senderId,
          input.senderName,
          input.senderRole,
          input.receiverId,
          input.receiverName,
          input.bookingId
        );
      }

      // Create message
      const messageRef = doc(
        collection(
          this.db,
          `artifacts/${FIRESTORE_PATHS.APP_ID}/messages`
        )
      );
      const messageId = messageRef.id;

      const receiverRole = input.senderRole === 'candidate' ? 'interviewer' : 'candidate';

      const message: Omit<Message, 'id'> = {
        conversationId,
        senderId: input.senderId,
        senderName: input.senderName,
        senderRole: input.senderRole,
        receiverId: input.receiverId,
        receiverName: input.receiverName,
        content: input.content,
        bookingId: input.bookingId,
        read: false,
        createdAt: new Date(),
      };

      await setDoc(messageRef, {
        ...message,
        createdAt: Timestamp.fromDate(message.createdAt),
      });

      // Update conversation
      const conversationRef = doc(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/conversations/${conversationId}`
      );
      
      const conversationDoc = await getDoc(conversationRef);
      if (conversationDoc.exists()) {
        const conversation = conversationDoc.data() as any;
        await updateDoc(conversationRef, {
          lastMessage: input.content.substring(0, 100),
          lastMessageAt: Timestamp.now(),
          [`unreadCount.${receiverRole}`]: (conversation.unreadCount?.[receiverRole] || 0) + 1,
          updatedAt: Timestamp.now(),
        });
      }

      logger.info({ messageId, conversationId }, 'Message sent');
      return messageId;
    } catch (error) {
      logger.error({ error }, 'Failed to send message');
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get or create conversation between two users
   */
  private async getOrCreateConversation(
    senderId: string,
    senderName: string,
    senderRole: 'candidate' | 'interviewer',
    receiverId: string,
    receiverName: string,
    bookingId?: string
  ): Promise<string> {
    try {
      const candidateId = senderRole === 'candidate' ? senderId : receiverId;
      const candidateName = senderRole === 'candidate' ? senderName : receiverName;
      const interviewerId = senderRole === 'interviewer' ? senderId : receiverId;
      const interviewerName = senderRole === 'interviewer' ? senderName : receiverName;

      // Check if conversation exists
      const conversationsRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/conversations`
      );
      const q = query(
        conversationsRef,
        where('candidateId', '==', candidateId),
        where('interviewerId', '==', interviewerId)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }

      // Create new conversation
      const conversationRef = doc(conversationsRef);
      const conversationId = conversationRef.id;

      const conversation: Omit<Conversation, 'id'> = {
        candidateId,
        candidateName,
        interviewerId,
        interviewerName,
        bookingId,
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadCount: {
          candidate: 0,
          interviewer: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(conversationRef, {
        ...conversation,
        lastMessageAt: Timestamp.fromDate(conversation.lastMessageAt),
        createdAt: Timestamp.fromDate(conversation.createdAt),
        updatedAt: Timestamp.fromDate(conversation.updatedAt),
      });

      logger.info({ conversationId }, 'Conversation created');
      return conversationId;
    } catch (error) {
      logger.error({ error }, 'Failed to get or create conversation');
      throw new Error('Failed to get or create conversation');
    }
  }

  /**
   * Get conversations for a user
   */
  async getUserConversations(
    userId: string,
    role: 'candidate' | 'interviewer'
  ): Promise<Conversation[]> {
    try {
      const conversationsRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/conversations`
      );
      const fieldName = role === 'candidate' ? 'candidateId' : 'interviewerId';
      const q = query(
        conversationsRef,
        where(fieldName, '==', userId),
        orderBy('lastMessageAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const conversations: Conversation[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          candidateId: data.candidateId,
          candidateName: data.candidateName,
          interviewerId: data.interviewerId,
          interviewerName: data.interviewerName,
          bookingId: data.bookingId,
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt.toDate(),
          unreadCount: data.unreadCount || { candidate: 0, interviewer: 0 },
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      logger.info({ userId, count: conversations.length }, 'Retrieved conversations');
      return conversations;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get conversations');
      throw new Error('Failed to get conversations');
    }
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId: string, limitCount = 50): Promise<Message[]> {
    try {
      const messagesRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/messages`
      );
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const messages: Message[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          receiverId: data.receiverId,
          receiverName: data.receiverName,
          content: data.content,
          bookingId: data.bookingId,
          read: data.read,
          createdAt: data.createdAt.toDate(),
        });
      });

      // Reverse to show oldest first
      messages.reverse();

      logger.info({ conversationId, count: messages.length }, 'Retrieved messages');
      return messages;
    } catch (error) {
      logger.error({ error, conversationId }, 'Failed to get messages');
      throw new Error('Failed to get messages');
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const messagesRef = collection(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/messages`
      );
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('receiverId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = [];

      for (const docSnap of snapshot.docs) {
        batch.push(updateDoc(docSnap.ref, { read: true }));
      }

      await Promise.all(batch);

      // Update conversation unread count
      const conversationRef = doc(
        this.db,
        `artifacts/${FIRESTORE_PATHS.APP_ID}/conversations/${conversationId}`
      );
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversation = conversationDoc.data() as any;
        const candidateId = conversation.candidateId;
        const role = userId === candidateId ? 'candidate' : 'interviewer';
        
        await updateDoc(conversationRef, {
          [`unreadCount.${role}`]: 0,
        });
      }

      logger.info({ conversationId, userId, count: snapshot.size }, 'Messages marked as read');
    } catch (error) {
      logger.error({ error, conversationId }, 'Failed to mark messages as read');
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Subscribe to real-time conversation updates
   */
  subscribeToConversations(
    userId: string,
    role: 'candidate' | 'interviewer',
    callback: (conversations: Conversation[]) => void
  ): Unsubscribe {
    const conversationsRef = collection(
      this.db,
      `artifacts/${FIRESTORE_PATHS.APP_ID}/conversations`
    );
    const fieldName = role === 'candidate' ? 'candidateId' : 'interviewerId';
    const q = query(
      conversationsRef,
      where(fieldName, '==', userId),
      orderBy('lastMessageAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const conversations: Conversation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          candidateId: data.candidateId,
          candidateName: data.candidateName,
          interviewerId: data.interviewerId,
          interviewerName: data.interviewerName,
          bookingId: data.bookingId,
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt.toDate(),
          unreadCount: data.unreadCount || { candidate: 0, interviewer: 0 },
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });
      callback(conversations);
    });
  }

  /**
   * Subscribe to real-time messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): Unsubscribe {
    const messagesRef = collection(
      this.db,
      `artifacts/${FIRESTORE_PATHS.APP_ID}/messages`
    );
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          receiverId: data.receiverId,
          receiverName: data.receiverName,
          content: data.content,
          bookingId: data.bookingId,
          read: data.read,
          createdAt: data.createdAt.toDate(),
        });
      });
      callback(messages);
    });
  }

  /**
   * Get total unread message count for user
   */
  async getUnreadCount(userId: string, role: 'candidate' | 'interviewer'): Promise<number> {
    try {
      const conversations = await this.getUserConversations(userId, role);
      const unreadCount = conversations.reduce((sum, conv) => {
        return sum + (conv.unreadCount[role] || 0);
      }, 0);
      return unreadCount;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get unread count');
      return 0;
    }
  }
}

// Singleton instance
let messagingServiceInstance: MessagingService | null = null;

export const initializeMessagingService = (db: Firestore): void => {
  if (!messagingServiceInstance) {
    messagingServiceInstance = new MessagingService(db);
    logger.info('MessagingService initialized');
  }
};

export const getMessagingService = (): MessagingService => {
  if (!messagingServiceInstance) {
    throw new Error('MessagingService not initialized. Call initializeMessagingService first.');
  }
  return messagingServiceInstance;
};
