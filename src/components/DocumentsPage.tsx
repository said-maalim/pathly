import { useState } from 'react';
import {
  Upload,
  Filter,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Share2,
  ChevronRight,
  X,
  Calendar,
  User,
  Briefcase,
  CreditCard,
  Shield,
  FolderOpen,
  Search,
  Info,
  ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

interface Document {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  expiryDate?: string;
  status: 'approved' | 'pending' | 'requires-action' | 'missing';
  size?: string;
  version?: number;
  sharedWithDSO: boolean;
}

interface DSORequest {
  id: string;
  documentName: string;
  reason: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'accepted';
}

const categories = [
  { id: 'all', name: 'All Documents', icon: FolderOpen },
  { id: 'identity', name: 'Identity Documents', icon: User },
  { id: 'sevis', name: 'SEVIS Documents', icon: Shield },
  { id: 'employment', name: 'Employment Documents', icon: Briefcase },
  { id: 'immigration', name: 'Immigration Notices', icon: FileText },
  { id: 'financial', name: 'Financial Documents', icon: CreditCard },
  { id: 'other', name: 'Other Uploads', icon: FolderOpen }
];

const requiredDocuments = [
  { id: 1, name: 'Passport Bio Page', status: 'approved', required: true },
  { id: 2, name: 'Current I-20', status: 'approved', required: true },
  { id: 3, name: 'Visa Stamp', status: 'approved', required: true },
  { id: 4, name: 'Financial Documents', status: 'pending', required: true },
  { id: 5, name: 'SEVIS Status Letter', status: 'missing', required: false }
];

const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'Passport Bio Page',
    category: 'identity',
    uploadDate: '2024-10-15',
    expiryDate: '2030-06-20',
    status: 'approved',
    size: '2.4 MB',
    version: 1,
    sharedWithDSO: true
  },
  {
    id: 'doc-2',
    name: 'Current I-20 Form',
    category: 'sevis',
    uploadDate: '2024-10-10',
    expiryDate: '2026-06-15',
    status: 'approved',
    size: '1.8 MB',
    version: 2,
    sharedWithDSO: true
  },
  {
    id: 'doc-3',
    name: 'F-1 Visa Stamp',
    category: 'immigration',
    uploadDate: '2024-10-05',
    expiryDate: '2025-12-31',
    status: 'approved',
    size: '3.1 MB',
    version: 1,
    sharedWithDSO: true
  },
  {
    id: 'doc-4',
    name: 'Bank Statement - October 2024',
    category: 'financial',
    uploadDate: '2024-11-01',
    status: 'pending',
    size: '856 KB',
    version: 1,
    sharedWithDSO: true
  },
  {
    id: 'doc-5',
    name: 'Enrollment Verification Letter',
    category: 'sevis',
    uploadDate: '2024-09-20',
    expiryDate: '2024-12-31',
    status: 'requires-action',
    size: '421 KB',
    version: 1,
    sharedWithDSO: false
  },
  {
    id: 'doc-6',
    name: 'Social Security Card',
    category: 'identity',
    uploadDate: '2024-08-15',
    status: 'approved',
    size: '1.2 MB',
    version: 1,
    sharedWithDSO: false
  }
];

const dsoRequests: DSORequest[] = [
  {
    id: 'req-1',
    documentName: 'Updated Financial Statement',
    reason: 'Need current semester funding verification',
    dueDate: '2024-11-25',
    status: 'pending'
  },
  {
    id: 'req-2',
    documentName: 'CPT I-983 Section 6',
    reason: 'Mid-term CPT evaluation required',
    dueDate: '2024-11-30',
    status: 'pending'
  }
];

interface DocumentsPageProps {
  onBack: () => void;
}

export function DocumentsPage({ onBack }: DocumentsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const completedRequired = requiredDocuments.filter(doc => doc.status === 'approved').length;
  const totalRequired = requiredDocuments.filter(doc => doc.required).length;
  const progressPercentage = (completedRequired / totalRequired) * 100;

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { className: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'Approved' };
      case 'pending':
        return { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100', label: 'Pending Review' };
      case 'requires-action':
        return { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', label: 'Requires Action' };
      case 'missing':
        return { className: 'bg-red-100 text-red-800 hover:bg-red-100', label: 'Missing' };
      default:
        return { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100', label: 'Unknown' };
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-gray-900 mb-2">Documents</h1>
              <p className="text-gray-600">Manage your immigration and university documents in one place.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button 
                className="bg-[#2A73E8] hover:bg-[#1557b0]" 
                size="sm"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </div>

        {/* Expiration Alerts */}
        <div className="space-y-3 mb-6">
          {mockDocuments.filter(doc => isExpiringSoon(doc.expiryDate)).length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Document Expiring Soon:</strong> Your Enrollment Verification Letter expires on Dec 31, 2024
              </AlertDescription>
            </Alert>
          )}
          {dsoRequests.filter(req => req.status === 'pending').length > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Action Required:</strong> You have {dsoRequests.filter(req => req.status === 'pending').length} pending document request(s) from your DSO
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Required Documents Checklist */}
        <Card className="shadow-sm border-0 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Required Documents</CardTitle>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                {completedRequired} of {totalRequired} Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Completion Progress</span>
                <span className="text-gray-900">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {requiredDocuments.map(doc => {
                const statusConfig = getStatusConfig(doc.status);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {doc.status === 'approved' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : doc.status === 'missing' ? (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 truncate">{doc.name}</p>
                        <Badge className={`${statusConfig.className} mt-1`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                    {doc.status === 'missing' && (
                      <Button size="sm" variant="outline" className="ml-2">
                        <Upload className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Categories and Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {categories.map(category => {
                  const Icon = category.icon;
                  const count = category.id === 'all' 
                    ? mockDocuments.length 
                    : mockDocuments.filter(doc => doc.category === category.id).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-[#2A73E8]/10 text-[#2A73E8]'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{category.name}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Document Library */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>
                  Your Documents
                  <span className="text-gray-500 ml-2">({filteredDocuments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No documents found</p>
                    <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your First Document
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredDocuments.map(doc => {
                      const statusConfig = getStatusConfig(doc.status);
                      const expiringSoon = isExpiringSoon(doc.expiryDate);
                      const expired = isExpired(doc.expiryDate);
                      
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6 text-[#2A73E8]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-gray-900 truncate">{doc.name}</p>
                                {doc.sharedWithDSO && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                                    Shared with DSO
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-gray-600 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Uploaded {new Date(doc.uploadDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                {doc.expiryDate && (
                                  <span className={`flex items-center gap-1 ${
                                    expired ? 'text-red-600' : expiringSoon ? 'text-yellow-600' : ''
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    {expired ? 'Expired' : 'Expires'} {new Date(doc.expiryDate).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                )}
                                {doc.size && <span>{doc.size}</span>}
                                {doc.version && doc.version > 1 && <span>v{doc.version}</span>}
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <Badge className={statusConfig.className}>
                                  {statusConfig.label}
                                </Badge>
                                {expiringSoon && !expired && (
                                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    Expiring Soon
                                  </Badge>
                                )}
                                {expired && (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                    Expired
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* DSO Requests Section */}
        {dsoRequests.length > 0 && (
          <Card className="shadow-sm border-0 mt-6 border-l-4 border-l-[#2A73E8]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#2A73E8]" />
                Requests from Your DSO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dsoRequests.map(request => (
                  <div
                    key={request.id}
                    className="flex items-start justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-900">{request.documentName}</p>
                        <Badge className={
                          request.status === 'accepted' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : request.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                        }>
                          {request.status === 'pending' ? 'Pending' : request.status === 'submitted' ? 'Submitted' : 'Accepted'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{request.reason}</p>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(request.dueDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    {request.status === 'pending' && (
                      <Button className="bg-[#2A73E8] hover:bg-[#1557b0] ml-4">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Document Preview Sidebar */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setSelectedDocument(null)}>
          <div 
            className="w-full max-w-2xl bg-white h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-gray-900">Document Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6">
              {/* Document Preview */}
              <div className="bg-gray-100 rounded-lg p-12 mb-6 text-center">
                <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Document preview would appear here</p>
              </div>

              {/* Document Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-900 mb-4">Document Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Name</span>
                      <span className="text-gray-900">{selectedDocument.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Category</span>
                      <span className="text-gray-900 capitalize">{selectedDocument.category}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Upload Date</span>
                      <span className="text-gray-900">
                        {new Date(selectedDocument.uploadDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {selectedDocument.expiryDate && (
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Expiry Date</span>
                        <span className="text-gray-900">
                          {new Date(selectedDocument.expiryDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Status</span>
                      <Badge className={getStatusConfig(selectedDocument.status).className}>
                        {getStatusConfig(selectedDocument.status).label}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Size</span>
                      <span className="text-gray-900">{selectedDocument.size}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Version</span>
                      <span className="text-gray-900">v{selectedDocument.version}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Shared with DSO</span>
                      <span className="text-gray-900">{selectedDocument.sharedWithDSO ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div>
                  <h3 className="text-gray-900 mb-4">Status Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="w-0.5 h-12 bg-green-300"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-gray-900">Uploaded</p>
                        <p className="text-gray-500">
                          {new Date(selectedDocument.uploadDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedDocument.status !== 'missing' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <CheckCircle2 className={`w-4 h-4 ${
                            selectedDocument.status !== 'missing' ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className={`w-0.5 h-12 ${
                          selectedDocument.status === 'approved' ? 'bg-green-300' : 'bg-gray-200'
                        }`}></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-gray-900">Reviewed</p>
                        <p className="text-gray-500">In progress</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedDocument.status === 'approved' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <CheckCircle2 className={`w-4 h-4 ${
                            selectedDocument.status === 'approved' ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className={selectedDocument.status === 'approved' ? 'text-gray-900' : 'text-gray-500'}>
                          Approved
                        </p>
                        {selectedDocument.status === 'approved' && (
                          <p className="text-gray-500">Completed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-6 border-t border-gray-200">
                  <Button className="w-full bg-[#2A73E8] hover:bg-[#1557b0]">
                    <Download className="w-4 h-4 mr-2" />
                    Download Document
                  </Button>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Replace Document
                  </Button>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900">Share with DSO</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDocument.sharedWithDSO}
                        className="sr-only peer"
                        onChange={() => {}}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A73E8]"></div>
                    </label>
                  </div>
                  <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Document
                  </Button>
                </div>

                {/* DSO Notes Section */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-gray-900 mb-3">DSO Notes / Feedback</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-600 italic">No feedback from DSO yet.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}