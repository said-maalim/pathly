import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Users,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Mail,
  Download,
  User,
  Shield,
  CreditCard,
  FileText,
  ArrowUpDown,
  Loader,
  Globe,
  Bell,
  Home,
  Plus,
  BarChart3,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StudentProfileView } from './StudentProfileView';

interface DSOStudentCenterProps {
  onBack: () => void;
  onLogout?: () => void;
  userName?: string;
  userData?: any;
  onCreateRequestAction?: (studentId: string, studentName: string) => void;
}

interface Student {
  id: string;
  name: string;
  email: string;
  userType: string;
  universityId: string;
  createdAt: string;
  visaProfile: {
    visaType?: string;
    status?: string;
    expirationDate?: string;
    sevisStatus?: string;
    compliance?: string;
    passportStatus?: string;
    passportExpirationDate?: string;
    lastUpdated?: string;
  };
}

export function DSOStudentCenter({ onBack, onLogout, userName = 'DSO Admin', userData, onCreateRequestAction }: DSOStudentCenterProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filterVisaType, setFilterVisaType] = useState('all');
  const [filterSevisStatus, setFilterSevisStatus] = useState('all');
  const [filterPassportStatus, setFilterPassportStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'visa' | 'sevis'>('name');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentTab, setCurrentTab] = useState<'list' | 'analytics'>('list');

  // Get user type
  const userType = userData?.data?.user?.user_metadata?.userType;
  const universityId = userData?.data?.user?.user_metadata?.universityId || 'stanford';

  // Check user type on mount
  useEffect(() => {
    if (userType && userType !== 'dso') {
      alert(`You are logged in as a ${userType.toUpperCase()}. This is the DSO portal. Please access the ${userType.toUpperCase()} portal instead.`);
    }
  }, [userType]);

  // Fetch students
  useEffect(() => {
    fetchStudents();
  }, [userData]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      const token = userData?.data?.session?.access_token;
      if (!token) {
        console.error('No access token found');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/dso/students/${universityId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Error fetching students:', error);
        return;
      }

      const result = await response.json();
      console.log('Fetched students:', result.students);
      setStudents(result.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  // Statistics
  const stats = [
    { 
      label: 'Total Students', 
      value: students.length, 
      icon: Users, 
      color: 'bg-blue-500',
      subtext: 'Active enrolled'
    },
    { 
      label: 'Visa Expiring Soon', 
      value: students.filter(s => {
        if (!s.visaProfile?.expirationDate) return false;
        const daysUntil = Math.ceil((new Date(s.visaProfile.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 90;
      }).length,
      icon: Clock, 
      color: 'bg-yellow-500',
      subtext: 'Within 90 days'
    },
    { 
      label: 'Non-Compliant', 
      value: students.filter(s => s.visaProfile?.compliance === 'non-compliant').length, 
      icon: AlertTriangle, 
      color: 'bg-red-500',
      subtext: 'Need attention'
    },
    { 
      label: 'Active SEVIS', 
      value: students.filter(s => s.visaProfile?.sevisStatus === 'active').length, 
      icon: CheckCircle2, 
      color: 'bg-green-500',
      subtext: 'In good standing'
    }
  ];

  // Filter and sort students
  const filteredStudents = students
    .filter(student => {
      const visaMatch = filterVisaType === 'all' || student.visaProfile?.visaType === filterVisaType;
      const sevisMatch = filterSevisStatus === 'all' || student.visaProfile?.sevisStatus === filterSevisStatus;
      const passportMatch = filterPassportStatus === 'all' || student.visaProfile?.passportStatus === filterPassportStatus;
      const searchMatch = searchQuery === '' || 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      return visaMatch && sevisMatch && passportMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'visa') {
        return (a.visaProfile?.visaType || '').localeCompare(b.visaProfile?.visaType || '');
      } else {
        return (a.visaProfile?.sevisStatus || '').localeCompare(b.visaProfile?.sevisStatus || '');
      }
    });

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // If viewing individual student
  if (selectedStudent) {
    return (
      <StudentProfileView 
        student={selectedStudent}
        onBack={() => {
          setSelectedStudent(null);
          fetchStudents(); // Refresh the list
        }}
        userData={userData}
        onCreateRequestAction={onCreateRequestAction}
      />
    );
  }

  // Visa Type Distribution for Analytics
  const visaTypeDistribution = students.reduce((acc, student) => {
    const type = student.visaProfile?.visaType || 'Not Set';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // SEVIS Status Distribution
  const sevisStatusDistribution = students.reduce((acc, student) => {
    const status = student.visaProfile?.sevisStatus || 'Not Set';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Compliance Distribution
  const complianceDistribution = students.reduce((acc, student) => {
    const compliance = student.visaProfile?.compliance || 'Not Set';
    acc[compliance] = (acc[compliance] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Passport Status Distribution
  const passportStatusDistribution = students.reduce((acc, student) => {
    const status = student.visaProfile?.passportStatus || 'Not Set';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Main view
  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 mb-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2A73E8] rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl text-gray-900">Pathly</span>
                <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">DSO Admin</Badge>
              </div>
              <span className="text-gray-300 hidden sm:block">|</span>
              <div className="hidden sm:flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2A73E8]" />
                <span className="text-gray-700">Student Center</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onBack}
                className="border-[#2A73E8] text-[#2A73E8] hover:bg-[#2A73E8] hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              {userName && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#2A73E8] rounded-full flex items-center justify-center text-white">
                    {userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  {onLogout && (
                    <Button variant="ghost" size="sm" onClick={onLogout}>
                      Log Out
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-[#2A73E8]" />
              <h1 className="text-gray-900">Student Center</h1>
            </div>
            <p className="text-gray-600">Manage student information, visa status, and compliance records.</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <Card key={idx} className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-gray-500">{stat.subtext}</p>
                    </div>
                  </div>
                  <p className="text-gray-700">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={currentTab} onValueChange={(value: any) => setCurrentTab(value)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="list">Student List</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Student List Tab */}
            <TabsContent value="list">
              {/* Filters and Search */}
              <Card className="shadow-sm border-0 mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                      />
                    </div>

                    {/* Visa Type Filter */}
                    <Select value={filterVisaType} onValueChange={setFilterVisaType}>
                      <SelectTrigger>
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Visa Types</SelectItem>
                        <SelectItem value="F-1">F-1</SelectItem>
                        <SelectItem value="J-1">J-1</SelectItem>
                        <SelectItem value="M-1">M-1</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* SEVIS Status Filter */}
                    <Select value={filterSevisStatus} onValueChange={setFilterSevisStatus}>
                      <SelectTrigger>
                        <Shield className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All SEVIS Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Passport Status Filter */}
                    <Select value={filterPassportStatus} onValueChange={setFilterPassportStatus}>
                      <SelectTrigger>
                        <CreditCard className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Passport Status</SelectItem>
                        <SelectItem value="Valid">Valid</SelectItem>
                        <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort */}
                  <div className="mt-4">
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Sort by Name</SelectItem>
                        <SelectItem value="visa">Sort by Visa Type</SelectItem>
                        <SelectItem value="sevis">Sort by SEVIS Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Student List */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>All Students ({filteredStudents.length})</span>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader className="w-12 h-12 text-[#2A73E8] animate-spin mb-4" />
                      <p className="text-gray-600">Loading students...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredStudents.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-2">No students found</p>
                          <p className="text-gray-400">Try adjusting your filters</p>
                        </div>
                      ) : (
                      filteredStudents.map((student) => (
                        <div 
                          key={student.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-[#2A73E8] hover:shadow-md transition-all cursor-pointer bg-white"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Left side - Main info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <p className="text-gray-900">{student.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {student.email}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                <div>
                                  <p className="text-gray-500 mb-1">Visa Type</p>
                                  <Badge variant="outline" className="text-[#2A73E8] border-[#2A73E8]">
                                    {student.visaProfile?.visaType || 'Not set'}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">Visa Status</p>
                                  <Badge className={getStatusColor(student.visaProfile?.status)}>
                                    {student.visaProfile?.status || 'pending'}
                                  </Badge>
                                </div>
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

                              <div className="flex items-center gap-4 text-gray-500 mt-3">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Visa Exp: {formatDate(student.visaProfile?.expirationDate)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CreditCard className="w-4 h-4" />
                                  <span>Passport: {student.visaProfile?.passportStatus || 'Not set'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right side - Actions */}
                            <div className="flex flex-col gap-2">
                              <Button 
                                size="sm" 
                                className="bg-[#2A73E8] hover:bg-[#1557b0]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudent(student);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visa Type Distribution */}
                <Card className="shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#2A73E8]" />
                      Visa Type Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(visaTypeDistribution).map(([type, count]) => (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700">{type}</span>
                            <span className="text-gray-900">{count} students</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#2A73E8] h-2 rounded-full transition-all"
                              style={{ width: `${(count / students.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* SEVIS Status Distribution */}
                <Card className="shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#2A73E8]" />
                      SEVIS Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(sevisStatusDistribution).map(([status, count]) => (
                        <div key={status}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700">{status}</span>
                            <span className="text-gray-900">{count} students</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${(count / students.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Distribution */}
                <Card className="shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#2A73E8]" />
                      Compliance Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(complianceDistribution).map(([compliance, count]) => (
                        <div key={compliance}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700">{compliance}</span>
                            <span className="text-gray-900">{count} students</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                compliance === 'compliant' ? 'bg-green-500' : 
                                compliance === 'non-compliant' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${(count / students.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Passport Status Distribution */}
                <Card className="shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#2A73E8]" />
                      Passport Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(passportStatusDistribution).map(([status, count]) => (
                        <div key={status}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-700">{status}</span>
                            <span className="text-gray-900">{count} students</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                status === 'Valid' ? 'bg-green-500' : 
                                status === 'Expired' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${(count / students.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Statistics */}
                <Card className="shadow-sm border-0 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#2A73E8]" />
                      Key Metrics & Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-gray-900 mb-1">{students.length}</div>
                        <p className="text-gray-600">Total Enrolled Students</p>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-900 mb-1">
                          {students.filter(s => s.visaProfile?.compliance === 'compliant').length}
                        </div>
                        <p className="text-gray-600">Compliant Students</p>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-900 mb-1">
                          {students.filter(s => s.visaProfile?.sevisStatus === 'active').length}
                        </div>
                        <p className="text-gray-600">Active SEVIS Records</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}