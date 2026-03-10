import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  ClipboardList,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Mail,
  Download,
  Calendar,
  User,
  FileText,
  ArrowUpDown,
  MoreVertical,
  Loader,
  Globe,
  Bell,
  Home
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RequestProcessingView } from './RequestProcessingView';

interface DSORequestCenterProps {
  onBack: () => void;
  onLogout?: () => void;
  userName?: string;
  userData?: any;
}

interface Request {
  id: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  requestType: string;
  category: string;
  status: 'New' | 'Under Review' | 'Info Needed' | 'Approved' | 'Rejected';
  priority: 'Urgent' | 'High' | 'Normal' | 'Low';
  submittedDate: string;
  dueDate: string;
  assignedTo?: string;
  details: any;
  documents: any[];
  internalNotes: string[];
}

export function DSORequestCenter({ onBack, onLogout, userName = 'DSO Admin', userData }: DSORequestCenterProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'student'>('date');
  const [loading, setLoading] = useState(true);
  const [backendRequests, setBackendRequests] = useState<any[]>([]);

  // Get user type
  const userType = userData?.data?.user?.user_metadata?.userType;

  // Check user type on mount
  useEffect(() => {
    if (userType && userType !== 'dso') {
      alert(`You are logged in as a ${userType.toUpperCase()}. This is the DSO portal. Please access the ${userType.toUpperCase()} portal instead.`);
    }
  }, [userType]);

  // Mock request data - shown alongside backend requests
  const [requests, setRequests] = useState<Request[]>([
    {
      id: 'REQ-2024-001',
      studentName: 'Sarah Rodriguez',
      studentEmail: 'sarah.r@university.edu',
      studentId: 'STU-001',
      requestType: 'CPT Application',
      category: 'Immigration Documents',
      status: 'New',
      priority: 'High',
      submittedDate: '2024-11-22',
      dueDate: '2024-12-06',
      details: {
        employerName: 'Tech Solutions Inc.',
        position: 'Software Engineering Intern',
        startDate: '2025-01-15',
        endDate: '2025-05-15',
        hoursPerWeek: 20,
        isPaid: true,
        salary: 25,
        courseRelation: 'This internship directly relates to my Computer Science major...'
      },
      documents: [
        { name: 'Offer Letter.pdf', size: '245 KB', uploadDate: '2024-11-22' },
        { name: 'Job Description.pdf', size: '156 KB', uploadDate: '2024-11-22' }
      ],
      internalNotes: []
    },
    {
      id: 'REQ-2024-002',
      studentName: 'Michael Chen',
      studentEmail: 'michael.c@university.edu',
      studentId: 'STU-002',
      requestType: 'OPT Application',
      category: 'Immigration Documents',
      status: 'Under Review',
      priority: 'Urgent',
      submittedDate: '2024-11-20',
      dueDate: '2024-12-04',
      assignedTo: 'Dr. Johnson',
      details: {
        optType: 'Post-Completion OPT',
        degreeLevel: 'Bachelor',
        graduationDate: '2025-05-15',
        major: 'Computer Science',
        requestedStartDate: '2025-06-01'
      },
      documents: [
        { name: 'Transcript.pdf', size: '892 KB', uploadDate: '2024-11-20' },
        { name: 'Degree Audit.pdf', size: '234 KB', uploadDate: '2024-11-20' }
      ],
      internalNotes: ['Verified graduation date with registrar - MC']
    },
    {
      id: 'REQ-2024-003',
      studentName: 'Priya Patel',
      studentEmail: 'priya.p@university.edu',
      studentId: 'STU-003',
      requestType: 'Travel Signature',
      category: 'Immigration Documents',
      status: 'Info Needed',
      priority: 'Normal',
      submittedDate: '2024-11-19',
      dueDate: '2024-12-03',
      assignedTo: 'Dr. Smith',
      details: {
        travelDestination: 'India',
        departureDate: '2024-12-20',
        returnDate: '2025-01-10',
        purpose: 'Winter break - visiting family'
      },
      documents: [
        { name: 'Flight Itinerary.pdf', size: '178 KB', uploadDate: '2024-11-19' }
      ],
      internalNotes: ['Need to verify current I-20 signature date - DS']
    },
    {
      id: 'REQ-2024-004',
      studentName: 'Juan Martinez',
      studentEmail: 'juan.m@university.edu',
      studentId: 'STU-004',
      requestType: 'I-20 Replacement',
      category: 'Immigration Documents',
      status: 'Approved',
      priority: 'High',
      submittedDate: '2024-11-18',
      dueDate: '2024-12-02',
      assignedTo: 'Dr. Johnson',
      details: {
        reason: 'Lost/Stolen',
        lastKnownLocation: 'Lost during move to new apartment',
        policeReport: true
      },
      documents: [
        { name: 'Police Report.pdf', size: '423 KB', uploadDate: '2024-11-18' },
        { name: 'Affidavit.pdf', size: '145 KB', uploadDate: '2024-11-18' }
      ],
      internalNotes: ['Police report verified - approved for replacement - MJ', 'New I-20 generated and sent - MJ']
    },
    {
      id: 'REQ-2024-005',
      studentName: 'Yuki Tanaka',
      studentEmail: 'yuki.t@university.edu',
      studentId: 'STU-005',
      requestType: 'Program Extension',
      category: 'Academic & Employment',
      status: 'Under Review',
      priority: 'Normal',
      submittedDate: '2024-11-17',
      dueDate: '2024-12-01',
      assignedTo: 'Dr. Smith',
      details: {
        currentProgramEnd: '2025-05-15',
        requestedExtensionDate: '2025-12-15',
        reason: 'Academic reasons',
        explanation: 'Changed major from Business to Computer Science, need additional semester'
      },
      documents: [
        { name: 'Academic Advisor Letter.pdf', size: '267 KB', uploadDate: '2024-11-17' },
        { name: 'Degree Plan.pdf', size: '189 KB', uploadDate: '2024-11-17' }
      ],
      internalNotes: ['Waiting for registrar confirmation - DS']
    },
    {
      id: 'REQ-2024-006',
      studentName: 'Emma Wilson',
      studentEmail: 'emma.w@university.edu',
      studentId: 'STU-006',
      requestType: 'Reduced Course Load',
      category: 'Academic & Employment',
      status: 'New',
      priority: 'High',
      submittedDate: '2024-11-21',
      dueDate: '2024-12-05',
      details: {
        currentCourseLoad: 12,
        requestedCourseLoad: 6,
        reason: 'Medical',
        explanation: 'Undergoing medical treatment that requires reduced academic load'
      },
      documents: [
        { name: 'Medical Certificate.pdf', size: '334 KB', uploadDate: '2024-11-21' },
        { name: 'Doctor Letter.pdf', size: '201 KB', uploadDate: '2024-11-21' }
      ],
      internalNotes: []
    },
    {
      id: 'REQ-2024-007',
      studentName: 'David Kim',
      studentEmail: 'david.k@university.edu',
      studentId: 'STU-007',
      requestType: 'Address Change',
      category: 'Immigration Documents',
      status: 'Approved',
      priority: 'Normal',
      submittedDate: '2024-11-15',
      dueDate: '2024-11-29',
      assignedTo: 'Dr. Johnson',
      details: {
        previousAddress: '123 Old Street, Boston, MA 02115',
        newAddress: '456 New Avenue, Apt 3B, Boston, MA 02116',
        moveDate: '2024-11-10',
        phoneNumber: '(617) 555-0123'
      },
      documents: [
        { name: 'Lease Agreement.pdf', size: '512 KB', uploadDate: '2024-11-15' }
      ],
      internalNotes: ['SEVIS updated successfully - MJ']
    },
    {
      id: 'REQ-2024-008',
      studentName: 'Sofia Garcia',
      studentEmail: 'sofia.g@university.edu',
      studentId: 'STU-008',
      requestType: 'Status Clarification',
      category: 'Status & Compliance',
      status: 'Under Review',
      priority: 'Low',
      submittedDate: '2024-11-16',
      dueDate: '2024-11-30',
      assignedTo: 'Dr. Smith',
      details: {
        question: 'Can I take online courses during summer?',
        situation: 'Planning summer schedule and want to confirm if I can take all online courses'
      },
      documents: [],
      internalNotes: ['Checking with policy guidelines - DS']
    }
  ]);

  // Fetch requests from backend
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        
        // Get university ID from userData
        const userProfile = userData?.data?.user?.user_metadata;
        const universityId = userProfile?.universityId || 'university-001'; // Default for testing
        
        console.log('Fetching requests for university:', universityId);
        console.log('User data:', userData);
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/requests/university/${universityId}`,
          {
            headers: {
              'Authorization': `Bearer ${userData?.data?.session?.access_token || userData?.session?.access_token || publicAnonKey}`
            }
          }
        );

        if (!response.ok) {
          const error = await response.json();
          console.error('Error fetching requests:', error);
          alert(`Failed to fetch requests: ${error.error || 'Unknown error'}`);
          return;
        }

        const result = await response.json();
        console.log('Fetched backend requests:', result.requests);
        
        // Transform backend requests to match our Request interface
        const transformedRequests = result.requests.map((req: any) => ({
          id: req.id,
          studentName: req.userName || 'Unknown Student',
          studentEmail: req.userEmail || req.userId,
          studentId: req.userId,
          requestType: req.requestName || req.requestType,
          category: 'Immigration Documents',
          status: req.status === 'pending' ? 'New' : req.status === 'approved' ? 'Approved' : req.status === 'rejected' ? 'Rejected' : req.status,
          priority: req.priority || 'Normal',
          submittedDate: req.submittedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          dueDate: req.dueDate?.split('T')[0] || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          details: req.formData || { reason: req.reason },
          documents: req.uploadedFiles || [],
          internalNotes: []
        }));

        setBackendRequests(transformedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [userData]);

  // Combine mock requests with backend requests
  const allRequests = [...backendRequests, ...requests];

  // Statistics
  const stats = [
    { 
      label: 'Total Requests', 
      value: allRequests.length, 
      icon: ClipboardList, 
      color: 'bg-blue-500',
      subtext: '+3 this week'
    },
    { 
      label: 'Pending Action', 
      value: allRequests.filter(r => r.status === 'New' || r.status === 'Info Needed').length, 
      icon: Clock, 
      color: 'bg-yellow-500',
      subtext: 'Need review'
    },
    { 
      label: 'Under Review', 
      value: allRequests.filter(r => r.status === 'Under Review').length, 
      icon: Loader, 
      color: 'bg-purple-500',
      subtext: 'In progress'
    },
    { 
      label: 'Urgent Requests', 
      value: allRequests.filter(r => r.priority === 'Urgent' && r.status !== 'Approved').length, 
      icon: AlertCircle, 
      color: 'bg-red-500',
      subtext: 'High priority'
    }
  ];

  // Filter and sort requests
  const filteredRequests = allRequests
    .filter(req => {
      const statusMatch = filterStatus === 'all' || req.status === filterStatus;
      const typeMatch = filterType === 'all' || req.requestType === filterType;
      const priorityMatch = filterPriority === 'all' || req.priority === filterPriority;
      const searchMatch = searchQuery === '' || 
        req.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requestType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      return statusMatch && typeMatch && priorityMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { 'Urgent': 0, 'High': 1, 'Normal': 2, 'Low': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else {
        return a.studentName.localeCompare(b.studentName);
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Under Review':
        return 'bg-purple-100 text-purple-800';
      case 'Info Needed':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Normal':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleUpdateRequest = (updatedRequest: Request) => {
    // Update both mock requests and backend requests
    setRequests(requests.map(req => 
      req.id === updatedRequest.id ? updatedRequest : req
    ));
    setBackendRequests(backendRequests.map(req => 
      req.id === updatedRequest.id ? updatedRequest : req
    ));
    setSelectedRequest(updatedRequest);
  };

  // If viewing individual request
  if (selectedRequest) {
    return (
      <RequestProcessingView 
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        onUpdate={handleUpdateRequest}
        userData={userData}
      />
    );
  }

  // Main request list view
  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 mb-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2A73E8] rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl text-gray-900">Pathly</span>
                <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">DSO Admin</Badge>
              </div>
              <span className="text-gray-300 hidden sm:block">|</span>
              <div className="hidden sm:flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#2A73E8]" />
                <span className="text-gray-700">Request Center</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onBack}
                className="border-[#2A73E8] text-[#2A73E8] hover:bg-[#2A73E8] hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              {userName && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#2A73E8] rounded-full flex items-center justify-center text-white">
                    {userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  {onLogout && (
                    <Button variant="ghost" size="sm" onClick={onLogout}>
                      Log Out
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <ClipboardList className="w-8 h-8 text-[#2A73E8]" />
              <h1 className="text-gray-900">Request Management Center</h1>
            </div>
            <p className="text-gray-600">Review and process student immigration and academic requests.</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <Card key={idx} className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-gray-500">{stat.subtext}</p>
                    </div>
                  </div>
                  <p className="text-gray-700">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters and Search */}
          <Card className="shadow-sm border-0 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by student, email, or request ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                  />
                </div>

                {/* Status Filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Info Needed">Info Needed</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="priority">Sort by Priority</SelectItem>
                    <SelectItem value="student">Sort by Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Request List */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Requests ({filteredRequests.length})</span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-12 h-12 text-[#2A73E8] animate-spin mb-4" />
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No requests found</p>
                      <p className="text-gray-400">Try adjusting your filters</p>
                    </div>
                  ) : (
                  filteredRequests.map((request) => {
                    const daysUntilDue = getDaysUntilDue(request.dueDate);
                    const isOverdue = daysUntilDue < 0;
                    const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

                    return (
                      <div 
                        key={request.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-[#2A73E8] hover:shadow-md transition-all cursor-pointer bg-white"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left side - Main info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <p className="text-gray-900">{request.studentName}</p>
                              <Badge variant="outline" className="text-xs">
                                {request.id}
                              </Badge>
                              <Badge className={getPriorityColor(request.priority)}>
                                {request.priority}
                              </Badge>
                              {request.assignedTo && (
                                <Badge variant="outline" className="text-xs">
                                  <User className="w-3 h-3 mr-1" />
                                  {request.assignedTo}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <p className="text-gray-700">{request.requestType}</p>
                              <span className="text-gray-400">•</span>
                              <p className="text-gray-500">{request.category}</p>
                            </div>

                            <div className="flex items-center gap-4 text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Submitted: {formatDate(request.submittedDate)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span className={isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : ''}>
                                  Due: {formatDate(request.dueDate)}
                                  {isOverdue && ' (Overdue)'}
                                  {isDueSoon && !isOverdue && ` (${daysUntilDue}d left)`}
                                </span>
                              </div>
                              {request.documents.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" />
                                  <span>{request.documents.length} document{request.documents.length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right side - Status and actions */}
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            
                            <Button 
                              size="sm" 
                              className="bg-[#2A73E8] hover:bg-[#1557b0]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(request);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}