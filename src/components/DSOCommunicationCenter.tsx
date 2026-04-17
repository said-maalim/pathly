/**
 * DSOCommunicationCenter — Messaging page for the DSO portal.
 *
 * Tabs:
 *  Inbox    — incoming messages from students (real data via useDSOMessages)
 *  Compose  — write & send messages to students (calls real API when schoolId provided)
 *  Templates — manage email templates (local state; DB persistence can be added later)
 *  History  — outbox of messages sent by this DSO (real data via useDSOMessages)
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { ComposeEmailPanel } from './communication/ComposeEmailPanel';
import type { StudentOption } from './communication/ComposeEmailPanel';
import { EmailTemplatesPanel } from './communication/EmailTemplatesPanel';
import type { EmailTemplate } from './communication/EmailTemplatesPanel';
import { MessageHistoryPanel } from './communication/MessageHistoryPanel';
import type { Message } from './communication/MessageHistoryPanel';
import { useDSOMessages } from '../hooks/useMessages';
import { sendMessage } from '../services/messaging.service';

// ── Initial template data (local-only until DB persistence is added) ──────────

const INITIAL_TEMPLATES: EmailTemplate[] = [
  { id: 'TMPL-001', name: 'Visa Renewal Reminder',        category: 'Compliance', subject: 'Important: Your F-1 Visa is Expiring Soon',             body: `Dear [Student Name],\n\nThis is a friendly reminder that your F-1 visa will expire on [Expiration Date]...\n\nBest regards,\n[DSO Name]`, lastUsed: '2024-11-20', usageCount: 45 },
  { id: 'TMPL-002', name: 'Document Upload Request',       category: 'Documents',  subject: 'Action Required: Please Upload [Document Type]',          body: `Dear [Student Name],\n\nWe need you to upload the following document...\n\nBest regards,\n[DSO Name]`, lastUsed: '2024-11-21', usageCount: 78 },
  { id: 'TMPL-003', name: 'Request Approved',              category: 'Requests',   subject: 'Good News: Your [Request Type] Has Been Approved',         body: `Dear [Student Name],\n\nCongratulations! Your [Request Type] has been approved.\n\nBest regards,\n[DSO Name]`, lastUsed: '2024-11-22', usageCount: 156 },
  { id: 'TMPL-004', name: 'Request Needs More Information',category: 'Requests',   subject: 'Additional Information Required: [Request Type]',          body: `Dear [Student Name],\n\nWe need additional information to process your [Request Type]...\n\nBest regards,\n[DSO Name]`, usageCount: 92 },
  { id: 'TMPL-005', name: 'Compliance Check Reminder',     category: 'Compliance', subject: 'Reminder: Upcoming Compliance Check',                      body: `Dear [Student Name],\n\nThis is a reminder that your compliance check is scheduled for [Check Date]...\n\nBest regards,\n[DSO Name]`, usageCount: 34 },
  { id: 'TMPL-006', name: 'CPT Approved',                  category: 'Employment', subject: 'CPT Authorization Approved - Action Required',              body: `Dear [Student Name],\n\nYour CPT application has been approved...\n\nBest regards,\n[DSO Name]`, usageCount: 89 },
  { id: 'TMPL-007', name: 'Travel Signature Completed',    category: 'Travel',     subject: 'Your I-20 Travel Signature is Ready',                      body: `Dear [Student Name],\n\nYour I-20 has been signed for travel...\n\nBest regards,\n[DSO Name]`, usageCount: 112 },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface DSOCommunicationCenterProps {
  onBack: () => void;
  onLogout?: () => void;
  userName?: string;
  /** School ID of the logged-in DSO — enables real API calls */
  schoolId?: string;
  /** List of students in this school, used in the compose dropdown */
  students?: StudentOption[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DSOCommunicationCenter({
  onBack,
  onLogout,
  userName = 'DSO Admin',
  schoolId,
  students = [],
}: DSOCommunicationCenterProps) {

  const [selectedTab, setSelectedTab] = useState<'inbox' | 'compose' | 'templates' | 'history'>('inbox');
  const [templates, setTemplates] = useState<EmailTemplate[]>(INITIAL_TEMPLATES);

  // ── Real data from API ───────────────────────────────────────────────────────
  const { inbox, sent, loading, error, refresh, unreadCount } = useDSOMessages();

  // Pre-fill compose form when DSO hits "Reply" from inbox
  const [replyPreFill, setReplyPreFill] = useState<{
    recipientId: string;
    recipientEmail: string;
    subject: string;
    threadId: string;
    parentId: string;
  } | null>(null);

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const templatesUsedRecently = templates.filter(t => t.lastUsed).length;
  const sentMessages = sent;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleMessageSent = async (msg: {
    recipientId?: string;
    recipientEmail: string;
    subject: string;
    body: string;
    templateName?: string;
    recipientType?: 'individual' | 'bulk' | 'school';
  }) => {
    if (schoolId) {
      // Real API call
      await sendMessage({
        recipientId: msg.recipientId,
        subject: msg.subject,
        bodyText: msg.body,
        templateRef: msg.templateName,
        recipientType: msg.recipientType ?? 'individual',
        ...(replyPreFill ? { threadId: replyPreFill.threadId, parentId: replyPreFill.parentId } : {}),
      });
      toast.success('Message sent successfully');
      setReplyPreFill(null);
      await refresh();
    }
    // History is now driven by real sent data from useDSOMessages
  };

  const handleReply = (inboxMsg: { id: string; thread_id: string; sender_id: string; sender?: { id: string; full_name: string; email: string } | null; subject: string }) => {
    setReplyPreFill({
      recipientId: inboxMsg.sender?.id ?? inboxMsg.sender_id,
      recipientEmail: inboxMsg.sender?.email ?? '',
      subject: inboxMsg.subject.startsWith('Re:') ? inboxMsg.subject : `Re: ${inboxMsg.subject}`,
      threadId: inboxMsg.thread_id,
      parentId: inboxMsg.id,
    });
    setSelectedTab('compose');
  };

  const handleUseTemplate = (_template: EmailTemplate) => { setSelectedTab('compose'); };

  const handleCreateTemplate = (data: Omit<EmailTemplate, 'id' | 'usageCount'>) => {
    setTemplates([...templates, { id: `TMPL-${String(templates.length + 1).padStart(3, '0')}`, ...data, usageCount: 0 }]);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  // ── Map real sent messages to the legacy Message shape for MessageHistoryPanel ─
  const historyMessages: Message[] = sentMessages.map(m => ({
    id: m.id,
    recipient: m.recipient?.full_name ?? (m.recipient_type === 'bulk' ? 'Bulk Send' : 'DSO Office'),
    recipientEmail: m.recipient?.email ?? '',
    subject: m.subject,
    body: m.body,
    sentDate: m.created_at.split('T')[0],
    sentBy: userName,
    status: (m.status.charAt(0).toUpperCase() + m.status.slice(1)) as Message['status'],
    template: m.template_ref,
  }));

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '22px', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="#16a34a" strokeWidth="1.6" width="20" height="20"><path d="M2 4h16v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm0 0l8 6 8-6"/></svg>
        </div>
        <div>
          <h1 style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.3px', margin: 0 }}>Messaging</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Send messages, manage templates, and respond to student inquiries.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { num: unreadCount, sub: 'Needs attention', label: 'Unread Messages', iconColor: '#fee2e2', iconStroke: '#dc2626',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M3 4h16v10a1 1 0 01-1 1H9l-4 3v-3H4a1 1 0 01-1-1V4z"/></svg> },
          { num: templates.length, sub: `${templatesUsedRecently} used recently`, label: 'Templates Available', iconColor: '#dbeafe', iconStroke: '#1d4ed8',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><rect x="4" y="2" width="14" height="18" rx="2"/><path d="M8 7h6M8 11h6M8 15h4"/></svg> },
          { num: sentMessages.length, sub: 'This session', label: 'Messages Sent', iconColor: '#dcfce7', iconStroke: '#15803d',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M2 11l18-8-7 18-4-7-7-3z"/></svg> },
          { num: inbox.length, sub: 'From students', label: 'Student Messages', iconColor: '#fef3c7', iconStroke: '#b45309',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="11" cy="8" r="3"/><path d="M5 19c0-4 12-4 12 0"/></svg> },
        ].map(({ num, sub, label, iconColor, iconStroke, icon }, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconColor, color: iconStroke }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: '11.5px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', marginTop: '6px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '3px', gap: '2px', alignSelf: 'flex-start' }}>
        {([
          { key: 'inbox'     as const, label: `Inbox${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          { key: 'compose'   as const, label: 'Compose' },
          { key: 'templates' as const, label: `Templates (${templates.length})` },
          { key: 'history'   as const, label: `History (${historyMessages.length})` },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            style={{
              padding: '7px 22px', borderRadius: '6px',
              fontSize: '13.5px', fontWeight: 500, cursor: 'pointer',
              border: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
              background: selectedTab === tab.key ? '#1a1f2e' : 'transparent',
              color: selectedTab === tab.key ? '#fff' : '#6b7280',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}
          >
            {tab.key === 'inbox'     && <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" width="13" height="13"><path d="M2 3h10v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 0l5 4 5-4"/></svg>}
            {tab.key === 'compose'   && <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" width="13" height="13"><path d="M1 7l12-5-4 12-3-5-5-2z"/></svg>}
            {tab.key === 'templates' && <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" width="13" height="13"><rect x="2" y="1" width="10" height="12" rx="1.5"/><path d="M5 4h4M5 7h4M5 10h2"/></svg>}
            {tab.key === 'history'   && <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" width="13" height="13"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/></svg>}
            {tab.label}
            {tab.key === 'inbox' && unreadCount > 0 && (
              <span style={{ background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '0 5px', borderRadius: '8px', lineHeight: '16px' }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {selectedTab === 'inbox' && (
        <DSOInboxPanel
          messages={inbox}
          loading={loading}
          error={error}
          onRefresh={refresh}
          onReply={handleReply}
        />
      )}
      {selectedTab === 'compose' && (
        <ComposeEmailPanel
          templates={templates}
          userName={userName}
          students={students}
          replyPreFill={replyPreFill}
          onSendAsync={schoolId ? async (payload) => {
            await handleMessageSent({
              recipientId: payload.recipientId,
              recipientEmail: payload.recipientEmail,
              subject: payload.subject,
              body: payload.body,
              templateName: payload.templateName,
              recipientType: payload.recipientType,
            });
          } : undefined}
          onMessageSent={() => { /* handled by onSendAsync */ }}
        />
      )}
      {selectedTab === 'templates' && (
        <EmailTemplatesPanel
          templates={templates}
          onUseTemplate={handleUseTemplate}
          onCreateTemplate={handleCreateTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />
      )}
      {selectedTab === 'history' && (
        <MessageHistoryPanel messages={historyMessages} />
      )}
    </div>
  );
}

// ── DSO Inbox Panel ───────────────────────────────────────────────────────────

interface InboxMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  sender?: { id: string; full_name: string; email: string } | null;
}

interface DSOInboxPanelProps {
  messages: InboxMessage[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onReply: (msg: InboxMessage) => void;
}

function DSOInboxPanel({ messages, loading, error, onRefresh, onReply }: DSOInboxPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
        Loading messages…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#ef4444', fontSize: '13.5px' }}>{error}</div>
        <button onClick={onRefresh} style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f4f5f7', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Retry
        </button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#f4f5f7', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.4" width="28" height="28"><path d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8"/></svg>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>No student messages yet</div>
        <div style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '280px', lineHeight: 1.5 }}>
          When students send messages or ask questions, they will appear here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {messages.map(msg => {
        const isExpanded = expanded === msg.id;
        const isUnread   = msg.status !== 'read';
        const senderName = msg.sender?.full_name ?? 'Student';
        const initials   = senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

        return (
          <div
            key={msg.id}
            style={{ background: '#fff', border: `1px solid ${isUnread ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '10px', overflow: 'hidden', borderLeft: `3px solid ${isUnread ? '#2563eb' : '#e5e7eb'}` }}
          >
            {/* Header row */}
            <button
              onClick={() => setExpanded(isExpanded ? null : msg.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: isUnread ? 600 : 500, color: '#111827' }}>{senderName}</span>
                  {msg.sender?.email && <span style={{ fontSize: '12px', color: '#9ca3af' }}>&lt;{msg.sender.email}&gt;</span>}
                  {isUnread && <span style={{ display: 'inline-flex', padding: '1px 8px', borderRadius: '10px', background: '#dbeafe', color: '#1d4ed8', fontSize: '11px', fontWeight: 600 }}>New</span>}
                </div>
                <div style={{ fontSize: '13px', color: isUnread ? '#111827' : '#374151', fontWeight: isUnread ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                  {msg.subject}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0, marginRight: '8px' }}>
                {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <svg viewBox="0 0 12 12" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="12" height="12" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                <path d="M2 4l4 4 4-4"/>
              </svg>
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '14px 0 16px' }}>
                  {msg.body}
                </p>
                <button
                  onClick={() => onReply(msg)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M1 8l14-6-5 14-3-5-6-3z"/></svg>
                  Reply to Student
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
