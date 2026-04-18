/**
 * UniversityStudentPortal — Student-facing dashboard.
 * Redesigned to match Pathly design system with dark sidebar, welcome banner,
 * SEVIS alert strip, status cards, and bottom grid layout.
 */
import { useState, useEffect, useCallback } from 'react';
import { RequestCenter } from './RequestCenter';
import { I20RequestTracker } from './I20RequestTracker';
import { StatusBadge } from './StatusBadge';
import { ResourcesPage } from './ResourcesPage';
import { SettingsPage } from './SettingsPage';
import { DSORequestsSection } from './DSORequestsSection';
import { AllRequestsPage } from './AllRequestsPage';
import { toast } from 'sonner';

import { StudentMessagingView } from './StudentMessagingView';
import { useStudentMessages } from '../hooks/useMessages';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { useStudentRequests } from '../hooks/useStudentRequests';
import { useStudentDocuments } from '../hooks/useStudentDocuments';
import { submitRequest, respondToRequest } from '../services/request.service';
import { formatDate } from '../lib/utils';
import type { UserData } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type StudentView =
  | 'dashboard'
  | 'i20-request'
  | 'i20-tracker'
  | 'settings'
  | 'resources'
  | 'all-requests'
  | 'messaging';

interface UniversityStudentPortalProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userData?: UserData;
}

// ─── SVG helpers ──────────────────────────────────────────────────────────────

const SVG = {
  dashboard: <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M2 2h5v5H2V2zm0 7h5v5H2V9zm7-7h5v5H9V2zm0 7h5v5H9V9z"/></svg>,
  profile: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-3 10-3 10 0"/></svg>,
  messaging: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M2 3h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 0l6 5 6-5"/></svg>,
  allRequests: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M8 2h6v12H2V5l3-3h3zm0 0v3H2"/><path d="M5 9h6M5 12h4"/></svg>,
  requestCenter: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M8 2a4 4 0 00-4 4v3l-1 1h10l-1-1V6a4 4 0 00-4-4zM6.5 13a1.5 1.5 0 003 0"/></svg>,
  settings: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
  logout: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M10 2h3a1 1 0 011 1v10a1 1 0 01-1 1h-3M7 11l3-3-3-3M10 8H3"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4"/><path d="M11 11l3 3"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2a4 4 0 00-4 4v3l-1 1h10l-1-1V6a4 4 0 00-4-4zM6.5 13a1.5 1.5 0 003 0"/></svg>,
  refresh: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M2 8a6 6 0 1110.7-3.7M13 2v4H9"/></svg>,
  alert: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18"><path d="M8 2L1 14h14L8 2z"/><path d="M8 7v3M8 12v.5"/></svg>,
  visa: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><rect x="1" y="4" width="14" height="9" rx="1.5"/><path d="M1 7h14"/></svg>,
  passport: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm2 4h6M5 8h4"/></svg>,
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15"><path d="M8 3v10M3 8h10"/></svg>,
  clock: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l4 4 4-4"/></svg>,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function UniversityStudentPortal({ onNavigate, onLogout, userData }: UniversityStudentPortalProps) {
  const [currentView, setCurrentView] = useState<StudentView>('dashboard');

  const userEmail = userData?.data?.user?.email ?? 'student@university.edu';
  const userName = userData?.data?.user?.user_metadata?.name ?? 'Student';
  const userId = userData?.data?.user?.id;
  const meta = userData?.data?.user?.user_metadata as any;
  const studentId = meta?.studentId ?? meta?.student_id_number ?? '';
  const program = meta?.program ?? meta?.major ?? '';
  const degreeLevel = meta?.degreeLevel ?? meta?.degree_level ?? '';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  // ─── Data Hooks ─────────────────────────────────────────────────────────
  const { unreadCount } = useStudentMessages();
  const { sevisStatus, visaStatus, passportStatus, loading: profileLoading, refresh: refreshProfile } = useStudentProfile();
  const { myRequests, dsoRequests, loading: requestsLoading, refresh: refreshRequests } = useStudentRequests();
  const { documents: recentDocuments, refresh: refreshDocuments } = useStudentDocuments(userId);
  const loading = profileLoading || requestsLoading;

  useEffect(() => {
    const userType = userData?.data?.user?.user_metadata?.userType;
    if (userType && userType !== 'student') {
      alert(`You are logged in as a ${userType.toUpperCase()}. This is the student portal.`);
    }
  }, [userData]);

  // ─── Actions ──────────────────────────────────────────────────────────
  const refreshDashboard = useCallback(async () => {
    try {
      await Promise.all([refreshProfile(), refreshRequests(), refreshDocuments()]);
      toast.success('Dashboard refreshed', { description: 'All data has been updated' });
    } catch { toast.error('Failed to refresh dashboard'); }
  }, [refreshProfile, refreshRequests, refreshDocuments]);

  const handleI20RequestSubmit = useCallback(async (requestData: Record<string, unknown>) => {
    try {
      const formData = requestData.formData as Record<string, unknown> ?? {};
      await submitRequest({
        requestType: requestData.requestId as string,
        requestName: requestData.requestName as string,
        reason: (formData.additionalInfo as string) ?? `Request for ${requestData.requestName}`,
        formData,
      });
      await refreshRequests();
      setCurrentView('i20-tracker');
    } catch (err) { alert(`Failed to submit request: ${err instanceof Error ? err.message : 'Unknown error'}`); }
  }, [refreshRequests]);

  const handleRespondToRequest = useCallback(async (requestId: string, responseData: Record<string, unknown>) => {
    try {
      await respondToRequest({ requestId, responseData });
      await refreshRequests();
      toast.success('Response submitted to your DSO', { description: 'Your DSO will review your submission shortly.' });
    } catch (err) {
      toast.error('Failed to submit response', { description: err instanceof Error ? err.message : 'Please try again' });
      throw err;
    }
  }, [refreshRequests]);

  // ─── Styles ───────────────────────────────────────────────────────────
  const sidebarStyle: React.CSSProperties = { width: '220px', background: '#1a1f2e', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '0 0 16px' };
  const navItemBase: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s', marginBottom: '2px', border: 'none', background: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit' };
  const navActive: React.CSSProperties = { ...navItemBase, color: '#fff', background: 'rgba(255,255,255,0.08)', fontWeight: 500 };
  const navInactive: React.CSSProperties = { ...navItemBase, color: '#8b92a5', fontWeight: 400 };

  // ─── Nav items ────────────────────────────────────────────────────────
  const NAV_ITEMS: { view: StudentView; icon: React.ReactNode; label: string; badge?: number }[] = [
    { view: 'dashboard', icon: SVG.dashboard, label: 'Dashboard' },
    { view: 'settings', icon: SVG.profile, label: 'My Profile' },
    { view: 'messaging' as StudentView, icon: SVG.messaging, label: 'Messaging', badge: unreadCount > 0 ? unreadCount : undefined },
    { view: 'all-requests', icon: SVG.allRequests, label: 'All Requests' },
    { view: 'i20-request', icon: SVG.requestCenter, label: 'Request Center' },
  ];

  // ─── Sub-view content renderer ────────────────────────────────────────
  const renderSubViewContent = () => {
    switch (currentView) {
      case 'i20-request':
        return <RequestCenter onBack={() => setCurrentView('dashboard')} onSubmit={handleI20RequestSubmit} />;
      case 'i20-tracker':
        return <I20RequestTracker onBack={() => setCurrentView('dashboard')} requests={myRequests as any} onSubmitNewRequest={() => setCurrentView('i20-request')} />;
      case 'settings':
        return <SettingsPage onBack={() => setCurrentView('dashboard')} onLogout={onLogout} />;
      case 'resources':
        return <ResourcesPage onBack={() => setCurrentView('dashboard')} />;
      case 'all-requests':
        return <AllRequestsPage onBack={() => setCurrentView('dashboard')} studentRequests={myRequests} dsoRequests={dsoRequests} onViewStudentRequest={() => setCurrentView('i20-tracker')} onViewDSORequest={(r) => console.log('View DSO request:', r)} />;
      case 'messaging':
        return <StudentMessagingView onBack={() => setCurrentView('dashboard')} />;
      default:
        return null;
    }
  };

  // ─── Visa helpers ─────────────────────────────────────────────────────
  const getVisaBadge = () => {
    if (!visaStatus) return { label: 'Not set', bg: '#f3f4f6', color: '#374151' };
    if (visaStatus.visaType) return { label: visaStatus.visaType, bg: '#dbeafe', color: '#1d4ed8' };
    return { label: 'Not set', bg: '#f3f4f6', color: '#374151' };
  };
  const getStatusBadge = (status: string) => {
    if (status === 'Active' || status === 'Valid') return { label: status, bg: '#dcfce7', color: '#166534' };
    if (status === 'Expiring Soon') return { label: status, bg: '#fef3c7', color: '#92400e' };
    if (status === 'Expired') return { label: status, bg: '#fee2e2', color: '#991b1b' };
    if (status === 'Pending Renewal') return { label: status, bg: '#fef3c7', color: '#92400e' };
    return { label: status || 'Not set', bg: '#f3f4f6', color: '#374151' };
  };

  // Helper to get SEVIS status badge config
  const getSevisBadgeConfig = () => {
    if (!sevisStatus) return [];
    const badges: { label: string; bg: string; color: string }[] = [];
    if (sevisStatus.status) {
      if (sevisStatus.status === 'Active') badges.push({ label: sevisStatus.status, bg: '#dcfce7', color: '#166534' });
      else if (sevisStatus.status === 'Terminated') badges.push({ label: sevisStatus.status, bg: '#fee2e2', color: '#991b1b' });
      else badges.push({ label: sevisStatus.status, bg: '#fef3c7', color: '#92400e' });
    }
    if (sevisStatus.compliance) {
      if (sevisStatus.compliance === 'In Compliance') badges.push({ label: sevisStatus.compliance, bg: '#dcfce7', color: '#166534' });
      else badges.push({ label: sevisStatus.compliance, bg: '#fef3c7', color: '#92400e' });
    }
    return badges;
  };

  const sevisBadges = getSevisBadgeConfig();
  const sevisIsAlert = sevisStatus && (sevisStatus.status !== 'Active' || sevisStatus.compliance !== 'In Compliance');

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside style={sidebarStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 20px 14px', color: '#fff', fontWeight: 600, fontSize: '17px', letterSpacing: '-0.3px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🌐</div>
          Pathly
        </div>

        {/* Student Pill */}
        <div style={{ margin: '0 14px 18px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>{initials}</div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#e5e7eb', lineHeight: 1.3 }}>{userName}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Student · University Portal</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.view} onClick={() => setCurrentView(item.view)} style={currentView === item.view ? navActive : navInactive}
              onMouseEnter={e => currentView !== item.view && (e.currentTarget.style.color = '#fff', e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => currentView !== item.view && (e.currentTarget.style.color = '#8b92a5', e.currentTarget.style.background = 'none')}>
              {item.icon}
              {item.label}
              {item.badge && <span style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 14px 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e5e7eb'} onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
            {SVG.logout}
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 24px', height: '56px', flexShrink: 0 }}>
          <div style={{ flex: 1, maxWidth: '520px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f4f5f7', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0 12px', height: '36px' }}>
            {SVG.search}
            <input type="text" placeholder="Search requests, documents..." style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '13.5px', color: '#111827', fontFamily: 'inherit' }} />
            <span style={{ fontSize: '11px', color: '#9ca3af', background: '#e5e7eb', borderRadius: '4px', padding: '2px 5px', fontFamily: "'DM Mono', monospace" }}>⌘K</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
            <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '50%', background: '#f4f5f7', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {SVG.bell}
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>2</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px 4px 4px', border: '1px solid #e5e7eb', borderRadius: '20px', cursor: 'pointer', background: '#f4f5f7', fontSize: '13px', fontWeight: 500 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 600 }}>{initials}</div>
              {userName}
              {SVG.chevronDown}
            </div>
          </div>
        </header>

        {/* Content area — sub-views or dashboard */}
        {currentView !== 'dashboard' ? (
          /* Sub-views render their own scrollable content */
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {renderSubViewContent()}
          </div>
        ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#f4f5f7' }}>

          {/* Welcome banner */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1f2e 100%)', borderRadius: '10px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: '60px', bottom: '-60px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>University Portal</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: '#fff', letterSpacing: '-0.4px', marginBottom: '4px' }}>Welcome back, {userName}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Manage your visa status and immigration documents.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                  {SVG.profile}
                  Student ID: <strong style={{ color: '#e2e8f0', fontWeight: 500 }}>{studentId || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                  {SVG.passport}
                  <strong style={{ color: '#e2e8f0', fontWeight: 500 }}>{program || 'Program not set'}{degreeLevel ? ` · ${degreeLevel}` : ''}</strong>
                </div>
              </div>
            </div>
            <button onClick={refreshDashboard} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', position: 'relative', zIndex: 1 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              {SVG.refresh}
              Refresh Status
            </button>
          </div>

          {/* SEVIS alert strip */}
          {sevisStatus && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: `3px solid ${sevisIsAlert ? '#dc2626' : '#16a34a'}` }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, background: sevisIsAlert ? '#fee2e2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {sevisIsAlert
                  ? <svg viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.6" width="18" height="18"><path d="M8 2L1 14h14L8 2z"/><path d="M8 7v3M8 12v.5"/></svg>
                  : <svg viewBox="0 0 16 16" fill="none" stroke="#16a34a" strokeWidth="1.6" width="18" height="18"><circle cx="8" cy="8" r="6"/><path d="M5.5 8l2 2 3-3.5"/></svg>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  SEVIS Status
                  {sevisBadges.map((b, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 500, background: b.bg, color: b.color }}>{b.label}</span>
                  ))}
                </div>
                <div style={{ fontSize: '12.5px', color: '#6b7280' }}>
                  {sevisIsAlert ? 'Your SEVIS record requires attention. Please contact your DSO immediately.' : 'Your SEVIS record is in good standing.'}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  {sevisStatus.lastUpdated && (
                    <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {SVG.clock} Last updated: {sevisStatus.lastUpdated}
                    </div>
                  )}
                  {sevisStatus.nextCheckDate && (
                    <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M2 7h12M5 2v2M11 2v2"/></svg>
                      Next compliance check: {sevisStatus.nextCheckDate}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            {/* Visa Status */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {SVG.visa} Visa Status
                </div>
                {(() => { const b = getVisaBadge(); return <span style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: b.bg, color: b.color, border: '1px solid #bfdbfe', fontFamily: "'DM Mono', monospace" }}>{b.label}</span>; })()}
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: '13px' }}>Loading...</div>
              ) : visaStatus ? (
                <div>
                  <div style={{ fontSize: '11.5px', color: '#9ca3af', marginBottom: '3px', fontWeight: 500 }}>Time Remaining</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: visaStatus.daysRemaining !== null && visaStatus.daysRemaining <= 0 ? '#dc2626' : '#111827', marginBottom: '14px' }}>
                    {visaStatus.daysRemaining !== null ? (visaStatus.daysRemaining > 0 ? `${visaStatus.daysRemaining} days` : 'Expired') : 'N/A'}
                  </div>
                  <div style={{ height: '5px', background: '#e5e7eb', borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '3px', background: visaStatus.daysRemaining !== null && visaStatus.daysRemaining <= 0 ? '#dc2626' : visaStatus.daysRemaining !== null && visaStatus.daysRemaining < 90 ? '#d97706' : '#2563eb', width: `${Math.min(100, Math.max(0, ((visaStatus.daysRemaining ?? 0) / 730) * 100))}%` }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#9ca3af' }}>Expiration Date</span>
                      <span style={{ fontWeight: 500, color: visaStatus.daysRemaining !== null && visaStatus.daysRemaining <= 0 ? '#dc2626' : '#111827' }}>{visaStatus.expirationDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#9ca3af' }}>Visa Type</span>
                      <span style={{ fontWeight: 500, color: '#111827' }}>{visaStatus.visaType || 'Not set'} Student</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: '13px' }}>No visa data available</div>
              )}
            </div>

            {/* Request Center */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                {SVG.messaging} Request Center
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', flex: 1, justifyContent: 'center' }}>
                <button onClick={() => setCurrentView('i20-request')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '10px 16px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}>
                  {SVG.plus} New DSO Request
                </button>
                <button onClick={() => setCurrentView('i20-tracker')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '9px 16px', borderRadius: '6px', background: '#f4f5f7', border: '1px solid #e5e7eb', color: '#111827', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eaebec'} onMouseLeave={e => e.currentTarget.style.background = '#f4f5f7'}>
                  {SVG.clock} Track My Requests
                </button>
              </div>
            </div>

            {/* Passport Status */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {SVG.passport} Passport Status
                </div>
                {passportStatus && (() => { const b = getStatusBadge(passportStatus.status); return <span style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 500, background: b.bg, color: b.color }}>{b.label}</span>; })()}
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: '13px' }}>Loading...</div>
              ) : passportStatus ? (
                <div>
                  <div style={{ fontSize: '11.5px', color: '#9ca3af', marginBottom: '3px', fontWeight: 500 }}>Time Remaining</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: passportStatus.daysRemaining !== null && passportStatus.daysRemaining <= 0 ? '#dc2626' : '#111827', marginBottom: '14px' }}>
                    {passportStatus.daysRemaining !== null ? (passportStatus.daysRemaining > 0 ? `${passportStatus.daysRemaining} days` : 'Expired') : 'N/A'}
                  </div>
                  <div style={{ height: '5px', background: '#e5e7eb', borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '3px', background: passportStatus.daysRemaining !== null && passportStatus.daysRemaining <= 0 ? '#dc2626' : '#16a34a', width: `${Math.min(100, Math.max(0, ((passportStatus.daysRemaining ?? 0) / 1825) * 100))}%` }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#9ca3af' }}>Expiration Date</span>
                      <span style={{ fontWeight: 500, color: passportStatus.daysRemaining !== null && passportStatus.daysRemaining <= 0 ? '#dc2626' : '#111827' }}>{passportStatus.expirationDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#9ca3af' }}>Country</span>
                      <span style={{ fontWeight: 500, color: '#111827' }}>Not set</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: '13px' }}>No passport data available</div>
              )}
            </div>
          </div>

          {/* Bottom grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
            {/* DSO Requests */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Requests from your DSO</span>
                <a onClick={() => setCurrentView('all-requests')} style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: 500, cursor: 'pointer' }}>View request history</a>
              </div>
              <div style={{ padding: '18px' }}>
                {dsoRequests.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f4f5f7', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      {SVG.messaging}
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>No requests right now</div>
                    <div style={{ fontSize: '12.5px', color: '#6b7280', lineHeight: 1.5, maxWidth: '240px' }}>If your DSO needs documents, info, or confirmation, it will appear here.</div>
                  </div>
                ) : (
                  <div>
                    {dsoRequests.slice(0, 5).map((req: any) => (
                      <div key={req.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '3px' }}>{req.request_name || req.request_type || 'DSO Request'}</div>
                          <div style={{ fontSize: '11.5px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {SVG.clock} {formatDate(req.submitted_at || req.created_at)}
                          </div>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Submit area */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Have something to submit?</span>
                <button onClick={() => setCurrentView('i20-request')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}>
                  {SVG.plus} Submit New Request
                </button>
              </div>
            </div>

            {/* Messaging */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Messaging</span>
                <a onClick={() => setCurrentView('messaging')} style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: 500, cursor: 'pointer' }}>View all</a>
              </div>
              <div style={{ padding: '18px' }}>
                {/* Sample messages - connected to real data when available */}
                {[
                  { from: 'DSO Office', preview: 'Your SEVIS record has been flagged for review. Please contact us as soon as possible.', time: 'Mar 11', color: '#2563eb', unread: true },
                  { from: 'DSO Office', preview: 'Reminder: Your visa expiration date is approaching. Please schedule an appointment.', time: 'Mar 9', color: '#16a34a', unread: true },
                  { from: 'DSO Office', preview: 'Welcome to the Pathly portal! Your profile has been set up successfully.', time: 'Feb 20', color: '#6b7280', unread: false },
                ].map((msg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#fff', background: msg.color }}>DS</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{msg.from}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.preview}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{msg.time}</span>
                      {msg.unread && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb' }} />}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setCurrentView('messaging')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', marginTop: '14px', padding: '9px 14px', borderRadius: '6px', background: '#f4f5f7', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#111827', fontFamily: 'inherit', justifyContent: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e9eaec'} onMouseLeave={e => e.currentTarget.style.background = '#f4f5f7'}>
                  {SVG.messaging} Message your DSO
                </button>
              </div>
            </div>
          </div>

        </div>/* /dashboard content */
        )}
      </div>{/* /main */}
    </div>
  );
}