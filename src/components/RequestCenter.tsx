/**
 * RequestCenter — Student request hub with rich 2-column sub-page cards.
 *
 * Three levels:
 *   1. Main grid  – 3 category cards + recent requests + help strip
 *   2. Sub-page   – 2-column rich cards with requirements and CTA
 *   3. Form flow  – I20RequestFlow (unchanged)
 */
import { useState } from 'react';
import { I20RequestFlow } from './I20RequestFlow';

// ── SVG icons ──────────────────────────────────────────────────────────────

const ICN = {
  back: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14"><path d="M10 3L5 8l5 5"/></svg>,
  arrow: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M3 8h10M9 4l4 4-4 4"/></svg>,
  arrowBullet: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M3 8h10M9 4l4 4-4 4"/></svg>,
  clockPill: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
  clockBig: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
  check: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><circle cx="8" cy="8" r="6"/><path d="M5.5 8l2 2 3-3"/></svg>,
  warn: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11v.5"/></svg>,
  mail: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M2 3h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 0l6 5 6-5"/></svg>,
  mailBig: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20"><path d="M3 5h14v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 0l7 6 7-6"/></svg>,
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M8 3v10M3 8h10"/></svg>,
  help: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20"><circle cx="10" cy="10" r="8"/><path d="M10 14v-1M10 7a2 2 0 012 2 2 2 0 01-2 2"/></svg>,
  /* Category icons (large) */
  briefcase: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="26" height="26"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M10 14h4"/></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="26" height="26"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  docCheck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="26" height="26"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>,
  /* Sub-page option icons */
  briefcaseSm: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><path d="M12 12v4M10 14h4"/></svg>,
  layers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/></svg>,
  send: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  fileX: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><line x1="9" y1="15" x2="15" y2="9"/><line x1="15" y1="15" x2="9" y2="9"/></svg>,
  clockCircle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  userCircle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  book: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  docLines: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/></svg>,
  card: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>,
  transfer: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M18 8l4 4-4 4M6 4v7a4 4 0 004 4h9M6 20v-3"/></svg>,
  undo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/></svg>,
  pause: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>,
};

// ── Data ────────────────────────────────────────────────────────────────────

interface RichOption {
  id: string; name: string; desc: string; icon: React.ReactNode;
  iconBg: string; iconColor: string; colorClass: string;
  time: string; ctaLabel: string;
  needs: string[]; eligLabel: string; eligType: 'ok' | 'warn';
}

const WORK_AUTH_OPTIONS: RichOption[] = [
  { id: 'cpt', name: 'Curricular Practical Training (CPT)', desc: 'Authorize work experience directly tied to your major before graduation. Requires a job offer and enrollment in a co-op or internship course.', icon: ICN.briefcaseSm, iconBg: '#dbeafe', iconColor: '#1d4ed8', colorClass: 'blue', time: '5–7 business days', ctaLabel: 'Start CPT Application', needs: ['Employer offer letter with job title, dates and work address', 'Proof of enrollment in a qualifying co-op or internship course', 'Academic advisor or department approval signature'], eligLabel: 'Pre-completion', eligType: 'ok' },
  { id: 'opt', name: 'Optional Practical Training (OPT)', desc: 'Work in your field for up to 12 months after graduation. USCIS processing takes 3–5 months — apply as early as possible.', icon: ICN.layers, iconBg: '#ede9fe', iconColor: '#6d28d9', colorClass: 'purple', time: 'Apply 90 days before graduation', ctaLabel: 'Start OPT Application', needs: ['Completed OPT request form signed by DSO', 'Valid passport copy (minimum 6 months validity)', 'I-94 record and all previous I-20 documents'], eligLabel: 'Post-completion', eligType: 'ok' },
  { id: 'stem-opt', name: 'STEM OPT Extension', desc: 'Extend your OPT by 24 months if you hold a STEM-designated degree and your employer participates in E-Verify.', icon: ICN.grid, iconBg: '#dcfce7', iconColor: '#15803d', colorClass: 'green', time: '90 days before OPT expires', ctaLabel: 'Start STEM OPT Application', needs: ['Form I-983 training plan signed by employer and student', 'Employer E-Verify company ID number', 'Current EAD (Employment Authorization Document) copy'], eligLabel: '24-month extension', eligType: 'ok' },
];

const I20_OPTIONS: RichOption[] = [
  { id: 'travel', name: 'Travel Signature', desc: 'Required before every international trip. Your signature must be dated within 12 months for active students, or 6 months if on OPT.', icon: ICN.send, iconBg: '#dbeafe', iconColor: '#1d4ed8', colorClass: 'blue', time: '3–5 business days', ctaLabel: 'Request Travel Signature', needs: ['Your current I-20 document (to be signed)', 'Planned travel dates and destination country', 'Proof of full-time enrollment for current semester'], eligLabel: 'Submit 2+ weeks before travel', eligType: 'warn' },
  { id: 'lost', name: 'Lost / Damaged I-20', desc: 'Request a replacement if your I-20 has been lost, stolen, or damaged. A new document will be issued with an updated DSO signature.', icon: ICN.fileX, iconBg: '#fef3c7', iconColor: '#b45309', colorClass: 'amber', time: '2–3 business days', ctaLabel: 'Request Replacement', needs: ['Written explanation of how the document was lost or damaged', 'Your SEVIS ID number (if available from another record)', 'Valid government-issued photo ID'], eligLabel: 'No fee required', eligType: 'ok' },
  { id: 'extension', name: 'Program Extension', desc: 'Extend your I-20 end date if you need more time to complete degree requirements. Must demonstrate satisfactory academic progress.', icon: ICN.clockCircle, iconBg: '#ede9fe', iconColor: '#6d28d9', colorClass: 'purple', time: '5–7 business days', ctaLabel: 'Request Extension', needs: ['Academic advisor letter confirming new expected end date', 'Updated financial support documents for extended period', 'Unofficial transcript showing academic progress'], eligLabel: 'Apply before current end date', eligType: 'warn' },
  { id: 'financial', name: 'Financial Update', desc: 'Update your I-20 funding information when you receive a new scholarship, fellowship, TA/RA appointment, or change in financial support.', icon: ICN.dollar, iconBg: '#dcfce7', iconColor: '#15803d', colorClass: 'green', time: '3–5 business days', ctaLabel: 'Request Financial Update', needs: ['Award or appointment letter from funding source', 'Amount, duration, and currency of funding', 'Bank statement if self-funded (last 3 months)'], eligLabel: 'Anytime', eligType: 'ok' },
  { id: 'personal-info', name: 'Personal Information Change', desc: 'Update your legal name, U.S. address, phone number, or other personal details recorded in SEVIS and on your I-20.', icon: ICN.userCircle, iconBg: '#ccfbf1', iconColor: '#0f766e', colorClass: 'teal', time: '2–3 business days', ctaLabel: 'Request Info Change', needs: ['Legal document supporting the change (passport, court order)', 'Completed personal information update form'], eligLabel: 'Anytime', eligType: 'ok' },
  { id: 'change', name: 'Change of Major / Level', desc: 'Notify your DSO after an official change of major or degree level so your I-20 and SEVIS record can be updated to reflect the new program.', icon: ICN.book, iconBg: '#f1f5f9', iconColor: '#475569', colorClass: 'slate', time: '5–7 business days', ctaLabel: 'Submit Change Request', needs: ['Official notice of change from the registrar\'s office', 'Updated financial documents if program cost changes'], eligLabel: 'After official approval', eligType: 'ok' },
];

const OTHER_OPTIONS: RichOption[] = [
  { id: 'enrollment', name: 'Enrollment Verification', desc: 'Request an official letter confirming your current enrollment status — commonly required by banks, employers, or government agencies.', icon: ICN.docLines, iconBg: '#dbeafe', iconColor: '#1d4ed8', colorClass: 'blue', time: '1–2 business days', ctaLabel: 'Request Letter', needs: ['Purpose of the letter (e.g. bank account, visa application)', 'Recipient name or institution if the letter is addressed to someone'], eligLabel: 'Fastest turnaround', eligType: 'ok' },
  { id: 'ssn-letter', name: 'Social Security Letter', desc: 'Get a DSO support letter required when applying for a Social Security Number. Only available if you have active work authorization.', icon: ICN.card, iconBg: '#fef3c7', iconColor: '#b45309', colorClass: 'amber', time: '2–3 business days', ctaLabel: 'Request SSN Letter', needs: ['Proof of employment authorization (CPT, OPT, or EAD card)', 'Employer offer letter or signed work contract'], eligLabel: 'Requires work authorization', eligType: 'warn' },
  { id: 'transfer', name: 'Transfer Out', desc: 'Transfer your SEVIS record to a new U.S. institution. Your DSO sets a release date after which the new school takes over your record.', icon: ICN.transfer, iconBg: '#ede9fe', iconColor: '#6d28d9', colorClass: 'purple', time: '5–10 business days', ctaLabel: 'Initiate Transfer', needs: ['Official acceptance letter from the new institution', 'Your requested SEVIS record release date', 'New school\'s DSO name and contact information'], eligLabel: 'Irreversible after release date', eligType: 'warn' },
  { id: 'reinstatement', name: 'Reinstatement Guidance', desc: 'If you\'ve fallen out of F-1 status, your DSO can guide you through reinstatement or recommend departure and re-entry options.', icon: ICN.undo, iconBg: '#fee2e2', iconColor: '#b91c1c', colorClass: 'red', time: 'Requires DSO consultation', ctaLabel: 'Request Guidance', needs: ['Written explanation of how your status was violated', 'All previous I-20s and immigration travel documents', 'Evidence of ongoing financial support'], eligLabel: 'Act promptly — time-sensitive', eligType: 'warn' },
  { id: 'leave', name: 'Leave of Absence / Return from Leave', desc: 'Take an authorized break from your studies or notify your DSO when returning to active enrollment after an approved leave period.', icon: ICN.pause, iconBg: '#ccfbf1', iconColor: '#0f766e', colorClass: 'teal', time: '3–5 business days', ctaLabel: 'Submit Leave Request', needs: ['Academic department or registrar leave approval documentation', 'Planned leave start and expected return-to-enrollment date'], eligLabel: 'Must be pre-approved', eligType: 'warn' },
];

type CatId = 'work-auth' | 'i20-updates' | 'other-dso';

const CATEGORIES: { id: CatId; title: string; desc: string; icon: React.ReactNode; iconBg: string; iconColor: string; tags: string[]; count: string; subTitle: string; subDesc: string; options: RichOption[] }[] = [
  { id: 'work-auth', title: 'Work Authorization Requests', desc: 'Apply for CPT, OPT, or STEM OPT authorization to work legally during or after your studies.', icon: ICN.briefcase, iconBg: '#dbeafe', iconColor: '#1d4ed8', tags: ['CPT', 'OPT', 'STEM OPT'], count: '3 request types', subTitle: 'Work Authorization Requests', subDesc: 'CPT, OPT, and STEM OPT applications for employment authorization', options: WORK_AUTH_OPTIONS },
  { id: 'i20-updates', title: 'I-20 Update Requests', desc: 'Request travel signatures, program changes, extensions, or replacement I-20 documents.', icon: ICN.doc, iconBg: '#ede9fe', iconColor: '#6d28d9', tags: ['Travel Signature', 'Program Change', 'Replacement'], count: '6 request types', subTitle: 'I-20 Update Requests', subDesc: 'Travel signatures, program changes, and I-20 replacements', options: I20_OPTIONS },
  { id: 'other-dso', title: 'Other DSO Requests', desc: 'Submit requests for verification letters, school transfers, reinstatement, or special assistance.', icon: ICN.docCheck, iconBg: '#dcfce7', iconColor: '#15803d', tags: ['Verification Letter', 'Transfer', 'Special Assistance'], count: '5 request types', subTitle: 'Other DSO Requests', subDesc: 'Verification letters, transfers, and special assistance', options: OTHER_OPTIONS },
];

const HELP: Record<string, { title: string; sub: string }> = {
  '': { title: 'Not sure which request to submit?', sub: 'Contact your Designated School Official (DSO) directly for guidance, or send them a message through the portal.' },
  'work-auth': { title: 'Not sure which authorization type applies to you?', sub: 'CPT is for work during your studies; OPT and STEM OPT are for after graduation. Contact your DSO to confirm eligibility before applying.' },
  'i20-updates': { title: 'Need your I-20 urgently?', sub: 'For travel within 72 hours or emergency replacements, message your DSO directly to request expedited processing.' },
  'other-dso': { title: 'Have a situation not listed here?', sub: 'Message your DSO directly for any special circumstances or requests that don\'t fit the categories above.' },
};

// Top-color accent classes mapped to CSS-in-JS
const COLOR_MAP: Record<string, string> = { blue: '#2563eb', purple: '#7c3aed', green: '#16a34a', amber: '#d97706', red: '#dc2626', teal: '#0f766e', slate: '#475569' };

// ── Component ──────────────────────────────────────────────────────────────

interface RequestCenterProps {
  onBack: () => void;
  onSubmit: (data: any) => void;
  /** Navigate to the student's All Requests page. */
  onNavigateToAllRequests?: () => void;
  /** Navigate to the Messaging page. */
  onNavigateToMessaging?: () => void;
}

export function RequestCenter({ onBack, onSubmit, onNavigateToAllRequests, onNavigateToMessaging }: RequestCenterProps) {
  const [selectedCategory, setSelectedCategory] = useState<CatId | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  // Level 3: Form flow
  if (selectedRequest) {
    const allOptions = CATEGORIES.flatMap(c => c.options);
    const opt = allOptions.find(o => o.id === selectedRequest);
    return <I20RequestFlow requestId={selectedRequest} requestName={opt?.name || ''} onClose={() => setSelectedRequest(null)} onSubmit={onSubmit} />;
  }

  const category = selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory) : null;
  const helpInfo = HELP[selectedCategory || ''];

  // ── Shared styles ─────────────────────────────────────────────────
  const pageWrap: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '26px 32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" };

  // ── Level 2: Sub-page with rich 2-column cards ────────────────────
  if (category) {
    return (
      <div style={pageWrap}>
        {/* Breadcrumb + header */}
        <div>
          <button onClick={() => setSelectedCategory(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 500, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: '2px' }}
            onMouseEnter={e => e.currentTarget.style.color = '#2563eb'} onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
            {ICN.back} Back to Request Center
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: category.iconBg, color: category.iconColor }}>{category.icon}</div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.4px', margin: 0, color: '#111827' }}>{category.subTitle}</h1>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>{category.subDesc}</p>
            </div>
          </div>
        </div>

        {/* 2-column rich cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'stretch' }}>
          {category.options.map(opt => {
            const accentColor = COLOR_MAP[opt.colorClass] || '#2563eb';
            return (
            <div key={opt.id}
              style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.08)'; const bar = e.currentTarget.querySelector('[data-accent]') as HTMLElement; if (bar) bar.style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; const bar = e.currentTarget.querySelector('[data-accent]') as HTMLElement; if (bar) bar.style.opacity = '0'; }}>
              {/* Accent top bar */}
              <div data-accent style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', borderRadius: '10px 10px 0 0', background: accentColor, opacity: 0, transition: 'opacity 0.2s' }} />

              {/* Top: icon + time pill */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: opt.iconBg, color: opt.iconColor }}>{opt.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 500, color: '#9ca3af', background: '#f4f5f7', border: '1px solid #e5e7eb', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {ICN.clockPill} {opt.time}
                </div>
              </div>

              {/* Title + desc */}
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', letterSpacing: '-0.2px' }}>{opt.name}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>{opt.desc}</div>

              {/* What you'll need */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1px' }}>What you'll need</div>
                {opt.needs.map((n, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '12.5px', color: '#6b7280', lineHeight: 1.4 }}>
                    <span style={{ flexShrink: 0, marginTop: '1px', color: '#9ca3af' }}>{ICN.arrowBullet}</span>
                    {n}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f3f4f6', marginTop: 'auto' }}>
                <button onClick={() => setSelectedRequest(opt.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, transition: 'gap 0.15s' }}>
                  {opt.ctaLabel} {ICN.arrow}
                </button>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: opt.eligType === 'ok' ? '#16a34a' : '#d97706' }}>
                  {opt.eligType === 'ok' ? ICN.check : ICN.warn} {opt.eligLabel}
                </span>
              </div>
            </div>
          );
          })}
        </div>

        {/* Info strip */}
        {helpInfo && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: '3px solid #2563eb', borderRadius: '10px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ICN.help}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '3px', color: '#111827' }}>{helpInfo.title}</div>
              <div style={{ fontSize: '12.5px', color: '#6b7280', lineHeight: 1.5 }}>{helpInfo.sub}</div>
            </div>
            <button
              onClick={onNavigateToMessaging}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}>
              {ICN.mail} Message DSO
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Level 1: Main category grid ───────────────────────────────────
  return (
    <div style={pageWrap}>
      {/* Back + heading */}
      <div>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: '16px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#111827'} onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
          {ICN.back} Back to Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ICN.mailBig}</div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.4px', margin: 0, color: '#111827' }}>Request Center</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>Choose the type of request you need help with from your DSO.</p>
          </div>
        </div>
      </div>

      {/* Category cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {CATEGORIES.map(cat => (
          <div key={cat.id} onClick={() => setSelectedCategory(cat.id)}
            style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px 22px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', background: cat.iconBg, color: cat.iconColor }}>{cat.icon}</div>
            <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.2px', marginBottom: '6px', color: '#111827' }}>{cat.title}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, flex: 1, marginBottom: '20px' }}>{cat.desc}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {cat.tags.map(t => <span key={t} style={{ fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '20px', background: '#f4f5f7', border: '1px solid #e5e7eb', color: '#6b7280' }}>{t}</span>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: '#2563eb' }}>
                View Options {ICN.arrow}
              </span>
              <span style={{ fontSize: '11.5px', color: '#9ca3af' }}>{cat.count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent requests */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Recent Requests</span>
          <a onClick={onNavigateToAllRequests} style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: 500, cursor: 'pointer' }}>View all requests →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { title: 'CPT Extension — Undergraduate to Graduate', status: 'Review', statusBg: '#fef9c3', statusColor: '#854d0e', date: 'Submitted Nov 10, 2025' },
            { title: 'OPT Application — Post-Completion', status: 'Submitted', statusBg: '#e0e7ff', statusColor: '#3730a3', date: 'Submitted Oct 28, 2025' },
            { title: 'Travel Signature Request', status: 'Approved', statusBg: '#dcfce7', statusColor: '#166534', date: 'Submitted Sep 5, 2025' },
          ].map((r, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', lineHeight: 1.4 }}>{r.title}</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, background: r.statusBg, color: r.statusColor }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', opacity: 0.6 }} />
                  {r.status}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {ICN.clockBig} {r.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help strip */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '18px', borderLeft: '3px solid #2563eb' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ICN.help}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{helpInfo.title}</div>
          <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>{helpInfo.sub}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={onNavigateToMessaging}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid #2563eb', color: '#2563eb', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {ICN.mail} Message DSO
          </button>
        </div>
      </div>
    </div>
  );
}