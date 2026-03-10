import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  BookOpen,
  Settings,
  Menu,
  X,
  Globe,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import { RequestCenter } from './RequestCenter';

interface RequestCenterPageProps {
  onNavigate: (page: string) => void;
  onSubmit: (requestData: any) => void;
}

export function RequestCenterPage({ onNavigate, onSubmit }: RequestCenterPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NavItems = () => (
    <>
      <button onClick={() => onNavigate('student-portal')} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full text-left">
        <LayoutDashboard className="w-5 h-5" />
        <span>Dashboard</span>
      </button>
      <button onClick={() => onNavigate('student-portal')} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full text-left">
        <FileText className="w-5 h-5" />
        <span>Documents</span>
      </button>
      <button onClick={() => onNavigate('request-center')} className="flex items-center gap-3 px-4 py-3 bg-[#2A73E8]/10 text-[#2A73E8] rounded-lg w-full text-left">
        <ClipboardList className="w-5 h-5" />
        <span>Request Center</span>
      </button>
      <button onClick={() => onNavigate('student-portal')} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full text-left">
        <BookOpen className="w-5 h-5" />
        <span>Resources</span>
      </button>
      <button onClick={() => onNavigate('student-portal')} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full text-left">
        <Settings className="w-5 h-5" />
        <span>Settings</span>
      </button>
      <button onClick={() => onNavigate('ask-lexi')} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full text-left">
        <MessageSquare className="w-5 h-5" />
        <span>Ask Lexi</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2A73E8] rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl text-gray-900">Pathly</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2A73E8] rounded-full flex items-center justify-center text-white">
                SR
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 
          w-64 p-6 z-30 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="space-y-2">
            <NavItems />
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content - Request Center */}
        <main className="flex-1">
          <RequestCenter 
            onBack={() => onNavigate('student-portal')} 
            onSubmit={onSubmit}
          />
        </main>
      </div>
    </div>
  );
}
