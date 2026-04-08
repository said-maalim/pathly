/**
 * RequestProcessingView — Request review/detail page refactored to the Pathly
 * design system (inline styles, DM Sans, #f4f5f7 bg, white surface cards).
 *
 * Preserves: renderRequestDetails by type, approve/reject/info-needed handlers,
 * backend API call, internal notes, message to student, timeline.
 */
import { useState } from 'react';
import { apiPut } from '../lib/api-client';

interface RequestProcessingViewProps {
  request: any;
  onBack: () => void;
  onUpdate: (updatedRequest: any) => void;
  userData?: any;
}

// ── Badge helper ────────────────────────────────────────────────────────────
function statusStyle(s: string): React.CSSProperties {
  const m: Record<string, React.CSSProperties> = {
    New:            { background: '#dbeafe', color: '#1d4ed8' },
    'Under Review': { background: '#ede9fe', color: '#6d28d9' },
    'Info Needed':  { background: '#fef9c3', color: '#854d0e' },
    Approved:       { background: '#dcfce7', color: '#166534' },
    Rejected:       { background: '#fee2e2', color: '#991b1b' },
  };
  return m[s] ?? { background: '#f4f5f7', color: '#6b7280' };
}
function priorityStyle(p: string): React.CSSProperties {
  const m: Record<string, React.CSSProperties> = {
    Urgent: { background: '#fee2e2', color: '#991b1b' },
    High:   { background: '#fff7ed', color: '#9a3412' },
    Normal: { background: '#f4f5f7', color: '#374151' },
    Low:    { background: '#dbeafe', color: '#1d4ed8' },
  };
  return m[p] ?? m.Normal;
}

const badgeBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
};

export function RequestProcessingView({ request, onBack, onUpdate, userData }: RequestProcessingViewProps) {
  const [status, setStatus] = useState(request.status);
  const [priority, setPriority] = useState(request.priority);
  const [assignedTo, setAssignedTo] = useState(request.assignedTo || 'unassigned');
  const [newNote, setNewNote] = useState('');
  const [internalNotes, setInternalNotes] = useState<string[]>(request.internalNotes || []);
  const [messageToStudent, setMessageToStudent] = useState('');

  const dsoOfficers = ['Dr. Johnson', 'Dr. Smith', 'Dr. Williams', 'Dr. Brown'];

  const initials = request.studentName?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddNote = () => {
    if (newNote.trim()) {
      setInternalNotes([...internalNotes, `[${new Date().toLocaleString()}] ${newNote}`]);
      setNewNote('');
    }
  };

  const handleSendMessage = () => {
    if (messageToStudent.trim()) {
      alert(`Message sent to ${request.studentName}:\n\n${messageToStudent}`);
      setMessageToStudent('');
    }
  };

  const handleSaveChanges = () => {
    onUpdate({ ...request, status, priority, assignedTo: assignedTo === 'unassigned' ? undefined : assignedTo, internalNotes });
    alert('Request updated successfully!');
  };

  const updateRequestStatusInBackend = async (u: any) => {
    await apiPut(`/requests/${u.id}/status`, { status: u.status.toLowerCase(), notes: u.internalNotes?.join('\n') || '' });
  };

  const handleApprove = async () => {
    try {
      const u = { ...request, status: 'Approved', priority, assignedTo: assignedTo === 'unassigned' ? undefined : assignedTo, internalNotes: [...internalNotes, `[${new Date().toLocaleString()}] Request approved`] };
      await updateRequestStatusInBackend(u);
      onUpdate(u); setStatus('Approved');
      alert(`${request.requestType} approved for ${request.studentName}.`);
    } catch { alert('Failed to update request status.'); }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    try {
      const u = { ...request, status: 'Rejected', priority, assignedTo: assignedTo === 'unassigned' ? undefined : assignedTo, internalNotes: [...internalNotes, `[${new Date().toLocaleString()}] Request rejected`] };
      await updateRequestStatusInBackend(u);
      onUpdate(u); setStatus('Rejected');
      alert('Request rejected.');
    } catch { alert('Failed to reject request.'); }
  };

  const handleRequestMoreInfo = async () => {
    try {
      const u = { ...request, status: 'Info Needed', priority, assignedTo: assignedTo === 'unassigned' ? undefined : assignedTo, internalNotes };
      await updateRequestStatusInBackend(u);
      onUpdate(u); setStatus('Info Needed');
      alert('Status updated to "Info Needed".');
    } catch { alert('Failed to update status.'); }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px 22px', marginBottom: '14px' };
  const cardTitle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: '#111827', marginBottom: '18px' };
  const label: React.CSSProperties = { fontSize: '11.5px', color: '#9ca3af', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' };
  const value: React.CSSProperties = { fontSize: '13.5px', color: '#111827', fontWeight: 500 };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' };
  const sideCard: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 20px', marginBottom: '14px' };
  const sideTitle: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '14px' };
  const selectStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', background: '#fff', color: '#111827' };

  // ── Request details renderer ──────────────────────────────────────────────
  const renderDetails = () => {
    const d = request.details;
    if (!d || Object.keys(d).length === 0) return <p style={{ color: '#9ca3af', fontSize: '13px' }}>No additional details provided</p>;

    // Generic renderer for all types
    const fields: { label: string; value: string }[] = [];
    const formatKey = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();

    switch (request.requestType) {
      case 'CPT Application':
        fields.push({ label: 'Employer Name', value: d.employerName }, { label: 'Position', value: d.position }, { label: 'Start Date', value: d.startDate }, { label: 'End Date', value: d.endDate }, { label: 'Hours Per Week', value: `${d.hoursPerWeek} hours` }, { label: 'Compensation', value: d.isPaid ? `$${d.salary}/hour` : 'Unpaid' });
        break;
      case 'OPT Application':
        fields.push({ label: 'OPT Type', value: d.optType }, { label: 'Degree Level', value: d.degreeLevel }, { label: 'Major', value: d.major }, { label: 'Graduation Date', value: d.graduationDate }, { label: 'Requested Start Date', value: d.requestedStartDate });
        break;
      case 'Travel Signature':
        fields.push({ label: 'Destination', value: d.destination || d.travelDestination || 'N/A' }, { label: 'Purpose', value: d.travelReason || d.purpose || 'N/A' }, { label: 'Departure Date', value: d.departureDate || 'N/A' }, { label: 'Return Date', value: d.returnDate || 'N/A' });
        break;
      case 'I-20 Replacement':
        fields.push({ label: 'Reason', value: d.reason }, { label: 'Police Report Filed', value: d.policeReport ? 'Yes' : 'No' }, { label: 'Details', value: d.lastKnownLocation });
        break;
      case 'Program Extension':
        fields.push({ label: 'Current Program End', value: d.currentProgramEnd }, { label: 'Requested Extension', value: d.requestedExtensionDate }, { label: 'Reason', value: d.reason }, { label: 'Explanation', value: d.explanation });
        break;
      case 'Reduced Course Load':
        fields.push({ label: 'Current Course Load', value: `${d.currentCourseLoad} credits` }, { label: 'Requested Course Load', value: `${d.requestedCourseLoad} credits` }, { label: 'Reason', value: d.reason }, { label: 'Explanation', value: d.explanation });
        break;
      case 'Address Change':
        fields.push({ label: 'Previous Address', value: d.previousAddress }, { label: 'New Address', value: d.newAddress }, { label: 'Move Date', value: d.moveDate }, { label: 'Phone Number', value: d.phoneNumber });
        break;
      case 'Status Clarification':
        fields.push({ label: 'Question', value: d.question }, { label: 'Situation', value: d.situation });
        break;
      default:
        Object.entries(d).forEach(([k, v]) => { if (v) fields.push({ label: formatKey(k), value: typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v) }); });
    }

    return (
      <div style={grid2}>
        {fields.map(f => (
          <div key={f.label}><div style={label}>{f.label}</div><div style={value}>{f.value || 'N/A'}</div></div>
        ))}
      </div>
    );
  };

  // ── Timeline dots ─────────────────────────────────────────────────────────
  const dotColor = (s: string) => {
    const m: Record<string, string> = { New: '#2563eb', 'Under Review': '#7c3aed', Approved: '#16a34a', Rejected: '#dc2626', 'Info Needed': '#d97706' };
    return m[s] ?? '#d1d5db';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 0, background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* Back + header row */}
      <div style={{ marginBottom: '22px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 500, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 0', marginBottom: '16px' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#111827')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15"><path d="M10 3L5 8l5 5"/></svg>
          Back to Request List
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.3px', margin: 0 }}>{request.requestType}</h1>
              <span style={{ fontSize: '11.5px', color: '#9ca3af', background: '#f4f5f7', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '4px', fontFamily: "'DM Mono', monospace" }}>
                {request.id.length > 12 ? request.id.slice(0, 8) + '…' : request.id}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>{request.category}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...badgeBase, ...statusStyle(status), fontSize: '13px', padding: '5px 14px' }}>{status}</span>
            <span style={{ ...badgeBase, ...priorityStyle(priority), fontSize: '13px', padding: '5px 14px' }}>{priority}</span>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }}>

        {/* ── LEFT: info cards ── */}
        <div>

          {/* Student Information */}
          <div style={card}>
            <div style={cardTitle}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="15" height="15"><circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-3 10-3 10 0"/></svg>
              Student Information
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '15px', fontWeight: 600, flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{request.studentName}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{request.studentEmail}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', fontSize: '12.5px', color: '#6b7280' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.3" width="13" height="13"><circle cx="7" cy="7" r="5.5"/><path d="M5 7l1.5 1.5 3-3"/></svg>
                ID: {request.studentId ? (request.studentId.length > 12 ? request.studentId.slice(0, 8) + '…' : request.studentId) : 'N/A'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.3" width="13" height="13"><rect x="1" y="3" width="12" height="8" rx="1"/><path d="M1 5.5h12"/></svg>
                F-1 Visa
              </span>
            </div>
          </div>

          {/* Request Details */}
          <div style={card}>
            <div style={cardTitle}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="15" height="15"><rect x="3" y="2" width="10" height="12" rx="1.5"/><path d="M6 5h4M6 8h4M6 11h2"/></svg>
              Request Details
            </div>
            {renderDetails()}
          </div>

          {/* Attached Documents */}
          {request.documents && request.documents.length > 0 && (
            <div style={card}>
              <div style={cardTitle}>
                <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="15" height="15"><path d="M9 2H5a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V5L9 2z"/><path d="M9 2v3h3"/></svg>
                Attached Documents ({request.documents.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {request.documents.map((doc: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.3" width="14" height="14"><path d="M8 1H4a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V4L8 1z"/><path d="M8 1v3h3"/></svg>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{doc.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>{doc.size} • Uploaded {doc.uploadDate}</div>
                      </div>
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px' }}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M7 2v7M4 6l3 3 3-3M2 11h10"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div style={card}>
            <div style={cardTitle}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="15" height="15"><path d="M2 3h12v8a1 1 0 01-1 1H7l-3 2v-2H3a1 1 0 01-1-1V3z"/></svg>
              Internal Notes (DSO Only)
            </div>
            {internalNotes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {internalNotes.map((note, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap' }}>
                    {note}
                  </div>
                ))}
              </div>
            )}
            <textarea
              placeholder="Add an internal note (visible only to DSO staff)..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', color: '#111827', marginBottom: '10px' }}
            />
            <button onClick={handleAddNote} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#111827', fontFamily: 'inherit' }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M7 2v10M2 7h10"/></svg>
              Add Note
            </button>
          </div>

          {/* Message Student */}
          <div style={{ ...card, marginBottom: 0 }}>
            <div style={cardTitle}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="15" height="15"><path d="M2 3h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 0l6 5 6-5"/></svg>
              Message Student
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', fontSize: '12.5px', color: '#1d4ed8', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><circle cx="7" cy="7" r="5.5"/><path d="M7 5v3M7 9.5v.5"/></svg>
              This message will be sent to {request.studentEmail}
            </div>
            <textarea
              placeholder="Type your message to the student..."
              value={messageToStudent}
              onChange={e => setMessageToStudent(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', color: '#111827', marginBottom: '10px' }}
            />
            <button onClick={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M1 7l12-5-4 12-3-5-5-2z"/></svg>
              Send Message
            </button>
          </div>
        </div>

        {/* ── RIGHT: sidebar ── */}
        <div>

          {/* Quick Actions */}
          <div style={sideCard}>
            <div style={sideTitle}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleApprove} disabled={status === 'Approved'} style={{ width: '100%', padding: '9px 14px', borderRadius: '6px', background: status === 'Approved' ? '#d1d5db' : '#16a34a', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: status === 'Approved' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="7" cy="7" r="5.5"/><path d="M5 7l1.5 1.5 3-3"/></svg>
                Approve Request
              </button>
              <button onClick={handleRequestMoreInfo} style={{ width: '100%', padding: '9px 14px', borderRadius: '6px', background: '#fff', color: '#d97706', border: '1px solid #fbbf24', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="7" cy="7" r="5.5"/><path d="M7 5v3M7 9.5v.5"/></svg>
                Request More Info
              </button>
              <button onClick={handleReject} disabled={status === 'Rejected'} style={{ width: '100%', padding: '9px 14px', borderRadius: '6px', background: '#fff', color: status === 'Rejected' ? '#d1d5db' : '#dc2626', border: `1px solid ${status === 'Rejected' ? '#d1d5db' : '#fca5a5'}`, fontSize: '13px', fontWeight: 500, cursor: status === 'Rejected' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="7" cy="7" r="5.5"/><path d="M5 5l4 4M9 5l-4 4"/></svg>
                Reject Request
              </button>
            </div>
          </div>

          {/* Update Request */}
          <div style={sideCard}>
            <div style={sideTitle}>Update Request</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Status</div>
                <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
                  <option value="New">New</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Info Needed">Info Needed</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Priority</div>
                <select value={priority} onChange={e => setPriority(e.target.value)} style={selectStyle}>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Assign To</div>
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={selectStyle}>
                  <option value="unassigned">Unassigned</option>
                  {dsoOfficers.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <button onClick={handleSaveChanges} style={{ width: '100%', padding: '9px 14px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ ...sideCard, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', ...sideTitle }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="#2563eb" strokeWidth="1.5" width="14" height="14"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 2"/></svg>
              Timeline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Submitted */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', marginTop: '5px', flexShrink: 0 }} />
                <div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Request Submitted</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>{request.submittedDate}</div></div>
              </div>
              {/* Current Status */}
              {(status === 'Under Review' || status === 'Info Needed') && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor(status), marginTop: '5px', flexShrink: 0 }} />
                  <div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{status}</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Current Status</div></div>
                </div>
              )}
              {status === 'Approved' && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', marginTop: '5px', flexShrink: 0 }} />
                  <div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Approved</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Request approved</div></div>
                </div>
              )}
              {status === 'Rejected' && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', marginTop: '5px', flexShrink: 0 }} />
                  <div><div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Rejected</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Request rejected</div></div>
                </div>
              )}
              {/* Due date */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d1d5db', marginTop: '5px', flexShrink: 0 }} />
                <div><div style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>Due Date</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>{request.dueDate}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
