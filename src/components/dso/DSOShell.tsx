/**
 * DSOShell — Root layout shell for the DSO portal.
 * Renders the persistent left sidebar + top bar with main content in the scroll area.
 * All existing sub-views (StudentCenter, RequestCenter, etc.) are rendered as children.
 */
import { DSOSidebar } from './DSOSidebar';
import { DSOTopBar } from './DSOTopBar';
import type { DSOView } from './types';

interface DSOShellProps {
  children: React.ReactNode;
  currentView: DSOView;
  onNavigate: (view: DSOView) => void;
  userName: string;
  userInitials: string;
  notificationCount?: number;
  onLogout: () => void;
}

export function DSOShell({
  children,
  currentView,
  onNavigate,
  userName,
  userInitials,
  notificationCount,
  onLogout,
}: DSOShellProps) {
  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden">
      {/* Left Sidebar — always visible */}
      <DSOSidebar currentView={currentView} onNavigate={onNavigate} />

      {/* Right content pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky top bar */}
        <DSOTopBar
          userName={userName}
          userInitials={userInitials}
          notificationCount={notificationCount}
          onLogout={onLogout}
        />

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
