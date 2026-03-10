import { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Upload,
  Send,
  ArrowUpDown,
  Home,
  Globe,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface DSODocumentCenterProps {
  onBack: () => void;
  onLogout?: () => void;
  userName?: string;
}

interface Document {
  id: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  documentName: string;
  documentType: string;
  uploadDate: string;
  size: string;
  status: 'Pending Verification' | 'Verified' | 'Rejected' | 'Expired';
  verifiedBy?: string;
  verifiedDate?: string;
  expirationDate?: string;
  notes: string[];
  requestId?: string;
}

export function DSODocumentCenter({ onBack, onLogout, userName = 'DSO Admin' }: DSODocumentCenterProps) {
  const [selectedTab, setSelectedTab] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'student' | 'type'>('date');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [requestDocOpen, setRequestDocOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestDetails, setRequestDetails] = useState({ student: '', docType: '', dueDate: '', notes: '' });

  // Mock document data
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'DOC-2024-001',
      studentName: 'Sarah Rodriguez',
      studentEmail: 'sarah.r@university.edu',
      studentId: 'STU-001',
      documentName: 'Offer_Letter_Tech_Solutions.pdf',
      documentType: 'CPT Employment Offer',
      uploadDate: '2024-11-22',
      size: '245 KB',
      status: 'Pending Verification',
      notes: [],
      requestId: 'REQ-2024-001'
    },
    {
      id: 'DOC-2024-002',
      studentName: 'Sarah Rodriguez',
      studentEmail: 'sarah.r@university.edu',
      studentId: 'STU-001',
      documentName: 'Job_Description_SWE_Intern.pdf',
      documentType: 'CPT Job Description',
      uploadDate: '2024-11-22',
      size: '156 KB',
      status: 'Pending Verification',
      notes: [],
      requestId: 'REQ-2024-001'
    },
    {
      id: 'DOC-2024-003',
      studentName: 'Michael Chen',
      studentEmail: 'michael.c@university.edu',
      studentId: 'STU-002',
      documentName: 'Official_Transcript_Fall2024.pdf',
      documentType: 'Academic Transcript',
      uploadDate: '2024-11-20',
      size: '892 KB',
      status: 'Verified',
      verifiedBy: 'Dr. Johnson',
      verifiedDate: '2024-11-21',
      notes: ['Transcript verified with registrar office - MJ']
    },
    {
      id: 'DOC-2024-004',
      studentName: 'Michael Chen',
      studentEmail: 'michael.c@university.edu',
      studentId: 'STU-002',
      documentName: 'Degree_Audit_CS.pdf',
      documentType: 'Degree Audit',
      uploadDate: '2024-11-20',
      size: '234 KB',
      status: 'Verified',
      verifiedBy: 'Dr. Johnson',
      verifiedDate: '2024-11-21',
      notes: ['Confirmed graduation eligibility for May 2025 - MJ']
    },
    {
      id: 'DOC-2024-005',
      studentName: 'Priya Patel',
      studentEmail: 'priya.p@university.edu',
      studentId: 'STU-003',
      documentName: 'Flight_Itinerary_India.pdf',
      documentType: 'Travel Documentation',
      uploadDate: '2024-11-19',
      size: '178 KB',
      status: 'Verified',
      verifiedBy: 'Dr. Smith',
      verifiedDate: '2024-11-20',
      notes: ['Travel dates confirmed - DS']
    },
    {
      id: 'DOC-2024-006',
      studentName: 'Juan Martinez',
      studentEmail: 'juan.m@university.edu',
      studentId: 'STU-004',
      documentName: 'Police_Report_Lost_I20.pdf',
      documentType: 'Police Report',
      uploadDate: '2024-11-18',
      size: '423 KB',
      status: 'Verified',
      verifiedBy: 'Dr. Johnson',
      verifiedDate: '2024-11-19',
      notes: ['Police report verified with Boston PD - MJ']
    },
    {
      id: 'DOC-2024-007',
      studentName: 'Emma Wilson',
      studentEmail: 'emma.w@university.edu',
      studentId: 'STU-006',
      documentName: 'Medical_Certificate.pdf',
      documentType: 'Medical Documentation',
      uploadDate: '2024-11-21',
      size: '334 KB',
      status: 'Pending Verification',
      notes: []
    },
    {
      id: 'DOC-2024-008',
      studentName: 'Emma Wilson',
      studentEmail: 'emma.w@university.edu',
      studentId: 'STU-006',
      documentName: 'Doctor_Recommendation_Letter.pdf',
      documentType: 'Medical Documentation',
      uploadDate: '2024-11-21',
      size: '201 KB',
      status: 'Pending Verification',
      notes: []
    },
    {
      id: 'DOC-2024-009',
      studentName: 'David Kim',
      studentEmail: 'david.k@university.edu',
      studentId: 'STU-007',
      documentName: 'Lease_Agreement_New_Apt.pdf',
      documentType: 'Address Verification',
      uploadDate: '2024-11-15',
      size: '512 KB',
      status: 'Verified',
      verifiedBy: 'Dr. Johnson',
      verifiedDate: '2024-11-16',
      notes: ['Lease verified, SEVIS updated - MJ']
    },
    {
      id: 'DOC-2024-010',
      studentName: 'Yuki Tanaka',
      studentEmail: 'yuki.t@university.edu',
      studentId: 'STU-008',
      documentName: 'Financial_Statement_2024.pdf',
      documentType: 'Financial Documentation',
      uploadDate: '2024-10-15',
      size: '678 KB',
      status: 'Expired',
      expirationDate: '2024-11-15',
      notes: ['Document expired - needs updated financial statement']
    },
    {
      id: 'DOC-2024-011',
      studentName: 'Sofia Garcia',
      studentEmail: 'sofia.g@university.edu',
      studentId: 'STU-009',
      documentName: 'Passport_Copy_Low_Quality.pdf',
      documentType: 'Passport',
      uploadDate: '2024-11-10',
      size: '123 KB',
      status: 'Rejected',
      verifiedBy: 'Dr. Smith',
      verifiedDate: '2024-11-11',
      notes: ['Image quality too low - cannot read passport number. Please upload clearer scan - DS']
    }
  ]);

  // Statistics
  const stats = [
    {
      label: 'Total Documents',
      value: documents.length,
      icon: FileText,
      color: 'bg-blue-500',
      subtext: 'All uploaded'
    },
    {
      label: 'Pending Verification',
      value: documents.filter(d => d.status === 'Pending Verification').length,
      icon: Clock,
      color: 'bg-yellow-500',
      subtext: 'Need review'
    },
    {
      label: 'Verified',
      value: documents.filter(d => d.status === 'Verified').length,
      icon: CheckCircle2,
      color: 'bg-green-500',
      subtext: 'Approved'
    },
    {
      label: 'Requires Action',
      value: documents.filter(d => d.status === 'Rejected' || d.status === 'Expired').length,
      icon: AlertCircle,
      color: 'bg-red-500',
      subtext: 'Rejected/Expired'
    }
  ];

  // Filter documents based on tab and filters
  const filteredDocuments = documents
    .filter(doc => {
      if (selectedTab !== 'all' && selectedTab === 'pending') return doc.status === 'Pending Verification';
      if (selectedTab === 'verified') return doc.status === 'Verified';
      if (selectedTab === 'rejected') return doc.status === 'Rejected' || doc.status === 'Expired';
      return true;
    })
    .filter(doc => {
      const typeMatch = filterType === 'all' || doc.documentType === filterType;
      const searchMatch = searchQuery === '' ||
        doc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      } else if (sortBy === 'student') {
        return a.studentName.localeCompare(b.studentName);
      } else {
        return a.documentType.localeCompare(b.documentType);
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Verification':
        return 'bg-yellow-100 text-yellow-800';
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleVerify = (doc: Document) => {
    const updatedDoc = {
      ...doc,
      status: 'Verified' as const,
      verifiedBy: userName || 'DSO Admin',
      verifiedDate: new Date().toISOString().split('T')[0],
      notes: [...doc.notes, `[${new Date().toLocaleString()}] Document verified - ${verificationNotes || 'No additional notes'}`]
    };
    setDocuments(documents.map(d => d.id === doc.id ? updatedDoc : d));
    setVerificationNotes('');
    setVerifyDialogOpen(false);
    setSelectedDocument(null);
    alert(`Document "${doc.documentName}" has been verified successfully!`);
  };

  const handleReject = (doc: Document) => {
    const updatedDoc = {
      ...doc,
      status: 'Rejected' as const,
      verifiedBy: userName || 'DSO Admin',
      verifiedDate: new Date().toISOString().split('T')[0],
      notes: [...doc.notes, `[${new Date().toLocaleString()}] Document rejected - ${rejectionReason}`]
    };
    setDocuments(documents.map(d => d.id === doc.id ? updatedDoc : d));
    setRejectionReason('');
    setRejectDialogOpen(false);
    setSelectedDocument(null);
    alert(`Student will be notified to resubmit "${doc.documentName}"`);
  };

  const handleRequestDocument = () => {
    alert(`Document request sent to ${requestDetails.student} for ${requestDetails.docType}. Due date: ${requestDetails.dueDate}`);
    setRequestDetails({ student: '', docType: '', dueDate: '', notes: '' });
    setRequestDocOpen(false);
  };

  const handleBulkVerify = () => {
    const pendingDocs = documents.filter(d => d.status === 'Pending Verification');
    if (pendingDocs.length === 0) {
      alert('No pending documents to verify');
      return;
    }
    if (confirm(`Verify all ${pendingDocs.length} pending documents?`)) {
      const updatedDocs = documents.map(doc => {
        if (doc.status === 'Pending Verification') {
          return {
            ...doc,
            status: 'Verified' as const,
            verifiedBy: userName || 'DSO Admin',
            verifiedDate: new Date().toISOString().split('T')[0],
            notes: [...doc.notes, `[${new Date().toLocaleString()}] Bulk verified`]
          };
        }
        return doc;
      });
      setDocuments(updatedDocs);
      alert(`${pendingDocs.length} documents verified successfully!`);
    }
  };

  const documentTypes = Array.from(new Set(documents.map(d => d.documentType)));

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
                <FileText className="w-5 h-5 text-[#2A73E8]" />
                <span className="text-gray-700">Document Center</span>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-8 h-8 text-[#2A73E8]" />
                  <h1 className="text-gray-900">Document Management Center</h1>
                </div>
                <p className="text-gray-600">Verify, manage, and track all student-submitted documents.</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setRequestDocOpen(true)}
                  className="bg-[#2A73E8] hover:bg-[#1557b0]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Request Document
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleBulkVerify}
                  disabled={documents.filter(d => d.status === 'Pending Verification').length === 0}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Bulk Verify
                </Button>
              </div>
            </div>
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

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={(v: any) => setSelectedTab(v)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="pending">
                Pending ({documents.filter(d => d.status === 'Pending Verification').length})
              </TabsTrigger>
              <TabsTrigger value="verified">
                Verified ({documents.filter(d => d.status === 'Verified').length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Issues ({documents.filter(d => d.status === 'Rejected' || d.status === 'Expired').length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({documents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab}>
              {/* Filters and Search */}
              <Card className="shadow-sm border-0 mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="md:col-span-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search documents or students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                      />
                    </div>

                    {/* Type Filter */}
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Document Types</SelectItem>
                        {documentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
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
                        <SelectItem value="student">Sort by Student</SelectItem>
                        <SelectItem value="type">Sort by Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Document List */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Documents ({filteredDocuments.length})</span>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export List
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredDocuments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No documents found</p>
                        <p className="text-gray-400">Try adjusting your filters</p>
                      </div>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-[#2A73E8] hover:shadow-md transition-all bg-white"
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Left side - Document info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <p className="text-gray-900 truncate">{doc.documentName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {doc.id}
                                </Badge>
                                <Badge className={getStatusColor(doc.status)}>
                                  {doc.status}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <p className="text-gray-700">{doc.studentName}</p>
                                <span className="text-gray-400">•</span>
                                <p className="text-gray-500">{doc.documentType}</p>
                              </div>

                              <div className="flex items-center gap-4 text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                                </div>
                                <span>•</span>
                                <span>{doc.size}</span>
                                {doc.verifiedBy && (
                                  <>
                                    <span>•</span>
                                    <span>By: {doc.verifiedBy}</span>
                                  </>
                                )}
                                {doc.expirationDate && (
                                  <>
                                    <span>•</span>
                                    <span className="text-red-600">Expired: {formatDate(doc.expirationDate)}</span>
                                  </>
                                )}
                              </div>

                              {doc.notes.length > 0 && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-gray-600 text-sm">
                                  {doc.notes[doc.notes.length - 1]}
                                </div>
                              )}
                            </div>

                            {/* Right side - Actions */}
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" title="View Document">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Download">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              {doc.status === 'Pending Verification' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setVerifyDialogOpen(true);
                                    }}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Verify
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500 text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setRejectDialogOpen(true);
                                    }}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Document</DialogTitle>
            <DialogDescription>
              Confirm that "{selectedDocument?.documentName}" is valid and approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-gray-700 mb-2">Verification Notes (Optional)</label>
              <Textarea
                placeholder="Add any verification notes..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="min-h-24"
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => selectedDocument && handleVerify(selectedDocument)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Verify Document
              </Button>
              <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedDocument?.documentName}". The student will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-gray-700 mb-2">Rejection Reason *</label>
              <Textarea
                placeholder="Explain why this document is being rejected and what the student needs to do..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-32"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-red-500 text-red-700 hover:bg-red-50"
                onClick={() => selectedDocument && handleReject(selectedDocument)}
                disabled={!rejectionReason.trim()}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Document
              </Button>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Document Dialog */}
      <Dialog open={requestDocOpen} onOpenChange={setRequestDocOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Document from Student</DialogTitle>
            <DialogDescription>
              Send a document request to a specific student with a due date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-gray-700 mb-2">Student Email *</label>
              <input
                type="email"
                placeholder="student@university.edu"
                value={requestDetails.student}
                onChange={(e) => setRequestDetails({ ...requestDetails, student: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Document Type *</label>
              <Select value={requestDetails.docType} onValueChange={(value) => setRequestDetails({ ...requestDetails, docType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Passport">Passport Copy</SelectItem>
                  <SelectItem value="Transcript">Academic Transcript</SelectItem>
                  <SelectItem value="Financial">Financial Statement</SelectItem>
                  <SelectItem value="Enrollment">Enrollment Verification</SelectItem>
                  <SelectItem value="Medical">Medical Certificate</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Due Date *</label>
              <input
                type="date"
                value={requestDetails.dueDate}
                onChange={(e) => setRequestDetails({ ...requestDetails, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Additional Instructions</label>
              <Textarea
                placeholder="Provide specific requirements or instructions..."
                value={requestDetails.notes}
                onChange={(e) => setRequestDetails({ ...requestDetails, notes: e.target.value })}
                className="min-h-24"
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="bg-[#2A73E8] hover:bg-[#1557b0]"
                onClick={handleRequestDocument}
                disabled={!requestDetails.student || !requestDetails.docType || !requestDetails.dueDate}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Request
              </Button>
              <Button variant="outline" onClick={() => setRequestDocOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}