import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BookOpen, 
  Settings,
  Upload,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Menu,
  X,
  Globe,
  Calendar,
  FileCheck,
  Shield,
  Bell,
  Plus,
  Eye,
  Inbox,
  ClipboardList,
  Loader2,
  ArrowLeft,
  CreditCard, // Added for passport icon
  List
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { RequestCenter } from './RequestCenter';
import { I20RequestTracker } from './I20RequestTracker';
import { StatusBadge } from './StatusBadge';
import { StudentDocumentsPage } from './StudentDocumentsPage';
import { ResourcesPage } from './ResourcesPage';
import { SettingsPage } from './SettingsPage';
import { AskLexiPage } from './AskLexiPage';
import { DSORequestsSection } from './DSORequestsSection';
import { AllRequestsPage } from './AllRequestsPage';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface UniversityStudentPortalProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userData?: any;
}

export function UniversityStudentPortal({ onNavigate, onLogout, userData }: UniversityStudentPortalProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'documents' | 'i20-request' | 'i20-tracker' | 'settings' | 'ask-lexi' | 'resources' | 'all-requests'>('dashboard');
  const [requestType, setRequestType] = useState<'i20' | 'opt' | null>(null);
  const [requestDetails, setRequestDetails] = useState('');
  const [i20Requests, setI20Requests] = useState<any[]>([]);
  const [sevisStatus, setSevisStatus] = useState<any>(null);
  const [visaStatus, setVisaStatus] = useState<any>(null);
  const [passportStatus, setPassportStatus] = useState<any>(null); // Added passport status state
  const [loading, setLoading] = useState(true);
  const [dsoRequests, setDsoRequests] = useState<any[]>([]);
  const [respondingToRequest, setRespondingToRequest] = useState<any>(null);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);

  // Extract user info from userData
  const userEmail = userData?.data?.user?.email || 'student@university.edu';
  const userName = userData?.data?.user?.user_metadata?.name || 'Student';

  // Check user type on mount
  useEffect(() => {
    const userType = userData?.data?.user?.user_metadata?.userType;
    if (userType && userType !== 'student') {
      alert(`You are logged in as a ${userType.toUpperCase()}. This is the student portal. Please access the ${userType.toUpperCase()} portal instead.`);
    }
  }, [userData]);

  // Fetch SEVIS data and requests on mount
  useEffect(() => {
    fetchSevisData();
    fetchMyRequests();
    fetchDSORequests();
    fetchRecentDocuments();
  }, []);

  // Refresh requests when opening tracker view
  useEffect(() => {
    if (currentView === 'i20-tracker') {
      fetchMyRequests();
    }
  }, [currentView]);

  const fetchSevisData = async () => {
    try {
      setLoading(true);
      const token = userData?.data?.session?.access_token;
      
      if (!token) {
        console.error('No access token available');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/visa/profile`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (response.ok && result.visaProfile) {
        console.log('Fetched visa profile data:', result.visaProfile);
        
        // Capitalize first letter for display
        const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : 'Not set';
        
        // Set SEVIS status
        setSevisStatus({
          status: capitalize(result.visaProfile.sevisStatus || 'not set'),
          lastUpdated: result.visaProfile.lastUpdated 
            ? new Date(result.visaProfile.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Not available',
          compliance: capitalize(result.visaProfile.compliance || 'not set'),
          nextCheck: result.visaProfile.nextCheckDate 
            ? new Date(result.visaProfile.nextCheckDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Not scheduled'
        });

        // Set Visa status with days remaining calculation
        let daysRemaining = 0;
        if (result.visaProfile.expirationDate) {
          const expirationDate = new Date(result.visaProfile.expirationDate);
          const today = new Date();
          const diffTime = expirationDate.getTime() - today.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        setVisaStatus({
          visaType: result.visaProfile.visaType || 'Not set',
          status: result.visaProfile.status || 'Not set',
          expirationDate: result.visaProfile.expirationDate 
            ? new Date(result.visaProfile.expirationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Not set',
          daysRemaining: result.visaProfile.expirationDate ? daysRemaining : null
        });

        // Set Passport status with days remaining calculation
        let passportDaysRemaining = 0;
        if (result.visaProfile.passportExpirationDate) {
          const passportExpirationDate = new Date(result.visaProfile.passportExpirationDate);
          const today = new Date();
          const diffTime = passportExpirationDate.getTime() - today.getTime();
          passportDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        setPassportStatus({
          status: result.visaProfile.passportStatus || 'Not set',
          expirationDate: result.visaProfile.passportExpirationDate 
            ? new Date(result.visaProfile.passportExpirationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Not set',
          daysRemaining: result.visaProfile.passportExpirationDate ? passportDaysRemaining : null
        });
      } else {
        // Set default if no data
        setSevisStatus({
          status: 'Not set',
          lastUpdated: 'Not available',
          compliance: 'Not set',
          nextCheck: 'Not scheduled'
        });
        setVisaStatus({
          visaType: 'Not set',
          status: 'Not set',
          expirationDate: 'Not set',
          daysRemaining: null
        });
        setPassportStatus({
          status: 'Not set',
          expirationDate: 'Not set',
          daysRemaining: null
        });
      }
    } catch (error) {
      console.error('Error fetching visa profile data:', error);
      setSevisStatus({
        status: 'Error loading',
        lastUpdated: 'Error',
        compliance: 'Error',
        nextCheck: 'Error'
      });
      setVisaStatus({
        visaType: 'Error',
        status: 'Error',
        expirationDate: 'Error',
        daysRemaining: null
      });
      setPassportStatus({
        status: 'Error',
        expirationDate: 'Error',
        daysRemaining: null
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = userData?.data?.session?.access_token || userData?.session?.access_token;
      
      console.log('Fetching my requests with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/requests/my-requests`,
        {
          headers: {
            'Authorization': `Bearer ${token || publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Error fetching requests:', error);
        return;
      }

      const result = await response.json();
      console.log('Fetched my requests:', result.requests);
      
      // Transform backend requests to display format
      const transformedRequests = result.requests.map((req: any) => {
        // Map backend status to display status
        let displayStatus = req.status;
        if (req.status === 'pending') displayStatus = 'submitted';
        else if (req.status === 'info needed') displayStatus = 'needs-info';
        
        // Calculate timeline based on status
        let timeline = [
          {
            step: 'Submitted',
            status: 'completed',
            date: req.submittedAt?.split('T')[0],
            note: 'Request received and logged in system'
          },
          {
            step: 'Under Review',
            status: req.status === 'pending' ? 'current' : req.status === 'approved' || req.status === 'rejected' ? 'completed' : 'current'
          },
          {
            step: 'In Progress',
            status: req.status === 'approved' ? 'completed' : 'pending'
          },
          {
            step: 'Completed',
            status: req.status === 'approved' ? 'completed' : 'pending'
          }
        ];
        
        // If rejected, update timeline
        if (req.status === 'rejected') {
          timeline = [
            {
              step: 'Submitted',
              status: 'completed',
              date: req.submittedAt?.split('T')[0],
              note: 'Request received and logged in system'
            },
            {
              step: 'Under Review',
              status: 'completed'
            },
            {
              step: 'Rejected',
              status: 'current',
              date: req.processedAt?.split('T')[0],
              note: req.notes || 'Request was rejected'
            }
          ];
        }
        
        return {
          id: req.id,
          category: req.requestType,
          categoryDisplay: req.requestName || req.requestType,
          requestName: req.requestName,
          requestType: req.requestType,
          reason: req.reason,
          dsoNote: req.notes,
          status: displayStatus,
          submittedDate: req.submittedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          submittedAt: req.submittedAt,
          assignedDSO: 'DSO Office',
          dsoEmail: 'dso@university.edu',
          timeline,
          documents: [],
          comments: req.notes ? [{ from: 'DSO', message: req.notes, date: req.processedAt?.split('T')[0] || '' }] : []
        };
      });
      
      setI20Requests(transformedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchDSORequests = async () => {
    try {
      const token = userData?.data?.session?.access_token || userData?.session?.access_token;
      
      console.log('Fetching DSO requests with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/requests/dso-requests`,
        {
          headers: {
            'Authorization': `Bearer ${token || publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Error fetching DSO requests:', error);
        return;
      }

      const result = await response.json();
      console.log('Fetched DSO requests:', result.requests);
      
      // Use the backend data directly - it already has the right structure
      setDsoRequests(result.requests || []);
    } catch (error) {
      console.error('Error fetching DSO requests:', error);
    }
  };

  const fetchRecentDocuments = async () => {
    try {
      const token = userData?.data?.session?.access_token || userData?.session?.access_token;
      
      if (!userData?.data?.user?.id) {
        console.log('No userId available for fetching documents');
        return;
      }
      
      console.log('Fetching recent documents for user:', userData?.data?.user?.id);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/documents/student/${userData?.data?.user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token || publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Error fetching recent documents:', error);
        return;
      }

      const result = await response.json();
      console.log('Fetched documents:', result.documents);
      
      // Sort by upload date and take most recent 3
      const sortedDocs = (result.documents || [])
        .sort((a: any, b: any) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime())
        .slice(0, 3);
      
      setRecentDocuments(sortedDocs);
    } catch (error) {
      console.error('Error fetching recent documents:', error);
      setRecentDocuments([]);
    }
  };

  // Refresh all dashboard data
  const refreshDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSevisData(),
        fetchDSORequests(),
        fetchRecentDocuments()
      ]);
      toast.success('Dashboard refreshed', {
        description: 'All data has been updated'
      });
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error('Failed to refresh dashboard', {
        description: 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = () => {
    if (requestType && requestDetails.trim()) {
      // Simulate request submission
      alert(`Your ${requestType === 'i20' ? 'I-20' : 'OPT'} request has been submitted to your DSO. You'll receive an email confirmation shortly.`);
      setRequestType(null);
      setRequestDetails('');
    }
  };

  const handleI20RequestSubmit = async (requestData: any) => {
    try {
      setLoading(true);
      
      const token = userData?.data?.session?.access_token || userData?.session?.access_token;
      
      console.log('Submitting request with token:', token ? 'Token exists' : 'No token');
      
      // Submit request to backend
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-268175b3/requests/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || publicAnonKey}`
        },
        body: JSON.stringify({
          requestType: requestData.requestId, // e.g., 'cpt', 'opt', 'travel', etc.
          requestName: requestData.requestName,
          reason: requestData.formData.additionalInfo || `Request for ${requestData.requestName}`,
          formData: requestData.formData,
          uploadedFiles: Object.keys(requestData.uploadedFiles || {}).map(key => ({
            field: key,
            fileName: requestData.uploadedFiles[key]?.name
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit request');
      }

      const result = await response.json();
      console.log('Request submitted successfully:', result);

      // Fetch updated list of requests from backend
      await fetchMyRequests();
      
      // Navigate to tracker to see the new request
      setCurrentView('i20-tracker');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert(`Failed to submit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async () => {
    if (!respondingToRequest) return;
    
    try {
      setSubmittingResponse(true);
      const token = userData?.data?.session?.access_token || userData?.session?.access_token;
      
      // For confirmation requests, just send the confirmation
      const responseData: any = {};
      
      if (respondingToRequest.type === 'confirmation') {
        if (!confirmationChecked) {
          alert('Please confirm by checking the checkbox');
          return;
        }
        responseData.confirmed = true;
        responseData.confirmedStatement = respondingToRequest.confirmationStatement;
      }
      // TODO: Add form and document upload handling
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/requests/respond`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requestActionId: respondingToRequest.id,
            responseData,
            documentUrl: null // TODO: Handle file uploads
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit response');
      }

      const result = await response.json();
      console.log('Response submitted successfully:', result);

      // Close modal and refresh requests
      setRespondingToRequest(null);
      setConfirmationChecked(false);
      await fetchDSORequests();
      
      alert('Response submitted successfully!');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert(`Failed to submit response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const NavItems = () => (
    <>
      <button onClick={() => setCurrentView('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left ${
        currentView === 'dashboard' ? 'bg-[#2A73E8]/10 text-[#2A73E8]' : 'text-gray-700 hover:bg-gray-100'
      } transition-colors`}>
        <LayoutDashboard className="w-5 h-5" />
        <span>Dashboard</span>
      </button>
      <button onClick={() => setCurrentView('documents')} className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left ${
        currentView === 'documents' ? 'bg-[#2A73E8]/10 text-[#2A73E8]' : 'text-gray-700 hover:bg-gray-100'
      } transition-colors`}>
        <FileText className="w-5 h-5" />
        <span>Documents</span>
      </button>
      <button onClick={() => onNavigate('request-center')} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full text-left">
        <ClipboardList className="w-5 h-5" />
        <span>Request Center</span>
      </button>
      <button onClick={() => setCurrentView('resources')} className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left ${
        currentView === 'resources' ? 'bg-[#2A73E8]/10 text-[#2A73E8]' : 'text-gray-700 hover:bg-gray-100'
      } transition-colors`}>
        <BookOpen className="w-5 h-5" />
        <span>Resources</span>
      </button>
      <button onClick={() => setCurrentView('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left ${
        currentView === 'settings' ? 'bg-[#2A73E8]/10 text-[#2A73E8]' : 'text-gray-700 hover:bg-gray-100'
      } transition-colors`}>
        <Settings className="w-5 h-5" />
        <span>Settings</span>
      </button>
      <button onClick={() => setCurrentView('ask-lexi')} className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left ${
        currentView === 'ask-lexi' ? 'bg-[#2A73E8]/10 text-[#2A73E8]' : 'text-gray-700 hover:bg-gray-100'
      } transition-colors`}>
        <MessageSquare className="w-5 h-5" />
        <span>Ask Lexi</span>
      </button>
      <button onClick={() => setCurrentView('all-requests')} className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left ${
        currentView === 'all-requests' ? 'bg-[#2A73E8]/10 text-[#2A73E8]' : 'text-gray-700 hover:bg-gray-100'
      } transition-colors`}>
        <List className="w-5 h-5" />
        <span>All Requests</span>
      </button>
    </>
  );

  const documentRequests = [
    { id: 1, title: 'Enrollment Verification - Fall 2024', dueDate: 'Nov 20, 2024', status: 'Pending' },
    { id: 2, title: 'Proof of Address', dueDate: 'Nov 25, 2024', status: 'Pending' }
  ];

  // Conditional rendering based on current view
  if (currentView === 'documents') {
    return (
      <div className="min-h-screen bg-[#F7F9FC]">
        {/* Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        <StudentDocumentsPage key="documents" userData={userData} />
      </div>
    );
  }

  if (currentView === 'i20-request') {
    return (
      <RequestCenter 
        key="i20-request"
        onBack={() => setCurrentView('dashboard')} 
        onSubmit={handleI20RequestSubmit}
      />
    );
  }

  if (currentView === 'i20-tracker') {
    return (
      <I20RequestTracker 
        key="i20-tracker"
        onBack={() => setCurrentView('dashboard')}
        requests={i20Requests}
        onSubmitNewRequest={() => setCurrentView('i20-request')}
      />
    );
  }

  if (currentView === 'settings') {
    return (
      <SettingsPage 
        key="settings"
        onBack={() => setCurrentView('dashboard')} 
        onLogout={onLogout}
      />
    );
  }

  if (currentView === 'ask-lexi') {
    return (
      <AskLexiPage 
        key="ask-lexi" 
        onBack={() => setCurrentView('dashboard')}
        userName={userName}
      />
    );
  }

  if (currentView === 'resources') {
    return (
      <ResourcesPage 
        key="resources" 
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'all-requests') {
    return (
      <AllRequestsPage 
        key="all-requests" 
        onBack={() => setCurrentView('dashboard')}
        studentRequests={i20Requests}
        dsoRequests={dsoRequests}
        onViewStudentRequest={(request) => {
          // Navigate to tracker to view full request details
          setCurrentView('i20-tracker');
        }}
        onViewDSORequest={(request) => {
          // For now, just log - we can add a detailed view later
          console.log('View DSO request:', request);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-[#2A73E8] rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-gray-900">Pathly</span>
          </div>
          <p className="text-gray-600 mt-2">University Portal</p>
          <Badge className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-100">Student</Badge>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItems />
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Button variant="outline" className="w-full" onClick={onLogout}>
            Log Out
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 bg-white h-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-[#2A73E8] rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl text-gray-900">Pathly</span>
                </div>
                <p className="text-gray-600 mt-2">University Portal</p>
                <Badge className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-100">Student</Badge>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              <NavItems />
            </nav>
            <div className="p-4 border-t border-gray-200">
              <Button variant="outline" className="w-full" onClick={onLogout}>
                Log Out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button 
                className="md:hidden p-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
              
              <div className="flex items-center gap-4 ml-auto">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 hidden md:flex">
                  👤 {userName}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Bell className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#2A73E8] rounded-full flex items-center justify-center text-white">
                    {userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-gray-900">{userName}</p>
                    <p className="text-gray-500">{userEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-gray-900 mb-2">Welcome back, {userName}!</h1>
              <p className="text-gray-600">Manage your visa status and immigration documents through your university.</p>
            </div>

            {/* SEVIS Status Card */}
            <Card className="mb-6 shadow-sm border-0 border-l-4 border-l-green-500">
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2A73E8] mr-3" />
                    <span className="text-gray-600">Loading SEVIS status...</span>
                  </div>
                ) : (
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 mb-2">SEVIS Status</h3>
                        {sevisStatus ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                {sevisStatus.status}
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                {sevisStatus.compliance}
                              </Badge>
                            </div>
                            <p className="text-gray-600">Last updated: {sevisStatus.lastUpdated}</p>
                            <p className="text-gray-600">Next compliance check: {sevisStatus.nextCheck}</p>
                          </div>
                        ) : (
                          <p className="text-gray-600">No SEVIS data available</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[#2A73E8] border-[#2A73E8]"
                        onClick={refreshDashboard}
                      >
                        <Loader2 className="w-4 h-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Visa Status Card */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Visa Status
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#2A73E8]" />
                    ) : visaStatus ? (
                      <Badge className={
                        visaStatus.status === 'Active' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                        visaStatus.status === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                        visaStatus.status === 'Pending Renewal' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' :
                        'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      }>
                        {visaStatus.visaType} {visaStatus.status}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Not set</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-[#2A73E8]" />
                    </div>
                  ) : visaStatus ? (
                    <div className="space-y-4">
                      {visaStatus.daysRemaining !== null && (
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Time Remaining</span>
                            <span className={`${
                              visaStatus.daysRemaining < 90 ? 'text-red-600' :
                              visaStatus.daysRemaining < 180 ? 'text-yellow-600' :
                              'text-gray-900'
                            }`}>
                              {visaStatus.daysRemaining > 0 
                                ? `${visaStatus.daysRemaining} days` 
                                : 'Expired'}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(100, Math.max(0, (visaStatus.daysRemaining / 730) * 100))} 
                            className="h-2" 
                          />
                        </div>
                      )}
                      <div className={visaStatus.daysRemaining !== null ? "pt-4 border-t border-gray-200" : ""}>
                        <p className="text-gray-600 mb-1">Expiration Date</p>
                        <p className="text-gray-900">{visaStatus.expirationDate}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-4">No visa data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Request Center Card */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-[#2A73E8]" />
                    Request Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start bg-[#2A73E8] hover:bg-[#1557b0] text-white"
                    onClick={() => setCurrentView('i20-request')}
                  >
                    <Inbox className="w-4 h-4 mr-2" />
                    New DSO Request
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setCurrentView('i20-tracker')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Track My Requests
                  </Button>
                </CardContent>
              </Card>

              {/* Passport Status Card */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Passport Status
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#2A73E8]" />
                    ) : passportStatus ? (
                      <Badge className={
                        passportStatus.status === 'Valid' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                        passportStatus.status === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                        passportStatus.status === 'Expired' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                        'bg-gray-100 text-gray-800 hover:bg-gray-100'
                      }>
                        {passportStatus.status}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Not set</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-[#2A73E8]" />
                    </div>
                  ) : passportStatus ? (
                    <div className="space-y-4">
                      {passportStatus.daysRemaining !== null && passportStatus.expirationDate !== 'Not set' && (
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Time Remaining</span>
                            <span className={`${
                              passportStatus.daysRemaining < 180 ? 'text-red-600' :
                              passportStatus.daysRemaining < 365 ? 'text-yellow-600' :
                              'text-gray-900'
                            }`}>
                              {passportStatus.daysRemaining > 0 
                                ? `${passportStatus.daysRemaining} days` 
                                : 'Expired'}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(100, Math.max(0, (passportStatus.daysRemaining / 1825) * 100))} 
                            className="h-2" 
                          />
                        </div>
                      )}
                      <div className={passportStatus.daysRemaining !== null && passportStatus.expirationDate !== 'Not set' ? "pt-4 border-t border-gray-200" : ""}>
                        <p className="text-gray-600 mb-1">Expiration Date</p>
                        <p className="text-gray-900">{passportStatus.expirationDate}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-4">No passport data available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Requests from DSO - New Component */}
            <div className="mb-6">
              <DSORequestsSection 
                requests={dsoRequests}
                onViewAllRequests={() => setCurrentView('all-requests')}
                onRespondSubmit={async (requestId, responseData) => {
                  try {
                    const token = userData?.data?.session?.access_token || userData?.session?.access_token;
                    
                    const response = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/requests/respond`,
                      {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          requestActionId: requestId,
                          responseData,
                          documentUrl: null
                        })
                      }
                    );

                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to submit response');
                    }

                    const result = await response.json();
                    console.log('Response submitted successfully:', result);

                    // Refresh requests
                    await fetchDSORequests();
                    
                    // Show success toast
                    toast.success('Response submitted to your DSO', {
                      description: 'Your DSO will review your submission shortly.'
                    });
                  } catch (error) {
                    console.error('Error submitting response:', error);
                    toast.error('Failed to submit response', {
                      description: error instanceof Error ? error.message : 'Please try again'
                    });
                    throw error;
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Documents */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Recent Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentDocuments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-600">
                        No documents uploaded by DSO. If uploaded, you will see it here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentDocuments.map((doc) => {
                        // Format the date
                        const formattedDate = doc.uploadedDate 
                          ? new Date(doc.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Unknown date';
                        
                        return (
                          <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-[#2A73E8]" />
                              </div>
                              <div>
                                <p className="text-gray-900">{doc.title || doc.fileName}</p>
                                <p className="text-gray-500">{formattedDate}</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button variant="outline" className="w-full mt-4" onClick={() => setCurrentView('documents')}>
                    View All Documents
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Requests Submitted */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-[#2A73E8]" />
                    Recent Requests Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {i20Requests.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <ClipboardList className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-4">
                        No requests submitted yet
                      </p>
                      <Button 
                        className="bg-[#2A73E8] hover:bg-[#1557b0]"
                        onClick={() => setCurrentView('i20-request')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Submit New Request
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {i20Requests.slice(0, 3).map((request) => {
                        const formattedDate = request.submittedDate 
                          ? new Date(request.submittedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Unknown date';
                        
                        return (
                          <div 
                            key={request.id} 
                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                            onClick={() => setCurrentView('i20-tracker')}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-[#2A73E8]" />
                              </div>
                              <div>
                                <p className="text-gray-900">{request.requestName || request.categoryDisplay}</p>
                                <p className="text-gray-500">{formattedDate}</p>
                              </div>
                            </div>
                            <StatusBadge status={request.status} />
                          </div>
                        );
                      })}
                      <Button 
                        variant="outline" 
                        className="w-full mt-4" 
                        onClick={() => setCurrentView('all-requests')}
                      >
                        View All Requests
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}