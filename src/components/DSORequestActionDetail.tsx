import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  FileText,
  ClipboardCheck,
  CheckSquare,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DSORequestActionDetailProps {
  requestId: string;
  onBack: () => void;
  userData?: any;
}

interface RequestDetail {
  id: string;
  title: string;
  type: 'document' | 'form' | 'confirmation';
  sentTo: 'Single' | 'Bulk';
  targetCount: number;
  deadline: string | null;
  completionPercent: number;
  completedCount: number;
  totalCount: number;
  status: 'active' | 'completed' | 'overdue';
  createdAt: string;
  instructions?: string;
  formFields?: any[];
  confirmationStatement?: string;
}

interface StudentResponse {
  studentId: string;
  studentName: string;
  studentEmail: string;
  visaType: string;
  status: 'completed' | 'pending' | 'overdue';
  submittedAt: string | null;
  responseData?: any;
  documentUrl?: string;
}

export function DSORequestActionDetail({ requestId, onBack, userData }: DSORequestActionDetailProps) {
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'overdue'>('all');

  useEffect(() => {
    fetchRequestDetail();
  }, [requestId]);

  const fetchRequestDetail = async () => {
    try {
      setLoading(true);
      const token = userData?.data?.session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/dso/request-actions/${requestId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch request detail');
      }

      setRequest(result.request);
      setResponses(result.responses || []);
    } catch (error: any) {
      console.error('Error fetching request detail:', error);
      // Mock data for demonstration
      setRequest({
        id: requestId,
        title: 'Passport Copy Upload',
        type: 'document',
        sentTo: 'Bulk',
        targetCount: 5,
        deadline: '2024-12-30',
        completionPercent: 60,
        completedCount: 3,
        totalCount: 5,
        status: 'active',
        createdAt: '2024-12-15',
        instructions: 'Please upload a clear, readable copy of your passport.'
      });

      // Mock responses
      setResponses([
        {
          studentId: '1',
          studentName: 'Emma Chen',
          studentEmail: 'emma.chen@stanford.edu',
          visaType: 'F-1',
          status: 'completed',
          submittedAt: '2024-12-16T10:30:00Z',
          documentUrl: 'https://example.com/passport1.pdf'
        },
        {
          studentId: '2',
          studentName: 'James Wilson',
          studentEmail: 'james.wilson@stanford.edu',
          visaType: 'F-1',
          status: 'completed',
          submittedAt: '2024-12-16T14:20:00Z',
          documentUrl: 'https://example.com/passport2.pdf'
        },
        {
          studentId: '3',
          studentName: 'Maria Garcia',
          studentEmail: 'maria.garcia@stanford.edu',
          visaType: 'F-1',
          status: 'completed',
          submittedAt: '2024-12-17T09:15:00Z',
          documentUrl: 'https://example.com/passport3.pdf'
        },
        {
          studentId: '4',
          studentName: 'Li Wei',
          studentEmail: 'li.wei@stanford.edu',
          visaType: 'F-1',
          status: 'pending',
          submittedAt: null
        },
        {
          studentId: '5',
          studentName: 'Sarah Johnson',
          studentEmail: 'sarah.johnson@stanford.edu',
          visaType: 'F-1',
          status: 'pending',
          submittedAt: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'form': return ClipboardCheck;
      case 'confirmation': return CheckSquare;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'form': return 'bg-purple-100 text-purple-800';
      case 'confirmation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredResponses = responses.filter(response => {
    if (filterStatus === 'all') return true;
    return response.status === filterStatus;
  });

  const completedResponses = responses.filter(r => r.status === 'completed');
  const pendingResponses = responses.filter(r => r.status === 'pending');
  const overdueResponses = responses.filter(r => r.status === 'overdue');

  // Helper function to get field label from field ID
  const getFieldLabel = (fieldId: string): string => {
    const field = request?.formFields?.find(f => f.id === fieldId);
    return field?.label || fieldId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#2A73E8] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-gray-900 mb-2">Request Not Found</h2>
          <p className="text-gray-600 mb-6">The requested action could not be found.</p>
          <Button onClick={onBack} className="bg-[#2A73E8] hover:bg-[#1557b0]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
        </div>
      </div>
    );
  }

  const TypeIcon = getTypeIcon(request.type);

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div className="text-gray-400">|</div>
              <div>
                <h1 className="text-gray-900">{request.title}</h1>
                <p className="text-sm text-gray-600">Request Action Details</p>
              </div>
            </div>
            <Button variant="outline" className="text-gray-600">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Overview Card */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 ${getTypeColor(request.type)} rounded-lg flex items-center justify-center`}>
                    <TypeIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="mb-2">{request.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <Badge className={getTypeColor(request.type)}>
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{request.sentTo} · {request.targetCount} {request.targetCount === 1 ? 'student' : 'students'}</span>
                      </div>
                      {request.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(request.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Total Sent</span>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-gray-900">{request.totalCount}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Completed</span>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-gray-900">{completedResponses.length}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Pending</span>
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-gray-900">{pendingResponses.length}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Overdue</span>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-gray-900">{overdueResponses.length}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Overall Completion</span>
                  <span className="text-gray-900">{request.completionPercent}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#2A73E8] transition-all"
                    style={{ width: `${request.completionPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Request Details */}
              {request.instructions && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-gray-900 mb-2">Instructions</h4>
                  <p className="text-gray-700 text-sm">{request.instructions}</p>
                </div>
              )}

              {request.confirmationStatement && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-gray-900 mb-2">Confirmation Statement</h4>
                  <p className="text-gray-700 text-sm">{request.confirmationStatement}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responses Section */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Student Responses</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                    className={filterStatus === 'all' ? 'bg-[#2A73E8]' : ''}
                  >
                    All ({responses.length})
                  </Button>
                  <Button
                    variant={filterStatus === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('completed')}
                    className={filterStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Completed ({completedResponses.length})
                  </Button>
                  <Button
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                    className={filterStatus === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  >
                    Pending ({pendingResponses.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredResponses.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No responses found for this filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredResponses.map((response) => (
                    <div
                      key={response.studentId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-[#2A73E8] rounded-full flex items-center justify-center text-white">
                            {response.studentName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-gray-900">{response.studentName}</h4>
                              {getStatusBadge(response.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{response.studentEmail}</span>
                              <Badge variant="outline" className="text-xs">
                                {response.visaType}
                              </Badge>
                              {response.submittedAt && (
                                <span>
                                  Submitted: {new Date(response.submittedAt).toLocaleDateString()} at {new Date(response.submittedAt).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {response.status === 'completed' && response.documentUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[#2A73E8] border-[#2A73E8]"
                            onClick={() => window.open(response.documentUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                        {response.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-yellow-600 border-yellow-600"
                            disabled
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Waiting
                          </Button>
                        )}
                      </div>

                      {/* Response Data for Forms */}
                      {response.responseData && request.type === 'form' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-gray-900 mb-2">Form Responses:</h5>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {Object.entries(response.responseData)
                              .filter(([key, value]) => {
                                // Filter out empty values, internal flags, and notes
                                if (!value || value === '') return false;
                                if (key === 'accuracyConfirmed') return false;
                                return true;
                              })
                              .map(([key, value]) => (
                                <div key={key} className="bg-gray-50 p-3 rounded">
                                  <span className="text-gray-600 block text-xs mb-1">{getFieldLabel(key)}</span>
                                  <span className="text-gray-900 font-medium">{String(value)}</span>
                                </div>
                              ))}
                          </div>
                          {/* Show notes separately if they exist */}
                          {response.responseData.notes && (
                            <div className="mt-3 bg-blue-50 p-3 rounded border border-blue-100">
                              <span className="text-gray-600 block text-xs mb-1">Additional Notes</span>
                              <span className="text-gray-900 text-sm">{response.responseData.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}