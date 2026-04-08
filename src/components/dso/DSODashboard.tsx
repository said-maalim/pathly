/**
 * DSODashboard — Exactly matches the provided HTML reference design.
 *
 * Design tokens from HTML:
 *   --bg: #f4f5f7
 *   --surface: #ffffff
 *   --border: #e5e7eb
 *   --blue: #2563eb
 *   --green: #16a34a
 *   --red: #dc2626
 *   --amber: #d97706
 *   --orange: #ea580c
 *
 * Layout:
 *   - Peach gradient page-header
 *   - 4-column metric-row
 *   - bottom-grid: 1fr 280px (table + right column)
 */
import { useState, useEffect } from 'react';
import { projectId } from '../../utils/supabase/info';
import type { DSOView } from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '??';
}

const AVATAR_COLORS = ['#8b5cf6', '#2563eb', '#16a34a', '#dc2626', '#d97706', '#ea580c', '#6366f1'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkflowItem {
  id: string;
  studentName: string;
  studentId: string;
  issue: string;
  isUrgent: boolean;
  context: string;
  status: string;
  priority: string;
  date: string;
  isSystem: boolean;
}

interface ActivityItem {
  id: string;
  text: React.ReactNode;
  initials: string;
  color: string;
}

// ─── Badge ───────────────────────────────────────────────────────────────────

function Badge({ label, type }: { label: string; type: string }) {
  const styles: Record<string, React.CSSProperties> = {
    Review:    { background: '#fef9c3', color: '#854d0e' },
    High:      { background: '#fee2e2', color: '#991b1b' },
    Medium:    { background: '#fef3c7', color: '#92400e' },
    Med:       { background: '#fef3c7', color: '#92400e' },
    Low:       { background: '#dcfce7', color: '#166534' },
    Pending:   { background: '#e0e7ff', color: '#3730a3' },
    Submitted: { background: '#f3f4f6', color: '#374151' },
    Active:    { background: '#dcfce7', color: '#166534' },
  };
  const s = styles[label] ?? styles['Submitted'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 500,
      whiteSpace: 'nowrap', ...s,
    }}>
      {label}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface DSODashboardProps {
  schoolId: string;
  accessToken: string;
  studentCount: number;
  onNavigate: (view: DSOView) => void;
}

export function DSODashboard({ schoolId, accessToken, studentCount, onNavigate }: DSODashboardProps) {
  const [workflow, setWorkflow] = useState<WorkflowItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [criticalDetails, setCriticalDetails] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-268175b3`;

  useEffect(() => {
    if (!schoolId || !accessToken) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`${BASE}/requests/school/${schoolId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const requests: any[] = data.requests ?? data.data ?? (Array.isArray(data) ? data : []);

        const pending = requests.filter((r: any) =>
          ['pending', 'submitted', 'in_review'].includes(r.status));
        setPendingCount(pending.length);

        const critical = requests.filter((r: any) =>
          r.priority === 'high' || r.priority === 'urgent');
        setCriticalCount(critical.length);
        setCriticalDetails(critical.slice(0, 3).map((r: any) =>
          r.title ?? r.request_type ?? 'Compliance issue'));

        // Map to workflow rows
        const rows: WorkflowItem[] = requests.slice(0, 8).map((r: any) => {
          const sName = r.student?.user?.full_name ?? r.student_name ?? 'Student';
          const sId = r.student?.student_id_number
            ?? (r.student_id ? r.student_id.slice(0, 8) : '');
          const pri = r.priority === 'high' || r.priority === 'urgent' ? 'High'
            : r.priority === 'medium' ? 'Medium' : 'Low';
          const sta = r.status === 'pending' ? 'Review'
            : r.status === 'submitted' ? 'Submitted'
            : r.status === 'in_review' ? 'Review'
            : r.status === 'approved' ? 'Active'
            : 'Pending';

          return {
            id: r.id,
            studentName: sName,
            studentId: sId,
            issue: r.title ?? r.request_type ?? r.type ?? 'Pending Item',
            isUrgent: pri === 'High',
            context: r.description ?? r.reason ?? '',
            status: sta,
            priority: pri,
            date: r.created_at ? fmt(r.created_at) : 'N/A',
            isSystem: r.is_system ?? false,
          };
        });
        setWorkflow(rows);

        // Activity feed
        const feed: ActivityItem[] = requests.slice(0, 5).map((r: any, i: number) => {
          const sName = r.student?.user?.full_name ?? 'Student';
          const type = r.request_type ?? r.title ?? 'request';
          const colors = ['#2563eb', '#8b5cf6', '#6b7280', '#16a34a', '#d97706'];
          return {
            id: r.id + i,
            text: <><strong style={{ color: '#111827', fontWeight: 500 }}>{sName}</strong>{` submitted a ${type}`}</>,
            initials: initials(sName),
            color: r.is_system ? '#6b7280' : colors[i % colors.length],
          };
        });
        setActivity(feed);
      } catch (e) {
        console.error('[DSODashboard]', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [schoolId, accessToken]);

  const handleAction = async (id: string, action: 'approved' | 'in_review' | 'rejected') => {
    setActionLoading(id);
    try {
      await fetch(`${BASE}/requests/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      setWorkflow(prev => prev.filter(r => r.id !== id));
      setPendingCount(p => Math.max(0, p - 1));
      const verb = action === 'approved' ? 'approved' : action === 'rejected' ? 'declined' : 'sent for review';
      setActivity(prev => [{
        id: id + Date.now(),
        text: <><strong style={{ color: '#111827', fontWeight: 500 }}>DSO</strong>{` ${verb} a request`}</>,
        initials: 'DS',
        color: action === 'approved' ? '#16a34a' : action === 'rejected' ? '#dc2626' : '#2563eb',
      }, ...prev.slice(0, 4)]);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const s: React.CSSProperties = {}; // placeholder

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      background: '#f4f5f7',
      fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>

      {/* Page header — peach gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #fef3e2 0%, #fde9cc 100%)',
        borderRadius: '10px',
        padding: '20px 24px',
        border: '1px solid #f8d99f',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.4px', color: '#1c1917', margin: 0 }}>
          DSO Dashboard: Priority Actions &amp; Compliance Overview
        </h1>
        <p style={{ fontSize: '13.5px', color: '#78716c', marginTop: '3px' }}>
          Your streamlined daily workflow.
        </p>
      </div>

      {/* Metric cards — 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>

        {/* Active Students */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginBottom: '6px' }}>Active Students</div>
              <div style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: '10px' }}>
                {studentCount.toLocaleString()}
              </div>
            </div>
            <svg style={{ width: '80px', height: '32px' }} viewBox="0 0 80 32" fill="none">
              <polyline points="0,24 16,20 28,22 40,14 52,16 64,10 80,6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button onClick={() => onNavigate('student-center')} style={{ background: 'none', border: 'none', padding: 0, fontSize: '12.5px', color: '#2563eb', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
            View All Students →
          </button>
        </div>

        {/* Pending Requests */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginBottom: '6px' }}>Pending Student Requests</div>
          <div style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: '10px' }}>
            {loading ? '–' : pendingCount}
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: '#e5e7eb', marginBottom: '6px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(to right,#22c55e,#f59e0b,#9ca3af)', width: pendingCount > 0 ? '100%' : '0%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
            <span>Priority: {pendingCount}</span><span>{pendingCount > 0 ? '100%' : '0%'}</span>
          </div>
          <button onClick={() => onNavigate('request-center')} style={{ background: 'none', border: 'none', padding: 0, fontSize: '12.5px', color: '#2563eb', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Process Requests →
          </button>
        </div>

        {/* Missing & Expiring Docs */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginBottom: '6px' }}>Missing &amp; Expiring Documents</div>
          <div style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: '10px' }}>0</div>
          <div style={{ height: '6px', borderRadius: '3px', background: '#e5e7eb', marginBottom: '6px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(to right,#ef4444,#f59e0b,#9ca3af)', width: '0%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
            <span>Urgent/Warning: 0</span>
          </div>
          <button onClick={() => onNavigate('document-center')} style={{ background: 'none', border: 'none', padding: 0, fontSize: '12.5px', color: '#2563eb', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Manage Docs →
          </button>
        </div>

        {/* Critical Compliance Alerts */}
        <div style={{ background: '#fff8f0', border: '1px solid #fed7aa', borderRadius: '10px', padding: '16px 18px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#ea580c', marginBottom: '4px' }}>
            Critical Compliance Alerts
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: '10px', color: '#dc2626' }}>
            {loading ? '–' : criticalCount}
          </div>
          {criticalDetails.length > 0 && (
            <div style={{ fontSize: '11.5px', color: '#92400e', marginBottom: '10px', lineHeight: 1.7 }}>
              {criticalDetails.map((d, i) => <div key={i}>- {d}</div>)}
            </div>
          )}
          {criticalDetails.length === 0 && (
            <div style={{ fontSize: '11.5px', color: '#92400e', marginBottom: '10px', lineHeight: 1.7 }}>
              No critical alerts
            </div>
          )}
          <button onClick={() => onNavigate('request-actions-dashboard')} style={{ background: 'none', border: 'none', padding: 0, fontSize: '12.5px', color: '#ea580c', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            View Alerts →
          </button>
        </div>
      </div>

      {/* Bottom grid: table (1fr) + right column (280px) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', flex: 1, minHeight: 0 }}>

        {/* Workflow table card */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Priority Workflow List</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', background: '#f4f5f7', color: '#111827', fontFamily: 'inherit' }}>
              Filterably Aesers
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l4 4 4-4"/></svg>
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Student ↕', 'Request/Issue', 'Status ↕', 'Priority ↕', 'Date ↕', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '9px 14px',
                      textAlign: 'left',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      color: '#6b7280',
                      borderBottom: '1px solid #e5e7eb',
                      background: '#fafafa',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      Loading…
                    </td>
                  </tr>
                ) : workflow.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      No pending workflow items
                    </td>
                  </tr>
                ) : workflow.map(row => {
                  const busy = actionLoading === row.id;
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Student */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 600, color: '#fff',
                            background: row.isSystem ? '#6b7280' : avatarColor(row.studentName),
                          }}>
                            {initials(row.studentName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '13px' }}>{row.studentName}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{row.studentId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Request/Issue */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'top', maxWidth: '260px' }}>
                        <div style={{ fontSize: '13px', color: row.isUrgent ? '#dc2626' : '#111827', fontWeight: row.isUrgent ? 500 : 400 }}>
                          {row.issue}
                        </div>
                        {row.context && (
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                            <strong style={{ fontWeight: 500, color: '#6b7280' }}>Context:</strong> {row.context.slice(0, 80)}{row.context.length > 80 ? '…' : ''}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                        <Badge label={row.status} type="status" />
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                        <Badge label={row.priority} type="priority" />
                      </td>

                      {/* Date */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Submitted:</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{row.date}</div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <button
                              onClick={() => handleAction(row.id, 'approved')}
                              disabled={busy}
                              style={{
                                padding: '5px 12px', borderRadius: '6px',
                                background: '#16a34a', color: '#fff', border: 'none',
                                fontSize: '12px', fontWeight: 500, cursor: busy ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', opacity: busy ? 0.6 : 1, transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => { if (!busy) (e.currentTarget as HTMLButtonElement).style.background = '#15803d'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#16a34a'; }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(row.id, 'in_review')}
                              disabled={busy}
                              style={{
                                padding: '4px 10px', borderRadius: '6px',
                                background: 'transparent', color: '#6b7280',
                                border: '1px solid #e5e7eb',
                                fontSize: '12px', fontWeight: 400, cursor: busy ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { if (!busy) { (e.currentTarget as HTMLButtonElement).style.background = '#f4f5f7'; (e.currentTarget as HTMLButtonElement).style.color = '#111827'; }}}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleAction(row.id, 'rejected')}
                              disabled={busy}
                              style={{
                                padding: '4px 10px', borderRadius: '6px',
                                background: 'transparent', color: '#6b7280',
                                border: '1px solid #e5e7eb',
                                fontSize: '12px', fontWeight: 400, cursor: busy ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { if (!busy) { (e.currentTarget as HTMLButtonElement).style.background = '#f4f5f7'; (e.currentTarget as HTMLButtonElement).style.color = '#111827'; }}}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
                            >
                              decline
                            </button>
                          </div>
                          <button style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            background: 'transparent', border: '1px solid #e5e7eb',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '16px', color: '#9ca3af', flexShrink: 0,
                          }}>···</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Recent Activity */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Recent Student Activity</span>
            </div>
            <div style={{ padding: '14px 18px 8px' }}>
              {activity.length === 0 ? (
                <p style={{ fontSize: '12.5px', color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>No recent activity</p>
              ) : activity.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 0', borderBottom: '1px solid #f3f4f6',
                  fontSize: '12.5px', color: '#6b7280', lineHeight: 1.5,
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 600, color: '#fff',
                    background: item.color,
                  }}>
                    {item.initials}
                  </div>
                  <div>{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Quick Actions</span>
            </div>
            <div style={{ padding: '14px 18px' }}>
              {[
                {
                  label: 'Initiate Student Task',
                  view: 'create-request-action' as DSOView,
                  icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm2 4h6M5 8h4"/></svg>,
                },
                {
                  label: 'Data Import',
                  view: 'roster-import' as DSOView,
                  icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><path d="M8 2v8M5 7l3 3 3-3M3 13h10"/></svg>,
                },
                {
                  label: 'Bulk Email',
                  view: 'communication-center' as DSOView,
                  icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><path d="M2 3h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 0l6 5 6-5"/></svg>,
                },
              ].map(({ label, view, icon }) => (
                <button
                  key={label}
                  onClick={() => onNavigate(view)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '10px 14px',
                    background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                    cursor: 'pointer', color: '#111827', fontFamily: 'inherit',
                    transition: 'all 0.15s', textAlign: 'left', marginBottom: '8px',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f4f5f7'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; }}
                >
                  <span style={{ color: '#6b7280', flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
