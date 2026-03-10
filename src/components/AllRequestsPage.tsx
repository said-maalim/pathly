import { useState } from 'react';
import { ArrowLeft, FileText, Clock, CheckCircle2, AlertCircle, XCircle, Info, Send, Inbox } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { StatusBadge } from './StatusBadge';

interface AllRequestsPageProps {
  onBack: () => void;
  studentRequests: any[]; // Requests submitted by student TO DSO
  dsoRequests: any[]; // Requests created by DSO FOR student
  onViewStudentRequest: (request: any) => void;
  onViewDSORequest: (request: any) => void;
}

export function AllRequestsPage({ onBack, studentRequests, dsoRequests, onViewStudentRequest, onViewDSORequest }: AllRequestsPageProps) {
  const [activeTab, setActiveTab] = useState<'to-dso' | 'from-dso'>('to-dso');
  const [filter, setFilter] = useState<'all' | 'submitted' | 'approved' | 'needs-info' | 'rejected'>('all');

  const filteredStudentRequests = filter === 'all' 
    ? studentRequests 
    : studentRequests.filter(req => req.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'needs-info':
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'submitted':
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'cpt': 'CPT Authorization',
      'opt': 'OPT Application',
      'travel': 'Travel Signature',
      'program_extension': 'Program Extension',
      'address_update': 'Address Update',
      'i20_replacement': 'I-20 Replacement',
      'leave_absence': 'Leave of Absence',
      'reduced_course_load': 'Reduced Course Load',
      'confirmation': 'Confirmation Request',
      'document': 'Document Request',
      'form': 'Form Request'
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const statusCounts = {
    all: studentRequests.length,
    submitted: studentRequests.filter(r => r.status === 'submitted').length,
    approved: studentRequests.filter(r => r.status === 'approved').length,
    'needs-info': studentRequests.filter(r => r.status === 'needs-info').length,
    rejected: studentRequests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-gray-900">All Requests</h1>
              <p className="text-gray-500">View and track all your requests</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setActiveTab('to-dso')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'to-dso'
                ? 'bg-[#2A73E8] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Requests to DSO</span>
            <Badge className={activeTab === 'to-dso' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}>
              {studentRequests.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('from-dso')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'from-dso'
                ? 'bg-[#2A73E8] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Requests from DSO</span>
            <Badge className={activeTab === 'from-dso' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}>
              {dsoRequests.length}
            </Badge>
          </button>
        </div>

        {/* Requests to DSO Tab */}
        {activeTab === 'to-dso' && (
          <>
            {/* Status Filter Tabs */}
            <div className="mb-6 flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                All ({statusCounts.all})
              </button>
              <button
                onClick={() => setFilter('submitted')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  filter === 'submitted'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Submitted ({statusCounts.submitted})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  filter === 'approved'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Approved ({statusCounts.approved})
              </button>
              <button
                onClick={() => setFilter('needs-info')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  filter === 'needs-info'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Needs Info ({statusCounts['needs-info']})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  filter === 'rejected'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Rejected ({statusCounts.rejected})
              </button>
            </div>

            {/* Student Requests List */}
            {filteredStudentRequests.length === 0 ? (
              <Card className="shadow-sm border-0">
                <CardContent className="py-16">
                  <div className="text-center">
                    <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-gray-900 mb-2">No requests found</h3>
                    <p className="text-gray-600">
                      {filter === 'all' 
                        ? 'You haven\'t submitted any requests to your DSO yet.'
                        : `No ${filter} requests found.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredStudentRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className="shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onViewStudentRequest(request)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getStatusIcon(request.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="text-gray-900 mb-1">
                                  {request.requestName || getRequestTypeLabel(request.requestType)}
                                </h3>
                                <p className="text-gray-600">
                                  Submitted on {formatDate(request.submittedAt || request.submittedDate)}
                                </p>
                              </div>
                              <StatusBadge status={request.status} />
                            </div>
                            {request.reason && (
                              <p className="text-gray-600 mt-2 line-clamp-2">
                                {request.reason}
                              </p>
                            )}
                            {request.dsoNote && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-blue-900">DSO Note</p>
                                  <p className="text-blue-800 mt-1">{request.dsoNote}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewStudentRequest(request);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Requests from DSO Tab */}
        {activeTab === 'from-dso' && (
          <>
            {dsoRequests.length === 0 ? (
              <Card className="shadow-sm border-0">
                <CardContent className="py-16">
                  <div className="text-center">
                    <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-gray-900 mb-2">No requests found</h3>
                    <p className="text-gray-600">
                      You haven't received any requests from your DSO yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {dsoRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className="shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onViewDSORequest(request)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getStatusIcon(request.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="text-gray-900 mb-1">
                                  {request.requestName || getRequestTypeLabel(request.type)}
                                </h3>
                                <p className="text-gray-600">
                                  Received on {formatDate(request.createdAt || request.submittedAt)}
                                </p>
                              </div>
                              <StatusBadge status={request.status} />
                            </div>
                            {request.description && (
                              <p className="text-gray-600 mt-2 line-clamp-2">
                                {request.description}
                              </p>
                            )}
                            {request.dueDate && (
                              <div className="mt-3 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
                                <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-yellow-900">Due Date</p>
                                  <p className="text-yellow-800 mt-1">{formatDate(request.dueDate)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDSORequest(request);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
