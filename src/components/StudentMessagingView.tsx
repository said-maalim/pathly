import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudentMessages } from '../hooks/useMessages';
import { sendMessage, getMessageThread } from '../services/messaging.service';
import type { MessageRecord } from '../services/messaging.service';
import { toast } from 'sonner';
import './messaging.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const TOPICS = [
  { icon: '📄', label: 'Request update',    desc: 'Ask where a request stands' },
  { icon: '💼', label: 'Work authorization', desc: 'CPT, OPT or STEM questions' },
  { icon: '✈️', label: 'Travel & visa',      desc: 'Signatures, renewals, re-entry' },
  { icon: '❓', label: 'Something else',     desc: 'Any other question for your DSO' },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  latestMsg: MessageRecord;
  isUnread: boolean;
  awaitingDSO: boolean;
  dsoName: string;
  dsoInitials: string;
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
    const awaitingDSO = latestMsg.sender_role === 'student';

    const dsoMsg = inbox.find(x => x.thread_id === m.thread_id);
    const dsoName = dsoMsg?.sender?.full_name ?? 'DSO Office';
    const dsoInitials = dsoName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'QD';
    const rawSubject = inThread[inThread.length - 1]?.subject ?? m.subject;

    threads.push({
      thread_id: m.thread_id,
      subject: rawSubject.replace(/^Re:\s*/i, ''),
      latestMsg,
      isUnread,
      awaitingDSO,
      dsoName,
      dsoInitials,
    });
  }
  return threads;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface StudentMessagingViewProps {
  onBack: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StudentMessagingView({ onBack: _onBack }: StudentMessagingViewProps) {
  const { inbox, sent, loading, error, refresh, markRead } = useStudentMessages();

  const [filter, setFilter] = useState<'all' | 'unread' | 'awaiting'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadMsgs, setThreadMsgs] = useState<MessageRecord[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);

  // Compose modal
  const [showCompose, setShowCompose] = useState(false);
  const [composeTopic, setComposeTopic] = useState(0);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);

  const msgsRef = useRef<HTMLDivElement>(null);

  const threads = buildThreadList(inbox, sent);
  const filtered = threads.filter(t =>
    filter === 'all'      ? true :
    filter === 'unread'   ? t.isUnread :
    /* awaiting */          t.awaitingDSO,
  );
  const counts = {
    all:      threads.length,
    unread:   threads.filter(t => t.isUnread).length,
    awaiting: threads.filter(t => t.awaitingDSO).length,
  };
  const selectedThread = threads.find(t => t.thread_id === selectedId) ?? null;
  // Nav badge is polled by the student portal's own useStudentMessages() instance

  // Scroll to bottom when thread loads
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [threadMsgs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCompose) { setShowCompose(false); return; }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && showCompose) {
        e.preventDefault();
        handleSendNew();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompose, composeBody, composeSubject]);

  const handleSelectThread = useCallback(async (threadId: string) => {
    setSelectedId(threadId);
    setReplyBody('');
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
        subject: `Re: ${selectedThread.subject}`,
        bodyText: replyBody.trim(),
        recipientType: 'school',
        threadId: selectedId!,
        parentId: latestInbox?.id ?? threadRoot?.id,
      });
      setReplyBody('');
      toast.success('Message sent to your DSO');
      await refresh();
      const updated = await getMessageThread(selectedId!);
      if (updated.length) setThreadMsgs(updated);
    } catch (err) {
      toast.error('Failed to send reply', { description: err instanceof Error ? err.message : undefined });
    } finally {
      setReplying(false);
    }
  };

  const handleSendNew = async () => {
    if (!composeBody.trim()) { toast.error('Write a message first'); return; }
    setComposeSending(true);
    try {
      await sendMessage({
        subject: composeSubject.trim() || TOPICS[composeTopic].label,
        bodyText: composeBody.trim(),
        recipientType: 'school',
      });
      setShowCompose(false);
      setComposeSubject('');
      setComposeBody('');
      toast.success('Message sent to your DSO');
      await refresh();
    } catch (err) {
      toast.error('Failed to send', { description: err instanceof Error ? err.message : undefined });
    } finally {
      setComposeSending(false);
    }
  };

  const openCompose = (topicIndex = 0) => {
    setComposeTopic(topicIndex);
    setComposeSubject('');
    setComposeBody('');
    setShowCompose(true);
  };

  const lastThreadMsg = threadMsgs[threadMsgs.length - 1];
  const awaitingNotice = !!lastThreadMsg && lastThreadMsg.sender_role === 'student';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="msg-page">
      <div className={`msg-ws${selectedId ? ' msg-ws--open' : ''}`}>

        {/* ── Left pane ── */}
        <section className="msg-pane" aria-label="Conversations">
          <div className="msg-ph">
            <div className="msg-ph-row">
              <h1>Messaging</h1>
              <button className="msg-nb" onClick={() => openCompose()} aria-haspopup="dialog">
                <i aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 1v10M1 6h10"/>
                  </svg>
                </i>
                Message DSO
              </button>
            </div>
          </div>

          <div className="msg-tabs" role="group" aria-label="Filter">
            {(['all', 'unread', 'awaiting'] as const).map((k) => {
              const label = k === 'all' ? 'All' : k === 'unread' ? 'Unread' : 'Awaiting reply';
              return (
                <button key={k} className="msg-tab" aria-pressed={filter === k}
                  onClick={() => setFilter(k)}>
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
              <li><span className="msg-empty">No conversations here.</span></li>
            ) : filtered.map(t => (
              <li key={t.thread_id}>
                <button
                  className={`msg-cv${t.isUnread ? ' msg-cv--un' : ''}`}
                  aria-current={t.thread_id === selectedId || undefined}
                  onClick={() => handleSelectThread(t.thread_id)}
                >
                  <span className="msg-av" style={{width:42,height:42,fontSize:14,background:'linear-gradient(135deg,#2563eb,#6366f1)'}}>
                    {t.dsoInitials}
                  </span>
                  <span className="msg-cv-m">
                    <span className="msg-cv-n">
                      <span>{t.subject}</span>
                      <time>{formatTime(t.latestMsg.created_at)}</time>
                    </span>
                    <span className="msg-cv-pv">
                      {t.latestMsg.sender_role === 'student' ? 'You: ' : `${t.dsoName}: `}
                      {t.latestMsg.body}
                    </span>
                    {t.isUnread
                      ? <span className="msg-tg msg-tg--green">New reply</span>
                      : t.awaitingDSO
                      ? <span className="msg-tg msg-tg--amber">Awaiting DSO</span>
                      : <span className="msg-tg msg-tg--gray">Replied</span>
                    }
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
                <span className="msg-av" style={{width:40,height:40,fontSize:14,background:'linear-gradient(135deg,#2563eb,#6366f1)'}}>
                  {selectedThread.dsoInitials}
                </span>
                <div>
                  <h2>{selectedThread.subject}</h2>
                  <small>{selectedThread.dsoName} · DSO</small>
                </div>
              </div>

              <div className="msg-msgs" ref={msgsRef} aria-live="polite">
                {threadLoading ? (
                  <div className="msg-day">Loading conversation…</div>
                ) : threadMsgs.map((m, i) => {
                  const isStudent = m.sender_role === 'student';
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
                      {/* student = right (blue), dso = left (white) */}
                      <div className={`msg-b ${isStudent ? 'msg-b--right' : 'msg-b--left'}`}>
                        {m.body}
                      </div>
                      <div className={`msg-tm${isStudent ? ' msg-tm--right' : ''}`}>{time}</div>
                    </div>
                  );
                })}
                {awaitingNotice && (
                  <div className="msg-wait">
                    Sent. Your DSO usually replies within 2 business days.
                  </div>
                )}
              </div>

              <div className="msg-comp">
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder="Reply to your DSO…"
                  aria-label="Reply"
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                />
                <div className="msg-cbar">
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
            <div className="msg-es">
              <div>
                <div className="msg-dsoc">
                  <span className="msg-av" style={{width:48,height:48,fontSize:15,background:'linear-gradient(135deg,#2563eb,#6366f1)'}}>
                    QD
                  </span>
                  <div>
                    <h2>DSO Office</h2>
                    <p>Your Designated School Official</p>
                  </div>
                  <div className="msg-dsoc-meta">
                    <b><span className="msg-on-dot" style={{marginRight:5}}/>Usually replies in 2 days</b>
                    Mon–Fri · 9am–5pm
                  </div>
                </div>
                <h3>Start a conversation</h3>
                <div className="msg-starters">
                  {TOPICS.map((t, i) => (
                    <button key={i} className="msg-sc" onClick={() => openCompose(i)}>
                      <i>{t.icon}</i>
                      <div><b>{t.label}</b><span>{t.desc}</span></div>
                    </button>
                  ))}
                </div>
                <p style={{textAlign:'center',fontSize:'12.5px',color:'#9ca3af',marginTop:22}}>
                  Or pick a conversation from the list to read it.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Compose modal ── */}
      <div
        className={`msg-ov${showCompose ? ' msg-ov--on' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) setShowCompose(false); }}
      >
        <div className="msg-mdl" role="dialog" aria-modal="true" aria-labelledby="msg-compose-title">
          <div className="msg-mh">
            <h2 id="msg-compose-title">Message your DSO</h2>
            <span className="msg-mh-to">To: DSO Office</span>
            <button className="msg-mh-close" aria-label="Close" onClick={() => setShowCompose(false)}>
              ✕
            </button>
          </div>

          <div className="msg-sec">
            <span className="msg-sec-l" id="msg-topics-lbl">What is this about?</span>
            <div className="msg-topics" role="radiogroup" aria-labelledby="msg-topics-lbl">
              {TOPICS.map((t, i) => (
                <button key={i} type="button" role="radio"
                  aria-checked={composeTopic === i}
                  aria-pressed={composeTopic === i}
                  onClick={() => setComposeTopic(i)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="msg-sec">
            <label htmlFor="msg-csubj">Subject</label>
            <input id="msg-csubj" className="msg-fld" placeholder="Short summary"
              value={composeSubject} onChange={e => setComposeSubject(e.target.value)} />
          </div>

          <div className="msg-sec">
            <label htmlFor="msg-cbody">Message</label>
            <textarea id="msg-cbody" className="msg-fld"
              placeholder="Include dates, your SEVIS ID if relevant, and what you need…"
              value={composeBody} onChange={e => setComposeBody(e.target.value)} />
          </div>

          <div className="msg-mf">
            <span className="msg-mf-hint">Replies usually within 2 business days</span>
            <div style={{display:'flex',gap:8}}>
              <button className="msg-btn" onClick={() => setShowCompose(false)}>Cancel</button>
              <button className="msg-btn msg-btn--p" onClick={handleSendNew} disabled={composeSending}>
                {composeSending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
