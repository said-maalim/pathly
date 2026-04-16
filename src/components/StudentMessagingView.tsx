/**
 * StudentMessagingView
 * Full-page messaging view for students.
 *
 * - Left panel: inbox list (messages from DSO)
 * - Right panel: selected thread detail + reply form, or "New Message" compose form
 *
 * Uses the Pathly inline-style design system (#f4f5f7 bg, DM Sans, white cards).
 */

import { useState } from 'react';
import { useStudentMessages } from '../hooks/useMessages';
import { sendMessage } from '../services/messaging.service';
import type { MessageRecord } from '../services/messaging.service';
import { toast } from 'sonner';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function senderLabel(msg: MessageRecord): string {
  if (msg.sender?.full_name) return msg.sender.full_name;
  if (msg.sender_role === 'dso' || msg.sender_role === 'admin') return 'DSO Office';
  return 'Unknown';
}

function senderInitials(msg: MessageRecord): string {
  const name = senderLabel(msg);
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface StudentMessagingViewProps {
  onBack: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StudentMessagingView({ onBack }: StudentMessagingViewProps) {
  const { inbox, sent, loading, error, refresh, markRead, unreadCount } = useStudentMessages();

  const [selectedMsg, setSelectedMsg] = useState<MessageRecord | null>(null);
  const [activePanel, setActivePanel] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);

  // Compose new message
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectMessage = (msg: MessageRecord) => {
    setSelectedMsg(msg);
    setReplyBody('');
    if (msg.status !== 'read') markRead(msg.id);
  };

  const handleReply = async () => {
    if (!selectedMsg || !replyBody.trim()) return;
    try {
      setReplying(true);
      await sendMessage({
        subject: selectedMsg.subject.startsWith('Re:')
          ? selectedMsg.subject
          : `Re: ${selectedMsg.subject}`,
        bodyText: replyBody.trim(),
        recipientType: 'school',
        parentId: selectedMsg.id,
        threadId: selectedMsg.thread_id,
      });
      setReplyBody('');
      toast.success('Reply sent to your DSO');
      await refresh();
    } catch (err) {
      toast.error('Failed to send reply', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setReplying(false);
    }
  };

  const handleSendNew = async () => {
    if (!composeSubject.trim() || !composeBody.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }
    try {
      setSending(true);
      await sendMessage({
        subject: composeSubject.trim(),
        bodyText: composeBody.trim(),
        recipientType: 'school',
      });
      setComposeSubject('');
      setComposeBody('');
      toast.success('Message sent to your DSO');
      setActivePanel('sent');
      await refresh();
    } catch (err) {
      toast.error('Failed to send message', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setSending(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const avatarColors: Record<string, string> = {
    dso: '#2563eb', admin: '#7c3aed', student: '#16a34a',
  };
  const getAvatarColor = (role: string) => avatarColors[role] ?? '#6b7280';

  const messages = activePanel === 'inbox' ? inbox : sent;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f4f5f7', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M10 4L6 8l4 4"/></svg>
          Back
        </button>
        <div style={{ width: '1px', height: '20px', background: '#e5e7eb' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="#1d4ed8" strokeWidth="1.5" width="14" height="14"><path d="M2 3h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 0l6 5 6-5"/></svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Messaging</span>
          {unreadCount > 0 && (
            <span style={{ background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '10px' }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={() => { setActivePanel('compose'); setSelectedMsg(null); }}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M8 3v10M3 8h10"/></svg>
          New Message
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', background: '#f4f5f7', gap: '0' }}>

        {/* Left: message list */}
        <div style={{ width: '320px', flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 12px' }}>
            {(['inbox', 'sent'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActivePanel(tab); setSelectedMsg(null); }}
                style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', borderBottom: activePanel === tab ? '2px solid #2563eb' : '2px solid transparent', color: activePanel === tab ? '#2563eb' : '#6b7280', marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {tab === 'inbox' ? 'Inbox' : 'Sent'}
                {tab === 'inbox' && unreadCount > 0 && (
                  <span style={{ background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 600, padding: '0 5px', borderRadius: '8px', lineHeight: '16px' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Message list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Loading messages…</div>
            ) : error ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#ef4444', fontSize: '13px' }}>{error}</div>
            ) : messages.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" width="36" height="36"><path d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8l9 0 9 0"/></svg>
                {activePanel === 'inbox' ? 'No messages yet' : 'Nothing sent yet'}
              </div>
            ) : (
              messages.map(msg => {
                const isSelected = selectedMsg?.id === msg.id;
                const isUnread   = msg.status !== 'read' && activePanel === 'inbox';
                return (
                  <button
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%', padding: '12px 14px', border: 'none', borderBottom: '1px solid #f3f4f6', background: isSelected ? '#eff6ff' : isUnread ? '#fafbff' : '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent' }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: getAvatarColor(msg.sender_role), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                      {senderInitials(msg)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: isUnread ? 600 : 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {senderLabel(msg)}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{formatRelativeDate(msg.created_at)}</span>
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: isUnread ? 600 : 400, color: isUnread ? '#111827' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                        {msg.subject}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.body}
                      </div>
                    </div>
                    {isUnread && (
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: '6px' }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: detail / compose */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {activePanel === 'compose' ? (
            /* ── New Message Compose ── */
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px' }}>
              <div style={{ marginBottom: '18px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>New Message to DSO</h2>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Your message will be sent to the International Student Services office.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Subject *</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={e => setComposeSubject(e.target.value)}
                    placeholder="e.g. Question about my OPT application"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13.5px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                    onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Message *</label>
                  <textarea
                    value={composeBody}
                    onChange={e => setComposeBody(e.target.value)}
                    placeholder="Write your message here…"
                    rows={8}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13.5px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                    onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                    onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button
                    onClick={handleSendNew}
                    disabled={sending}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '6px', background: sending ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: 500, cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit' }}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M1 8l14-6-5 14-3-5-6-3z"/></svg>
                    {sending ? 'Sending…' : 'Send Message'}
                  </button>
                  <button
                    onClick={() => { setComposeSubject(''); setComposeBody(''); setActivePanel('inbox'); }}
                    style={{ padding: '9px 16px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f4f5f7', color: '#374151', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

          ) : selectedMsg ? (
            /* ── Message Thread Detail ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Subject bar */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>{selectedMsg.subject}</h2>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    {new Date(selectedMsg.created_at).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 500, background: selectedMsg.status === 'read' ? '#dcfce7' : '#dbeafe', color: selectedMsg.status === 'read' ? '#166534' : '#1d4ed8' }}>
                  {selectedMsg.status === 'read' ? 'Read' : 'New'}
                </span>
              </div>

              {/* Message body */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: getAvatarColor(selectedMsg.sender_role), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                    {senderInitials(selectedMsg)}
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>{senderLabel(selectedMsg)}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{selectedMsg.sender?.email ?? 'DSO Office'}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(selectedMsg.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {selectedMsg.body}
                </p>
              </div>

              {/* Reply form */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M13 5H6L2 9l4 4v-3h7V5z"/></svg>
                  Reply to DSO
                </div>
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder="Type your reply here…"
                  rows={4}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13.5px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, marginBottom: '12px' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyBody.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '6px', background: replying || !replyBody.trim() ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: replying || !replyBody.trim() ? 'default' : 'pointer', fontFamily: 'inherit' }}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M1 8l14-6-5 14-3-5-6-3z"/></svg>
                    {replying ? 'Sending…' : 'Send Reply'}
                  </button>
                  <button
                    onClick={() => setReplyBody('')}
                    style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f4f5f7', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

          ) : (
            /* ── Empty state ── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: '12px', paddingTop: '80px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.4" width="32" height="32"><path d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8l9 0 9 0"/></svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>Select a message to read</div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>Or compose a new message to your DSO</div>
              </div>
              <button
                onClick={() => setActivePanel('compose')}
                style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M8 3v10M3 8h10"/></svg>
                Message your DSO
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
