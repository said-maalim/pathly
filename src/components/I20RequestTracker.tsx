import { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar,
  FileText,
  User,
  MessageSquare,
  Download,
  CheckCircle2,
  Circle,
  Clock
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { StatusBadge, RequestStatus } from './StatusBadge';
import { Progress } from './ui/progress';

interface I20Request {
  id: string;
  category: string;
  categoryDisplay: string;
  status: RequestStatus;
  submittedDate: string;
  assignedDSO: string;
  dsoEmail: string;
  timeline: {
    step: string;
    status: 'completed' | 'current' | 'pending';
    date?: string;
    note?: string;
  }[];
  documents: {
    name: string;
    uploadedDate: string;
  }[];
  comments: {
    from: string;
    message: string;
    date: string;
  }[];
}

interface I20RequestTrackerProps {
  onBack: () => void;
  requests?: I20Request[];
  onSubmitNewRequest?: () => void;
}

// Mock data for demonstration
const mockRequests: I20Request[] = [
  {
    id: 'REQ-2024-001',
    category: 'cpt',
    categoryDisplay: 'CPT Authorization',
    status: 'under-review',
    submittedDate: '2024-11-15',
    assignedDSO: 'Dr. Jennifer Martinez',
    dsoEmail: 'j.martinez@university.edu',
    timeline: [
      {
        step: 'Submitted',
        status: 'completed',
        date: '2024-11-15',
        note: 'Request received and logged in system'
      },
      {
        step: 'Under Review',
        status: 'current',
        date: '2024-11-16',
        note: 'DSO reviewing submitted documents'
      },
      {
        step: 'In Progress',
        status: 'pending'
      },
      {
        step: 'Completed',
        status: 'pending'
      }
    ],
    documents: [
      {
        name: 'Offer_Letter_Tech_Corp.pdf',
        uploadedDate: '2024-11-15'
      },
      {
        name: 'CPT_Agreement_Signed.pdf',
        uploadedDate: '2024-11-15'
      }
    ],
    comments: [
      {
        from: 'Dr. Jennifer Martinez',
        message: 'Thank you for submitting your CPT request. I am currently reviewing your offer letter and will get back to you within 2-3 business days.',
        date: '2024-11-16 10:30 AM'
      }
    ]
  },
  {
    id: 'REQ-2024-002',
    category: 'travel',
    categoryDisplay: 'Travel Signature',
    status: 'completed',
    submittedDate: '2024-11-10',
    assignedDSO: 'Dr. Jennifer Martinez',
    dsoEmail: 'j.martinez@university.edu',
    timeline: [
      {
        step: 'Submitted',
        status: 'completed',
        date: '2024-11-10'
      },
      {
        step: 'Under Review',
        status: 'completed',
        date: '2024-11-10'
      },
      {
        step: 'In Progress',
        status: 'completed',
        date: '2024-11-11'
      },
      {
        step: 'Completed',
        status: 'completed',
        date: '2024-11-12',
        note: 'I-20 signed and ready for pickup'
      }
    ],
    documents: [],
    comments: [
      {
        from: 'Dr. Jennifer Martinez',
        message: 'Your I-20 has been signed for travel. You can pick it up from the International Student Office during business hours (9 AM - 5 PM).',
        date: '2024-11-12 2:15 PM'
      }
    ]
  }
];

export function I20RequestTracker({ onBack, requests = mockRequests, onSubmitNewRequest }: I20RequestTrackerProps) {
  const [selectedRequest, setSelectedRequest] = useState<I20Request | null>(null);

  if (selectedRequest) {
    const completedSteps = selectedRequest.timeline.filter(t => t.status === 'completed').length;
    const progressPercentage = (completedSteps / selectedRequest.timeline.length) * 100;

    return (
      <div className="min-h-screen bg-[#F5F6FA] p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" onClick={() => setSelectedRequest(null)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Requests
          </Button>

          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-gray-900">{selectedRequest.categoryDisplay}</h1>
                <p className="text-gray-600">Request ID: {selectedRequest.id}</p>
              </div>
              <StatusBadge status={selectedRequest.status} />
            </div>
          </div>

          {/* Progress Bar */}
          <Card className="shadow-sm border-0 mb-6">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-900">Overall Progress</span>
                  <span className="text-gray-600">{Math.round(progressPercentage)}% Complete</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Timeline & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Timeline */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Request Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedRequest.timeline.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.status === 'completed' 
                              ? 'bg-green-100' 
                              : item.status === 'current'
                              ? 'bg-blue-100'
                              : 'bg-gray-100'
                          }`}>
                            {item.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : item.status === 'current' ? (
                              <Clock className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          {index < selectedRequest.timeline.length - 1 && (
                            <div className={`w-0.5 h-16 ${
                              item.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`${
                              item.status === 'completed' || item.status === 'current'
                                ? 'text-gray-900'
                                : 'text-gray-500'
                            }`}>
                              {item.step}
                            </p>
                            {item.status === 'current' && (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Current</Badge>
                            )}
                          </div>
                          {item.date && (
                            <p className="text-gray-600 mb-1">{new Date(item.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}</p>
                          )}
                          {item.note && (
                            <p className="text-gray-600">{item.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comments & Messages */}
              {selectedRequest.comments.length > 0 && (
                <Card className="shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#2A73E8]" />
                      DSO Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedRequest.comments.map((comment, index) => (
                        <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-gray-900">{comment.from}</p>
                            <p className="text-gray-500">{comment.date}</p>
                          </div>
                          <p className="text-gray-700">{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Request Details */}
            <div className="space-y-6">
              {/* Request Info */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Submitted</span>
                    </div>
                    <p className="text-gray-900 ml-6">
                      {new Date(selectedRequest.submittedDate).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <User className="w-4 h-4" />
                      <span>Assigned DSO</span>
                    </div>
                    <p className="text-gray-900 ml-6">{selectedRequest.assignedDSO}</p>
                    <p className="text-gray-600 ml-6">{selectedRequest.dsoEmail}</p>
                  </div>

                  <div className="pt-4">
                    <Button variant="outline" className="w-full">
                      Contact DSO
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Uploaded Documents */}
              {selectedRequest.documents.length > 0 && (
                <Card className="shadow-sm border-0">
                  <CardHeader>
                    <CardTitle>Uploaded Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedRequest.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-[#2A73E8] flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-gray-900 truncate">{doc.name}</p>
                              <p className="text-gray-500">
                                {new Date(doc.uploadedDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view of all requests
  return (
    <div className="min-h-screen bg-[#F5F6FA] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Request Status Tracker</h1>
          <p className="text-gray-600">Track the status of all your submitted requests</p>
        </div>

        <div className="space-y-4">
          {requests.map((request) => (
            <Card 
              key={request.id} 
              className="shadow-sm border-0 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedRequest(request)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-gray-900">{request.categoryDisplay}</h3>
                      <StatusBadge status={request.status} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Submitted {new Date(request.submittedDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {request.assignedDSO}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        ID: {request.id}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>

                {/* Mini progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-600">
                      {request.timeline.filter(t => t.status === 'completed').length} / {request.timeline.length} steps
                    </span>
                  </div>
                  <Progress 
                    value={(request.timeline.filter(t => t.status === 'completed').length / request.timeline.length) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {requests.length === 0 && (
          <Card className="shadow-sm border-0">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No requests found</p>
              <Button className="bg-[#2A73E8] hover:bg-[#1557b0]" onClick={onSubmitNewRequest}>
                Submit Your First Request
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}