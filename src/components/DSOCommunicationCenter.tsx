import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useDSOMessages } from '../hooks/useMessages';
import { sendMessage, getMessageThread } from '../services/messaging.service';
import type { MessageRecord } from '../services/messaging.service';
import type { StudentOption } from './communication/ComposeEmailPanel';
import './messaging.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { name: 'Request more documents', desc: 'Ask for missing items',
    body: 'Hi {n}, to continue with your request we need a few more documents. Please upload them in the portal and let me know when they\'re ready.' },
  { name: 'Appointment reminder',   desc: 'Offer a meeting time',
    body: 'Hi {n}, I\'d like to meet to go over your request. Are you available this week? Share a couple of times that work for you.' },
  { name: 'Request received',       desc: 'Short confirmation',
    body: 'Hi {n}, thanks for your request. I\'ve received it and will follow up within two business days.' },
  { name: 'Visa expiring soon',     desc: 'Compliance reminder',
    body: 'Hi {n}, your visa is expiring soon. Please schedule a renewal appointment before any international travel.' },
] as const;

const STUDENT_COLORS = ['#2563eb','#8b5cf6','#0f766e','#d97706','#be123c','#0369a1'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function nameColor(name: string): string {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return STUDENT_COLORS[Math.abs(h) % STUDENT_COLORS.length];
}

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || '??';
}

function firstName(name: string): string {
  return name.split(' ')[0] ?? 'there';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface ThreadItem {
  thread_id: string;
  subject: string;
  studentName: string;
  studentInitials: string;
  studentColor: string;
  studentUserId: string;
  studentEmail: string;
  latestMsg: MessageRecord;
  isUnread: boolean;
  needsReply: boolean;
}

function buildThreadList(inbox: MessageRecord[], sent: MessageRecord[]): ThreadItem[] {
  const all = [...inbox, ...sent].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const seen = new Set<string>();
  const threads: ThreadItem[] = [];

  for (const m of all) {
    if (seen.has(m.thread_id)) continue;
    seen.add(m.thread_id);

    const inThread = all.filter(x => x.thread_id === m.thread_id);
    const latestMsg = inThread[0];
    const isUnread = inbox.some(x => x.thread_id === m.thread_id && x.status !== 'read');
    const needsReply = latestMsg.sender_role === 'student';

    // Student = the non-DSO side
    const studentMsg = inThread.find(x => x.sender_role === 'student');
    const sName = studentMsg?.sender?.full_name ?? 'Student';
    const sEmail = studentMsg?.sender?.email ?? '';
    const sUserId = studentMsg?.sender_id ?? '';
    const rawSubject = inThread[inThread.length - 1]?.subject ?? m.subject;

    threads.push({
      thread_id: m.thread_id,
      subject: rawSubject.replace(/^Re:\s*/i, ''),
      studentName: sName,
      studentInitials: initials(sName),
      studentColor: nameColor(sName),
      studentUserId: sUserId,
      studentEmail: sEmail,
      latestMsg,
      isUnread,
      needsReply,
    });
  }
  return threads;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DSOCommunicationCenterProps {
  onBack: () => void;
  onLogout?: () => void;
  userName?: string;
  schoolId?: string;
  students?: StudentOption[];
  onUnreadCountChange?: (count: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DSOCommunicationCenter({
  userName = 'DSO Admin',
  students = [],
  onUnreadCountChange,
}: DSOCommunicationCenterProps) {
  const { inbox, sent, loading, error, refresh, markRead, unreadCount } = useDSOMessages();

  const [filter, setFilter]   = useState<'all' | 'unread' | 'reply'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadMsgs, setThreadMsgs]   = useState<MessageRecord[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying]   = useState(false);
  const [showMenu, setShowMenu]   = useState(false);

  // Compose modal
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo]     = useState<StudentOption | null>(null);
  const [toQuery, setToQuery]         = useState('');
  const [showSugg, setShowSugg]       = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody]       = useState('');
  const [composeSending, setComposeSending] = useState(false);

  // ── Right-panel resize ────────────────────────────────────────────────────────
  const [panelWidth, setPanelWidth] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const resizing      = useRef(false);
  const resizeStartX  = useRef(0);
  const resizeStartW  = useRef(300);

  const msgsRef  = useRef<HTMLDivElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const composeBodyRef = useRef<HTMLTextAreaElement>(null);

  const threads = buildThreadList(inbox, sent);
  const filtered = threads.filter(t => {
    const matchFilter =
      filter === 'all'    ? true :
      filter === 'unread' ? t.isUnread :
      /* reply */           t.needsReply;
    const matchQ = !searchQ || (t.studentName + t.subject).toLowerCase().includes(searchQ.toLowerCase());
    return matchFilter && matchQ;
  });
  const counts = {
    all:    threads.length,
    unread: threads.filter(t => t.isUnread).length,
    reply:  threads.filter(t => t.needsReply).length,
  };
  const selectedThread = threads.find(t => t.thread_id === selectedId) ?? null;

  // Student suggestions for compose modal
  const suggestions = students.filter(s =>
    !composeTo && toQuery &&
    (s.name.toLowerCase().includes(toQuery.toLowerCase()) || s.email.toLowerCase().includes(toQuery.toLowerCase()))
  ).slice(0, 5);

  // Notify parent of unread count
  useEffect(() => { onUnreadCountChange?.(unreadCount); }, [unreadCount, onUnreadCountChange]);

  // Panel resize — global mouse move/up so drag works outside the handle
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      // dragging handle left = bigger panel
      const delta = resizeStartX.current - e.clientX;
      setPanelWidth(Math.min(480, Math.max(200, resizeStartW.current + delta)));
    };
    const onUp = () => {
      if (!resizing.current) return;
      resizing.current = false;
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    setIsDragging(true);
    resizeStartX.current = e.clientX;
    resizeStartW.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [threadMsgs]);

  // Close templates menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      const menu = document.getElementById('msg-dso-menu');
      if (menu && !menu.contains(e.target as Node)) setShowMenu(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName);
      if (e.key === 'c' && !typing && !e.metaKey && !e.ctrlKey && !showCompose) {
        e.preventDefault(); openCompose(); return;
      }
      if (e.key === 'Escape') {
        if (showCompose) { closeCompose(); return; }
        if (showMenu) { setShowMenu(false); return; }
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (showCompose) { e.preventDefault(); handleSendNew(); }
        else if ((e.target as HTMLElement).id === 'msg-dso-tx') { e.preventDefault(); handleReply(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompose, showMenu, composeBody, composeSubject, composeTo, replyBody]);

  const handleSelectThread = useCallback(async (threadId: string) => {
    setSelectedId(threadId);
    setReplyBody('');
    setShowMenu(false);
    setThreadLoading(true);
    setThreadMsgs([]);
    inbox.filter(m => m.thread_id === threadId && m.status !== 'read').forEach(m => markRead(m.id));
    try {
      const result = await getMessageThread(threadId);
      setThreadMsgs(result.length ? result : [...inbox, ...sent]
        .filter(m => m.thread_id === threadId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    } catch {
      setThreadMsgs([...inbox, ...sent]
        .filter(m => m.thread_id === threadId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    } finally {
      setThreadLoading(false);
    }
  }, [inbox, sent, markRead]);

  const handleReply = async () => {
    if (!selectedThread || !replyBody.trim()) return;
    setReplying(true);
    try {
      const latestInbox = inbox.filter(m => m.thread_id === selectedId)[0];
      const threadRoot = [...inbox, ...sent]
        .filter(m => m.thread_id === selectedId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
      await sendMessage({
        recipientId: selectedThread.studentUserId || undefined,
        subject: `Re: ${selectedThread.subject}`,
        bodyText: replyBody.trim(),
        recipientType: 'individual',
        threadId: selectedId!,
        parentId: latestInbox?.id ?? threadRoot?.id,
      });
      setReplyBody('');
      toast.success(`Message sent to ${firstName(selectedThread.studentName)}`);
      await refresh();
      const updated = await getMessageThread(selectedId!);
      if (updated.length) setThreadMsgs(updated);
    } catch (err) {
      toast.error('Failed to send reply', { description: err instanceof Error ? err.message : undefined });
    } finally {
      setReplying(false);
    }
  };

  const openCompose = (pre?: StudentOption) => {
    setComposeTo(pre ?? null);
    setToQuery('');
    setComposeSubject('');
    setComposeBody('');
    setShowSugg(false);
    setShowCompose(true);
    setTimeout(() => (pre ? document.getElementById('msg-dso-csubj')?.focus() : toInputRef.current?.focus()), 50);
  };

  const closeCompose = () => {
    setShowCompose(false);
    setShowSugg(false);
  };

  const handleSendNew = async () => {
    if (!composeTo) { toInputRef.current?.focus(); toast.error('Choose a student first'); return; }
    if (!composeBody.trim()) { composeBodyRef.current?.focus(); return; }
    setComposeSending(true);
    try {
      await sendMessage({
        recipientId: composeTo.user_id,
        subject: composeSubject.trim() || 'New message',
        bodyText: composeBody.trim(),
        recipientType: 'individual',
      });
      closeCompose();
      toast.success(`Message sent to ${firstName(composeTo.name)}`);
      await refresh();
    } catch (err) {
      toast.error('Failed to send', { description: err instanceof Error ? err.message : undefined });
    } finally {
      setComposeSending(false);
    }
  };

  const applyTemplate = (tplBody: string) => {
    const name = selectedThread ? firstName(selectedThread.studentName) : 'there';
    setReplyBody(tplBody.replace(/\{n\}/g, name));
    setShowMenu(false);
    document.getElementById('msg-dso-tx')?.focus();
  };

  const applyQuickTemplate = (tpl: typeof TEMPLATES[number]) => {
    const name = composeTo ? firstName(composeTo.name) : 'there';
    setComposeBody(tpl.body.replace(/\{n\}/g, name));
    if (!composeSubject) setComposeSubject(tpl.name);
    composeBodyRef.current?.focus();
  };

  const selectSuggestion = (s: StudentOption) => {
    setComposeTo(s);
    setToQuery('');
    setShowSugg(false);
    setTimeout(() => document.getElementById('msg-dso-csubj')?.focus(), 30);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="msg-page">
      <div
        className={`msg-ws msg-ws--dso${!selectedId ? ' msg-ws--no-sel' : ''}${selectedId ? ' msg-ws--open' : ''}`}
        style={{ '--msg-panel-w': `${panelWidth}px` } as React.CSSProperties}
      >

        {/* ── Left pane ── */}
        <section className="msg-pane" aria-label="Conversations">
          <div className="msg-ph">
            <div className="msg-ph-row">
              <h1>Messaging</h1>
              <button className="msg-nb" onClick={() => openCompose()} aria-haspopup="dialog" aria-label="New message">
                <i aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 1v10M1 6h10"/>
                  </svg>
                </i>
                New<kbd>C</kbd>
              </button>
            </div>
            <label className="msg-find">
              <span aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <circle cx="7" cy="7" r="4"/><path d="M11 11l3 3"/>
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search students or subjects"
                aria-label="Search conversations"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
            </label>
          </div>

          <div className="msg-tabs" role="group" aria-label="Filter">
            {(['all', 'unread', 'reply'] as const).map(k => {
              const label = k === 'all' ? 'All' : k === 'unread' ? 'Unread' : 'Needs reply';
              return (
                <button key={k} className="msg-tab" aria-pressed={filter === k} onClick={() => setFilter(k)}>
                  {label}<b>{counts[k]}</b>
                </button>
              );
            })}
          </div>

          <ul className="msg-list" role="list">
            {loading ? (
              <li><span className="msg-empty">Loading messages…</span></li>
            ) : error ? (
              <li><span className="msg-empty" style={{color:'#dc2626'}}>{error}</span></li>
            ) : filtered.length === 0 ? (
              <li><span className="msg-empty">No conversations match.</span></li>
            ) : filtered.map(t => (
              <li key={t.thread_id}>
                <button
                  className={`msg-cv${t.isUnread ? ' msg-cv--un' : ''}`}
                  aria-current={t.thread_id === selectedId || undefined}
                  onClick={() => handleSelectThread(t.thread_id)}
                >
                  <span className="msg-av" style={{width:42,height:42,fontSize:14,background:t.studentColor}}>
                    {t.studentInitials}
                  </span>
                  <span className="msg-cv-m">
                    <span className="msg-cv-n">
                      <span>{t.studentName}</span>
                      <time>{formatTime(t.latestMsg.created_at)}</time>
                    </span>
                    <span className="msg-cv-sj">{t.subject}</span>
                    <span className="msg-cv-pv">
                      {t.latestMsg.sender_role !== 'student' ? 'You: ' : ''}
                      {t.latestMsg.body}
                    </span>
                    {t.needsReply && <span className="msg-tg msg-tg--amber">Needs reply</span>}
                  </span>
                  {t.isUnread && <span className="msg-dot" aria-label="Unread"/>}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Thread pane ── */}
        <section className="msg-thread" aria-label="Conversation">
          {selectedThread ? (
            <>
              <div className="msg-thh">
                <button className="msg-back" aria-label="Back to conversations"
                  onClick={() => setSelectedId(null)}>←</button>
                <span className="msg-av" style={{width:40,height:40,fontSize:14,background:selectedThread.studentColor}}>
                  {selectedThread.studentInitials}
                </span>
                <div>
                  <h2>{selectedThread.studentName}</h2>
                  <small>{selectedThread.subject}</small>
                </div>
                <div className="msg-thh-acts">
                  <button className="msg-btn" onClick={() => toast('Marked resolved (coming soon)')}>
                    Mark resolved
                  </button>
                </div>
              </div>

              {/* Linked request strip — shown when request_id is added to MessageRecord */}
              {/* <div className="msg-link">📎 <span>Linked request: <b>…</b></span></div> */}

              <div className="msg-msgs" ref={msgsRef} aria-live="polite">
                {threadLoading ? (
                  <div className="msg-day">Loading conversation…</div>
                ) : threadMsgs.map((m, i) => {
                  const isDSO = m.sender_role === 'dso' || m.sender_role === 'admin';
                  const prev = threadMsgs[i - 1];
                  const showDay = !prev ||
                    new Date(m.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                  const time = new Date(m.created_at)
                    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                  return (
                    <div key={m.id} style={{display:'contents'}}>
                      {showDay && (
                        <div className="msg-day">
                          {new Date(m.created_at).toLocaleDateString([],
                            { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                      )}
                      {/* In DSO view: student = left (white), DSO = right (blue) */}
                      <div className={`msg-b ${isDSO ? 'msg-b--right' : 'msg-b--left'}`}>
                        {m.body}
                      </div>
                      <div className={`msg-tm${isDSO ? ' msg-tm--right' : ''}`}>{time}</div>
                    </div>
                  );
                })}
              </div>

              <div className="msg-comp">
                <div id="msg-dso-menu" className={`msg-menu${showMenu ? ' msg-menu--open' : ''}`}>
                  {TEMPLATES.map((t, i) => (
                    <button key={i} onClick={() => applyTemplate(t.body)}>
                      {t.name}<small>{t.desc}</small>
                    </button>
                  ))}
                </div>
                <textarea
                  id="msg-dso-tx"
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder={`Reply to ${firstName(selectedThread.studentName)}…`}
                  aria-label="Message"
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault(); handleReply();
                    }
                  }}
                />
                <div className="msg-cbar">
                  <button className="msg-ib" id="msg-dso-tpl" aria-haspopup="true"
                    onClick={() => setShowMenu(v => !v)}>
                    📄 Templates
                  </button>
                  <span className="msg-cbar-hint">⌘↵ to send</span>
                  <button className="msg-btn msg-btn--p"
                    onClick={handleReply}
                    disabled={replying || !replyBody.trim()}>
                    {replying ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ── Empty state ── */
            <div className="msg-es-dso">
              <div>
                <div className="msg-es-ic">
                  <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M2 3h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 0l6 5 6-5"/>
                  </svg>
                </div>
                <h2>Select a conversation</h2>
                <p>Pick a student from the list to read the thread, see their status, and reply.</p>
                <div className="msg-es-st">
                  <button onClick={() => setFilter('unread')}>
                    <b>{counts.unread}</b><span>Unread</span>
                  </button>
                  <button onClick={() => setFilter('reply')}>
                    <b>{counts.reply}</b><span>Need reply</span>
                  </button>
                  <button onClick={() => setFilter('all')}>
                    <b>{threads.length}</b><span>Conversations</span>
                  </button>
                </div>
                <div className="msg-es-acts">
                  <button className="msg-btn msg-btn--p"
                    onClick={() => { setFilter('reply'); const first = threads.find(t => t.needsReply); if (first) handleSelectThread(first.thread_id); }}>
                    Open next needing reply
                  </button>
                  <button className="msg-btn" onClick={() => openCompose()}>New message</button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Context panel ── */}
        {selectedThread && (
          <aside className="msg-cx" aria-label="Student details">
            {/* Drag handle on the left edge of the panel */}
            <div
              className={`msg-cx-handle${isDragging ? ' msg-cx-handle--active' : ''}`}
              onMouseDown={startResize}
              title="Drag to resize"
            />
            {/* Scrollable content */}
            <div className="msg-cx-scroll">
              <div className="msg-cx-who">
                <span className="msg-av" style={{width:56,height:56,fontSize:18,margin:'0 auto 10px',background:selectedThread.studentColor,display:'grid'}}>
                  {selectedThread.studentInitials}
                </span>
                <h3>{selectedThread.studentName}</h3>
                <div className="msg-cx-email">{selectedThread.studentEmail || '—'}</div>
              </div>
              <h4>Status</h4>
              <div className="msg-kv"><span>Visa</span><span>—</span></div>
              <div className="msg-kv"><span>SEVIS</span><span>—</span></div>
              <div className="msg-kv"><span>Compliance</span><span>—</span></div>
              <div className="msg-kv"><span>Program</span><span>—</span></div>
              <h4>Open request</h4>
              <div className="msg-rq">
                <b>No linked request</b>
                <span className="msg-tg msg-tg--gray" style={{margin:0}}>None</span>
              </div>
              <button className="msg-btn" onClick={() => toast('View full profile (coming soon)')}>
                View full profile
              </button>
              <button className="msg-btn msg-btn--p" onClick={() => toast('Review request (coming soon)')}>
                Review request
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Compose modal ── */}
      <div
        className={`msg-ov${showCompose ? ' msg-ov--on' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) closeCompose(); }}
      >
        <div className="msg-mdl" role="dialog" aria-modal="true" aria-labelledby="msg-dso-modal-title">
          <div className="msg-mh">
            <h2 id="msg-dso-modal-title">New message</h2>
            <button className="msg-mh-close" aria-label="Close" onClick={closeCompose}>✕</button>
          </div>

          {/* To field */}
          <div className="msg-fr">
            <label htmlFor="msg-dso-to">To</label>
            {composeTo ? (
              <span className="msg-pk">
                <span className="msg-av" style={{width:22,height:22,fontSize:9,background:nameColor(composeTo.name)}}>
                  {initials(composeTo.name)}
                </span>
                {composeTo.name}
                <button aria-label="Remove recipient" onClick={() => { setComposeTo(null); setTimeout(() => toInputRef.current?.focus(), 30); }}>✕</button>
              </span>
            ) : (
              <>
                <input
                  id="msg-dso-to"
                  ref={toInputRef}
                  placeholder="Search students…"
                  autoComplete="off"
                  value={toQuery}
                  onChange={e => { setToQuery(e.target.value); setShowSugg(true); }}
                  onFocus={() => setShowSugg(true)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && suggestions.length) {
                      e.preventDefault();
                      selectSuggestion(suggestions[0]);
                    }
                  }}
                />
                <div className={`msg-sg${showSugg && suggestions.length > 0 ? ' msg-sg--on' : ''}`} role="listbox">
                  {suggestions.map(s => (
                    <button key={s.user_id} role="option" onMouseDown={() => selectSuggestion(s)}>
                      <span className="msg-av" style={{width:28,height:28,fontSize:11,background:nameColor(s.name)}}>
                        {initials(s.name)}
                      </span>
                      {s.name}
                      <small style={{marginLeft:'auto'}}>{s.email}</small>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Subject field */}
          <div className="msg-fr">
            <label htmlFor="msg-dso-csubj">Subject</label>
            <input id="msg-dso-csubj" placeholder="What is this about?"
              value={composeSubject} onChange={e => setComposeSubject(e.target.value)} />
          </div>

          {/* Quick template chips */}
          <div className="msg-qt">
            {TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => applyQuickTemplate(t)}>{t.name}</button>
            ))}
          </div>

          {/* Body */}
          <textarea
            ref={composeBodyRef}
            aria-label="Message body"
            placeholder="Write your message…"
            value={composeBody}
            onChange={e => setComposeBody(e.target.value)}
          />

          <div className="msg-mf">
            <span className="msg-mf-hint">⌘↵ to send · Esc to close</span>
            <div style={{display:'flex',gap:8}}>
              <button className="msg-btn" onClick={closeCompose}>Cancel</button>
              <button className="msg-btn msg-btn--p" onClick={handleSendNew} disabled={composeSending}>
                {composeSending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
