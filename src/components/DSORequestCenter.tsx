/**
 * DSORequestCenter — Student Requests page refactored to match the
 * established Pathly design system (DM Sans, #f4f5f7 bg, white surface
 * cards, colored stat icons, inline-style filter bar, request cards).
 *
 * All data fetching, filtering, sorting, mock data, RequestProcessingView
 * integration, and handleUpdateRequest preserved unchanged.
 */
import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { RequestProcessingView } from './RequestProcessingView';

interface DSORequestCenterProps {
  onBack: () => void;
  onLogout?: () => void;
  userName?: string;
  userData?: any;
}

interface Request {
  id: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  requestType: string;
  category: string;
  status: 'New' | 'Under Review' | 'Info Needed' | 'Approved' | 'Rejected';
  priority: 'Urgent' | 'High' | 'Normal' | 'Low';
  submittedDate: string;
  dueDate: string;
  assignedTo?: string;
  details: any;
  documents: any[];
  internalNotes: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function statusBadge(status: string): React.CSSProperties {
  const m: Record<string, React.CSSProperties> = {
    New:            { background: '#dbeafe', color: '#1d4ed8' },
    'Under Review': { background: '#ede9fe', color: '#6d28d9' },
    'Info Needed':  { background: '#fef9c3', color: '#854d0e' },
    Approved:       { background: '#dcfce7', color: '#166534' },
    Rejected:       { background: '#fee2e2', color: '#991b1b' },
  };
  return m[status] ?? { background: '#f4f5f7', color: '#6b7280' };
}

function priorityBadge(p: string): React.CSSProperties {
  const m: Record<string, React.CSSProperties> = {
    Urgent: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
    High:   { background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' },
    Normal: { background: '#f4f5f7', color: '#374151', border: '1px solid #e5e7eb' },
    Low:    { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  };
  return m[p] ?? m.Normal;
}

// ── Component ───────────────────────────────────────────────────────────────

export function DSORequestCenter({ onBack, onLogout, userName = 'DSO Admin', userData }: DSORequestCenterProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'student'>('date');
  const [loading, setLoading] = useState(true);
  const [backendRequests, setBackendRequests] = useState<any[]>([]);

  const userType = userData?.data?.user?.user_metadata?.userType;

  useEffect(() => {
    if (userType && userType !== 'dso') {
      alert(`You are logged in as a ${userType.toUpperCase()}. This is the DSO portal.`);
    }
  }, [userType]);

  // ── Fetch from backend ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const userProfile = userData?.data?.user?.user_metadata || userData?.user?.user_metadata;
        const universityId = userProfile?.schoolId || userProfile?.universityId || 'b5acd146-322e-4e43-80ab-4f36a12aafeb';

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/requests/school/${universityId}`,
          { headers: { Authorization: `Bearer ${userData?.data?.session?.access_token || userData?.session?.access_token || publicAnonKey}` } }
        );

        if (!response.ok) { const error = await response.json(); console.error('Error fetching requests:', error); return; }

        const result = await response.json();
        const transformed = (result.requests || []).map((req: any) => ({
          id: req.id,
          studentName: req.student?.user?.name || req.userName || 'Unknown Student',
          studentEmail: req.student?.user?.email || req.userEmail || req.student_id || req.userId || 'Unknown',
          studentId: req.student_id || req.userId || req.student?.id || '',
          requestType: req.request_name || req.requestName || req.request_type || req.requestType,
          category: 'Immigration Documents',
          status: req.status === 'pending' ? 'New' : req.status === 'approved' ? 'Approved' : req.status === 'rejected' ? 'Rejected' : (req.status || 'New'),
          priority: req.priority || 'Normal',
          submittedDate: (req.submitted_at || req.submittedAt || new Date().toISOString()).split('T')[0],
          dueDate: (req.due_date || req.dueDate || new Date(Date.now() + 14 * 86400000).toISOString()).split('T')[0],
          details: req.form_data || req.formData || { reason: req.reason },
          documents: req.uploaded_files || req.uploadedFiles || [],
          internalNotes: req.internal_notes || req.internalNotes ? [req.internal_notes || req.internalNotes] : [],
        }));
        setBackendRequests(transformed);
      } catch (e) { console.error('Error fetching requests:', e); }
      finally { setLoading(false); }
    };
    fetchRequests();
  }, [userData]);

  const allRequests: Request[] = backendRequests;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalReqs = allRequests.length;
  const pendingAction = allRequests.filter(r => r.status === 'New' || r.status === 'Info Needed').length;
  const underReview = allRequests.filter(r => r.status === 'Under Review').length;
  const urgentReqs = allRequests.filter(r => r.priority === 'Urgent' && r.status !== 'Approved').length;

  // ── Filter & Sort ─────────────────────────────────────────────────────────
  const filtered = allRequests
    .filter(r => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.studentName.toLowerCase().includes(q) && !r.studentEmail.toLowerCase().includes(q) && !r.requestType.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      if (sortBy === 'priority') {
        const o: Record<string, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
        return (o[a.priority] ?? 2) - (o[b.priority] ?? 2);
      }
      return a.studentName.localeCompare(b.studentName);
    });

  // ── Update handler ────────────────────────────────────────────────────────
  const handleUpdateRequest = (u: Request) => {
    setBackendRequests(prev => prev.map(r => r.id === u.id ? u : r));
    setSelectedRequest(u);
  };

  // ── Detail view ───────────────────────────────────────────────────────────
  if (selectedRequest) {
    return (
      <RequestProcessingView
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        onUpdate={handleUpdateRequest}
        userData={userData}
      />
    );
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const selectStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '0 12px', height: '36px',
    background: '#f4f5f7', border: '1px solid #e5e7eb',
    borderRadius: '6px', fontSize: '13px', fontWeight: 400,
    color: '#111827', cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'inherit', appearance: 'none' as const,
  };

  const badgeBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '22px', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="#7c3aed" strokeWidth="1.6" width="20" height="20">
            <rect x="3" y="2" width="14" height="16" rx="2"/><path d="M7 6h6M7 10h6M7 14h4"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.3px', margin: 0 }}>Student Requests</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Review and process student immigration and academic requests.</p>
        </div>
      </div>

      {/* Stat cards — 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { num: totalReqs, sub: 'All submissions', label: 'Total Requests', iconColor: '#dbeafe', iconStroke: '#1d4ed8',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><rect x="4" y="2" width="14" height="18" rx="2"/><path d="M8 7h6M8 11h6M8 15h4"/></svg> },
          { num: pendingAction, sub: 'Need review', label: 'Pending Action', iconColor: '#fef3c7', iconStroke: '#b45309',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="11" cy="11" r="8"/><path d="M11 7v4l2.5 2.5"/></svg> },
          { num: underReview, sub: 'In progress', label: 'Under Review', iconColor: '#ede9fe', iconStroke: '#7c3aed',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="11" cy="11" r="8"/><path d="M8 11h6M11 8v6"/></svg> },
          { num: urgentReqs, sub: 'High priority', label: 'Urgent Requests', iconColor: '#fee2e2', iconStroke: '#b91c1c',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M11 3L2 19h18L11 3z"/><path d="M11 10v4M11 16v.5"/></svg> },
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

      {/* Filter bar */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', maxWidth: '420px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f4f5f7', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0 12px', height: '36px', fontSize: '13px', color: '#6b7280' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4"/><path d="M11 11l3 3"/></svg>
          <input
            type="text"
            placeholder="Search by student, email, or request ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '13px', fontFamily: 'inherit', color: '#111827' }}
          />
        </div>

        {/* Status */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="all">All Statuses</option>
          <option value="New">New</option>
          <option value="Under Review">Under Review</option>
          <option value="Info Needed">Info Needed</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        {/* Priority */}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={selectStyle}>
          <option value="all">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Normal">Normal</option>
          <option value="Low">Low</option>
        </select>

        {/* Divider */}
        <div style={{ width: '100%', height: '1px', background: '#e5e7eb', margin: '4px 0' }} />

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={selectStyle}>
          <option value="date">Sort by Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="student">Sort by Student</option>
        </select>
      </div>

      {/* List header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>All Requests ({filtered.length})</span>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px', borderRadius: '6px',
          border: '1px solid #e5e7eb', background: '#fff',
          fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          color: '#111827', fontFamily: 'inherit',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M5 7l3 3 3-3M3 13h10"/></svg>
          Export
        </button>
      </div>

      {/* Request cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
          <p style={{ fontSize: '14px', marginBottom: '4px' }}>No requests found</p>
          <p style={{ fontSize: '12px' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(request => {
            const days = daysUntil(request.dueDate);
            const overdue = days < 0;
            const dueSoon = days >= 0 && days <= 3;

            return (
              <div
                key={request.id}
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px', transition: 'box-shadow 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                onClick={() => setSelectedRequest(request)}
              >
                {/* Top row: student name + ID + badges + Review btn */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{request.studentName}</span>
                    <span style={{ fontSize: '11.5px', color: '#9ca3af', background: '#f4f5f7', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '4px', fontFamily: "'DM Mono', monospace" }}>
                      {request.id.length > 12 ? request.id.slice(0, 8) + '…' : request.id}
                    </span>
                    <span style={{ ...badgeBase, ...priorityBadge(request.priority) }}>{request.priority}</span>
                    {request.assignedTo && (
                      <span style={{ ...badgeBase, background: '#f4f5f7', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" width="11" height="11" style={{ marginRight: '4px' }}><circle cx="6" cy="4" r="2"/><path d="M2 10c0-2.5 8-2.5 8 0"/></svg>
                        {request.assignedTo}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ ...badgeBase, ...statusBadge(request.status) }}>{request.status}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedRequest(request); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '7px 16px', borderRadius: '6px',
                        background: '#2563eb', color: '#fff', border: 'none',
                        fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/></svg>
                      Review
                    </button>
                  </div>
                </div>

                {/* Middle row: request type + category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: '#374151' }}>
                  <svg viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.3" width="14" height="14"><rect x="2" y="1" width="10" height="12" rx="1.5"/><path d="M5 4h4M5 7h4M5 10h2"/></svg>
                  <span style={{ fontWeight: 500 }}>{request.requestType}</span>
                  <span style={{ color: '#d1d5db' }}>•</span>
                  <span style={{ color: '#6b7280' }}>{request.category}</span>
                </div>

                {/* Footer: dates + docs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '10px', borderTop: '1px solid #f3f4f6', fontSize: '12.5px', color: '#6b7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.3" width="13" height="13"><rect x="1.5" y="2.5" width="11" height="10" rx="1"/><path d="M1.5 6h11M4.5 1v2M9.5 1v2"/></svg>
                    Submitted: {fmt(request.submittedDate)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: overdue ? '#dc2626' : dueSoon ? '#d97706' : undefined }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke={overdue ? '#dc2626' : dueSoon ? '#d97706' : '#9ca3af'} strokeWidth="1.3" width="13" height="13"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/></svg>
                    Due: {fmt(request.dueDate)}
                    {overdue && ' (Overdue)'}
                    {dueSoon && !overdue && ` (${days}d left)`}
                  </span>
                  {request.documents.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.3" width="13" height="13"><rect x="2" y="1" width="10" height="12" rx="1.5"/><path d="M5 4h4M5 7h4"/></svg>
                      {request.documents.length} doc{request.documents.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}