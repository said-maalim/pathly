/**
 * useMessages
 * React hooks for loading and managing messages in the student and DSO portals.
 * Errors are swallowed with empty-array fallbacks so the UI degrades gracefully
 * if the messaging endpoint has not yet been deployed.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getStudentInbox,
  getDSOInbox,
  getSentMessages,
  markMessageAsRead,
} from '../services/messaging.service';
import type { MessageRecord } from '../services/messaging.service';

// ─── Student hook ─────────────────────────────────────────────────────────────

export function useStudentMessages() {
  const [inbox, setInbox]   = useState<MessageRecord[]>([]);
  const [sent, setSent]     = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [inboxData, sentData] = await Promise.all([
        getStudentInbox(),
        getSentMessages(),
      ]);
      setInbox(inboxData);
      setSent(sentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      // Keep stale data on error rather than wiping it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const markRead = useCallback(async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
      setInbox(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, status: 'read' as const, read_at: new Date().toISOString() }
            : m
        )
      );
    } catch {
      // Silently fail — not critical
    }
  }, []);

  const unreadCount = inbox.filter(m => m.status !== 'read').length;

  return { inbox, sent, loading, error, refresh, markRead, unreadCount };
}

// ─── DSO hook ─────────────────────────────────────────────────────────────────

export function useDSOMessages() {
  const [inbox, setInbox]   = useState<MessageRecord[]>([]);
  const [sent, setSent]     = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [inboxData, sentData] = await Promise.all([
        getDSOInbox(),
        getSentMessages(),
      ]);
      setInbox(inboxData);
      setSent(sentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const unreadCount = inbox.filter(m => m.status !== 'read').length;

  return { inbox, sent, loading, error, refresh, unreadCount };
}
