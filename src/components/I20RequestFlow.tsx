import { useState } from 'react';
import {
  Briefcase,
  GraduationCap,
  Plane,
  TrendingUp,
  BookOpen,
  DollarSign,
  FileX,
  ArrowLeftRight,
  RefreshCw,
  PauseCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  FileText,
  Clock,
  User,
  FileCheck
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

interface I20RequestFlowProps {
  requestId: string;
  requestName: string;
  onClose: () => void;
  onSubmit: (requestData: any) => void;
}

type I20Category = {
  id: string;
  name: string;
  description: string;
  icon: any;
};

const categories: I20Category[] = [
  {
    id: 'opt',
    name: 'OPT Application',
    description: 'Apply for Optional Practical Training after graduation',
    icon: Briefcase
  },
  {
    id: 'stem-opt',
    name: 'STEM OPT Extension',
    description: 'Extend your OPT for STEM degree holders',
    icon: TrendingUp
  },
  {
    id: 'cpt',
    name: 'CPT Authorization',
    description: 'Request Curricular Practical Training authorization',
    icon: GraduationCap
  },
  {
    id: 'travel',
    name: 'Travel Signature',
    description: 'Get your I-20 signed for international travel',
    icon: Plane
  },
  {
    id: 'extension',
    name: 'Program Extension',
    description: 'Extend your program completion date',
    icon: Clock
  },
  {
    id: 'change',
    name: 'Change of Major / Level',
    description: 'Update your major or degree level',
    icon: BookOpen
  },
  {
    id: 'financial',
    name: 'Financial Change',
    description: 'Report changes in financial support',
    icon: DollarSign
  },
  {
    id: 'lost',
    name: 'Lost or Damaged I-20',
    description: 'Request replacement for lost or damaged I-20',
    icon: FileX
  },
  {
    id: 'transfer',
    name: 'Transfer Out',
    description: 'Transfer your SEVIS record to another school',
    icon: ArrowLeftRight
  },
  {
    id: 'reinstatement',
    name: 'Reinstatement',
    description: 'Request reinstatement to F-1 status',
    icon: RefreshCw
  },
  {
    id: 'leave',
    name: 'Return from Leave',
    description: 'Return to active status after approved leave',
    icon: PauseCircle
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Other I-20 related requests',
    icon: HelpCircle
  }
];

export function I20RequestFlow({ requestId, requestName, onClose, onSubmit }: I20RequestFlowProps) {
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');
  const [formData, setFormData] = useState<any>({});
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({});

  const handleFormChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileUpload = (field: string, file: File | null) => {
    setUploadedFiles({ ...uploadedFiles, [field]: file });
  };

  const handleSubmitRequest = () => {
    const requestData = {
      requestId,
      requestName,
      formData,
      uploadedFiles,
      submittedAt: new Date().toISOString()
    };
    onSubmit(requestData);
    setStep('success');
  };

  // Get the icon for the current request
  const getRequestIcon = () => {
    const iconMap: { [key: string]: any } = {
      'cpt': Briefcase,
      'opt': Briefcase,
      'stem-opt': TrendingUp,
      'travel': Plane,
      'extension': Clock,
      'change': BookOpen,
      'financial': DollarSign,
      'personal-info': User,
      'lost': FileX,
      'enrollment': FileCheck,
      'ssn-letter': FileText,
      'transfer': ArrowLeftRight,
      'reinstatement': RefreshCw,
      'leave': PauseCircle
    };
    return iconMap[requestId] || FileText;
  };

  const RequestIcon = getRequestIcon();

  // Dynamic Form Screen
  if (step === 'form') {
    const category = categories.find(c => c.id === requestId);
    
    return (
      <div
        style={{ flex: 1, overflowY: 'auto', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={onClose} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Button>
            <div className="flex items-center gap-3 mb-4">
              {category && <category.icon className="w-8 h-8 text-[#2A73E8]" />}
              <div>
                <h1 className="text-gray-900">{category?.name}</h1>
                <p className="text-gray-600">Fill out the required information below</p>
              </div>
            </div>
          </div>

          <Card className="shadow-sm border-0">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-6">
                {/* CPT Authorization Form */}
                {requestId === 'cpt' && (
                  <>
                    <div>
                      <label className="block text-gray-900 mb-2">
                        Employer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        placeholder="Enter company or organization name"
                        value={formData.employerName || ''}
                        onChange={(e) => handleFormChange('employerName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-2">
                        Employer Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        placeholder="Street address"
                        value={formData.employerAddress1 || ''}
                        onChange={(e) => handleFormChange('employerAddress1', e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <input
                          type="text"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                          placeholder="City"
                          value={formData.employerCity || ''}
                          onChange={(e) => handleFormChange('employerCity', e.target.value)}
                        />
                        <input
                          type="text"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                          placeholder="State"
                          value={formData.employerState || ''}
                          onChange={(e) => handleFormChange('employerState', e.target.value)}
                        />
                      </div>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8] mt-3"
                        placeholder="ZIP Code"
                        value={formData.employerZip || ''}
                        onChange={(e) => handleFormChange('employerZip', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-900 mb-2">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                          value={formData.startDate || ''}
                          onChange={(e) => handleFormChange('startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-900 mb-2">
                          End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                          value={formData.endDate || ''}
                          onChange={(e) => handleFormChange('endDate', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-3">
                        Employment Type <span className="text-red-500">*</span>
                      </label>
                      <RadioGroup
                        value={formData.employmentType || ''}
                        onValueChange={(value) => handleFormChange('employmentType', value)}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="part-time" id="part-time" />
                          <Label htmlFor="part-time" className="cursor-pointer">Part-Time (20 hours/week or less)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full-time" id="full-time" />
                          <Label htmlFor="full-time" className="cursor-pointer">Full-Time (More than 20 hours/week)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-2">
                        Job Description <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        placeholder="Describe your job duties and how they relate to your major..."
                        className="min-h-32"
                        value={formData.jobDescription || ''}
                        onChange={(e) => handleFormChange('jobDescription', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-2">
                        Upload Offer Letter <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2A73E8] transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-gray-500">PDF, DOC, or DOCX (max 10MB)</p>
                        <input
                          type="file"
                          className="hidden"
                          id="offer-letter"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload('offerLetter', e.target.files?.[0] || null)}
                        />
                        <label htmlFor="offer-letter">
                          <Button variant="outline" className="mt-3" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                        {uploadedFiles.offerLetter && (
                          <p className="text-[#2A73E8] mt-2 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {uploadedFiles.offerLetter.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-2">
                        Upload CPT Agreement <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2A73E8] transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-gray-500">PDF, DOC, or DOCX (max 10MB)</p>
                        <input
                          type="file"
                          className="hidden"
                          id="cpt-agreement"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload('cptAgreement', e.target.files?.[0] || null)}
                        />
                        <label htmlFor="cpt-agreement">
                          <Button variant="outline" className="mt-3" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                        {uploadedFiles.cptAgreement && (
                          <p className="text-[#2A73E8] mt-2 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {uploadedFiles.cptAgreement.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* OPT Application Form */}
                {requestId === 'opt' && (
                  <>
                    <div>
                      <label className="block text-gray-900 mb-2">
                        Expected Graduation Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        value={formData.graduationDate || ''}
                        onChange={(e) => handleFormChange('graduationDate', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-2">
                        Degree Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        value={formData.degreeLevel || ''}
                        onChange={(e) => handleFormChange('degreeLevel', e.target.value)}
                      >
                        <option value="">Select degree level...</option>
                        <option value="bachelor">Bachelor's</option>
                        <option value="master">Master's</option>
                        <option value="doctoral">Doctoral</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-2">
                        Major/Program <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        placeholder="e.g., Computer Science"
                        value={formData.major || ''}
                        onChange={(e) => handleFormChange('major', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-2">
                        Upload Degree Completion Proof <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2A73E8] transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Upload transcript or completion letter</p>
                        <p className="text-gray-500">PDF (max 10MB)</p>
                        <input
                          type="file"
                          className="hidden"
                          id="degree-proof"
                          accept=".pdf"
                          onChange={(e) => handleFileUpload('degreeProof', e.target.files?.[0] || null)}
                        />
                        <label htmlFor="degree-proof">
                          <Button variant="outline" className="mt-3" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                        {uploadedFiles.degreeProof && (
                          <p className="text-[#2A73E8] mt-2 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {uploadedFiles.degreeProof.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Travel Signature Form */}
                {requestId === 'travel' && (
                  <>
                    <div>
                      <label className="block text-gray-900 mb-2">
                        Travel Destination <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                        placeholder="e.g., India, China, Mexico"
                        value={formData.destination || ''}
                        onChange={(e) => handleFormChange('destination', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-900 mb-2">
                          Departure Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                          value={formData.departureDate || ''}
                          onChange={(e) => handleFormChange('departureDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-900 mb-2">
                          Return Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                          value={formData.returnDate || ''}
                          onChange={(e) => handleFormChange('returnDate', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-2">
                        Reason for Travel <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        placeholder="e.g., Family visit, emergency, vacation"
                        className="min-h-24"
                        value={formData.travelReason || ''}
                        onChange={(e) => handleFormChange('travelReason', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Generic form for other categories */}
                {!['cpt', 'opt', 'travel'].includes(requestId) && (
                  <>
                    <div>
                      <label className="block text-gray-900 mb-2">
                        Request Details <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        placeholder="Please provide detailed information about your request..."
                        className="min-h-32"
                        value={formData.requestDetails || ''}
                        onChange={(e) => handleFormChange('requestDetails', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-900 mb-2">
                        Upload Supporting Documents <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2A73E8] transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-gray-500">PDF, DOC, or DOCX (max 10MB)</p>
                        <input
                          type="file"
                          className="hidden"
                          id="supporting-docs"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload('supportingDocs', e.target.files?.[0] || null)}
                        />
                        <label htmlFor="supporting-docs">
                          <Button variant="outline" className="mt-3" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                        {uploadedFiles.supportingDocs && (
                          <p className="text-[#2A73E8] mt-2 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {uploadedFiles.supportingDocs.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Additional Information - Common for all forms */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-gray-900 mb-2">
                    Anything else you would like the DSO to know? <span className="text-gray-500">(Optional)</span>
                  </label>
                  <Textarea
                    placeholder="Add context or special instructions (optional)."
                    className="min-h-24"
                    value={formData.additionalInfo || ''}
                    onChange={(e) => handleFormChange('additionalInfo', e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    className="bg-[#2A73E8] hover:bg-[#1557b0]"
                    onClick={() => setStep('review')}
                  >
                    Review Request
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Review & Submit Screen
  if (step === 'review') {
    const category = categories.find(c => c.id === requestId);
    
    return (
      <div
        style={{ flex: 1, overflowY: 'auto', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => setStep('form')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Form
            </Button>
            <h1 className="text-gray-900 mb-2">Review & Submit</h1>
            <p className="text-gray-600">Please review your request before submitting</p>
          </div>

          <Card className="shadow-sm border-0 mb-6">
            <CardHeader className="bg-[#2A73E8]/5 border-b border-gray-200">
              <CardTitle className="flex items-center gap-3">
                {category && <category.icon className="w-6 h-6 text-[#2A73E8]" />}
                {category?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Object.entries(formData).map(([key, value]) => {
                  if (!value || key === 'additionalInfo') return null;
                  
                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase());
                  
                  return (
                    <div key={key} className="pb-4 border-b border-gray-100 last:border-0">
                      <p className="text-gray-600 mb-1">{label}</p>
                      <p className="text-gray-900">{value as string}</p>
                    </div>
                  );
                })}

                {formData.additionalInfo && (
                  <div className="pb-4 border-b border-gray-100">
                    <p className="text-gray-600 mb-1">Additional Information</p>
                    <p className="text-gray-900">{formData.additionalInfo}</p>
                  </div>
                )}

                {Object.keys(uploadedFiles).length > 0 && (
                  <div>
                    <p className="text-gray-600 mb-2">Uploaded Documents</p>
                    <div className="space-y-2">
                      {Object.entries(uploadedFiles).map(([key, file]) => {
                        if (!file) return null;
                        return (
                          <div key={key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <FileText className="w-5 h-5 text-[#2A73E8]" />
                            <span className="text-gray-900">{file.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('form')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Edit Request
            </Button>
            <Button
              className="bg-[#2A73E8] hover:bg-[#1557b0] flex-1"
              onClick={handleSubmitRequest}
            >
              Submit Request
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success Screen
  if (step === 'success') {
    return (
      <div
        style={{ flex: 1, overflowY: 'auto', background: '#f4f5f7', fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        className="flex items-center justify-center p-4"
      >
        <Card className="max-w-md w-full shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-gray-900 mb-2">Request Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your I-20 request has been submitted to your DSO. You will receive an email confirmation shortly.
            </p>
            <div className="space-y-3">
              <Button
                className="bg-[#2A73E8] hover:bg-[#1557b0] w-full"
                onClick={onClose}
              >
                Track Request Status
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('category');
                  setFormData({});
                  setUploadedFiles({});
                }}
              >
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}