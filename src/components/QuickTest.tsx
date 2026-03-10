import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Copy, CheckCircle2, Loader2, User, Shield } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface QuickTestProps {
  onNavigate: (page: string) => void;
}

export function QuickTest({ onNavigate }: QuickTestProps) {
  const [loading, setLoading] = useState(false);
  const [testAccounts, setTestAccounts] = useState<any>(null);
  const [copied, setCopied] = useState('');

  const createTestAccounts = async () => {
    setLoading(true);
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const universityId = 'stanford';

    const studentCreds = {
      email: `student-${timestamp}@stanford.edu`,
      password: 'TestStudent123!',
      name: `Test Student #${randomNum}`,
      universityId
    };

    const dsoCreds = {
      email: `dso-${timestamp}@stanford.edu`,
      password: 'TestDSO123!',
      name: `Test DSO Admin #${randomNum}`,
      universityId
    };

    try {
      // Create student account
      const studentResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/auth/signup/student`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(studentCreds)
        }
      );
      const studentResult = await studentResponse.json();

      // Create DSO account
      const dsoResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/auth/signup/dso`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(dsoCreds)
        }
      );
      const dsoResult = await dsoResponse.json();

      if (studentResult.success && dsoResult.success) {
        setTestAccounts({
          student: { ...studentCreds, userId: studentResult.userId },
          dso: { ...dsoCreds, userId: dsoResult.userId }
        });
      } else {
        alert('Failed to create test accounts. Check console for errors.');
        console.error('Student result:', studentResult);
        console.error('DSO result:', dsoResult);
      }
    } catch (error) {
      console.error('Error creating test accounts:', error);
      alert('Error creating test accounts. Check console.');
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string, type: string) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(type);
          setTimeout(() => setCopied(''), 2000);
        })
        .catch(() => {
          // Fallback to older method
          fallbackCopy(text, type);
        });
    } else {
      // Use fallback method
      fallbackCopy(text, type);
    }
  };

  const fallbackCopy = (text: string, type: string) => {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Copy failed. Please copy manually: ' + text);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Quick Test Setup</h1>
            <p className="text-gray-600">Create test accounts and log in to test the integration</p>
          </div>
          <Button variant="outline" onClick={() => onNavigate('landing')}>
            ← Back
          </Button>
        </div>

        {/* Instructions */}
        <Alert className="mb-6">
          <AlertDescription>
            <strong>How to test:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Click "Create Test Accounts" below</li>
              <li>Copy the credentials for Student or DSO</li>
              <li>Click the login button to go to the auth page</li>
              <li>Paste the credentials and log in</li>
              <li>Test submitting requests, updating SEVIS, etc.</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Create Accounts */}
        {!testAccounts ? (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Create Test Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={createTestAccounts}
                disabled={loading}
                className="bg-[#2A73E8] hover:bg-[#1557b0] w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Accounts...
                  </>
                ) : (
                  'Create Test Accounts'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Student Account */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#2A73E8]" />
                  Student Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">
                      {testAccounts.student.email}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(testAccounts.student.email, 'student-email')}
                    >
                      {copied === 'student-email' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Password</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">
                      {testAccounts.student.password}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(testAccounts.student.password, 'student-password')}
                    >
                      {copied === 'student-password' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">User ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm text-xs">
                      {testAccounts.student.userId}
                    </code>
                  </div>
                </div>

                <Button
                  onClick={() => onNavigate('student-auth')}
                  className="w-full bg-[#2A73E8] hover:bg-[#1557b0]"
                >
                  → Log In as Student
                </Button>
              </CardContent>
            </Card>

            {/* DSO Account */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  DSO Admin Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">
                      {testAccounts.dso.email}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(testAccounts.dso.email, 'dso-email')}
                    >
                      {copied === 'dso-email' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Password</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">
                      {testAccounts.dso.password}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(testAccounts.dso.password, 'dso-password')}
                    >
                      {copied === 'dso-password' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">User ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm text-xs">
                      {testAccounts.dso.userId}
                    </code>
                  </div>
                </div>

                <Button
                  onClick={() => onNavigate('dso-auth')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  → Log In as DSO
                </Button>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Alert>
              <AlertDescription>
                <strong>✅ Accounts Created!</strong>
                <div className="mt-2 space-y-2 text-sm">
                  <p><strong>To test Student → DSO flow:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Log in as Student and submit an I-20 request</li>
                    <li>Log out and log in as DSO</li>
                    <li>Check if the request appears in DSO's queue</li>
                  </ol>
                  
                  <p className="mt-3"><strong>To test DSO → Student flow:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Log in as DSO and update the student's SEVIS status</li>
                    <li>Log out and log in as Student</li>
                    <li>Check if the SEVIS status is updated on the dashboard</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => {
                setTestAccounts(null);
                createTestAccounts();
              }}
              variant="outline"
              className="w-full"
            >
              Create New Test Accounts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}