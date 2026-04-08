/**
 * DSOCommunicationCenter — Messaging page refactored to the Pathly design
 * system (inline styles, DM Sans, #f4f5f7 bg, stat cards with colored icons,
 * dark tab bar).
 *
 * Preserves: compose/templates/history sub-components, template CRUD,
 * message state, and all handler callbacks.
 */
import { useState } from 'react';
import { ComposeEmailPanel } from './communication/ComposeEmailPanel';
import { EmailTemplatesPanel } from './communication/EmailTemplatesPanel';
import type { EmailTemplate } from './communication/EmailTemplatesPanel';
import { MessageHistoryPanel } from './communication/MessageHistoryPanel';
import type { Message } from './communication/MessageHistoryPanel';

// ── Initial data ───────────────────────────────────────────────────────────
const INITIAL_TEMPLATES: EmailTemplate[] = [
  { id: 'TMPL-001', name: 'Visa Renewal Reminder', category: 'Compliance', subject: 'Important: Your F-1 Visa is Expiring Soon', body: `Dear [Student Name],\n\nThis is a friendly reminder that your F-1 visa will expire on [Expiration Date]...\n\nBest regards,\n[DSO Name]`, lastUsed: '2024-11-20', usageCount: 45 },
  { id: 'TMPL-002', name: 'Document Upload Request', category: 'Documents', subject: 'Action Required: Please Upload [Document Type]', body: `Dear [Student Name],\n\nWe need you to upload the following document...\n\nBest regards,\n[DSO Name]`, lastUsed: '2024-11-21', usageCount: 78 },
  { id: 'TMPL-003', name: 'Request Approved', category: 'Requests', subject: 'Good News: Your [Request Type] Has Been Approved', body: `Dear [Student Name],\n\nCongratulations! Your [Request Type] has been approved.\n\nBest regards,\n[DSO Name]`, lastUsed: '2024-11-22', usageCount: 156 },
  { id: 'TMPL-004', name: 'Request Needs More Information', category: 'Requests', subject: 'Additional Information Required: [Request Type]', body: `Dear [Student Name],\n\nWe need additional information to process your [Request Type]...\n\nBest regards,\n[DSO Name]`, usageCount: 92 },
  { id: 'TMPL-005', name: 'Compliance Check Reminder', category: 'Compliance', subject: 'Reminder: Upcoming Compliance Check', body: `Dear [Student Name],\n\nThis is a reminder that your compliance check is scheduled for [Check Date]...\n\nBest regards,\n[DSO Name]`, usageCount: 34 },
  { id: 'TMPL-006', name: 'CPT Approved', category: 'Employment', subject: 'CPT Authorization Approved - Action Required', body: `Dear [Student Name],\n\nYour CPT application has been approved...\n\nBest regards,\n[DSO Name]`, usageCount: 89 },
  { id: 'TMPL-007', name: 'Travel Signature Completed', category: 'Travel', subject: 'Your I-20 Travel Signature is Ready', body: `Dear [Student Name],\n\nYour I-20 has been signed for travel...\n\nBest regards,\n[DSO Name]`, usageCount: 112 },
];

const INITIAL_MESSAGES: Message[] = [
  { id: 'MSG-001', recipient: 'Sarah Rodriguez', recipientEmail: 'sarah.r@university.edu', subject: 'Good News: Your CPT Application Has Been Approved', body: 'Dear Sarah Rodriguez, Congratulations! Your CPT Application has been approved...', sentDate: '2024-11-22', sentBy: 'Dr. Johnson', status: 'Read', template: 'Request Approved' },
  { id: 'MSG-002', recipient: 'Michael Chen', recipientEmail: 'michael.c@university.edu', subject: 'Additional Information Required: OPT Application', body: 'Dear Michael Chen, Thank you for submitting your OPT Application...', sentDate: '2024-11-21', sentBy: 'Dr. Johnson', status: 'Read', template: 'Request Needs More Information' },
  { id: 'MSG-003', recipient: 'Priya Patel', recipientEmail: 'priya.p@university.edu', subject: 'Your I-20 Travel Signature is Ready', body: 'Dear Priya Patel, Your I-20 has been signed for travel purposes...', sentDate: '2024-11-20', sentBy: 'Dr. Smith', status: 'Delivered', template: 'Travel Signature Completed' },
];

interface DSOCommunicationCenterProps {
  onBack: () => void;
  onLogout?: () => void;
  userName?: string;
}

export function DSOCommunicationCenter({ onBack, onLogout, userName = 'DSO Admin' }: DSOCommunicationCenterProps) {
  const [selectedTab, setSelectedTab] = useState<'compose' | 'templates' | 'history'>('compose');
  const [templates, setTemplates] = useState<EmailTemplate[]>(INITIAL_TEMPLATES);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const templatesUsedRecently = templates.filter(t => t.lastUsed).length;
  const activeConversations = messages.filter(m => m.status !== 'Read').length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMessageSent = (msg: { recipientEmail: string; subject: string; body: string; templateName?: string }) => {
    const newMsg: Message = {
      id: `MSG-${String(messages.length + 1).padStart(3, '0')}`,
      recipient: msg.recipientEmail.split('@')[0],
      recipientEmail: msg.recipientEmail,
      subject: msg.subject,
      body: msg.body,
      sentDate: new Date().toISOString().split('T')[0],
      sentBy: userName,
      status: 'Sent',
      template: msg.templateName,
    };
    setMessages([newMsg, ...messages]);
  };

  const handleUseTemplate = (_template: EmailTemplate) => { setSelectedTab('compose'); };

  const handleCreateTemplate = (data: Omit<EmailTemplate, 'id' | 'usageCount'>) => {
    setTemplates([...templates, { id: `TMPL-${String(templates.length + 1).padStart(3, '0')}`, ...data, usageCount: 0 }]);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    alert('Template deleted successfully');
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '22px', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="#16a34a" strokeWidth="1.6" width="20" height="20"><path d="M2 4h16v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm0 0l8 6 8-6"/></svg>
        </div>
        <div>
          <h1 style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.3px', margin: 0 }}>Messaging</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Send emails, manage templates, and track communication with students.</p>
        </div>
      </div>

      {/* Stat cards — 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { num: templates.length, sub: `${templatesUsedRecently} used recently`, label: 'Templates Available', iconColor: '#dbeafe', iconStroke: '#1d4ed8',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><rect x="4" y="2" width="14" height="18" rx="2"/><path d="M8 7h6M8 11h6M8 15h4"/></svg> },
          { num: messages.length, sub: 'This month', label: 'Messages Sent', iconColor: '#dcfce7', iconStroke: '#15803d',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M2 11l18-8-7 18-4-7-7-3z"/></svg> },
          { num: '94%', sub: 'Avg response: 6h', label: 'Read Rate', iconColor: '#ede9fe', iconStroke: '#7c3aed',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="11" cy="11" r="8"/><path d="M7.5 11l2.5 2.5 4.5-4.5"/></svg> },
          { num: activeConversations, sub: 'Pending responses', label: 'Active Conversations', iconColor: '#fef3c7', iconStroke: '#b45309',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M3 4h16v10a1 1 0 01-1 1H9l-4 3v-3H4a1 1 0 01-1-1V4z"/></svg> },
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
          { key: 'compose' as const, label: 'Compose' },
          { key: 'templates' as const, label: `Templates (${templates.length})` },
          { key: 'history' as const, label: `History (${messages.length})` },
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
            {tab.key === 'compose' && <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" width="13" height="13"><path d="M1 7l12-5-4 12-3-5-5-2z"/></svg>}
            {tab.key === 'templates' && <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" width="13" height="13"><rect x="2" y="1" width="10" height="12" rx="1.5"/><path d="M5 4h4M5 7h4M5 10h2"/></svg>}
            {tab.key === 'history' && <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" width="13" height="13"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/></svg>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — rendered by sub-components */}
      {selectedTab === 'compose' && (
        <ComposeEmailPanel templates={templates} userName={userName} onMessageSent={handleMessageSent} />
      )}
      {selectedTab === 'templates' && (
        <EmailTemplatesPanel templates={templates} onUseTemplate={handleUseTemplate} onCreateTemplate={handleCreateTemplate} onDeleteTemplate={handleDeleteTemplate} />
      )}
      {selectedTab === 'history' && (
        <MessageHistoryPanel messages={messages} />
      )}
    </div>
  );
}