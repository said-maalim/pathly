/**
 * DSOTopBar — exactly matches the reference HTML topbar.
 * 56px height, search with bg #f4f5f7 + border, ⌘K mono badge,
 * circular notif button, user chip with avatar gradient.
 */
import { useState, useEffect, useRef } from 'react';

interface DSOTopBarProps {
  userName: string;
  userInitials: string;
  notificationCount?: number;
  onLogout: () => void;
}

export function DSOTopBar({ userName, userInitials, notificationCount = 0, onLogout }: DSOTopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '0 24px',
      height: '56px',
      flexShrink: 0,
    }}>
      {/* Search */}
      <div style={{
        flex: 1,
        maxWidth: '580px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#f4f5f7',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '0 12px',
        height: '36px',
        color: '#6b7280',
        fontSize: '13.5px',
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="4"/><path d="M11 11l3 3"/>
        </svg>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search student records, tasks, documents..."
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            flex: 1,
            fontSize: '13.5px',
            color: '#111827',
            fontFamily: 'inherit',
          }}
        />
        <span style={{
          fontSize: '11px',
          color: '#9ca3af',
          background: '#e5e7eb',
          borderRadius: '4px',
          padding: '2px 5px',
          fontFamily: 'monospace',
          flexShrink: 0,
        }}>⌘K</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '50%', background: '#f4f5f7', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2a4 4 0 00-4 4v3l-1 1h10l-1-1V6a4 4 0 00-4-4zM6.5 13a1.5 1.5 0 003 0"/>
          </svg>
          {notificationCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#2563eb',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
            }}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </div>

        {/* User chip */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 4px',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              cursor: 'pointer',
              background: '#f4f5f7',
              fontSize: '13px',
              fontWeight: 500,
              userSelect: 'none',
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {userInitials}
            </div>
            {userName}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4l4 4 4-4"/>
            </svg>
          </div>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '140px',
              zIndex: 100,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => { setDropdownOpen(false); onLogout(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#dc2626',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6"/>
                </svg>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
