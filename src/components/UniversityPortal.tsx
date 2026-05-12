import { useState } from 'react';
import { Globe, Mail, Shield, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { UniversityStudentPortal } from './UniversityStudentPortal';
import { UniversityDSOPortal } from './UniversityDSOPortal';

interface UniversityPortalProps {
  onNavigate: (page: string) => void;
}

export function UniversityPortal({ onNavigate }: UniversityPortalProps) {
  const [portalType, setPortalType] = useState<'login' | 'student' | 'dso'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleStudentLogin = () => {
    if (email && password) {
      // Mock validation - check if it's a university email
      if (email.includes('@university.edu')) {
        setPortalType('student');
      } else {
        alert('Please use your university email address');
      }
    } else {
      alert('Please enter your email and password');
    }
  };

  const handleDSOLogin = () => {
    if (email && password) {
      setPortalType('dso');
    } else {
      alert('Please enter your credentials');
    }
  };

  const handleLogout = () => {
    setPortalType('login');
    setEmail('');
    setPassword('');
  };

  if (portalType === 'student') {
    return <UniversityStudentPortal onNavigate={onNavigate} onLogout={handleLogout} />;
  }

  if (portalType === 'dso') {
    return <UniversityDSOPortal onNavigate={onNavigate} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A73E8]/5 via-white to-[#2A73E8]/5">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2A73E8] rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-gray-900">Pathly</span>
            </div>
            
            <Button variant="ghost" onClick={() => onNavigate('landing')}>
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-gray-900 mb-4">University Portal</h1>
            <p className="text-gray-600">
              Access your immigration services through your institution
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Portal Card */}
            <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-[#2A73E8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-[#2A73E8]" />
                </div>
                <CardTitle className="text-gray-900">Student Access</CardTitle>
                <p className="text-gray-600 mt-2">
                  Log in with your university email to manage your visa status and documents
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">University Email</label>
                  <input
                    type="email"
                    placeholder="student@university.edu"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleStudentLogin()}
                  />
                </div>
                <Button 
                  className="w-full bg-[#2A73E8] hover:bg-[#1557b0] py-6"
                  onClick={handleStudentLogin}
                >
                  Student Login
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <div className="text-center pt-2">
                  <a href="#" className="text-[#2A73E8] hover:underline">
                    Forgot password?
                  </a>
                </div>

                {/* Features List */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <p className="text-gray-700 mb-3">Student Portal Features:</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2A73E8]"></div>
                    <span>View SEVIS status & compliance</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2A73E8]"></div>
                    <span>Request new I-20 documents</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2A73E8]"></div>
                    <span>Apply for OPT</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2A73E8]"></div>
                    <span>Upload required documents</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DSO Admin Portal Card */}
            <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-gray-900">DSO Admin Access</CardTitle>
                <p className="text-gray-600 mt-2">
                  Designated School Officials - manage your institution's international students
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Admin Email</label>
                  <input
                    type="email"
                    placeholder="dso@university.edu"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleDSOLogin()}
                  />
                </div>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 py-6"
                  onClick={handleDSOLogin}
                >
                  DSO Login
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <div className="text-center pt-2">
                  <a href="#" className="text-purple-600 hover:underline">
                    Request DSO access
                  </a>
                </div>

                {/* Features List */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <p className="text-gray-700 mb-3">DSO Portal Features:</p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                    <span>Manage student SEVIS status</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                    <span>Update compliance records</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                    <span>Process I-20 & OPT requests</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                    <span>Request student documents</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                    <span>Send bulk reminder emails</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <Card className="mt-8 shadow-sm border-0 bg-[#2A73E8]/5">
            <CardContent className="p-8 text-center">
              <h3 className="text-gray-900 mb-3">Don't have a university portal account?</h3>
              <p className="text-gray-600 mb-6">
                If you're an independent student or your university isn't partnered with Pathly yet, 
                you can still use our free individual platform.
              </p>
              <Button variant="outline" className="border-[#2A73E8] text-[#2A73E8]" onClick={() => onNavigate('dashboard')}>
                Use Free Individual Platform
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
