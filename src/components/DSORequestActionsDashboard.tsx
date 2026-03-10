import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  FileText,
  ClipboardCheck,
  CheckSquare,
  Plus,
  Eye,
  Calendar,
  Users,
  Filter,
  Search,
  Download,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DSORequestActionsDashboardProps {
  onBack: () => void;
  onCreateNew: () => void;
  onViewDetail: (requestId: string) => void;
  userData?: any;
}

interface RequestAction {
  id: string;
  title: string;
  type: 'document' | 'form' | 'confirmation';
  sentTo: 'Single' | 'Bulk';
  targetStudent?: string;
  targetStudentName?: string;
  targetCount: number;
  deadline: string | null;
  completionPercent: number;
  completedCount: number;
  totalCount: number;
  status: 'active' | 'completed' | 'overdue';
  createdAt: string;
}

export function DSORequestActionsDashboard({ onBack, onCreateNew, onViewDetail, userData }: DSORequestActionsDashboardProps) {
  const [requests, setRequests] = useState<RequestAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = userData?.data?.session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/dso/request-actions`,
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
        throw new Error(result.error || 'Failed to fetch request actions');
      }

      setRequests(result.requests || []);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      // Set mock data for demonstration
      setRequests([
        {
          id: '1',
          title: 'Passport Copy Upload',
          type: 'document',
          sentTo: 'Bulk',
          targetCount: 156,
          deadline: '2024-12-01',
          completionPercent: 78,
          completedCount: 122,
          totalCount: 156,
          status: 'active',
          createdAt: '2024-11-15'
        },
        {
          id: '2',
          title: 'OPT Employment Information',
          type: 'form',
          sentTo: 'Bulk',
          targetCount: 89,
          deadline: '2024-11-30',
          completionPercent: 45,
          completedCount: 40,
          totalCount: 89,
          status: 'active',
          createdAt: '2024-11-10'
        },
        {
          id: '3',
          title: 'SEVIS Status Acknowledgement',
          type: 'confirmation',
          sentTo: 'Bulk',
          targetCount: 1247,
          deadline: null,
          completionPercent: 92,
          completedCount: 1147,
          totalCount: 1247,
          status: 'active',
          createdAt: '2024-11-01'
        },
        {
          id: '4',
          title: 'Signed I-20 Document',
          type: 'document',
          sentTo: 'Single',
          targetCount: 1,
          deadline: '2024-11-20',
          completionPercent: 100,
          completedCount: 1,
          totalCount: 1,
          status: 'completed',
          createdAt: '2024-11-08'
        },
        {
          id: '5',
          title: 'Address Update Form',
          type: 'form',
          sentTo: 'Bulk',
          targetCount: 234,
          deadline: '2024-11-18',
          completionPercent: 23,
          completedCount: 54,
          totalCount: 234,
          status: 'overdue',
          createdAt: '2024-10-25'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'form': return ClipboardCheck;
      case 'confirmation': return CheckSquare;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'form': return 'bg-purple-100 text-purple-800';
      case 'confirmation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getCompletionColor = (percent: number) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredRequests = requests.filter(request => {
    const typeMatch = filterType === 'all' || request.type === filterType;
    const statusMatch = filterStatus === 'all' || request.status === filterStatus;
    const searchMatch = request.title.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  });

  const stats = [
    { label: 'Total Requests', value: requests.length, color: 'bg-blue-500' },
    { label: 'Active', value: requests.filter(r => r.status === 'active').length, color: 'bg-green-500' },
    { label: 'Completed', value: requests.filter(r => r.status === 'completed').length, color: 'bg-purple-500' },
    { label: 'Overdue', value: requests.filter(r => r.status === 'overdue').length, color: 'bg-red-500' }
  ];

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
                <h1 className="text-gray-900">Request Actions</h1>
                <p className="text-sm text-gray-600">Manage all student request actions</p>
              </div>
            </div>
            <Button
              onClick={onCreateNew}
              className="bg-[#2A73E8] hover:bg-[#1557b0]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Request
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, idx) => (
              <Card key={idx} className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <span className="text-white">{stat.value}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="document">Document Upload</SelectItem>
                    <SelectItem value="form">Form Submission</SelectItem>
                    <SelectItem value="confirmation">Confirmation</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table/Cards */}
          {loading ? (
            <Card className="shadow-sm border-0">
              <CardContent className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#2A73E8] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading requests...</p>
              </CardContent>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card className="shadow-sm border-0">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-gray-900 mb-2">No Request Actions Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'No requests match your current filters.'
                    : 'Create your first request action to get started.'}
                </p>
                <Button
                  onClick={onCreateNew}
                  className="bg-[#2A73E8] hover:bg-[#1557b0]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Request Action
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const TypeIcon = getTypeIcon(request.type);
                return (
                  <Card key={request.id} className="shadow-sm border-0 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Icon & Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 ${getTypeColor(request.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <TypeIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-gray-900">{request.title}</h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <TypeIcon className="w-4 h-4" />
                                <span className="capitalize">{request.type}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {request.sentTo === 'Single' ? (
                                  <span>{request.targetStudentName || 'Student'}</span>
                                ) : (
                                  <span>Bulk ({request.targetCount} students)</span>
                                )}
                              </div>
                              {request.deadline && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Due: {new Date(request.deadline).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Completion & Actions */}
                        <div className="flex items-center gap-6">
                          {/* Completion */}
                          <div className="text-right">
                            <div className="text-gray-900 mb-1">
                              {request.completedCount} / {request.totalCount}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getCompletionColor(request.completionPercent)} transition-all`}
                                  style={{ width: `${request.completionPercent}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12">{request.completionPercent}%</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#2A73E8] border-[#2A73E8]"
                              onClick={() => onViewDetail(request.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Export Section */}
          {filteredRequests.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button variant="outline" className="text-gray-600">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}