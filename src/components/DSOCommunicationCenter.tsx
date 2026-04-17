/**
 * DSOCommunicationCenter — Messaging page for the DSO portal.
 *
 * Tabs:
 *  Inbox    — incoming messages from students (real data via useDSOMessages)
 *  Compose  — write & send messages to students (calls real API when schoolId provided)
 *  Templates — manage email templates (local state; DB persistence can be added later)
 *  History  — outbox of messages sent by this DSO (real data via useDSOMessages)
 */

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { ComposeEmailPanel } from './communication/ComposeEmailPanel';
import type { StudentOption } from './communication/ComposeEmailPanel';
import { EmailTemplatesPanel } from './communication/EmailTemplatesPanel';
import type { EmailTemplate } from './communication/EmailTemplatesPanel';
import { MessageHistoryPanel } from './communication/MessageHistoryPanel';
import type { Message } from './communication/MessageHistoryPanel';
import { useDSOMessages } from '../hooks/useMessages';
import { sendMessage, getMessageThread, AttachmentData } from '../services/messaging.service';
import { supabase } from '../lib/supabase';

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
      await sendMessage({
        recipientId: msg.recipientId,
        subject: msg.subject,
        bodyText: msg.body,
        templateRef: msg.templateName,
        recipientType: msg.recipientType ?? 'individual',
      });
      toast.success('Message sent successfully');
      await refresh();
    }
  };

  const handleInlineSend = async (params: {
    recipientId: string;
    subject: string;
    threadId: string;
    parentId: string;
    body: string;
    attachments?: AttachmentData[];
  }) => {
    await sendMessage({
      recipientId: params.recipientId,
      subject: params.subject,
      bodyText: params.body,
      threadId: params.threadId,
      parentId: params.parentId,
      recipientType: 'individual',
      attachments: params.attachments,
    });
    toast.success('Reply sent');
    await refresh();
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
          onInlineSend={handleInlineSend}
          userName={userName}
        />
      )}
      {selectedTab === 'compose' && (
        <ComposeEmailPanel
          templates={templates}
          userName={userName}
          students={students}
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
  attachments?: AttachmentData[];
}

interface ThreadMessage {
  id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  created_at: string;
  sender?: { id: string; full_name: string; email: string } | null;
  attachments?: AttachmentData[];
}

interface DSOInboxPanelProps {
  messages: InboxMessage[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onInlineSend: (params: {
    recipientId: string;
    subject: string;
    threadId: string;
    parentId: string;
    body: string;
    attachments?: AttachmentData[];
  }) => Promise<void>;
  userName: string;
}

function DSOInboxPanel({ messages, loading, error, onRefresh, onInlineSend, userName }: DSOInboxPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, ThreadMessage[]>>({});
  const [threadLoading, setThreadLoading] = useState<Record<string, boolean>>({});
  const [replyBody, setReplyBody] = useState<Record<string, string>>({});
  const [replyAttachments, setReplyAttachments] = useState<Record<string, AttachmentData[]>>({});
  const [replySending, setReplySending] = useState<Record<string, boolean>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputFor, setFileInputFor] = useState<string | null>(null);

  const handleExpand = async (msg: InboxMessage) => {
    if (expanded === msg.id) {
      setExpanded(null);
      return;
    }
    setExpanded(msg.id);
    if (!threads[msg.thread_id]) {
      setThreadLoading(prev => ({ ...prev, [msg.id]: true }));
      try {
        const result = await getMessageThread(msg.thread_id);
        setThreads(prev => ({ ...prev, [msg.thread_id]: result as unknown as ThreadMessage[] }));
      } catch {
        setThreads(prev => ({ ...prev, [msg.thread_id]: [msg as unknown as ThreadMessage] }));
      } finally {
        setThreadLoading(prev => ({ ...prev, [msg.id]: false }));
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, msgId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFiles(prev => ({ ...prev, [msgId]: true }));
    try {
      const ext = file.name.split('.').pop();
      const path = `attachments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('message-attachments').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('message-attachments').getPublicUrl(path);
      const attachment: AttachmentData = { name: file.name, url: urlData.publicUrl, size: file.size, type: file.type };
      setReplyAttachments(prev => ({ ...prev, [msgId]: [...(prev[msgId] ?? []), attachment] }));
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [msgId]: false }));
      e.target.value = '';
    }
  };

  const handleSendReply = async (msg: InboxMessage) => {
    const body = replyBody[msg.id]?.trim();
    if (!body) return;
    setReplySending(prev => ({ ...prev, [msg.id]: true }));
    try {
      await onInlineSend({
        recipientId: msg.sender?.id ?? msg.sender_id,
        subject: msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`,
        threadId: msg.thread_id,
        parentId: msg.id,
        body,
        attachments: replyAttachments[msg.id],
      });
      const result = await getMessageThread(msg.thread_id);
      setThreads(prev => ({ ...prev, [msg.thread_id]: result as unknown as ThreadMessage[] }));
      setReplyBody(prev => ({ ...prev, [msg.id]: '' }));
      setReplyAttachments(prev => ({ ...prev, [msg.id]: [] }));
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setReplySending(prev => ({ ...prev, [msg.id]: false }));
    }
  };

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
      {/* Hidden file input shared across all reply forms */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={e => { if (fileInputFor) handleFileSelect(e, fileInputFor); }}
      />

      {messages.map(msg => {
        const isExpanded  = expanded === msg.id;
        const isUnread    = msg.status !== 'read';
        const senderName  = msg.sender?.full_name ?? 'Student';
        const initials    = senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        const threadMsgs  = threads[msg.thread_id] ?? [];
        const isLoadingThread = threadLoading[msg.id];
        const isSending   = replySending[msg.id];
        const canSend     = !!(replyBody[msg.id]?.trim()) && !isSending;

        return (
          <div
            key={msg.id}
            style={{ background: '#fff', border: `1px solid ${isUnread ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '10px', overflow: 'hidden', borderLeft: `3px solid ${isUnread ? '#2563eb' : '#e5e7eb'}` }}
          >
            {/* Header row */}
            <button
              onClick={() => handleExpand(msg)}
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

            {/* Expanded: thread + inline reply */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid #f3f4f6' }}>
                {/* Thread chat bubbles */}
                {isLoadingThread ? (
                  <div style={{ padding: '16px 18px', color: '#9ca3af', fontSize: '13px' }}>Loading thread…</div>
                ) : (
                  <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(threadMsgs.length > 0 ? threadMsgs : [msg as unknown as ThreadMessage]).map(tmsg => {
                      const isDSO = tmsg.sender_role === 'dso' || tmsg.sender_role === 'admin';
                      const bubbleName = isDSO ? userName : (tmsg.sender?.full_name ?? 'Student');
                      const bubbleInitials = bubbleName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <div key={tmsg.id} style={{ display: 'flex', flexDirection: isDSO ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-start' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: isDSO ? '#16a34a' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                            {bubbleInitials}
                          </div>
                          <div style={{ maxWidth: '72%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexDirection: isDSO ? 'row-reverse' : 'row' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#374151' }}>{bubbleName}</span>
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                {new Date(tmsg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ background: isDSO ? '#dcfce7' : '#eff6ff', borderRadius: isDSO ? '12px 2px 12px 12px' : '2px 12px 12px 12px', padding: '9px 13px', fontSize: '13.5px', color: '#1f2937', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {tmsg.body}
                            </div>
                            {/* Attachment chips */}
                            {tmsg.attachments && tmsg.attachments.length > 0 && (
                              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: isDSO ? 'flex-end' : 'flex-start' }}>
                                {tmsg.attachments.map((att, ai) => (
                                  <a key={ai} href={att.url} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: '12px', color: '#2563eb', textDecoration: 'none' }}>
                                    <svg viewBox="0 0 14 14" fill="none" stroke="#2563eb" strokeWidth="1.5" width="11" height="11"><path d="M7 1v7m-2.5-2.5L7 8l2.5-2.5"/><path d="M2 11h10"/></svg>
                                    {att.name}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline reply form */}
                <div style={{ padding: '12px 18px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    value={replyBody[msg.id] ?? ''}
                    onChange={e => setReplyBody(prev => ({ ...prev, [msg.id]: e.target.value }))}
                    placeholder="Write a reply…"
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '13.5px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
                  />
                  {/* Pending attachment chips */}
                  {(replyAttachments[msg.id] ?? []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(replyAttachments[msg.id] ?? []).map((att, ai) => (
                        <div key={ai} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: '12px', color: '#374151' }}>
                          <svg viewBox="0 0 14 14" fill="none" stroke="#6b7280" strokeWidth="1.5" width="11" height="11"><path d="M7 1v7m-2.5-2.5L7 8l2.5-2.5"/><path d="M2 11h10"/></svg>
                          {att.name}
                          <button
                            onClick={() => setReplyAttachments(prev => ({ ...prev, [msg.id]: (prev[msg.id] ?? []).filter((_, i) => i !== ai) }))}
                            style={{ border: 'none', background: 'none', padding: '0 0 0 2px', cursor: 'pointer', color: '#9ca3af', fontSize: '14px', lineHeight: 1 }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => { setFileInputFor(msg.id); fileInputRef.current?.click(); }}
                      disabled={uploadingFiles[msg.id]}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '6px', background: '#f4f5f7', border: '1px solid #e5e7eb', fontSize: '12.5px', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M12 9v1.5A1.5 1.5 0 0110.5 12h-7A1.5 1.5 0 012 10.5V9"/><path d="M7 2v7m-2-2.5L7 9l2-2.5"/></svg>
                      {uploadingFiles[msg.id] ? 'Uploading…' : 'Attach File'}
                    </button>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => handleSendReply(msg)}
                      disabled={!canSend}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: canSend ? '#2563eb' : '#9ca3af', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: canSend ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M1 8l14-6-5 14-3-5-6-3z"/></svg>
                      {isSending ? 'Sending…' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
