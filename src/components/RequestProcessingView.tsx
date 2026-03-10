import { useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  Plus,
  ExternalLink,
  Shield,
  Briefcase,
  MapPin,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface RequestProcessingViewProps {
  request: any;
  onBack: () => void;
  onUpdate: (updatedRequest: any) => void;
  userData?: any;
}

export function RequestProcessingView({ request, onBack, onUpdate, userData }: RequestProcessingViewProps) {
  const [status, setStatus] = useState(request.status);
  const [priority, setPriority] = useState(request.priority);
  const [assignedTo, setAssignedTo] = useState(request.assignedTo || 'unassigned');
  const [newNote, setNewNote] = useState('');
  const [internalNotes, setInternalNotes] = useState<string[]>(request.internalNotes || []);
  const [messageToStudent, setMessageToStudent] = useState('');

  const dsoOfficers = ['Dr. Johnson', 'Dr. Smith', 'Dr. Williams', 'Dr. Brown'];

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
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Normal':
        return 'bg-gray-100 text-gray-800';
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const timestamp = new Date().toLocaleString();
      const noteWithTimestamp = `[${timestamp}] ${newNote}`;
      setInternalNotes([...internalNotes, noteWithTimestamp]);
      setNewNote('');
    }
  };

  const handleSendMessage = () => {
    if (messageToStudent.trim()) {
      alert(`Message sent to ${request.studentName}:\n\n${messageToStudent}`);
      setMessageToStudent('');
    }
  };

  const handleSaveChanges = () => {
    const updatedRequest = {
      ...request,
      status,
      priority,
      assignedTo: assignedTo === 'unassigned' ? undefined : assignedTo,
      internalNotes
    };
    onUpdate(updatedRequest);
    alert('Request updated successfully!');
  };

  const handleApprove = async () => {
    try {
      const updatedRequest = {
        ...request,
        status: 'Approved',
        priority,
        assignedTo: assignedTo === 'unassigned' ? undefined : assignedTo,
        internalNotes: [...internalNotes, `[${new Date().toLocaleString()}] Request approved`]
      };
      
      // Update in backend
      await updateRequestStatusInBackend(updatedRequest);
      
      onUpdate(updatedRequest);
      setStatus('Approved');
      alert(`${request.requestType} approved for ${request.studentName}. Student will be notified.`);
    } catch (error) {
      alert('Failed to update request status. Please try again.');
    }
  };

  const handleReject = async () => {
    if (confirm('Are you sure you want to reject this request? The student will be notified.')) {
      try {
        const updatedRequest = {
          ...request,
          status: 'Rejected',
          priority,
          assignedTo: assignedTo === 'unassigned' ? undefined : assignedTo,
          internalNotes: [...internalNotes, `[${new Date().toLocaleString()}] Request rejected`]
        };
        
        // Update in backend
        await updateRequestStatusInBackend(updatedRequest);
        
        onUpdate(updatedRequest);
        setStatus('Rejected');
        alert('Request rejected. Student will be notified.');
      } catch (error) {
        alert('Failed to reject request. Please try again.');
      }
    }
  };

  const handleRequestMoreInfo = async () => {
    try {
      const updatedRequest = {
        ...request,
        status: 'Info Needed',
        priority,
        assignedTo: assignedTo === 'unassigned' ? undefined : assignedTo,
        internalNotes
      };
      
      // Update in backend
      await updateRequestStatusInBackend(updatedRequest);
      
      onUpdate(updatedRequest);
      setStatus('Info Needed');
      alert('Status updated to "Info Needed". Please send a message to the student with specific requirements.');
    } catch (error) {
      alert('Failed to update status. Please try again.');
    }
  };

  const updateRequestStatusInBackend = async (updatedRequest: any) => {
    try {
      // Get the session token from userData
      const token = userData?.data?.session?.access_token || userData?.session?.access_token;
      
      if (!token) {
        console.error('No authentication token available');
        return;
      }
      
      console.log('Updating request status:', {
        requestId: updatedRequest.id,
        newStatus: updatedRequest.status
      });
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/requests/${updatedRequest.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: updatedRequest.status.toLowerCase(),
            notes: updatedRequest.internalNotes?.join('\n') || ''
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Error updating request status:', error);
        throw new Error(error.error || 'Failed to update request');
      } else {
        const result = await response.json();
        console.log('Request status updated successfully in backend:', result);
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  };

  const renderRequestDetails = () => {
    const details = request.details;

    switch (request.requestType) {
      case 'CPT Application':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1">Employer Name</label>
                <p className="text-gray-900">{details.employerName}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Position</label>
                <p className="text-gray-900">{details.position}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Start Date</label>
                <p className="text-gray-900">{details.startDate}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">End Date</label>
                <p className="text-gray-900">{details.endDate}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Hours Per Week</label>
                <p className="text-gray-900">{details.hoursPerWeek} hours</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Compensation</label>
                <p className="text-gray-900">{details.isPaid ? `$${details.salary}/hour` : 'Unpaid'}</p>
              </div>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Course Relation</label>
              <p className="text-gray-900">{details.courseRelation}</p>
            </div>
          </div>
        );

      case 'OPT Application':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1">OPT Type</label>
                <p className="text-gray-900">{details.optType}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Degree Level</label>
                <p className="text-gray-900">{details.degreeLevel}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Major</label>
                <p className="text-gray-900">{details.major}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Graduation Date</label>
                <p className="text-gray-900">{details.graduationDate}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Requested Start Date</label>
                <p className="text-gray-900">{details.requestedStartDate}</p>
              </div>
            </div>
          </div>
        );

      case 'Travel Signature':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1">Destination</label>
                <p className="text-gray-900">{details.destination || details.travelDestination || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Purpose</label>
                <p className="text-gray-900">{details.travelReason || details.purpose || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Departure Date</label>
                <p className="text-gray-900">{details.departureDate || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Return Date</label>
                <p className="text-gray-900">{details.returnDate || 'N/A'}</p>
              </div>
            </div>
          </div>
        );

      case 'I-20 Replacement':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1">Reason</label>
                <p className="text-gray-900">{details.reason}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Police Report Filed</label>
                <p className="text-gray-900">{details.policeReport ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Details</label>
              <p className="text-gray-900">{details.lastKnownLocation}</p>
            </div>
          </div>
        );

      case 'Program Extension':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1">Current Program End</label>
                <p className="text-gray-900">{details.currentProgramEnd}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Requested Extension</label>
                <p className="text-gray-900">{details.requestedExtensionDate}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Reason</label>
                <p className="text-gray-900">{details.reason}</p>
              </div>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Explanation</label>
              <p className="text-gray-900">{details.explanation}</p>
            </div>
          </div>
        );

      case 'Reduced Course Load':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1">Current Course Load</label>
                <p className="text-gray-900">{details.currentCourseLoad} credits</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Requested Course Load</label>
                <p className="text-gray-900">{details.requestedCourseLoad} credits</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Reason</label>
                <p className="text-gray-900">{details.reason}</p>
              </div>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Explanation</label>
              <p className="text-gray-900">{details.explanation}</p>
            </div>
          </div>
        );

      case 'Address Change':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 mb-1">Previous Address</label>
              <p className="text-gray-900">{details.previousAddress}</p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">New Address</label>
              <p className="text-gray-900">{details.newAddress}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1">Move Date</label>
                <p className="text-gray-900">{details.moveDate}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Phone Number</label>
                <p className="text-gray-900">{details.phoneNumber}</p>
              </div>
            </div>
          </div>
        );

      case 'Status Clarification':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 mb-1">Question</label>
              <p className="text-gray-900">{details.question}</p>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Situation</label>
              <p className="text-gray-900">{details.situation}</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {details && Object.keys(details).length > 0 ? (
                Object.entries(details).map(([key, value]) => {
                  // Skip empty or null values
                  if (!value || value === '') return null;
                  
                  // Format the key to be more readable
                  const formattedKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
                  
                  return (
                    <div key={key}>
                      <label className="block text-gray-600 mb-1">{formattedKey}</label>
                      <p className="text-gray-900">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2">
                  <p className="text-gray-500">No additional details provided</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Request List
          </Button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-gray-900">{request.requestType}</h1>
                <Badge variant="outline">{request.id}</Badge>
              </div>
              <p className="text-gray-600">{request.category}</p>
            </div>

            <div className="flex gap-2">
              <Badge className={getStatusColor(status)} style={{ fontSize: '14px', padding: '6px 12px' }}>
                {status}
              </Badge>
              <Badge className={getPriorityColor(priority)} style={{ fontSize: '14px', padding: '6px 12px' }}>
                {priority}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Information */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#2A73E8]" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#2A73E8] rounded-full flex items-center justify-center text-white">
                      {request.studentName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-gray-900">{request.studentName}</p>
                      <p className="text-gray-500">{request.studentEmail}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Shield className="w-4 h-4" />
                      <span>Student ID: {request.studentId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>F-1 Visa</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Full Student Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#2A73E8]" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderRequestDetails()}
              </CardContent>
            </Card>

            {/* Attached Documents */}
            {request.documents.length > 0 && (
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#2A73E8]" />
                    Attached Documents ({request.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {request.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#2A73E8] transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-gray-900">{doc.name}</p>
                            <p className="text-gray-500">{doc.size} • Uploaded {doc.uploadDate}</p>
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

            {/* Internal Notes */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#2A73E8]" />
                  Internal Notes (DSO Only)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {internalNotes.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {internalNotes.map((note, idx) => (
                        <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-gray-700 whitespace-pre-wrap">{note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add an internal note (visible only to DSO staff)..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-24"
                    />
                    <Button onClick={handleAddNote} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Student */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#2A73E8]" />
                  Message Student
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      This message will be sent to {request.studentEmail}
                    </AlertDescription>
                  </Alert>
                  
                  <Textarea
                    placeholder="Type your message to the student..."
                    value={messageToStudent}
                    onChange={(e) => setMessageToStudent(e.target.value)}
                    className="min-h-32"
                  />
                  
                  <Button onClick={handleSendMessage} className="bg-[#2A73E8] hover:bg-[#1557b0]">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Status */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={status === 'Approved'}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve Request
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  onClick={handleRequestMoreInfo}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Request More Info
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-red-500 text-red-700 hover:bg-red-50"
                  onClick={handleReject}
                  disabled={status === 'Rejected'}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </Button>
              </CardContent>
            </Card>

            {/* Update Status */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Update Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Info Needed">Info Needed</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Priority</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Assign To</label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {dsoOfficers.map((officer) => (
                        <SelectItem key={officer} value={officer}>
                          {officer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full bg-[#2A73E8] hover:bg-[#1557b0]"
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#2A73E8]" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="text-gray-900">Request Submitted</p>
                      <p className="text-gray-500">{request.submittedDate}</p>
                    </div>
                  </div>
                  
                  {status === 'Under Review' && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                      <div>
                        <p className="text-gray-900">Under Review</p>
                        <p className="text-gray-500">Current Status</p>
                      </div>
                    </div>
                  )}
                  
                  {status === 'Approved' && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                      <div>
                        <p className="text-gray-900">Approved</p>
                        <p className="text-gray-500">Request approved</p>
                      </div>
                    </div>
                  )}
                  
                  {status === 'Rejected' && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                      <div>
                        <p className="text-gray-900">Rejected</p>
                        <p className="text-gray-500">Request rejected</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
                    <div>
                      <p className="text-gray-500">Due Date</p>
                      <p className="text-gray-500">{request.dueDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
