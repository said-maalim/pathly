/**
 * DSORequestActionsDashboard — "DSO Requests" (formerly Compliance).
 * Refactored to match the Pathly design system with inline styles.
 */
import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';

interface DSORequestActionsDashboardProps {
  onBack: () => void;
  onCreateNew: () => void;
  onViewDetail: (requestId: string) => void;
  userData?: any;
}

interface RequestAction {
  id: string;
  title: string;
  type: 'document' | 'form' | 'confirmation';
  sentTo: 'Single' | 'Bulk';
  targetStudent?: string;
  targetStudentName?: string;
  targetCount: number;
  deadline: string | null;
  completionPercent: number;
  completedCount: number;
  totalCount: number;
  status: 'active' | 'completed' | 'overdue';
  createdAt: string;
}

export function DSORequestActionsDashboard({ onBack, onCreateNew, onViewDetail, userData }: DSORequestActionsDashboardProps) {
  const [requests, setRequests] = useState<RequestAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Initial Data ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setRequests([
        { id: '1', title: 'Passport Copy Upload', type: 'document', sentTo: 'Bulk', targetCount: 156, deadline: '2024-12-01', completionPercent: 78, completedCount: 122, totalCount: 156, status: 'active', createdAt: '2024-11-15' },
        { id: '2', title: 'OPT Employment Information', type: 'form', sentTo: 'Bulk', targetCount: 89, deadline: '2024-11-30', completionPercent: 45, completedCount: 40, totalCount: 89, status: 'active', createdAt: '2024-11-10' },
        { id: '3', title: 'SEVIS Status Acknowledgement', type: 'confirmation', sentTo: 'Bulk', targetCount: 1247, deadline: null, completionPercent: 92, completedCount: 1147, totalCount: 1247, status: 'active', createdAt: '2024-11-01' },
        { id: '4', title: 'Signed I-20 Document', type: 'document', sentTo: 'Single', targetCount: 1, deadline: '2024-11-20', completionPercent: 100, completedCount: 1, totalCount: 1, status: 'completed', createdAt: '2024-11-08' },
        { id: '5', title: 'Address Update Form', type: 'form', sentTo: 'Bulk', targetCount: 234, deadline: '2024-11-18', completionPercent: 23, completedCount: 54, totalCount: 234, status: 'overdue', createdAt: '2024-10-25' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const filteredRequests = requests.filter(r => {
    const typeMatch = filterType === 'all' || r.type === filterType;
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    const searchMatch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  });

  const getStatusBadge = (status: string): React.CSSProperties => {
    switch (status) {
      case 'active': return { background: '#dbeafe', color: '#1d4ed8' };
      case 'completed': return { background: '#dcfce7', color: '#166534' };
      case 'overdue': return { background: '#fee2e2', color: '#991b1b' };
      default: return { background: '#f4f5f7', color: '#374151' };
    }
  };

  const getCompletionColor = (percent: number) => {
    if (percent >= 80) return '#16a34a'; // green
    if (percent >= 50) return '#d97706'; // amber
    return '#dc2626'; // red
  };

  const getTypeIcon = (type: string) => {
    if (type === 'document') return <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M8 1H4a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V4L8 1z"/><path d="M8 1v3h3"/></svg>;
    if (type === 'form') return <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><rect x="2" y="2" width="10" height="10" rx="1.5"/><path d="M5 5h4M5 7h4M5 9h2"/></svg>;
    return <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M3 7l2.5 2.5 5.5-5.5"/></svg>;
  };

  const getTypeBg = (type: string) => {
    if (type === 'document') return { bg: '#dbeafe', color: '#1d4ed8' };
    if (type === 'form') return { bg: '#ede9fe', color: '#6d28d9' };
    return { bg: '#dcfce7', color: '#15803d' };
  };

  const selectStyle: React.CSSProperties = { padding: '8px 30px 8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', background: '#fff', color: '#111827', cursor: 'pointer', fontFamily: 'inherit', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '14px' };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '22px', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="#6d28d9" strokeWidth="1.6" width="20" height="20"><path d="M9 3H4a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-5M8 12l3-3m0 0l4-4m-4 4v4m0-4H7"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.3px', margin: 0 }}>DSO Requests</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Manage requests for documents, forms, and confirmations.</p>
          </div>
        </div>
        <button onClick={onCreateNew} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M7 2v10M2 7h10"/></svg>
          Create Request Action
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { num: requests.length, label: 'Total Requests', iconColor: '#dbeafe', iconStroke: '#1d4ed8', icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><rect x="4" y="2" width="14" height="18" rx="2"/><path d="M8 7h6M8 11h6M8 15h4"/></svg> },
          { num: requests.filter(r => r.status === 'active').length, label: 'Active', iconColor: '#dcfce7', iconStroke: '#15803d', icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M2 11l18-8-7 18-4-7-7-3z"/></svg> },
          { num: requests.filter(r => r.status === 'completed').length, label: 'Completed', iconColor: '#ede9fe', iconStroke: '#6d28d9', icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="11" cy="11" r="8"/><path d="M7.5 11l2.5 2.5 4.5-4.5"/></svg> },
          { num: requests.filter(r => r.status === 'overdue').length, label: 'Overdue', iconColor: '#fee2e2', iconStroke: '#b91c1c', icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="11" cy="11" r="8"/><path d="M11 7v4l2.5 1.5"/></svg> }
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.iconColor, color: s.iconStroke }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', marginTop: '6px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', background: '#fff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15"><circle cx="7" cy="7" r="5"/><path d="M10.5 10.5L14 14"/></svg>
          </div>
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
          <option value="all">All Types</option>
          <option value="document">Document Upload</option>
          <option value="form">Form Submission</option>
          <option value="confirmation">Confirmation</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Main List */}
      <div>
        {loading ? (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '60px 20px', textAlign: 'center' }}>
            Loading requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '60px 20px', textAlign: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1" width="48" height="48" style={{ margin: '0 auto 16px' }}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>No Request Actions Found</h3>
            <p style={{ fontSize: '13.5px', color: '#6b7280', margin: '0 0 16px' }}>{searchQuery || filterType !== 'all' || filterStatus !== 'all' ? 'No requests match your current filters.' : 'Create your first request action to get started.'}</p>
            <button onClick={onCreateNew} style={{ padding: '8px 16px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Create Request Action
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredRequests.map(req => {
              const bgInfo = getTypeBg(req.type);
              const statusCfg = getStatusBadge(req.status);
              return (
                <div key={req.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: bgInfo.bg, color: bgInfo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getTypeIcon(req.type)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#111827' }}>{req.title}</span>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 500, background: statusCfg.background, color: statusCfg.color, textTransform: 'capitalize' }}>
                          {req.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: '#6b7280' }}>
                        <span style={{ textTransform: 'capitalize' }}>{req.type}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><circle cx="7" cy="4" r="2.5"/><path d="M2.5 13c0-3 9-3 9 0"/></svg>
                          {req.sentTo === 'Single' ? req.targetStudentName || 'Student' : `Bulk (${req.targetCount} students)`}
                        </span>
                        {req.deadline && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><rect x="2" y="2" width="10" height="10" rx="2"/><path d="M7 4v3l2 2"/></svg>
                            Due: {new Date(req.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Completion progress + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ width: '130px', textAlign: 'right' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#111827', marginBottom: '6px' }}>
                        {req.completedCount} / {req.totalCount} completed
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${req.completionPercent}%`, height: '100%', background: getCompletionColor(req.completionPercent), borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', width: '32px' }}>{req.completionPercent}%</span>
                      </div>
                    </div>
                    <button onClick={() => onViewDetail(req.id)} style={{ padding: '8px 14px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'} onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" width="13" height="13"><path d="M13 7c0-3-6-5-6-5S1 4 1 7s6 5 6 5 6-2 6-5z"/><circle cx="7" cy="7" r="2"/></svg>
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}