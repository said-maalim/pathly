/**
 * Messaging Service (Frontend)
 * All API calls for the DSO ↔ Student messaging feature.
 */

import { apiGet, apiPost, apiPut } from '../lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttachmentData {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface MessageRecord {
  id: string;
  school_id: string;
  thread_id: string;
  parent_id?: string;
  sender_id: string;
  sender_role: 'student' | 'dso' | 'admin';
  recipient_id?: string;
  recipient_type: 'individual' | 'bulk' | 'school';
  bulk_filter?: Record<string, unknown>;
  subject: string;
  body: string;
  status: 'sent' | 'delivered' | 'read';
  read_at?: string;
  template_ref?: string;
  created_at: string;
  updated_at: string;
  attachments?: AttachmentData[];
  // Joined from users table
  sender?: { id: string; full_name: string; email: string; role: string };
  recipient?: { id: string; full_name: string; email: string; role: string };
}

export interface SendMessagePayload {
  /** user_id of the recipient (for individual DSO → student messages) */
  recipientId?: string;
  subject: string;
  /** Body field is named bodyText to avoid conflict with built-in Body type */
  bodyText: string;
  templateRef?: string;
  recipientType?: 'individual' | 'bulk' | 'school';
  bulkFilter?: Record<string, unknown>;
  /** For threading: ID of the parent message */
  parentId?: string;
  /** For threading: share the same thread_id as the root message */
  threadId?: string;
  /** File attachments */
  attachments?: AttachmentData[];
}

interface MessagesResponse {
  messages: MessageRecord[];
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/** Send a message (DSO → student or student → DSO) */
export async function sendMessage(payload: SendMessagePayload): Promise<MessageRecord> {
  const res = await apiPost<{ success: boolean; message: MessageRecord }>('/messaging/send', payload);
  return res.message;
}

/** Student inbox: messages addressed to the current student */
export async function getStudentInbox(): Promise<MessageRecord[]> {
  const res = await apiGet<MessagesResponse>('/messaging/inbox');
  return res.messages ?? [];
}

/** DSO inbox: all messages sent by students within the school */
export async function getDSOInbox(): Promise<MessageRecord[]> {
  const res = await apiGet<MessagesResponse>('/messaging/dso-inbox');
  return res.messages ?? [];
}

/** Outbox: messages sent by the current user */
export async function getSentMessages(): Promise<MessageRecord[]> {
  const res = await apiGet<MessagesResponse>('/messaging/sent');
  return res.messages ?? [];
}

/** Full conversation thread (all messages with the same thread_id) */
export async function getMessageThread(threadId: string): Promise<MessageRecord[]> {
  const res = await apiGet<MessagesResponse>(`/messaging/thread/${threadId}`);
  return res.messages ?? [];
}

/** Mark a message as read */
export async function markMessageAsRead(messageId: string): Promise<void> {
  await apiPut<{ success: boolean }>(`/messaging/${messageId}/read`, {});
}

/** Unread count (role-aware — DSO gets school count, student gets personal count) */
export async function getUnreadCount(): Promise<number> {
  const res = await apiGet<{ count: number }>('/messaging/unread-count');
  return res.count ?? 0;
}
