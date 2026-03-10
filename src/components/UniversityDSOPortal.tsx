import { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Bell,
  Filter,
  Download,
  Search,
  Mail,
  Eye,
  Globe,
  BarChart3,
  AlertCircle,
  Plus,
  Send,
  X,
  CheckCircle2,
  FileCheck,
  Shield,
  ClipboardList,
  Loader2,
  ArrowLeft,
  CreditCard
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DSORequestCenter } from './DSORequestCenter';
import { DSODocumentCenter } from './DSODocumentCenter';
import { DSODocumentsCenter } from './DSODocumentsCenter';
import { DSOCommunicationCenter } from './DSOCommunicationCenter';
import { DSOStudentCenter } from './DSOStudentCenter';
import { DSOCreateRequestAction } from './DSOCreateRequestAction';
import { DSORequestActionsDashboard } from './DSORequestActionsDashboard';
import { DSORequestActionDetail } from './DSORequestActionDetail';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAccessToken } from '../utils/supabase/client';

interface UniversityDSOPortalProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userData?: any;
}

export function UniversityDSOPortal({ onNavigate, onLogout, userData }: UniversityDSOPortalProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'request-center' | 'document-center' | 'communication-center' | 'student-center' | 'request-actions-dashboard' | 'create-request-action' | 'request-action-detail'>('dashboard');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [targetStudentForRequest, setTargetStudentForRequest] = useState<{ id: string; name: string } | null>(null);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [documentRequestOpen, setDocumentRequestOpen] = useState(false);
  const [sevisUpdateOpen, setSevisUpdateOpen] = useState(false);
  const [visaUpdateOpen, setVisaUpdateOpen] = useState(false);
  const [passportUpdateOpen, setPassportUpdateOpen] = useState(false); // Added passport update dialog state
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sevisFormData, setSevisFormData] = useState({
    studentId: '',
    sevisStatus: 'active',
    compliance: 'compliant',
    nextCheckDate: '',
    notes: ''
  });
  const [visaFormData, setVisaFormData] = useState({
    studentId: '',
    visaType: 'F-1',
    status: 'Active',
    expirationDate: ''
  });
  const [passportFormData, setPassportFormData] = useState({ // Added passport form data
    studentId: '',
    passportStatus: 'Valid',
    passportExpirationDate: ''
  });
  const [updating, setUpdating] = useState(false);

  // Extract user info from userData
  const userEmail = userData?.data?.user?.email || 'admin@university.edu';
  const userName = userData?.data?.user?.user_metadata?.name || 'DSO Admin';
  const universityId = userData?.data?.user?.user_metadata?.universityId || 'stanford';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get access token from userData
      const token = userData?.data?.session?.access_token;
      if (!token) {
        console.error('No access token found in userData:', userData);
        setError('Not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Fetching students for university:', universityId);
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/dso/students/${universityId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      console.log('API response status:', response.status);
      console.log('API response data:', result);
      
      if (!response.ok) {
        console.error('API error response:', result);
        throw new Error(result.error || 'Failed to fetch students');
      }

      console.log('Fetched students:', result.students);
      setStudents(result.students || []);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSevisUpdate = async () => {
    if (!sevisFormData.studentId) {
      alert('Please select a student');
      return;
    }

    try {
      setUpdating(true);
      const token = userData?.data?.session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/dso/sevis/${sevisFormData.studentId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sevisStatus: sevisFormData.sevisStatus,
            compliance: sevisFormData.compliance,
            nextCheckDate: sevisFormData.nextCheckDate,
            notes: sevisFormData.notes
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update SEVIS status');
      }

      console.log('SEVIS updated:', result);
      alert('SEVIS status updated successfully! Student will be notified.');
      setSevisUpdateOpen(false);
      
      // Refresh student list
      await fetchStudents();
      
      // Reset form
      setSevisFormData({
        studentId: '',
        sevisStatus: 'active',
        compliance: 'compliant',
        nextCheckDate: '',
        notes: ''
      });
    } catch (err: any) {
      console.error('Error updating SEVIS:', err);
      alert(`Failed to update SEVIS status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleVisaUpdate = async () => {
    if (!visaFormData.studentId) {
      alert('Please select a student');
      return;
    }

    try {
      setUpdating(true);
      const token = userData?.data?.session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/dso/visa/${visaFormData.studentId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            visaType: visaFormData.visaType,
            status: visaFormData.status,
            expirationDate: visaFormData.expirationDate
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update visa status');
      }

      console.log('Visa status updated:', result);
      alert('Visa status updated successfully!');
      setVisaUpdateOpen(false);
      
      // Refresh student list
      await fetchStudents();
      
      // Reset form
      setVisaFormData({
        studentId: '',
        visaType: 'F-1',
        status: 'Active',
        expirationDate: ''
      });
    } catch (err: any) {
      console.error('Error updating visa:', err);
      alert(`Failed to update visa status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handlePassportUpdate = async () => {
    if (!passportFormData.studentId) {
      alert('Please select a student');
      return;
    }

    try {
      setUpdating(true);
      const token = userData?.data?.session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/dso/passport/${passportFormData.studentId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            passportStatus: passportFormData.passportStatus,
            passportExpirationDate: passportFormData.passportExpirationDate
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update passport status');
      }

      console.log('Passport status updated:', result);
      alert('Passport status updated successfully!');
      setPassportUpdateOpen(false);
      
      // Refresh student list
      await fetchStudents();
      
      // Reset form
      setPassportFormData({
        studentId: '',
        passportStatus: 'Valid',
        passportExpirationDate: ''
      });
    } catch (err: any) {
      console.error('Error updating passport:', err);
      alert(`Failed to update passport status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const stats = [
    { label: 'Total Students', value: '1,247', icon: Users, color: 'bg-blue-500' },
    { label: 'Active Visas', value: '1,189', icon: FileText, color: 'bg-green-500' },
    { label: 'Expiring Soon', value: '23', icon: AlertCircle, color: 'bg-yellow-500' },
    { label: 'Pending Requests', value: '12', icon: Bell, color: 'bg-red-500' }
  ];

  const pendingRequests = [
    { id: 1, student: 'Priya Patel', type: 'New I-20', reason: 'Program extension from undergraduate to graduate studies', date: 'Nov 10, 2024' },
    { id: 2, student: 'Michael Chen', type: 'OPT Application', reason: 'Graduating in May 2025, seeking employment in Computer Science field', date: 'Nov 9, 2024' },
    { id: 3, student: 'Yuki Tanaka', type: 'New I-20', reason: 'Lost original I-20 document', date: 'Nov 8, 2024' }
  ];

  const filteredStudents = students.filter(student => {
    const typeMatch = filterType === 'all' || student.visaType === filterType;
    const statusMatch = filterStatus === 'all' || student.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Expiring Soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending Renewal':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'Compliant':
        return 'bg-green-100 text-green-800';
      case 'Action Required':
        return 'bg-yellow-100 text-yellow-800';
      case 'Non-Compliant':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // If viewing Request Center
  if (currentView === 'request-center') {
    return <DSORequestCenter 
      onBack={() => setCurrentView('dashboard')} 
      onLogout={onLogout}
      userName={userName}
      userData={userData}
    />;
  }

  // If viewing Document Center
  if (currentView === 'document-center') {
    return (
      <div className="min-h-screen bg-[#F7F9FC]">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
              <Button
                variant="outline"
                onClick={onLogout}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </header>
        <DSODocumentsCenter userData={userData} />
      </div>
    );
  }

  // If viewing Communication Center
  if (currentView === 'communication-center') {
    return <DSOCommunicationCenter 
      onBack={() => setCurrentView('dashboard')} 
      onLogout={onLogout}
      userName={userName}
    />;
  }

  // If viewing Student Center
  if (currentView === 'student-center') {
    return <DSOStudentCenter 
      onBack={() => setCurrentView('dashboard')} 
      onLogout={onLogout}
      userName={userName}
      userData={userData}
      onCreateRequestAction={(studentId, studentName) => {
        setTargetStudentForRequest({ id: studentId, name: studentName });
        setCurrentView('create-request-action');
      }}
    />;
  }

  // If viewing Request Actions Dashboard
  if (currentView === 'request-actions-dashboard') {
    return <DSORequestActionsDashboard 
      onBack={() => setCurrentView('dashboard')} 
      onCreateNew={() => setCurrentView('create-request-action')}
      onViewDetail={(requestId) => {
        setSelectedRequestId(requestId);
        setCurrentView('request-action-detail');
      }}
      userData={userData}
    />;
  }

  // If creating Request Action
  if (currentView === 'create-request-action') {
    return <DSOCreateRequestAction 
      onBack={() => setCurrentView('request-actions-dashboard')} 
      userData={userData}
      targetStudent={targetStudentForRequest}
    />;
  }

  // If viewing Request Action Detail
  if (currentView === 'request-action-detail' && selectedRequestId) {
    return <DSORequestActionDetail 
      requestId={selectedRequestId}
      onBack={() => {
        setSelectedRequestId(null);
        setCurrentView('request-actions-dashboard');
      }}
      userData={userData}
    />;
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2A73E8] rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-gray-900">Pathly</span>
              <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">DSO Admin</Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hidden md:flex">
                🛡️ {userName}
              </Badge>
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#2A73E8] rounded-full flex items-center justify-center text-white">
                  {userInitials}
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-gray-900 mb-2">DSO Admin Portal</h1>
            <p className="text-gray-600">Manage your international student population and visa statuses.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <Card key={idx} className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Access Section */}
          <Card className="mb-8 shadow-sm border-0">
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => setCurrentView('student-center')}
                  className="h-auto py-6 px-6 flex-col items-start bg-white border-2 border-[#2A73E8] text-[#2A73E8] hover:bg-[#2A73E8] hover:text-white transition-all"
                  variant="outline"
                >
                  <div className="flex items-center gap-3 mb-2 w-full">
                    <Users className="w-6 h-6" />
                    <span className="text-lg">Student Center</span>
                  </div>
                  <p className="text-sm opacity-80">Manage student information and status</p>
                </Button>

                <Button
                  onClick={() => setCurrentView('request-center')}
                  className="h-auto py-6 px-6 flex-col items-start bg-white border-2 border-[#2A73E8] text-[#2A73E8] hover:bg-[#2A73E8] hover:text-white transition-all"
                  variant="outline"
                >
                  <div className="flex items-center gap-3 mb-2 w-full">
                    <ClipboardList className="w-6 h-6" />
                    <span className="text-lg">Request Center</span>
                  </div>
                  <p className="text-sm opacity-80">Manage student requests and approvals</p>
                </Button>

                <Button
                  onClick={() => setCurrentView('document-center')}
                  className="h-auto py-6 px-6 flex-col items-start bg-white border-2 border-[#2A73E8] text-[#2A73E8] hover:bg-[#2A73E8] hover:text-white transition-all"
                  variant="outline"
                >
                  <div className="flex items-center gap-3 mb-2 w-full">
                    <FileCheck className="w-6 h-6" />
                    <span className="text-lg">Document Center</span>
                  </div>
                  <p className="text-sm opacity-80">Verify and manage student documents</p>
                </Button>

                <Button
                  onClick={() => setCurrentView('communication-center')}
                  className="h-auto py-6 px-6 flex-col items-start bg-white border-2 border-[#2A73E8] text-[#2A73E8] hover:bg-[#2A73E8] hover:text-white transition-all"
                  variant="outline"
                >
                  <div className="flex items-center gap-3 mb-2 w-full">
                    <Mail className="w-6 h-6" />
                    <span className="text-lg">Communication Center</span>
                  </div>
                  <p className="text-sm opacity-80">Send emails and manage templates</p>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Bar */}
          <Card className="mb-8 shadow-sm border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Dialog open={bulkEmailOpen} onOpenChange={setBulkEmailOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#2A73E8] hover:bg-[#1557b0] justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Bulk Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Send Bulk Email Reminder</DialogTitle>
                      <DialogDescription>Send a reminder email to a group of students.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Recipient Group</label>
                        <Select defaultValue="expiring">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Students</SelectItem>
                            <SelectItem value="expiring">Students with Expiring Visas</SelectItem>
                            <SelectItem value="pending">Students with Pending Actions</SelectItem>
                            <SelectItem value="noncompliant">Non-Compliant Students</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Email Template</label>
                        <Select defaultValue="renewal">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="renewal">Visa Renewal Reminder</SelectItem>
                            <SelectItem value="documents">Document Upload Request</SelectItem>
                            <SelectItem value="compliance">Compliance Check</SelectItem>
                            <SelectItem value="custom">Custom Message</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Message</label>
                        <Textarea 
                          placeholder="Enter your message here..."
                          className="min-h-32"
                          defaultValue="This is a reminder to renew your visa status. Please contact the DSO office if you need assistance."
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button className="bg-[#2A73E8] hover:bg-[#1557b0]" onClick={() => {
                          alert('Bulk email sent successfully to 23 students');
                          setBulkEmailOpen(false);
                        }}>
                          <Send className="w-4 h-4 mr-2" />
                          Send Email
                        </Button>
                        <Button variant="outline" onClick={() => setBulkEmailOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={documentRequestOpen} onOpenChange={setDocumentRequestOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-[#2A73E8] text-[#2A73E8] justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Request Documents
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Request Document Upload</DialogTitle>
                      <DialogDescription>Request a specific document from a student.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Select Student</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a student..." />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student, idx) => (
                              <SelectItem key={idx} value={student.email}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Document Type</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose document type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enrollment">Enrollment Verification</SelectItem>
                            <SelectItem value="transcript">Academic Transcript</SelectItem>
                            <SelectItem value="financial">Financial Statement</SelectItem>
                            <SelectItem value="passport">Passport Copy</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Due Date</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Additional Notes</label>
                        <Textarea 
                          placeholder="Provide any additional instructions..."
                          className="min-h-24"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button className="bg-[#2A73E8] hover:bg-[#1557b0]" onClick={() => {
                          alert('Document request sent successfully');
                          setDocumentRequestOpen(false);
                        }}>
                          Send Request
                        </Button>
                        <Button variant="outline" onClick={() => setDocumentRequestOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  onClick={() => setCurrentView('request-actions-dashboard')}
                  variant="outline" 
                  className="border-[#2A73E8] text-[#2A73E8] justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Request Actions
                </Button>

                <Dialog open={sevisUpdateOpen} onOpenChange={setSevisUpdateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-[#2A73E8] text-[#2A73E8] justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      Update SEVIS Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Update Student SEVIS Status</DialogTitle>
                      <DialogDescription>Update the SEVIS status and compliance of a student.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Select Student</label>
                        <Select value={sevisFormData.studentId} onValueChange={(value) => {
                          const student = students.find(s => s.id === value);
                          setSevisFormData(prev => ({...prev, studentId: value}));
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a student..." />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student, idx) => (
                              <SelectItem key={idx} value={student.id}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">SEVIS Status</label>
                        <Select value={sevisFormData.sevisStatus} onValueChange={(value) => setSevisFormData(prev => ({...prev, sevisStatus: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="initial">Initial</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Compliance Status</label>
                        <Select value={sevisFormData.compliance} onValueChange={(value) => setSevisFormData(prev => ({...prev, compliance: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compliant">Compliant</SelectItem>
                            <SelectItem value="action-required">Action Required</SelectItem>
                            <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Next Check Date</label>
                        <input 
                          type="date" 
                          value={sevisFormData.nextCheckDate}
                          onChange={(e) => setSevisFormData(prev => ({...prev, nextCheckDate: e.target.value}))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Notes</label>
                        <Textarea 
                          value={sevisFormData.notes}
                          onChange={(e) => setSevisFormData(prev => ({...prev, notes: e.target.value}))}
                          placeholder="Add any relevant notes..."
                          className="min-h-24"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          className="bg-[#2A73E8] hover:bg-[#1557b0]" 
                          onClick={handleSevisUpdate}
                          disabled={updating}
                        >
                          {updating ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                          ) : (
                            'Update SEVIS Status'
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => setSevisUpdateOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={visaUpdateOpen} onOpenChange={setVisaUpdateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-[#2A73E8] text-[#2A73E8] justify-start">
                      <FileCheck className="w-4 h-4 mr-2" />
                      Update Visa Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Update Student Visa Status</DialogTitle>
                      <DialogDescription>Update the visa type and status of a student.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Select Student</label>
                        <Select value={visaFormData.studentId} onValueChange={(value) => {
                          setVisaFormData(prev => ({...prev, studentId: value}));
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a student..." />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student, idx) => (
                              <SelectItem key={idx} value={student.id}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Visa Type</label>
                        <Select value={visaFormData.visaType} onValueChange={(value) => setVisaFormData(prev => ({...prev, visaType: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="F-1">F-1 (Academic Student)</SelectItem>
                            <SelectItem value="J-1">J-1 (Exchange Visitor)</SelectItem>
                            <SelectItem value="M-1">M-1 (Vocational Student)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Visa Status</label>
                        <Select value={visaFormData.status} onValueChange={(value) => setVisaFormData(prev => ({...prev, status: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                            <SelectItem value="Pending Renewal">Pending Renewal</SelectItem>
                            <SelectItem value="Expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Expiration Date</label>
                        <input 
                          type="date" 
                          value={visaFormData.expirationDate}
                          onChange={(e) => setVisaFormData(prev => ({...prev, expirationDate: e.target.value}))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          className="bg-[#2A73E8] hover:bg-[#1557b0]" 
                          onClick={handleVisaUpdate}
                          disabled={updating}
                        >
                          {updating ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                          ) : (
                            'Update Visa Status'
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => setVisaUpdateOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={passportUpdateOpen} onOpenChange={setPassportUpdateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-[#2A73E8] text-[#2A73E8] justify-start">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Update Passport Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Update Student Passport Status</DialogTitle>
                      <DialogDescription>Update the passport status and expiration date of a student.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Select Student</label>
                        <Select value={passportFormData.studentId} onValueChange={(value) => {
                          setPassportFormData(prev => ({...prev, studentId: value}));
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a student..." />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student, idx) => (
                              <SelectItem key={idx} value={student.id}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Passport Status</label>
                        <Select value={passportFormData.passportStatus} onValueChange={(value) => setPassportFormData(prev => ({...prev, passportStatus: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Valid">Valid</SelectItem>
                            <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                            <SelectItem value="Expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Expiration Date</label>
                        <input 
                          type="date" 
                          value={passportFormData.passportExpirationDate}
                          onChange={(e) => setPassportFormData(prev => ({...prev, passportExpirationDate: e.target.value}))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          className="bg-[#2A73E8] hover:bg-[#1557b0]" 
                          onClick={handlePassportUpdate}
                          disabled={updating}
                        >
                          {updating ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                          ) : (
                            'Update Passport Status'
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => setPassportUpdateOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <Card className="mb-8 shadow-sm border-0 border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Pending Student Requests ({pendingRequests.length})
                  </div>
                  <Button 
                    onClick={() => setCurrentView('request-center')}
                    className="bg-[#2A73E8] hover:bg-[#1557b0]"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    View Request Center
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-gray-900">{request.student}</p>
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                              {request.type}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{request.reason}</p>
                          <p className="text-gray-500">Submitted: {request.date}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            <Mail className="w-4 h-4 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}