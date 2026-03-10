import { useState } from 'react';
import {
  User,
  FileText,
  Bell,
  Shield,
  Building2,
  Settings as SettingsIcon,
  Database,
  LogOut,
  ArrowLeft,
  Save,
  AlertTriangle,
  Check,
  Globe,
  Calendar,
  Mail,
  Phone,
  Download,
  Trash2,
  Monitor,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
}

type SettingsSection = 
  | 'profile' 
  | 'immigration' 
  | 'notifications' 
  | 'security' 
  | 'university' 
  | 'preferences' 
  | 'data';

export function SettingsPage({ onBack, onLogout }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [showPassword, setShowPassword] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: 'Sarah Chen',
    preferredName: 'Sarah',
    email: 'sarah.chen@university.edu',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1998-05-15',
    countryCitizenship: 'China',
    countryBirth: 'China'
  });

  // Immigration state
  const [immigrationData, setImmigrationData] = useState({
    visaType: 'F-1',
    sevisId: 'N0012345678',
    degreeLevel: 'Masters',
    major: 'Computer Science',
    yearOfStudy: '2nd Year',
    academicStatus: 'Active',
    expectedGraduation: '2026-05-15',
    campus: 'Main Campus'
  });

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState({
    complianceDeadlines: true,
    travelSignature: true,
    optCptReminders: true,
    documentExpiring: true,
    sevisChanges: true,
    dsoMessages: true
  });

  const [browserNotifications, setBrowserNotifications] = useState({
    deadlineReminders: true,
    documentUploaded: true,
    requestUpdates: true
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    timeZone: 'America/New_York',
    language: 'English',
    dateFormat: 'MM/DD/YYYY'
  });

  const menuItems = [
    { id: 'profile' as SettingsSection, label: 'Profile', icon: User },
    { id: 'immigration' as SettingsSection, label: 'Immigration & Student Info', icon: FileText },
    { id: 'notifications' as SettingsSection, label: 'Notifications', icon: Bell },
    { id: 'security' as SettingsSection, label: 'Security', icon: Shield },
    { id: 'university' as SettingsSection, label: 'University Info', icon: Building2 },
    { id: 'preferences' as SettingsSection, label: 'Preferences', icon: SettingsIcon },
    { id: 'data' as SettingsSection, label: 'Data & Documents', icon: Database }
  ];

  const activeSessions = [
    { id: 1, device: 'Chrome on MacBook Pro', location: 'Boston, MA', lastActive: '5 minutes ago', current: true },
    { id: 2, device: 'Safari on iPhone', location: 'Boston, MA', lastActive: '2 hours ago', current: false }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-gray-900 mb-2">Profile Information</h2>
              <p className="text-gray-600">Update your personal information and contact details.</p>
            </div>

            <Card className="shadow-sm border-0">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Preferred Name</label>
                    <input
                      type="text"
                      value={profileData.preferredName}
                      onChange={(e) => setProfileData({ ...profileData, preferredName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Email (University)</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">
                        Locked
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Country of Citizenship *</label>
                    <input
                      type="text"
                      value={profileData.countryCitizenship}
                      onChange={(e) => setProfileData({ ...profileData, countryCitizenship: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Country of Birth *</label>
                    <input
                      type="text"
                      value={profileData.countryBirth}
                      onChange={(e) => setProfileData({ ...profileData, countryBirth: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline">
                    Request Email Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'immigration':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-gray-900 mb-2">Immigration & Student Information</h2>
              <p className="text-gray-600">Manage your visa and academic status details.</p>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Some fields require DSO approval. You may submit a review request for changes.
              </AlertDescription>
            </Alert>

            <Card className="shadow-sm border-0">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Visa Type</label>
                    <div className="relative">
                      <select
                        value={immigrationData.visaType}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed appearance-none"
                      >
                        <option>F-1</option>
                        <option>J-1</option>
                        <option>M-1</option>
                        <option>Other</option>
                      </select>
                      <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">
                        Locked
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">SEVIS ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={immigrationData.sevisId}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <Badge className="absolute right-2 top-2 bg-gray-200 text-gray-700 hover:bg-gray-200">
                        Locked
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Degree Level</label>
                    <select
                      value={immigrationData.degreeLevel}
                      onChange={(e) => setImmigrationData({ ...immigrationData, degreeLevel: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    >
                      <option>Bachelors</option>
                      <option>Masters</option>
                      <option>PhD</option>
                      <option>Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Major</label>
                    <input
                      type="text"
                      value={immigrationData.major}
                      onChange={(e) => setImmigrationData({ ...immigrationData, major: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Year of Study</label>
                    <select
                      value={immigrationData.yearOfStudy}
                      onChange={(e) => setImmigrationData({ ...immigrationData, yearOfStudy: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                      <option>5th Year+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Academic Status</label>
                    <select
                      value={immigrationData.academicStatus}
                      onChange={(e) => setImmigrationData({ ...immigrationData, academicStatus: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    >
                      <option>Active</option>
                      <option>OPT</option>
                      <option>STEM OPT</option>
                      <option>Completed</option>
                      <option>Transferred</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Expected Graduation Date</label>
                    <input
                      type="date"
                      value={immigrationData.expectedGraduation}
                      onChange={(e) => setImmigrationData({ ...immigrationData, expectedGraduation: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Campus / School</label>
                    <input
                      type="text"
                      value={immigrationData.campus}
                      onChange={(e) => setImmigrationData({ ...immigrationData, campus: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">
                    Request Profile Update Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-gray-900 mb-2">Notification Preferences</h2>
              <p className="text-gray-600">Manage how you receive updates and alerts.</p>
            </div>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  complianceDeadlines: 'Upcoming compliance deadlines',
                  travelSignature: 'I-20 travel signature expiring',
                  optCptReminders: 'OPT/CPT reminders',
                  documentExpiring: 'Document expiring',
                  sevisChanges: 'SEVIS status changes',
                  dsoMessages: 'Messages from DSO office'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications[key as keyof typeof emailNotifications]}
                        onChange={(e) => setEmailNotifications({
                          ...emailNotifications,
                          [key]: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A73E8]"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Browser Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  deadlineReminders: 'Deadline reminders',
                  documentUploaded: 'New document uploaded by DSO',
                  requestUpdates: 'Request status updates'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={browserNotifications[key as keyof typeof browserNotifications]}
                        onChange={(e) => setBrowserNotifications({
                          ...browserNotifications,
                          [key]: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A73E8]"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-gray-900 mb-2">Security Settings</h2>
              <p className="text-gray-600">Manage your account security and authentication.</p>
            </div>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    placeholder="Confirm new password"
                  />
                </div>
                <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-gray-900 mb-1">Enable 2FA</p>
                    <p className="text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline">
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeSessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900">{session.device}</p>
                          {session.current && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600">{session.location} • {session.lastActive}</p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="text-gray-900 mb-1">Delete Account</p>
                    <p className="text-gray-600">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'university':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-gray-900 mb-2">University Information</h2>
              <p className="text-gray-600">View your university and DSO office details.</p>
            </div>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  University Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">University Name</p>
                    <p className="text-gray-900">Boston University</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">Campus / School Code</p>
                    <p className="text-gray-900">BOS-001</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>DSO Office Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">DSO Office Name</p>
                    <p className="text-gray-900">International Students & Scholars Office</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">Office Hours</p>
                    <p className="text-gray-900">Mon-Fri, 9:00 AM - 5:00 PM</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">DSO Contact</p>
                    <p className="text-gray-900">Dr. Michael Johnson</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">Email</p>
                    <p className="text-gray-900">isso@university.edu</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-1">Phone</p>
                    <p className="text-gray-900">+1 (617) 555-0100</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Button variant="outline">
                    Re-Verify University Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-gray-900 mb-2">Preferences</h2>
              <p className="text-gray-600">Customize your application experience.</p>
            </div>

            <Card className="shadow-sm border-0">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Time Zone
                    </label>
                    <select
                      value={preferences.timeZone}
                      onChange={(e) => setPreferences({ ...preferences, timeZone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Phoenix">Arizona Time</option>
                      <option value="America/Anchorage">Alaska Time</option>
                      <option value="Pacific/Honolulu">Hawaii Time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    >
                      <option>English</option>
                      <option>中文 (Chinese)</option>
                      <option>हिन्दी (Hindi)</option>
                      <option>العربية (Arabic)</option>
                      <option>Español (Spanish)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Date Format
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    >
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                  <Button className="bg-[#2A73E8] hover:bg-[#1557b0]">
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-gray-900 mb-2">Data & Document Controls</h2>
              <p className="text-gray-600">Manage your data, documents, and privacy settings.</p>
            </div>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-gray-900">Download All Documents</p>
                      <p className="text-gray-600">Export all your documents as a ZIP file</p>
                    </div>
                  </div>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download ZIP
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-1">Share Documents with DSO</p>
                    <p className="text-gray-600">Automatically share uploaded documents with your DSO office</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A73E8]"></div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>System & Cache</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-gray-900">Clear Local Cache</p>
                      <p className="text-gray-600">Remove temporary files and cached data</p>
                    </div>
                  </div>
                  <Button variant="outline">
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 mb-2">Privacy Policy</p>
                  <p className="text-gray-600 mb-3">
                    Learn about how we collect, use, and protect your data.
                  </p>
                  <a href="#" className="text-[#2A73E8] hover:underline">
                    View Privacy Policy →
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-gray-900">Settings</h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm border-0 sticky top-6">
              <CardContent className="p-4 space-y-1">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                        activeSection === item.id
                          ? 'bg-[#2A73E8]/10 text-[#2A73E8]'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
