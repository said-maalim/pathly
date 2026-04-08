/**
 * SettingsPage — shell: sidebar navigation + section router.
 * All section content lives in src/components/settings/*.
 * Refactored to match Pathly inline style design.
 */
import { useState } from 'react';
import {
  User, FileText, Bell, Shield, Building2,
  Settings as SettingsIcon, Database, LogOut, ArrowLeft
} from 'lucide-react';
import { ProfileSection } from './settings/ProfileSection';
import { NotificationsSection } from './settings/NotificationsSection';
import { SecuritySection } from './settings/SecuritySection';
import {
  ImmigrationSection,
  UniversitySection,
  PreferencesSection,
  DataSection,
} from './settings/AdditionalSections';

type SettingsSection = 'profile' | 'immigration' | 'notifications' | 'security' | 'university' | 'preferences' | 'data';

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
}

const MENU = [
  { id: 'profile' as SettingsSection, label: 'Profile', icon: User },
  { id: 'immigration' as SettingsSection, label: 'Immigration & Student Info', icon: FileText },
  { id: 'notifications' as SettingsSection, label: 'Notifications', icon: Bell },
  { id: 'security' as SettingsSection, label: 'Security', icon: Shield },
  { id: 'university' as SettingsSection, label: 'University Info', icon: Building2 },
  { id: 'preferences' as SettingsSection, label: 'Preferences', icon: SettingsIcon },
  { id: 'data' as SettingsSection, label: 'Data & Documents', icon: Database },
] as const;

function renderSection(section: SettingsSection) {
  switch (section) {
    case 'profile': return <ProfileSection />;
    case 'immigration': return <ImmigrationSection />;
    case 'notifications': return <NotificationsSection />;
    case 'security': return <SecuritySection />;
    case 'university': return <UniversitySection />;
    case 'preferences': return <PreferencesSection />;
    case 'data': return <DataSection />;
  }
}

export function SettingsPage({ onBack, onLogout }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif", minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 500, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#111827'} onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>Admin Settings</h1>
        <div style={{ width: '130px' }} /> {/* spacer for center alignment */}
      </div>

      {/* Main layout */}
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Sidebar */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', position: 'sticky', top: '88px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {MENU.map(({ id, label, icon: Icon }) => {
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 500, transition: 'all 0.15s',
                      background: active ? '#eff6ff' : 'transparent',
                      color: active ? '#1d4ed8' : '#4b5563'
                    }}
                    onMouseEnter={e => !active && (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon size={16} color={active ? '#2563eb' : '#9ca3af'} />
                    {label}
                  </button>
                );
              })}

              {/* Logout */}
              <div style={{ margin: '12px 0', borderTop: '1px solid #e5e7eb' }} />
              <button
                onClick={onLogout}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 500, color: '#dc2626', background: 'transparent', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} color="#ef4444" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: '400px' }}>
          {renderSection(activeSection)}
        </div>
        
      </div>
    </div>
  );
}
