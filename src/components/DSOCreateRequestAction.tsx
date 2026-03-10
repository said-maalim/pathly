import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  FileText,
  ClipboardCheck,
  CheckSquare,
  Plus,
  X,
  Calendar,
  Users,
  Send,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DSOCreateRequestActionProps {
  onBack: () => void;
  userData?: any;
}

type RequestType = 'document' | 'form' | 'confirmation' | '';
type TargetType = 'single' | 'bulk';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'dropdown' | 'checkbox';
  options?: string[];
  required: boolean;
}

interface Student {
  id: string;
  name: string;
  email: string;
  visaProfile?: any;
}

const FORM_TEMPLATES = {
  enrollment: {
    name: 'Enrollment Verification',
    fields: [
      { id: '1', label: 'Full Name', type: 'text' as const, required: true },
      { id: '2', label: 'Student ID', type: 'text' as const, required: true },
      { id: '3', label: 'Program of Study', type: 'text' as const, required: true },
      { id: '4', label: 'Expected Graduation Date', type: 'date' as const, required: true },
      { id: '5', label: 'Full-time Status', type: 'dropdown' as const, options: ['Full-time', 'Part-time'], required: true }
    ]
  },
  employment: {
    name: 'Employment Information',
    fields: [
      { id: '1', label: 'Employer Name', type: 'text' as const, required: true },
      { id: '2', label: 'Job Title', type: 'text' as const, required: true },
      { id: '3', label: 'Start Date', type: 'date' as const, required: true },
      { id: '4', label: 'Employment Type', type: 'dropdown' as const, options: ['CPT', 'OPT', 'STEM OPT'], required: true },
      { id: '5', label: 'Working Hours per Week', type: 'text' as const, required: true }
    ]
  },
  address: {
    name: 'Address Update',
    fields: [
      { id: '1', label: 'Street Address', type: 'text' as const, required: true },
      { id: '2', label: 'City', type: 'text' as const, required: true },
      { id: '3', label: 'State', type: 'text' as const, required: true },
      { id: '4', label: 'ZIP Code', type: 'text' as const, required: true },
      { id: '5', label: 'Effective Date', type: 'date' as const, required: true }
    ]
  }
};

export function DSOCreateRequestAction({ onBack, userData }: DSOCreateRequestActionProps) {
  const [requestType, setRequestType] = useState<RequestType>('');
  const [targetType, setTargetType] = useState<TargetType>('single');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [bulkFilter, setBulkFilter] = useState('all');
  const [deadline, setDeadline] = useState('');
  const [sending, setSending] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Document Upload fields
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentInstructions, setDocumentInstructions] = useState('');

  // Form Submission fields
  const [formTemplate, setFormTemplate] = useState<'enrollment' | 'employment' | 'address' | 'custom'>('enrollment');
  const [customFields, setCustomFields] = useState<FormField[]>([]);

  // Confirmation fields
  const [confirmationStatement, setConfirmationStatement] = useState('I acknowledge that my SEVIS status is active and I understand my responsibilities.');

  const universityId = userData?.data?.user?.user_metadata?.universityId || 'stanford';

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const token = userData?.data?.session?.access_token;

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

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch students');
      }

      setStudents(result.students || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fileTypes = ['PDF', 'JPG', 'PNG', 'DOC', 'DOCX'];

  const addCustomField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      label: 'New Field',
      type: 'text',
      required: false
    };
    setCustomFields([...customFields, newField]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const updateCustomField = (id: string, updates: Partial<FormField>) => {
    setCustomFields(customFields.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  const getRequestIcon = (type: RequestType) => {
    switch (type) {
      case 'document': return FileText;
      case 'form': return ClipboardCheck;
      case 'confirmation': return CheckSquare;
      default: return FileText;
    }
  };

  const handleSendRequest = async () => {
    // Validation
    if (!requestType) {
      alert('Please select a request type');
      return;
    }

    if (requestType === 'document' && !documentTitle) {
      alert('Please enter a document title');
      return;
    }

    if (targetType === 'single' && !selectedStudent) {
      alert('Please select a student');
      return;
    }

    setSending(true);

    try {
      const token = userData?.data?.session?.access_token;
      
      // Prepare request data based on type
      let requestData: any = {
        type: requestType,
        targetType,
        targetStudent: targetType === 'single' ? selectedStudent : null,
        bulkFilter: targetType === 'bulk' ? bulkFilter : null,
        deadline: deadline || null
      };

      if (requestType === 'document') {
        requestData.documentTitle = documentTitle;
        requestData.acceptedFileTypes = fileTypes;
        requestData.instructions = documentInstructions;
      } else if (requestType === 'form') {
        requestData.formTemplate = formTemplate;
        requestData.formFields = formTemplate === 'custom' 
          ? customFields 
          : FORM_TEMPLATES[formTemplate].fields;
      } else if (requestType === 'confirmation') {
        requestData.confirmationStatement = confirmationStatement;
      }

      // Call API endpoint to create request
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/dso/request-actions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create request action');
      }

      alert('Request Action sent successfully!');
      onBack();
    } catch (error: any) {
      console.error('Error sending request:', error);
      alert(`Failed to send request: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

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
                <h1 className="text-gray-900">Create Request Action</h1>
                <p className="text-sm text-gray-600">Request information, documents, or confirmation from students</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Breadcrumb */}
          <div className="text-sm text-gray-600">
            Dashboard → Students → <span className="text-[#2A73E8]">Request Action</span>
          </div>

          {/* Section 1: Request Type */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle>Request Type</CardTitle>
              <p className="text-sm text-gray-600">Select the type of action you want to request</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setRequestType('document')}
                  className={`p-6 border-2 rounded-lg transition-all text-left ${
                    requestType === 'document' 
                      ? 'border-[#2A73E8] bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className={`w-8 h-8 mb-3 ${requestType === 'document' ? 'text-[#2A73E8]' : 'text-gray-400'}`} />
                  <h3 className="text-gray-900 mb-1">Document Upload</h3>
                  <p className="text-sm text-gray-600">Request specific documents from students</p>
                </button>

                <button
                  onClick={() => setRequestType('form')}
                  className={`p-6 border-2 rounded-lg transition-all text-left ${
                    requestType === 'form' 
                      ? 'border-[#2A73E8] bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ClipboardCheck className={`w-8 h-8 mb-3 ${requestType === 'form' ? 'text-[#2A73E8]' : 'text-gray-400'}`} />
                  <h3 className="text-gray-900 mb-1">Form Submission</h3>
                  <p className="text-sm text-gray-600">Request students to complete a form</p>
                </button>

                <button
                  onClick={() => setRequestType('confirmation')}
                  className={`p-6 border-2 rounded-lg transition-all text-left ${
                    requestType === 'confirmation' 
                      ? 'border-[#2A73E8] bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckSquare className={`w-8 h-8 mb-3 ${requestType === 'confirmation' ? 'text-[#2A73E8]' : 'text-gray-400'}`} />
                  <h3 className="text-gray-900 mb-1">Confirmation</h3>
                  <p className="text-sm text-gray-600">Request acknowledgement or confirmation</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Request Details (Dynamic) */}
          {requestType && (
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
                <p className="text-sm text-gray-600">Configure the specific requirements for this request</p>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Document Upload */}
                {requestType === 'document' && (
                  <>
                    <div>
                      <label className="block text-gray-900 mb-2">Document Name / Title *</label>
                      <input
                        type="text"
                        placeholder="e.g., Passport Copy or Signed I-20"
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-2">Optional Instructions</label>
                      <Textarea
                        placeholder="Please upload a clear, readable copy."
                        value={documentInstructions}
                        onChange={(e) => setDocumentInstructions(e.target.value)}
                        className="min-h-24"
                      />
                    </div>
                  </>
                )}

                {/* Form Submission */}
                {requestType === 'form' && (
                  <>
                    <div>
                      <label className="block text-gray-900 mb-2">Form Template</label>
                      <Select value={formTemplate} onValueChange={(value: any) => setFormTemplate(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enrollment">Enrollment Verification</SelectItem>
                          <SelectItem value="employment">Employment Information</SelectItem>
                          <SelectItem value="address">Address Update</SelectItem>
                          <SelectItem value="custom">Custom Template</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Form Preview Panel */}
                    {formTemplate !== 'custom' && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-gray-900">Form Preview: {FORM_TEMPLATES[formTemplate].name}</h4>
                          <Badge className="bg-blue-100 text-blue-800">
                            {FORM_TEMPLATES[formTemplate].fields.length} fields
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {FORM_TEMPLATES[formTemplate].fields.map(field => (
                            <div key={field.id} className="flex items-center gap-2 text-sm">
                              <Info className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{field.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                              {field.required && (
                                <Badge className="bg-red-100 text-red-800 text-xs">Required</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Fields */}
                    {formTemplate === 'custom' && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-gray-900">Custom Fields</label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addCustomField}
                            className="text-[#2A73E8]"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Field
                          </Button>
                        </div>
                        
                        {customFields.length === 0 ? (
                          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No fields added yet. Click "Add Field" to create your custom form.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {customFields.map(field => (
                              <div key={field.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 space-y-2">
                                    <input
                                      type="text"
                                      placeholder="Field Label"
                                      value={field.label}
                                      onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <Select 
                                        value={field.type} 
                                        onValueChange={(value: any) => updateCustomField(field.id, { type: value })}
                                      >
                                        <SelectTrigger className="w-32 h-8 text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="text">Text</SelectItem>
                                          <SelectItem value="date">Date</SelectItem>
                                          <SelectItem value="dropdown">Dropdown</SelectItem>
                                          <SelectItem value="checkbox">Checkbox</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={field.required}
                                          onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                                          className="rounded border-gray-300"
                                        />
                                        Required
                                      </label>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCustomField(field.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Confirmation */}
                {requestType === 'confirmation' && (
                  <>
                    <div>
                      <label className="block text-gray-900 mb-2">Confirmation Statement</label>
                      <Textarea
                        placeholder="I acknowledge that..."
                        value={confirmationStatement}
                        onChange={(e) => setConfirmationStatement(e.target.value)}
                        className="min-h-32"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        Students will see this statement and must check a box to confirm acknowledgement.
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-gray-900 mb-3">Student View Preview</h4>
                      <div className="bg-white border border-gray-300 rounded-lg p-4">
                        <p className="text-gray-700 mb-3">{confirmationStatement}</p>
                        <label className="flex items-start gap-2 text-gray-700">
                          <input type="checkbox" className="mt-1 rounded border-gray-300" disabled />
                          <span>I acknowledge and confirm</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section 3: Deadline */}
          {requestType && (
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Deadline (Optional)</CardTitle>
                <p className="text-sm text-gray-600">Students will receive reminders before the deadline</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 4: Target Students */}
          {requestType && (
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Send To</CardTitle>
                <p className="text-sm text-gray-600">Choose who should receive this request</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="targetType"
                      value="single"
                      checked={targetType === 'single'}
                      onChange={(e) => setTargetType(e.target.value as TargetType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-gray-900 mb-1">Single Student</div>
                      <p className="text-sm text-gray-600">Send this request to one specific student</p>
                    </div>
                  </label>

                  {targetType === 'single' && (
                    <div className="ml-7 pl-4 border-l-2 border-gray-200">
                      <label className="block text-gray-700 mb-2">Select Student</label>
                      <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Search and select a student..." />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingStudents ? (
                            <SelectItem value="loading">Loading students...</SelectItem>
                          ) : (
                            students.map(student => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} - {student.visaProfile?.visaType || 'F-1 Visa'}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="targetType"
                      value="bulk"
                      checked={targetType === 'bulk'}
                      onChange={(e) => setTargetType(e.target.value as TargetType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-gray-900 mb-1">Bulk Students</div>
                      <p className="text-sm text-gray-600">Send to all students or a filtered group</p>
                    </div>
                  </label>

                  {targetType === 'bulk' && (
                    <div className="ml-7 pl-4 border-l-2 border-gray-200">
                      <label className="block text-gray-700 mb-2">Student Group</label>
                      <Select value={bulkFilter} onValueChange={setBulkFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Students</SelectItem>
                          <SelectItem value="opt">OPT Students</SelectItem>
                          <SelectItem value="graduating">Graduating This Term</SelectItem>
                          <SelectItem value="f1">F-1 Visa Holders</SelectItem>
                          <SelectItem value="expiring">Expiring Visas (Next 60 Days)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-600 mt-2 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        Estimated recipients: {bulkFilter === 'all' ? '1,247' : bulkFilter === 'opt' ? '156' : bulkFilter === 'graduating' ? '89' : '1,189'} students
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons (Sticky Footer) */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 sm:-mx-6 lg:-mx-8 mt-8">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendRequest}
                disabled={!requestType || sending}
                className="bg-[#2A73E8] hover:bg-[#1557b0]"
              >
                {sending ? (
                  <>
                    <Users className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}