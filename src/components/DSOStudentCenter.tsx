/**
 * DSOStudentCenter — Student Center page matching the provided HTML reference.
 *
 * Preserves all existing data fetching, filtering, sorting, and StudentProfileView
 * integration — only the render output is rewritten to match the reference design.
 *
 * Design tokens from reference:
 *   --bg: #f4f5f7, --surface: #ffffff, --border: #e5e7eb
 *   --blue: #2563eb, --green: #16a34a, --red: #dc2626, --amber: #d97706
 *   Stat cards with 46px rounded-12 icons, DM Sans font
 *   Tab bar: dark nav bg active, filter bar, student cards, analytics bar charts
 */
import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
import { StudentProfileView } from './StudentProfileView';

interface DSOStudentCenterProps {
  onBack: () => void;
  onLogout?: () => void;
  userName?: string;
  userData?: any;
  onCreateRequestAction?: (studentId: string, studentName: string) => void;
}

interface Student {
  id: string;
  student_id_number?: string;
  name: string;
  email: string;
  userType: string;
  universityId: string;
  createdAt: string;
  visaProfile: {
    visaType?: string;
    status?: string;
    expirationDate?: string;
    i20ExpirationDate?: string;
    sevisStatus?: string;
    compliance?: string;
    passportStatus?: string;
    passportExpirationDate?: string;
    lastUpdated?: string;
    degreeLevel?: string;
    major?: string;
    programOfStudy?: string;
    expectedGradDate?: string;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateString?: string) {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Badge styling matching the reference
function badgeStyle(type: string): React.CSSProperties {
  const styles: Record<string, React.CSSProperties> = {
    'f1':         { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', fontFamily: "'DM Mono', monospace", fontSize: '11px' },
    'j1':         { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', fontFamily: "'DM Mono', monospace", fontSize: '11px' },
    'm1':         { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', fontFamily: "'DM Mono', monospace", fontSize: '11px' },
    'active':     { background: '#dcfce7', color: '#166534' },
    'pending':    { background: '#fef9c3', color: '#854d0e' },
    'expired':    { background: '#fee2e2', color: '#991b1b' },
    'expiring soon': { background: '#fee2e2', color: '#991b1b' },
    'compliance': { background: '#dbeafe', color: '#1d4ed8' },
    'na':         { background: '#f4f5f7', color: '#9ca3af', border: '1px solid #e5e7eb' },
  };
  return styles[type.toLowerCase()] ?? styles['na'];
}

function Badge({ label, type }: { label: string; type: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
      ...badgeStyle(type),
    }}>
      {label}
    </span>
  );
}

function visaBadgeType(visaType?: string) {
  if (!visaType) return 'na';
  return visaType.toLowerCase().replace('-', '');
}

function statusBadgeType(status?: string) {
  if (!status) return 'na';
  return status.toLowerCase();
}

function complianceBadgeType(compliance?: string) {
  if (!compliance) return 'na';
  if (compliance.toLowerCase().includes('compliance')) return 'compliance';
  return 'na';
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DSOStudentCenter({ onBack, onLogout, userName = 'DSO Admin', userData, onCreateRequestAction }: DSOStudentCenterProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filterVisaType, setFilterVisaType] = useState('all');
  const [filterSevisStatus, setFilterSevisStatus] = useState('all');
  const [filterPassportStatus, setFilterPassportStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'visa' | 'sevis'>('name');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentTab, setCurrentTab] = useState<'list' | 'analytics'>('list');

  const userType = userData?.data?.user?.user_metadata?.userType;
  const universityId = userData?.data?.user?.user_metadata?.schoolId || userData?.data?.user?.user_metadata?.universityId || 'stanford';

  useEffect(() => {
    if (userType && userType !== 'dso') {
      alert(`You are logged in as a ${userType.toUpperCase()}. This is the DSO portal.`);
    }
  }, [userType]);

  useEffect(() => { fetchStudents(); }, [userData]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = userData?.data?.session?.access_token;
      if (!token) { console.error('No access token'); return; }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/students/school/${universityId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) { console.error('Error fetching students:', await response.json()); return; }

      const result = await response.json();
      const studentData = result.students || result.data || (Array.isArray(result) ? result : []);
      const mapped = studentData.map((s: any) => ({
        id: s.id,
        student_id_number: s.student_id_number ?? null,
        name: s.user?.full_name || `${s.user?.first_name ?? ''} ${s.user?.last_name ?? ''}`.trim() || s.user?.email || 'Unknown Student',
        email: s.user?.email ?? s.email ?? '',
        userType: s.user?.role ?? 'student',
        universityId: s.school_id,
        createdAt: s.created_at,
        visaProfile: {
          visaType: s.visa_type ?? undefined,
          status: s.visa_status ?? undefined,
          expirationDate: s.i20_expiration_date ?? s.visa_expiration_date ?? undefined,
          i20ExpirationDate: s.i20_expiration_date ?? undefined,
          sevisStatus: s.sevis_status ?? undefined,
          compliance: s.compliance_status ?? undefined,
          passportStatus: s.passport_number ? 'Valid' : undefined,
          passportExpirationDate: s.passport_expiration_date ?? undefined,
          lastUpdated: s.updated_at ?? undefined,
          degreeLevel: s.degree_level ?? undefined,
          major: s.major ?? undefined,
          programOfStudy: s.program_of_study ?? undefined,
          expectedGradDate: s.expected_graduation_date ?? undefined,
        },
      }));
      setStudents(mapped);
    } catch (error) { console.error('Error fetching students:', error); }
    finally { setLoading(false); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const visaExpiringSoon = students.filter(s => {
    if (!s.visaProfile?.expirationDate) return false;
    const days = Math.ceil((new Date(s.visaProfile.expirationDate).getTime() - Date.now()) / (86400000));
    return days > 0 && days <= 90;
  }).length;

  const nonCompliant = students.filter(s => s.visaProfile?.compliance === 'non-compliant').length;
  const activeSEVIS = students.filter(s => s.visaProfile?.sevisStatus === 'active' || s.visaProfile?.sevisStatus === 'Active').length;

  // ── Filter & Sort ─────────────────────────────────────────────────────────
  const filtered = students
    .filter(s => {
      if (filterVisaType !== 'all' && s.visaProfile?.visaType !== filterVisaType) return false;
      if (filterSevisStatus !== 'all' && s.visaProfile?.sevisStatus !== filterSevisStatus) return false;
      if (filterPassportStatus !== 'all' && s.visaProfile?.passportStatus !== filterPassportStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'visa') return (a.visaProfile?.visaType || '').localeCompare(b.visaProfile?.visaType || '');
      if (sortBy === 'sevis') return (a.visaProfile?.sevisStatus || '').localeCompare(b.visaProfile?.sevisStatus || '');
      return a.name.localeCompare(b.name);
    });

  // ── Analytics distributions ───────────────────────────────────────────────
  const dist = (key: (s: Student) => string) =>
    students.reduce((a, s) => { const k = key(s); a[k] = (a[k] || 0) + 1; return a; }, {} as Record<string, number>);

  const visaDist = dist(s => s.visaProfile?.visaType || 'Not Set');
  const sevisDist = dist(s => s.visaProfile?.sevisStatus || 'Not Set');
  const compDist = dist(s => s.visaProfile?.compliance || 'N/A');
  const passDist = dist(s => s.visaProfile?.passportStatus || 'Not Set');

  // ── Profile view ──────────────────────────────────────────────────────────
  if (selectedStudent) {
    return (
      <StudentProfileView
        student={selectedStudent}
        onBack={() => { setSelectedStudent(null); fetchStudents(); }}
        userData={userData}
        onCreateRequestAction={onCreateRequestAction}
      />
    );
  }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const filterSelectStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '0 12px', height: '36px',
    background: '#f4f5f7', border: '1px solid #e5e7eb',
    borderRadius: '6px', fontSize: '13px', fontWeight: 400,
    color: '#111827', cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'inherit', appearance: 'none',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '22px', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="#2563eb" strokeWidth="1.6" width="20" height="20">
            <circle cx="10" cy="6" r="3"/><path d="M4 17c0-3.5 12-3.5 12 0"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.3px', margin: 0 }}>Student Center</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Manage student information, visa status, and compliance records.</p>
        </div>
      </div>

      {/* Stat cards — 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { num: students.length, sub: 'Active enrolled', label: 'Total Students', iconColor: '#dbeafe', iconStroke: '#1d4ed8',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="11" cy="7" r="3.5"/><path d="M4 19c0-4 14-4 14 0"/></svg> },
          { num: visaExpiringSoon, sub: 'Within 90 days', label: 'Visa Expiring Soon', iconColor: '#fef3c7', iconStroke: '#b45309',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="11" cy="11" r="8"/><path d="M11 7v4l2.5 2.5"/></svg> },
          { num: nonCompliant, sub: 'Need attention', label: 'Non-Compliant', iconColor: '#fee2e2', iconStroke: '#b91c1c',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M11 3L2 19h18L11 3z"/><path d="M11 10v4M11 16v.5"/></svg> },
          { num: activeSEVIS, sub: 'In good standing', label: 'Active SEVIS', iconColor: '#dcfce7', iconStroke: '#15803d',
            icon: <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="11" cy="11" r="8"/><path d="M7.5 11l2.5 2.5 4.5-4.5"/></svg> },
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
        {(['list', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            style={{
              padding: '7px 22px', borderRadius: '6px',
              fontSize: '13.5px', fontWeight: 500, cursor: 'pointer',
              border: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
              background: currentTab === tab ? '#1a1f2e' : 'transparent',
              color: currentTab === tab ? '#fff' : '#6b7280',
            }}
          >
            {tab === 'list' ? 'Student List' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* ── STUDENT LIST TAB ── */}
      {currentTab === 'list' && (
        <>
          {/* Filter bar */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: '220px', maxWidth: '420px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f4f5f7', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0 12px', height: '36px', fontSize: '13px', color: '#6b7280' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4"/><path d="M11 11l3 3"/></svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '13px', fontFamily: 'inherit', color: '#111827' }}
              />
            </div>

            {/* Visa Type */}
            <select value={filterVisaType} onChange={e => setFilterVisaType(e.target.value)} style={filterSelectStyle}>
              <option value="all">All Visa Types</option>
              <option value="F-1">F-1</option>
              <option value="J-1">J-1</option>
              <option value="M-1">M-1</option>
            </select>

            {/* SEVIS Status */}
            <select value={filterSevisStatus} onChange={e => setFilterSevisStatus(e.target.value)} style={filterSelectStyle}>
              <option value="all">All SEVIS Status</option>
              <option value="Active">Active</option>
              <option value="active">active</option>
              <option value="Terminated">Terminated</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Passport Status */}
            <select value={filterPassportStatus} onChange={e => setFilterPassportStatus(e.target.value)} style={filterSelectStyle}>
              <option value="all">All Passport Status</option>
              <option value="Valid">Valid</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>

            {/* Divider */}
            <div style={{ width: '100%', height: '1px', background: '#e5e7eb', margin: '4px 0' }} />

            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={filterSelectStyle}>
              <option value="name">Sort by Name</option>
              <option value="visa">Sort by Visa Type</option>
              <option value="sevis">Sort by SEVIS Status</option>
            </select>
          </div>

          {/* List header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>All Students ({filtered.length})</span>
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

          {/* Student cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>Loading students…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
              <p style={{ fontSize: '14px', marginBottom: '4px' }}>No students found</p>
              <p style={{ fontSize: '12px' }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(student => (
                <div
                  key={student.id}
                  style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px', transition: 'box-shadow 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  onClick={() => setSelectedStudent(student)}
                >
                  {/* Top row: name + email + View Profile */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{student.name}</span>
                      <span style={{ fontSize: '12.5px', color: '#9ca3af', background: '#f4f5f7', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '4px' }}>
                        {student.email}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '7px 16px', borderRadius: '6px',
                        background: '#2563eb', color: '#fff', border: 'none',
                        fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="6" r="2.5"/><path d="M2 14c0-3 12-3 12 0"/></svg>
                      View Profile
                    </button>
                  </div>

                  {/* Meta grid — 4 columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11.5px', color: '#9ca3af', marginBottom: '5px', fontWeight: 500 }}>Visa Type</div>
                      <Badge label={student.visaProfile?.visaType || 'Not set'} type={visaBadgeType(student.visaProfile?.visaType)} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', color: '#9ca3af', marginBottom: '5px', fontWeight: 500 }}>Visa Status</div>
                      <Badge label={student.visaProfile?.status || 'pending'} type={statusBadgeType(student.visaProfile?.status)} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', color: '#9ca3af', marginBottom: '5px', fontWeight: 500 }}>SEVIS Status</div>
                      <Badge label={student.visaProfile?.sevisStatus || 'Not set'} type={statusBadgeType(student.visaProfile?.sevisStatus)} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', color: '#9ca3af', marginBottom: '5px', fontWeight: 500 }}>Compliance</div>
                      <Badge label={student.visaProfile?.compliance || 'N/A'} type={complianceBadgeType(student.visaProfile?.compliance)} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '10px', borderTop: '1px solid #f3f4f6', fontSize: '12.5px', color: '#6b7280' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="13" height="13"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                      Visa Exp: {formatDate(student.visaProfile?.expirationDate)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="13" height="13"><rect x="2" y="3" width="12" height="10" rx="1"/><path d="M2 7h12"/></svg>
                      Passport: {student.visaProfile?.passportStatus || 'Not set'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ANALYTICS TAB ── */}
      {currentTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 2x2 distribution charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { title: 'Visa Type Distribution', data: visaDist, color: '#2563eb',
                icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5"><rect x="2" y="10" width="3" height="4"/><rect x="6.5" y="6" width="3" height="8"/><rect x="11" y="2" width="3" height="12"/></svg> },
              { title: 'SEVIS Status Distribution', data: sevisDist, color: '#16a34a',
                icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg> },
              { title: 'Compliance Status', data: compDist, color: '#d97706',
                icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M5.5 8l2 2 3-3"/></svg> },
              { title: 'Passport Status Distribution', data: passDist, color: '#d97706',
                icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1"/><path d="M2 7h12"/></svg> },
            ].map(({ title, data, color, icon }) => (
              <div key={title} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: '#111827', marginBottom: '20px' }}>
                  {icon} {title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {Object.entries(data).map(([name, count]) => (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#111827' }}>{name}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{count} student{count !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ height: '7px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '4px', background: color, width: `${students.length > 0 ? (count / students.length) * 100 : 0}%`, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Key Metrics & Trends — full width */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: '#111827', marginBottom: '20px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5"><path d="M2 12l4-4 3 3 5-6"/></svg>
              Key Metrics &amp; Trends
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '4px' }}>
              {[
                { num: students.length, label: 'Total Enrolled Students' },
                { num: students.filter(s => s.visaProfile?.compliance === 'compliant' || s.visaProfile?.compliance === 'In Compliance').length, label: 'Compliant Students' },
                { num: activeSEVIS, label: 'Active SEVIS Records' },
              ].map(({ num, label }, i, arr) => (
                <div key={label} style={{ display: 'contents' }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px', color: '#111827', lineHeight: 1 }}>{num}</div>
                    <div style={{ fontSize: '12.5px', color: '#6b7280', marginTop: '6px' }}>{label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: '1px', height: '50px', background: '#e5e7eb', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}