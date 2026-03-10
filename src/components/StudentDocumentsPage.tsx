import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User as UserIcon,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { projectId } from '../utils/supabase/info';

interface StudentDocumentsPageProps {
  userData?: any;
}

interface Document {
  id: string;
  studentId: string;
  title: string;
  type: string;
  uploadedBy: string;
  uploadedDate: string;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
}

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

export function StudentDocumentsPage({ userData }: StudentDocumentsPageProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = userData?.data?.user?.id;
  const token = userData?.data?.session?.access_token;

  useEffect(() => {
    if (userId && token) {
      fetchDocuments();
    }
  }, [userId, token]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/documents/student/${userId}`,
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

  const handleDownload = async (doc: Document) => {
    if (!doc.fileUrl) {
      alert('File URL not available');
      return;
    }

    try {
      // In a real implementation, this would download from Supabase Storage
      window.open(doc.fileUrl, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document');
    }
  };

  const handleView = async (doc: Document) => {
    if (!doc.fileUrl) {
      alert('File URL not available');
      return;
    }

    try {
      // In a real implementation, this would open a preview modal
      window.open(doc.fileUrl, '_blank');
    } catch (err) {
      console.error('Error viewing document:', err);
      alert('Failed to view document');
    }
  };

  const DocumentCard = ({ doc }: { doc: Document }) => (
    <div className="flex items-start justify-between p-5 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-[#2A73E8]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-gray-900">{doc.title}</h3>
            <Badge className={documentTypeColors[doc.type] || documentTypeColors['Other']}>
              {doc.type}
            </Badge>
          </div>
          
          <div className="space-y-1 text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>Uploaded by: {doc.uploadedBy || 'DSO Office'}</span>
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
              onClick={() => handleView(doc)}
              className="border-[#2A73E8] text-[#2A73E8] hover:bg-[#2A73E8]/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button 
              size="sm"
              onClick={() => handleDownload(doc)}
              className="bg-[#2A73E8] hover:bg-[#1557b0]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
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
      <p className="text-gray-600">Your DSO will upload official immigration documents here when available</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#2A73E8]/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#2A73E8]" />
            </div>
            <div>
              <h1 className="text-gray-900">Documents</h1>
              <p className="text-gray-600">Your official immigration documents uploaded by your DSO</p>
            </div>
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
    </div>
  );
}
