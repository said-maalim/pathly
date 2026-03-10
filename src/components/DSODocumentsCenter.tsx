import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User as UserIcon,
  AlertCircle,
  Loader2,
  Shield,
  Upload,
  X,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { projectId } from '../utils/supabase/info';

interface DSODocumentsCenterProps {
  userData?: any;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Document {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  type: string;
  uploadedBy: string;
  uploadedDate: string;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
}

const documentTypes = [
  'I-20',
  'CPT',
  'OPT',
  'Travel Signature',
  'Passport Copy',
  'Visa Stamp',
  'SEVIS Updates',
  'Other'
];

const documentTypeColors: Record<string, string> = {
  'I-20': 'bg-blue-100 text-blue-800',
  'CPT': 'bg-green-100 text-green-800',
  'OPT': 'bg-purple-100 text-purple-800',
  'Travel Signature': 'bg-orange-100 text-orange-800',
  'Passport Copy': 'bg-indigo-100 text-indigo-800',
  'Visa Stamp': 'bg-pink-100 text-pink-800',
  'SEVIS Updates': 'bg-teal-100 text-teal-800',
  'Other': 'bg-gray-100 text-gray-800'
};

export function DSODocumentsCenter({ userData }: DSODocumentsCenterProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    studentId: '',
    title: '',
    type: '',
    notes: ''
  });

  const token = userData?.data?.session?.access_token;
  const dsoName = userData?.data?.user?.user_metadata?.name || 'DSO Office';
  const universityId = userData?.data?.user?.user_metadata?.universityId;

  useEffect(() => {
    if (token && universityId) {
      fetchStudents();
      fetchDocuments();
    }
  }, [token, universityId]);

  const fetchStudents = async () => {
    try {
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
    } catch (err: any) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/documents/dso/${universityId}`,
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
        throw new Error(result.error || 'Failed to fetch documents');
      }

      setDocuments(result.documents || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF only for documents)
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.studentId || !uploadForm.title || !uploadForm.type || !selectedFile) {
      alert('Please fill in all required fields and select a file');
      return;
    }

    try {
      setUploading(true);

      // TODO: In production, upload file to Supabase Storage first
      // const { data, error } = await supabase.storage.from('documents').upload(path, selectedFile)
      // For prototype/demo, we'll use a mock file URL
      const mockFileUrl = `https://example.com/documents/${selectedFile.name}`;

      const payload = {
        studentId: uploadForm.studentId,
        title: uploadForm.title,
        type: uploadForm.type,
        notes: uploadForm.notes,
        fileName: selectedFile.name,
        fileUrl: mockFileUrl,
        uploadedBy: dsoName
      };

      console.log('Uploading document with payload:', payload);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/documents/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      console.log('Upload response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload document');
      }

      alert('Document uploaded successfully!');
      setUploadModalOpen(false);
      resetUploadForm();
      fetchDocuments();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      alert(`Failed to upload document: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/documents/${docId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete document');
      }

      alert('Document deleted successfully!');
      fetchDocuments();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      studentId: '',
      title: '',
      type: '',
      notes: ''
    });
    setSelectedFile(null);
  };

  const DocumentCard = ({ doc }: { doc: Document }) => (
    <div className="flex items-start justify-between p-5 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-[#2A73E8]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-gray-900 mb-1">{doc.title}</h3>
              <p className="text-gray-600">Student: {doc.studentName}</p>
            </div>
            <Badge className={documentTypeColors[doc.type] || documentTypeColors['Other']}>
              {doc.type}
            </Badge>
          </div>
          
          <div className="space-y-1 text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>Uploaded by: {doc.uploadedBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Uploaded on: {new Date(doc.uploadedDate).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}</span>
            </div>
            {doc.fileName && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="truncate">{doc.fileName}</span>
              </div>
            )}
          </div>

          {doc.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-gray-700">{doc.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(doc.fileUrl, '_blank')}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(doc.fileUrl, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDeleteDocument(doc.id)}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16">
      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-900 mb-2">No documents uploaded yet</p>
      <p className="text-gray-600">Upload official immigration documents for your students</p>
      <Button 
        onClick={() => setUploadModalOpen(true)}
        className="bg-[#2A73E8] hover:bg-[#1557b0] mt-4"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload First Document
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#2A73E8]" />
              </div>
              <div>
                <h1 className="text-gray-900">Documents Center</h1>
                <p className="text-gray-600">Manage and upload official documents for students</p>
              </div>
            </div>
            <Button 
              onClick={() => setUploadModalOpen(true)}
              className="bg-[#2A73E8] hover:bg-[#1557b0]"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-[#2A73E8] animate-spin mb-3" />
                <p className="text-gray-600">Loading documents...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <p className="text-gray-900 mb-2">Error loading documents</p>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchDocuments} className="bg-[#2A73E8] hover:bg-[#1557b0]">
                  Try Again
                </Button>
              </div>
            ) : documents.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {documents.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload an official document for a student. Fill in all required fields marked with *.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Student Selection */}
            <div>
              <label className="block text-gray-700 mb-2">
                Select Student <span className="text-red-500">*</span>
              </label>
              <Select value={uploadForm.studentId} onValueChange={(value) => setUploadForm({ ...uploadForm, studentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Title */}
            <div>
              <label className="block text-gray-700 mb-2">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., I-20 - Program Update"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-gray-700 mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <Select value={uploadForm.type} onValueChange={(value) => setUploadForm({ ...uploadForm, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-gray-700 mb-2">
                Upload File (PDF only) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2A73E8] transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-6 h-6 text-[#2A73E8]" />
                      <span className="text-gray-900">{selectedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-700 mb-1">Click to upload or drag and drop</p>
                      <p className="text-gray-500">PDF files only, max 10MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <Textarea
                placeholder="Add any additional notes or instructions for the student..."
                rows={3}
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadModalOpen(false);
                  resetUploadForm();
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !uploadForm.studentId || !uploadForm.title || !uploadForm.type || !selectedFile}
                className="bg-[#2A73E8] hover:bg-[#1557b0]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
