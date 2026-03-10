import { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Paperclip, Calendar, User } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';

interface RespondToRequestModalProps {
  request: any;
  onClose: () => void;
  onSubmit: (responseData: any) => Promise<void>;
  isSubmitting: boolean;
}

export function RespondToRequestModal({ 
  request, 
  onClose, 
  onSubmit,
  isSubmitting 
}: RespondToRequestModalProps) {
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [notes, setNotes] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    const responseData: any = {};

    if (request.type === 'confirmation') {
      responseData.confirmed = confirmationChecked;
      responseData.confirmedStatement = request.confirmationStatement;
      if (notes) responseData.notes = notes;
    } else if (request.type === 'form') {
      // Spread formData directly into responseData
      Object.assign(responseData, formData);
      if (notes) responseData.notes = notes;
    } else if (request.type === 'document') {
      responseData.fileName = selectedFile?.name;
      if (notes) responseData.notes = notes;
      // TODO: Handle actual file upload
    }

    await onSubmit(responseData);
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-red-100 text-red-800';
    if (status === 'submitted') return 'bg-blue-100 text-blue-800';
    if (status === 'completed') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
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

  const isSubmitDisabled = () => {
    if (isSubmitting) return true;
    if (request.type === 'confirmation' && !confirmationChecked) return true;
    if (request.type === 'document' && !selectedFile) return true;
    if (request.type === 'form') {
      // Check if all required form fields are filled
      const requiredFields = request.formFields?.filter((f: any) => f.required) || [];
      return requiredFields.some((f: any) => !formData[f.id]);
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-gray-900 text-xl">{generateRequestTitle(request)}</h2>
              <Badge className={getStatusColor(request.status)}>
                {request.status === 'active' ? 'Action Required' : request.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>{getTypeLabel(request.type)}</span>
              </div>
              {request.deadline && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Due {new Date(request.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>DSO Office</span>
              </div>
              {request.createdAt && (
                <div className="text-gray-500">
                  Requested {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Instructions Panel */}
          {(request.instructions || request.confirmationStatement) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Instructions from your DSO</p>
                  <p className="text-sm text-blue-800">
                    {request.instructions || request.confirmationStatement}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Document Upload Type */}
          {request.type === 'document' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Upload Document: {request.documentTitle || 'Required Document'}
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#2A73E8] transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Paperclip className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                    </>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Additional Notes (Optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional information..."
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Form Submission Type */}
          {request.type === 'form' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                {/* Dynamic form fields based on what DSO requested */}
                {request.formFields && request.formFields.length > 0 ? (
                  request.formFields.map((field: any) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={formData[field.id] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8] focus:border-transparent"
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      )}
                      
                      {field.type === 'date' && (
                        <input
                          type="date"
                          value={formData[field.id] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8] focus:border-transparent"
                        />
                      )}
                      
                      {field.type === 'dropdown' && field.options && (
                        <select
                          value={formData[field.id] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8] focus:border-transparent"
                        >
                          <option value="">Select {field.label.toLowerCase()}</option>
                          {field.options.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      
                      {field.type === 'textarea' && (
                        <Textarea
                          value={formData[field.id] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="min-h-[80px] resize-none"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No form fields defined</p>
                )}
                
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="accuracy"
                    checked={formData.accuracyConfirmed || false}
                    onChange={(e) => setFormData({ ...formData, accuracyConfirmed: e.target.checked })}
                    className="mt-1 w-4 h-4 text-[#2A73E8] border-gray-300 rounded focus:ring-[#2A73E8]"
                  />
                  <label htmlFor="accuracy" className="text-sm text-gray-700 cursor-pointer">
                    I confirm that all information provided is accurate and up to date
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Type */}
          {request.type === 'confirmation' && (
            <div className="space-y-4">
              {request.confirmationStatement && (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-800 italic leading-relaxed">
                    "{request.confirmationStatement}"
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmationChecked}
                    onChange={(e) => setConfirmationChecked(e.target.checked)}
                    className="mt-0.5 w-5 h-5 text-[#2A73E8] border-gray-300 rounded focus:ring-[#2A73E8]"
                  />
                  <span className="text-sm text-gray-900 font-medium">
                    I acknowledge and confirm that I have read and understand the above statement
                  </span>
                </label>
              </div>

              {!confirmationChecked && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  You must confirm before submitting
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              Save Draft
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitDisabled()}
              className="bg-[#2A73E8] hover:bg-[#1557b0] text-white min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit Response
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}