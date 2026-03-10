import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Shield,
  CreditCard,
  FileText,
  Clock,
  Edit,
  Save,
  X,
  Loader2,
  Plus,
  CheckCircle2,
  MapPin,
  Phone,
  Globe
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface StudentProfileViewProps {
  student: any;
  onBack: () => void;
  userData?: any;
  onCreateRequestAction?: (studentId: string, studentName: string) => void;
}

export function StudentProfileView({ student, onBack, userData, onCreateRequestAction }: StudentProfileViewProps) {
  const [updating, setUpdating] = useState(false);
  const [sevisDialogOpen, setSevisDialogOpen] = useState(false);

  // SEVIS form data
  const [sevisFormData, setSevisFormData] = useState({
    sevisStatus: student.visaProfile?.sevisStatus || 'active',
    compliance: student.visaProfile?.compliance || 'compliant',
    nextCheckDate: '',
    notes: ''
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Active':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'Expired':
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'Expiring Soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceColor = (compliance?: string) => {
    switch (compliance) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'non-compliant':
        return 'bg-red-100 text-red-800';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateSEVIS = async () => {
    try {
      setUpdating(true);
      const token = userData?.data?.session?.access_token;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/dso/sevis/${student.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sevisStatus: sevisFormData.sevisStatus,
            compliance: sevisFormData.compliance,
            nextCheckDate: sevisFormData.nextCheckDate,
            notes: sevisFormData.notes
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('SEVIS update error:', errorData);
        throw new Error(errorData.error || 'Failed to update SEVIS record');
      }

      const result = await response.json();
      console.log('SEVIS update successful:', result);
      alert('SEVIS record updated successfully');
      setSevisDialogOpen(false);
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating SEVIS:', error);
      alert(`Failed to update SEVIS record: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 mb-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Students
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                className="bg-[#2A73E8] hover:bg-[#1557b0]"
                onClick={() => onCreateRequestAction?.(student.id, student.name)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Request
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-[#2A73E8] rounded-full flex items-center justify-center text-white text-2xl">
                  {student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h1 className="text-gray-900 mb-1">{student.name}</h1>
                  <p className="text-gray-600">{student.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-[#2A73E8]" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 mb-1">Full Name</p>
                      <p className="text-gray-900">{student.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Email</p>
                      <p className="text-gray-900">{student.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Student ID</p>
                      <p className="text-gray-900">{student.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">User Type</p>
                      <Badge variant="outline" className="text-[#2A73E8] border-[#2A73E8]">
                        {student.userType}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visa Information */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#2A73E8]" />
                    Visa Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 mb-1">Visa Type</p>
                      <Badge variant="outline" className="text-[#2A73E8] border-[#2A73E8]">
                        {student.visaProfile?.visaType || 'Not set'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Visa Status</p>
                      <Badge className={getStatusColor(student.visaProfile?.status)}>
                        {student.visaProfile?.status || 'Pending'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Expiration Date</p>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(student.visaProfile?.expirationDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Last Updated</p>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatDate(student.visaProfile?.lastUpdated)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SEVIS Information */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#2A73E8]" />
                      SEVIS Information
                    </div>
                    <Dialog open={sevisDialogOpen} onOpenChange={setSevisDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Update SEVIS
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update SEVIS Record</DialogTitle>
                          <DialogDescription>
                            Update SEVIS status and compliance information for {student.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <label className="text-gray-700 mb-2 block">SEVIS Status</label>
                            <Select
                              value={sevisFormData.sevisStatus}
                              onValueChange={(value) => setSevisFormData({ ...sevisFormData, sevisStatus: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="terminated">Terminated</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-gray-700 mb-2 block">Compliance Status</label>
                            <Select
                              value={sevisFormData.compliance}
                              onValueChange={(value) => setSevisFormData({ ...sevisFormData, compliance: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="compliant">Compliant</SelectItem>
                                <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                                <SelectItem value="at-risk">At Risk</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-gray-700 mb-2 block">Notes</label>
                            <Textarea
                              value={sevisFormData.notes}
                              onChange={(e) => setSevisFormData({ ...sevisFormData, notes: e.target.value })}
                              placeholder="Optional notes about this update..."
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button
                              className="flex-1 bg-[#2A73E8] hover:bg-[#1557b0]"
                              onClick={handleUpdateSEVIS}
                              disabled={updating}
                            >
                              {updating ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                              ) : (
                                'Update SEVIS'
                              )}
                            </Button>
                            <Button variant="outline" onClick={() => setSevisDialogOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 mb-1">SEVIS Status</p>
                      <Badge variant="outline">
                        {student.visaProfile?.sevisStatus || 'Not set'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Compliance</p>
                      <Badge className={getComplianceColor(student.visaProfile?.compliance)}>
                        {student.visaProfile?.compliance || 'Not set'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Passport Information */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#2A73E8]" />
                    Passport Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 mb-1">Passport Status</p>
                      <Badge className={getStatusColor(student.visaProfile?.passportStatus)}>
                        {student.visaProfile?.passportStatus || 'Not set'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Expiration Date</p>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(student.visaProfile?.passportExpirationDate)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Stats */}
            <div className="space-y-6">
              {/* Status Summary */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Status Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Visa</span>
                    </div>
                    <Badge className={getStatusColor(student.visaProfile?.status)}>
                      {student.visaProfile?.status || 'Pending'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">SEVIS</span>
                    </div>
                    <Badge variant="outline">
                      {student.visaProfile?.sevisStatus || 'Not set'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span className="text-gray-700">Compliance</span>
                    </div>
                    <Badge className={getComplianceColor(student.visaProfile?.compliance)}>
                      {student.visaProfile?.compliance || 'Not set'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Important Dates */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#2A73E8]" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-gray-500 mb-1">Visa Expiration</p>
                    <p className="text-gray-900">{formatDate(student.visaProfile?.expirationDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Passport Expiration</p>
                    <p className="text-gray-900">{formatDate(student.visaProfile?.passportExpirationDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Last Profile Update</p>
                    <p className="text-gray-900">{formatDate(student.visaProfile?.lastUpdated)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => onCreateRequestAction?.(student.id, student.name)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Request
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    View Documents
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}