/**
 * Messaging Service
 * Business logic for DSO ↔ Student two-way messaging.
 */

import { messageRepository } from '../../repositories/message.repository.ts';
import type { CreateMessageData } from '../../types/database.types.ts';

export class MessagingService {

  /**
   * Send a message.
   * - DSO → student: recipientId = student's user_id, recipientType = 'individual'
   * - DSO → bulk:    recipientId = undefined, recipientType = 'bulk', bulkFilter set
   * - Student → DSO: recipientId = undefined, recipientType = 'school'
   */
  async sendMessage(
    senderId: string,
    schoolId: string,
    senderRole: string,
    data: {
      recipientId?: string;
      subject: string;
      body: string;
      templateRef?: string;
      recipientType?: 'individual' | 'bulk' | 'school';
      bulkFilter?: Record<string, unknown>;
      parentId?: string;
      threadId?: string;
    }
  ) {
    // Determine recipient type from context if not explicitly provided
    let recipientType = data.recipientType;
    if (!recipientType) {
      if (data.recipientId) recipientType = 'individual';
      else if (senderRole === 'student') recipientType = 'school';
      else recipientType = 'bulk';
    }

    // Re-use the parent's thread_id for replies; generate a new one for root messages
    const threadId = data.threadId ?? crypto.randomUUID();

    const msgData: CreateMessageData = {
      school_id: schoolId,
      thread_id: threadId,
      parent_id: data.parentId,
      sender_id: senderId,
      sender_role: senderRole,
      recipient_id: data.recipientId,
      recipient_type: recipientType,
      bulk_filter: data.bulkFilter,
      subject: data.subject,
      body: data.body,
      template_ref: data.templateRef,
    };

    return await messageRepository.create(msgData);
  }

  /** Student inbox — messages where recipient_id = userId */
  async getStudentInbox(userId: string) {
    return await messageRepository.findInboxForUser(userId);
  }

  /** DSO inbox — all student messages within the school */
  async getDSOInbox(schoolId: string) {
    return await messageRepository.findSchoolInbox(schoolId);
  }

  /** Outbox — messages sent by this user */
  async getSentMessages(userId: string) {
    return await messageRepository.findSentByUser(userId);
  }

  /** Full conversation thread */
  async getThread(threadId: string) {
    return await messageRepository.findThread(threadId);
  }

  async markAsRead(messageId: string) {
    return await messageRepository.markAsRead(messageId);
  }

  async getUnreadCount(userId: string, role: string, schoolId: string) {
    if (role === 'dso' || role === 'admin') {
      return await messageRepository.getUnreadCountForSchool(schoolId);
    }
    return await messageRepository.getUnreadCountForUser(userId);
  }
}

export const messagingService = new MessagingService();
