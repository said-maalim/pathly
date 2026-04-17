/**
 * Message Repository
 * Data access layer for the messages table.
 */

import { getSupabaseAdmin } from '../config/database.ts';
import type { Message, CreateMessageData } from '../types/database.types.ts';

class MessageRepository {
  private get supabase() { return getSupabaseAdmin(); }

  // ── Select helpers ──────────────────────────────────────────────────────────

  private baseSelect = `
    *,
    sender:users!sender_id(id, full_name, email, role),
    recipient:users!recipient_id(id, full_name, email, role)
  `;

  // ── Finders ─────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Message | null> {
    const { data, error } = await this.supabase
      .from('messages')
      .select(this.baseSelect)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch message: ${error.message}`);
    }
    return data as Message;
  }

  /** Student inbox: messages personally addressed to this user */
  async findInboxForUser(userId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select(this.baseSelect)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch inbox: ${error.message}`);
    return (data || []) as Message[];
  }

  /**
   * DSO inbox: latest student message per thread within a school.
   * Returns one entry per thread_id (the most recent student message),
   * so each conversation appears only once.
   */
  async findSchoolInbox(schoolId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select(this.baseSelect)
      .eq('school_id', schoolId)
      .eq('sender_role', 'student')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch school inbox: ${error.message}`);

    // Deduplicate: one row per thread_id (already sorted latest-first)
    const seen = new Set<string>();
    const deduped: Message[] = [];
    for (const msg of (data || []) as Message[]) {
      if (!seen.has(msg.thread_id)) {
        seen.add(msg.thread_id);
        deduped.push(msg);
      }
    }
    return deduped;
  }

  /** Outbox: messages sent by a user (any role) */
  async findSentByUser(userId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select(this.baseSelect)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch sent messages: ${error.message}`);
    return (data || []) as Message[];
  }

  /** Full thread: all messages sharing a thread_id, oldest first */
  async findThread(threadId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select(this.baseSelect)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch thread: ${error.message}`);
    return (data || []) as Message[];
  }

  // ── Mutations ───────────────────────────────────────────────────────────────

  async create(data: CreateMessageData): Promise<Message> {
    const { data: msg, error } = await this.supabase
      .from('messages')
      .insert(data)
      .select(this.baseSelect)
      .single();

    if (error) throw new Error(`Failed to create message: ${error.message}`);
    return msg as Message;
  }

  async markAsRead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .update({ status: 'read', read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to mark as read: ${error.message}`);
  }

  // ── Counts ──────────────────────────────────────────────────────────────────

  async getUnreadCountForUser(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .neq('status', 'read');

    if (error) throw new Error(`Failed to get unread count: ${error.message}`);
    return count ?? 0;
  }

  async getUnreadCountForSchool(schoolId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('sender_role', 'student')
      .neq('status', 'read');

    if (error) throw new Error(`Failed to get school unread count: ${error.message}`);
    return count ?? 0;
  }
}

export const messageRepository = new MessageRepository();
