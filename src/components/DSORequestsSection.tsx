import { useState } from 'react';
import { CheckCircle2, ChevronRight, FileText, Clock, Inbox } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RespondToRequestModal } from './RespondToRequestModal';

interface DSORequestsSectionProps {
  requests: any[];
  onRespondSubmit: (requestId: string, responseData: any) => Promise<void>;
  onViewAllRequests?: () => void;
}

export function DSORequestsSection({ requests, onRespondSubmit, onViewAllRequests }: DSORequestsSectionProps) {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (responseData: any) => {
    try {
      setIsSubmitting(true);
      await onRespondSubmit(selectedRequest.id, responseData);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (request: any) => {
    if (request.hasResponded) {
      return {
        label: 'Completed',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle2,
        iconColor: 'text-green-600'
      };
    }
    
    // Check if overdue
    if (request.deadline) {
      const isOverdue = new Date(request.deadline) < new Date();
      if (isOverdue) {
        return {
          label: 'Overdue',
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: Clock,
          iconColor: 'text-red-600'
        };
      }
    }
    
    return {
      label: 'Action Required',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
      iconColor: 'text-yellow-600'
    };
  };

  const getTypeLabel = (type: string) => {
    if (type === 'document') return 'Document Upload';
    if (type === 'form') return 'Form Submission';
    if (type === 'confirmation') return 'Confirmation';
    return type;
  };

  const generateRequestTitle = (request: any) => {
    // Use existing title if available
    if (request.title && request.title.trim()) {
      return request.title;
    }

    // Generate title based on type
    if (request.type === 'document') {
      return request.documentTitle || 'Document Upload Required';
    } else if (request.type === 'form') {
      // Map form template to readable name
      const formTemplateNames: Record<string, string> = {
        'enrollment': 'Enrollment Verification',
        'employment': 'Employment Information',
        'address': 'Address Update Form',
        'travel': 'Travel Authorization',
        'personal': 'Personal Information Update'
      };
      return formTemplateNames[request.formTemplate || ''] || 'Form Submission Required';
    } else if (request.type === 'confirmation') {
      return 'Confirmation Required';
    }

    return 'Request from DSO';
  };

  const getDaysUntilDue = (deadline: string) => {
    const dueDate = new Date(deadline);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  // Empty State
  if (requests.length === 0) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Requests from your DSO</CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 mb-2">No requests right now</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              If your DSO needs documents, info, or confirmation, it will appear here.
            </p>
            <Button 
              variant="ghost" 
              disabled={!onViewAllRequests}
              className={onViewAllRequests ? "text-gray-600 hover:text-gray-900" : "text-gray-400 cursor-not-allowed"}
              onClick={onViewAllRequests}
            >
              View request history
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Requests List State
  return (
    <>
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Requests from your DSO</CardTitle>
            <span className="text-sm text-gray-500">
              {requests.filter(r => !r.hasResponded).length} pending
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {requests.map((request) => {
              const statusConfig = getStatusConfig(request);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={request.id}
                  className="group hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => !request.hasResponded && setSelectedRequest(request)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side - Icon + Content */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          request.hasResponded 
                            ? 'bg-green-100' 
                            : 'bg-blue-100'
                        }`}>
                          <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title + Status Badge */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="text-gray-900 font-medium">
                              {generateRequestTitle(request)}
                            </h4>
                            <Badge 
                              variant="outline" 
                              className={`${statusConfig.className} border`}
                            >
                              {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Type Badge + Due Date */}
                          <div className="flex items-center gap-3 mb-2 flex-wrap text-sm">
                            <span className="inline-flex items-center gap-1.5 text-gray-600">
                              <FileText className="w-3.5 h-3.5" />
                              {getTypeLabel(request.type)}
                            </span>
                            {request.deadline && !request.hasResponded && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className={`${
                                  new Date(request.deadline) < new Date() 
                                    ? 'text-red-600 font-medium' 
                                    : 'text-gray-600'
                                }`}>
                                  {getDaysUntilDue(request.deadline)}
                                </span>
                              </>
                            )}
                            {request.hasResponded && request.respondedAt && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-green-600">
                                  Submitted {new Date(request.respondedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Preview of request content */}
                          {request.type === 'confirmation' && request.confirmationStatement && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {request.confirmationStatement}
                            </p>
                          )}
                          {request.type === 'document' && request.documentTitle && (
                            <p className="text-sm text-gray-600">
                              Upload required: {request.documentTitle}
                            </p>
                          )}
                          {request.instructions && !request.confirmationStatement && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {request.instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right side - Action Button */}
                      <div className="flex-shrink-0">
                        {request.hasResponded ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                            }}
                          >
                            View
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            className="bg-[#2A73E8] hover:bg-[#1557b0] text-white group-hover:shadow-md transition-shadow"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                            }}
                          >
                            Respond
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Response Modal */}
      {selectedRequest && (
        <RespondToRequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}