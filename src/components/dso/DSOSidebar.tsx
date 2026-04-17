/**
 * DSOSidebar — exactly matches the reference HTML sidebar.
 * Colors: nav-bg #1a1f2e, nav-text #8b92a5, active rgba(255,255,255,0.08) + white text
 * Logo: gradient icon (blue→indigo) + "Pathly" 17px white font
 */
import type { DSOView } from './types';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  view: DSOView;
}

const SVG = {
  dashboard: (
    <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
      <path d="M2 2h5v5H2V2zm0 7h5v5H2V9zm7-7h5v5H9V2zm0 7h5v5H9V9z"/>
    </svg>
  ),
  students: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-3 10-3 10 0"/>
    </svg>
  ),
  compliance: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M8 2L2 5v4c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V5L8 2z"/>
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm2 4h6M5 8h4M5 11h3"/>
    </svg>
  ),
  requests: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-3 10-3 10 0"/>
    </svg>
  ),
  messaging: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M2 3h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 0l6 5 6-5"/>
    </svg>
  ),
  imports: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M3 13V7l5-5 5 5v6H9V9H7v4H3z"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <circle cx="8" cy="8" r="2"/>
      <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.8 3.8l.7.7M11.5 11.5l.7.7M3.8 12.2l.7-.7M11.5 4.5l.7-.7"/>
    </svg>
  ),
};

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard',        icon: SVG.dashboard,   view: 'dashboard' },
  { label: 'Students',         icon: SVG.students,    view: 'student-center' },
  { label: 'DSO Requests',     icon: SVG.compliance,  view: 'request-actions-dashboard' },
  { label: 'Student Requests', icon: SVG.requests,    view: 'request-center' },
  { label: 'Messaging',        icon: SVG.messaging,   view: 'communication-center' },
];

const UTILITY_NAV: NavItem[] = [
  { label: 'Data Imports',   icon: SVG.imports,   view: 'roster-import' },
  { label: 'Admin Settings', icon: SVG.settings,  view: 'admin-settings' },
];

interface DSOSidebarProps {
  currentView: DSOView;
  onNavigate: (view: DSOView) => void;
  messagingUnreadCount?: number;
}

export function DSOSidebar({ currentView, onNavigate, messagingUnreadCount }: DSOSidebarProps) {
  const item = ({ label, icon, view }: NavItem) => {
    const active = currentView === view;
    const badge = view === 'communication-center' && (messagingUnreadCount ?? 0) > 0
      ? messagingUnreadCount
      : undefined;
    return (
      <button
        key={view}
        onClick={() => onNavigate(view)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '9px 12px',
          borderRadius: '6px',
          color: active ? '#ffffff' : '#8b92a5',
          background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
          fontWeight: active ? 500 : 400,
          fontSize: '14px',
          cursor: 'pointer',
          border: 'none',
          width: '100%',
          textAlign: 'left',
          marginBottom: '2px',
          transition: 'all 0.15s',
          opacity: 1,
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.color = '#8b92a5';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }
        }}
      >
        <span style={{ opacity: active ? 1 : 0.7, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
        <span style={{ flex: 1 }}>{label}</span>
        {badge !== undefined && (
          <span style={{ background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '0 5px', borderRadius: '8px', lineHeight: '16px', flexShrink: 0 }}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside style={{
      width: '220px',
      background: '#1a1f2e',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      padding: '0 0 16px',
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '20px 20px 24px',
        color: '#fff',
        fontWeight: 600,
        fontSize: '17px',
        letterSpacing: '-0.3px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
        }}>
          🌐
        </div>
        Pathly
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px' }}>
        {MAIN_NAV.map(item)}

        <div style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          color: '#4b5563',
          textTransform: 'uppercase',
          padding: '16px 12px 6px',
        }}>
          Utility
        </div>

        {UTILITY_NAV.map(item)}
      </nav>
    </aside>
  );
}
