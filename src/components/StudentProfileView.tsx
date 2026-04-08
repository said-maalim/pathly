/**
 * StudentProfileView — matches the provided HTML reference exactly.
 *
 * Layout: back/create-request header → identity strip → 2-col grid
 *   Left: Personal Info, Program, Visa, SEVIS (with Update dialog), Passport
 *   Right: Status Summary (colored rows), Important Dates, Quick Actions
 *
 * Preserves: SEVIS update API call, onCreateRequestAction, all data fields.
 */
import { useState } from 'react';
import { projectId } from '../utils/supabase/info';

interface StudentProfileViewProps {
  student: any;
  onBack: () => void;
  userData?: any;
  onCreateRequestAction?: (studentId: string, studentName: string) => void;
}

function fmt(d?: string) {
  if (!d) return 'Not set';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '??';
}

// Badge helpers
function badgeStyle(type: string): React.CSSProperties {
  const m: Record<string, React.CSSProperties> = {
    f1:         { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', fontFamily: "'DM Mono', monospace", fontSize: '11px' },
    j1:         { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', fontFamily: "'DM Mono', monospace", fontSize: '11px' },
    student:    { background: '#dbeafe', color: '#1d4ed8' },
    pending:    { background: '#fef9c3', color: '#854d0e' },
    active:     { background: '#dcfce7', color: '#166534' },
    compliance: { background: '#dbeafe', color: '#1d4ed8' },
    notset:     { background: '#f4f5f7', color: '#9ca3af', border: '1px solid #e5e7eb' },
    na:         { background: '#f4f5f7', color: '#9ca3af', border: '1px solid #e5e7eb' },
  };
  return m[type.toLowerCase().replace('-', '').replace(' ', '')] ?? m.na;
}

function B({ label, type }: { label: string; type: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', ...badgeStyle(type) }}>
      {label}
    </span>
  );
}

export function StudentProfileView({ student, onBack, userData, onCreateRequestAction }: StudentProfileViewProps) {
  const [updating, setUpdating] = useState(false);
  const [sevisDialogOpen, setSevisDialogOpen] = useState(false);
  const [sevisForm, setSevisForm] = useState({
    sevisStatus: student.visaProfile?.sevisStatus || 'active',
    compliance: student.visaProfile?.compliance || 'compliant',
    notes: '',
  });

  const handleUpdateSEVIS = async () => {
    try {
      setUpdating(true);
      const token = userData?.data?.session?.access_token;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/dso/sevis/${student.id}`,
        { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sevisStatus: sevisForm.sevisStatus, compliance: sevisForm.compliance, notes: sevisForm.notes }) }
      );
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      alert('SEVIS record updated successfully');
      setSevisDialogOpen(false);
      window.location.reload();
    } catch (e) { alert(`Failed: ${(e as Error).message}`); }
    finally { setUpdating(false); }
  };

  // ── Shared inline style helpers ────────────────────────────────────────────
  const infoCardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px 22px', marginBottom: '14px',
  };
  const infoCardTitle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: '#111827',
  };
  const infoGrid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px',
  };
  const infoLabel: React.CSSProperties = {
    fontSize: '11.5px', color: '#9ca3af', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em',
  };
  const infoValue: React.CSSProperties = {
    fontSize: '13.5px', color: '#111827', fontWeight: 500,
  };
  const iconVal: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13.5px', color: '#111827', fontWeight: 500,
  };
  const sideCard: React.CSSProperties = {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 20px', marginBottom: '14px',
  };
  const sideTitle: React.CSSProperties = {
    fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '14px',
  };

  const visaStatus = student.visaProfile?.status || 'pending';
  const sevisStatus = student.visaProfile?.sevisStatus || 'Not set';
  const compliance = student.visaProfile?.compliance || 'N/A';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 0, background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* Back + Create Request */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '13.5px', fontWeight: 500, color: '#6b7280',
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          padding: '6px 0', transition: 'color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#111827')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15"><path d="M10 3L5 8l5 5"/></svg>
          Back to Students
        </button>
        <button
          onClick={() => onCreateRequestAction?.(student.id, student.name)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 18px', borderRadius: '6px',
            background: '#2563eb', color: '#fff', border: 'none',
            fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
          onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 3v10M3 8h10"/></svg>
          Create Request
        </button>
      </div>

      {/* Identity strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
        padding: '18px 22px', marginBottom: '18px',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '17px', fontWeight: 600, letterSpacing: '0.5px',
        }}>
          {initials(student.name)}
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>{student.name}</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>{student.email}</div>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>

        {/* ── LEFT: Info cards ── */}
        <div>

          {/* Personal Information */}
          <div style={infoCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={infoCardTitle}>
                <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="15" height="15"><circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-3 10-3 10 0"/></svg>
                Personal Information
              </div>
            </div>
            <div style={infoGrid}>
              <div><div style={infoLabel}>Full Name</div><div style={infoValue}>{student.name}</div></div>
              <div><div style={infoLabel}>Email</div><div style={infoValue}>{student.email}</div></div>
              <div><div style={infoLabel}>Student ID</div><div style={infoValue}>{student.student_id_number || 'Not set'}</div></div>
              <div><div style={infoLabel}>User Type</div><B label={student.userType || 'student'} type="student" /></div>
            </div>
          </div>

          {/* Program Information */}
          <div style={infoCardStyle}>
            <div style={{ marginBottom: '18px' }}>
              <div style={infoCardTitle}>
                <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="15" height="15"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm2 4h6M5 8h4M5 11h3"/></svg>
                Program Information
              </div>
            </div>
            <div style={infoGrid}>
              <div><div style={infoLabel}>Degree Level</div><div style={infoValue}>{student.visaProfile?.degreeLevel || 'Not set'}</div></div>
              <div><div style={infoLabel}>Major</div><div style={infoValue}>{student.visaProfile?.major || 'Not set'}</div></div>
              <div><div style={infoLabel}>Program of Study</div><div style={infoValue}>{student.visaProfile?.programOfStudy || 'Not set'}</div></div>
              <div><div style={infoLabel}>Expected Graduation</div><div style={infoValue}>{fmt(student.visaProfile?.expectedGradDate)}</div></div>
            </div>
          </div>

          {/* Visa Information */}
          <div style={infoCardStyle}>
            <div style={{ marginBottom: '18px' }}>
              <div style={infoCardTitle}>
                <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="15" height="15"><rect x="1" y="4" width="14" height="9" rx="1.5"/><path d="M1 7h14"/></svg>
                Visa Information
              </div>
            </div>
            <div style={infoGrid}>
              <div>
                <div style={infoLabel}>Visa Type</div>
                <B label={student.visaProfile?.visaType || 'Not set'} type={student.visaProfile?.visaType ? student.visaProfile.visaType.toLowerCase().replace('-','') : 'notset'} />
              </div>
              <div>
                <div style={infoLabel}>Visa Status</div>
                <B label={visaStatus} type={visaStatus.toLowerCase()} />
              </div>
              <div>
                <div style={infoLabel}>Expiration Date</div>
                <div style={iconVal}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="13" height="13"><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M2 7h12M5 2v2M11 2v2"/></svg>
                  {fmt(student.visaProfile?.expirationDate)}
                </div>
              </div>
              <div>
                <div style={infoLabel}>Last Updated</div>
                <div style={iconVal}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="13" height="13"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                  {fmt(student.visaProfile?.lastUpdated)}
                </div>
              </div>
            </div>
          </div>

          {/* SEVIS Information */}
          <div style={infoCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={infoCardTitle}>
                <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="15" height="15"><circle cx="8" cy="8" r="6"/><path d="M5.5 8l2 2 3-3"/></svg>
                SEVIS Information
              </div>
              <button
                onClick={() => setSevisDialogOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: '#f4f5f7', border: '1px solid #e5e7eb',
                  fontSize: '12.5px', fontWeight: 500, cursor: 'pointer',
                  color: '#111827', fontFamily: 'inherit', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e9eaec')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f4f5f7')}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M2 8a6 6 0 1110.7-3.7M13 2v4H9"/></svg>
                Update SEVIS
              </button>
            </div>
            <div style={infoGrid}>
              <div>
                <div style={infoLabel}>SEVIS Status</div>
                <B label={sevisStatus} type={sevisStatus.toLowerCase() === 'active' ? 'active' : 'na'} />
              </div>
              <div>
                <div style={infoLabel}>Compliance</div>
                <B label={compliance} type={compliance.toLowerCase().includes('compliance') ? 'compliance' : 'na'} />
              </div>
            </div>
          </div>

          {/* Passport Information */}
          <div style={{ ...infoCardStyle, marginBottom: 0 }}>
            <div style={{ marginBottom: '18px' }}>
              <div style={infoCardTitle}>
                <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="15" height="15"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm2 4h6M5 8h4"/></svg>
                Passport Information
              </div>
            </div>
            <div style={infoGrid}>
              <div>
                <div style={infoLabel}>Passport Status</div>
                <B label={student.visaProfile?.passportStatus || 'Not set'} type={student.visaProfile?.passportStatus ? 'active' : 'notset'} />
              </div>
              <div>
                <div style={infoLabel}>Expiration Date</div>
                <div style={iconVal}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="13" height="13"><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M2 7h12M5 2v2M11 2v2"/></svg>
                  {fmt(student.visaProfile?.passportExpirationDate)}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT: sidebar cards ── */}
        <div>

          {/* Status Summary */}
          <div style={sideCard}>
            <div style={sideTitle}>Status Summary</div>
            {/* Green row — Visa */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '6px', marginBottom: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 500, color: '#15803d' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/><path d="M5.5 8l2 2 3-3"/></svg>
                Visa
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 500, padding: '2px 9px', borderRadius: '20px', ...(visaStatus.toLowerCase() === 'active' ? { background: '#dcfce7', color: '#166534' } : { background: '#fef9c3', color: '#854d0e' }) }}>
                {visaStatus}
              </span>
            </div>
            {/* Blue row — SEVIS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '6px', marginBottom: '6px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 500, color: '#1d4ed8' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                SEVIS
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 500, padding: '2px 9px', borderRadius: '20px', ...(sevisStatus.toLowerCase() === 'active' ? { background: '#dcfce7', color: '#166534' } : { background: '#f4f5f7', color: '#9ca3af' }) }}>
                {sevisStatus}
              </span>
            </div>
            {/* Indigo row — Compliance */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '6px', background: '#eef2ff', border: '1px solid #c7d2fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 500, color: '#4338ca' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm2 4h6M5 8h4"/></svg>
                Compliance
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 500, padding: '2px 9px', borderRadius: '20px', ...(compliance.toLowerCase().includes('compliance') ? { background: '#dbeafe', color: '#1d4ed8' } : { background: '#f4f5f7', color: '#9ca3af' }) }}>
                {compliance}
              </span>
            </div>
          </div>

          {/* Important Dates */}
          <div style={sideCard}>
            <div style={sideTitle}>Important Dates</div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11.5px', color: '#9ca3af', fontWeight: 500, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Visa Expiration</div>
              <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#111827' }}>{fmt(student.visaProfile?.expirationDate)}</div>
            </div>
            <div style={{ height: '1px', background: '#e5e7eb', margin: '14px 0' }} />
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11.5px', color: '#9ca3af', fontWeight: 500, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Passport Expiration</div>
              <div style={{ fontSize: '13.5px', fontWeight: student.visaProfile?.passportExpirationDate ? 500 : 400, color: student.visaProfile?.passportExpirationDate ? '#111827' : '#9ca3af' }}>
                {fmt(student.visaProfile?.passportExpirationDate)}
              </div>
            </div>
            <div style={{ height: '1px', background: '#e5e7eb', margin: '14px 0' }} />
            <div>
              <div style={{ fontSize: '11.5px', color: '#9ca3af', fontWeight: 500, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Profile Update</div>
              <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#111827' }}>{fmt(student.visaProfile?.lastUpdated)}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ ...sideCard, marginBottom: 0 }}>
            <div style={sideTitle}>Quick Actions</div>
            {[
              { label: 'Create New Request',
                icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M8 3v10M3 8h10"/></svg>,
                onClick: () => onCreateRequestAction?.(student.id, student.name) },
              { label: 'Send Email',
                icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M2 3h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 0l6 5 6-5"/></svg>,
                onClick: () => {} },
              { label: 'View Documents',
                icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm2 4h6M5 8h4M5 11h3"/></svg>,
                onClick: () => {} },
            ].map(({ label, icon, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '9px 12px', borderRadius: '6px',
                  background: '#fff', border: '1px solid #e5e7eb',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  color: '#111827', fontFamily: 'inherit',
                  transition: 'background 0.15s', textAlign: 'left', marginBottom: '7px',
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

      {/* ── SEVIS Update Modal ── */}
      {sevisDialogOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }} onClick={() => setSevisDialogOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '12px', padding: '24px',
              width: '100%', maxWidth: '440px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Update SEVIS Record</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
              Update SEVIS status and compliance information for {student.name}
            </p>

            {/* SEVIS Status */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>SEVIS Status</label>
              <select
                value={sevisForm.sevisStatus}
                onChange={e => setSevisForm({ ...sevisForm, sevisStatus: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', background: '#fff', color: '#111827' }}
              >
                <option value="active">Active</option>
                <option value="terminated">Terminated</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Compliance */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Compliance Status</label>
              <select
                value={sevisForm.compliance}
                onChange={e => setSevisForm({ ...sevisForm, compliance: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', background: '#fff', color: '#111827' }}
              >
                <option value="compliant">Compliant</option>
                <option value="non-compliant">Non-Compliant</option>
                <option value="at-risk">At Risk</option>
              </select>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Notes</label>
              <textarea
                value={sevisForm.notes}
                onChange={e => setSevisForm({ ...sevisForm, notes: e.target.value })}
                placeholder="Optional notes about this update..."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', color: '#111827' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleUpdateSEVIS}
                disabled={updating}
                style={{
                  flex: 1, padding: '9px 16px', borderRadius: '6px',
                  background: '#2563eb', color: '#fff', border: 'none',
                  fontSize: '13.5px', fontWeight: 500, cursor: updating ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: updating ? 0.6 : 1,
                }}
              >
                {updating ? 'Updating...' : 'Update SEVIS'}
              </button>
              <button
                onClick={() => setSevisDialogOpen(false)}
                style={{
                  padding: '9px 16px', borderRadius: '6px',
                  background: '#fff', color: '#374151', border: '1px solid #e5e7eb',
                  fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}