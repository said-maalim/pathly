import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CheckCircle2, XCircle, Loader2, Users, FileText, Shield } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';

interface IntegrationTestProps {
  onBack: () => void;
}

// Create client singleton outside component
const supabase = createClient();

export function IntegrationTest({ onBack }: IntegrationTestProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [studentToken, setStudentToken] = useState('');
  const [dsoToken, setDsoToken] = useState('');
  const [studentId, setStudentId] = useState('');
  const [universityId] = useState('stanford');

  const addResult = (message: string, success: boolean, data?: any) => {
    setResults(prev => [...prev, { message, success, data, timestamp: new Date().toISOString() }]);
  };

  const makeRequest = async (endpoint: string, options: any = {}, token?: string) => {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-268175b3${endpoint}`,
      { ...options, headers }
    );

    return response.json();
  };

  // Test 1: Create DSO Account
  const testCreateDSO = async () => {
    setLoading(true);
    try {
      const dsoData = {
        email: `dso-test-${Date.now()}@stanford.edu`,
        password: 'TestPassword123!',
        name: 'Test DSO Admin',
        universityId: universityId
      };

      addResult('Creating DSO account...', true);
      const signupResult = await makeRequest('/auth/signup/dso', {
        method: 'POST',
        body: JSON.stringify(dsoData)
      });

      if (signupResult.success) {
        addResult('✓ DSO account created successfully', true, signupResult);
        
        // Sign in to get token
        const { data, error } = await supabase.auth.signInWithPassword({
          email: dsoData.email,
          password: dsoData.password
        });

        if (data.session) {
          setDsoToken(data.session.access_token);
          addResult('✓ DSO signed in, token acquired', true);
        } else {
          addResult('✗ Failed to sign in DSO', false, error);
        }
      } else {
        addResult('✗ Failed to create DSO account', false, signupResult);
      }
    } catch (error: any) {
      addResult('✗ Error creating DSO', false, error.message);
    }
    setLoading(false);
  };

  // Test 2: Create Student Account
  const testCreateStudent = async () => {
    setLoading(true);
    try {
      const studentData = {
        email: `student-test-${Date.now()}@stanford.edu`,
        password: 'StudentPass123!',
        name: 'Test Student',
        universityId: universityId
      };

      addResult('Creating student account...', true);
      const signupResult = await makeRequest('/auth/signup/student', {
        method: 'POST',
        body: JSON.stringify(studentData)
      });

      if (signupResult.success) {
        addResult('✓ Student account created successfully', true, signupResult);
        setStudentId(signupResult.userId);
        
        // Sign in to get token
        const { data, error } = await supabase.auth.signInWithPassword({
          email: studentData.email,
          password: studentData.password
        });

        if (data.session) {
          setStudentToken(data.session.access_token);
          addResult('✓ Student signed in, token acquired', true);
        } else {
          addResult('✗ Failed to sign in student', false, error);
        }
      } else {
        addResult('✗ Failed to create student account', false, signupResult);
      }
    } catch (error: any) {
      addResult('✗ Error creating student', false, error.message);
    }
    setLoading(false);
  };

  // Test 3: Student submits request
  const testSubmitRequest = async () => {
    if (!studentToken) {
      addResult('✗ Please create and sign in as student first', false);
      return;
    }

    setLoading(true);
    try {
      addResult('Student submitting I-20 request...', true);
      const requestData = {
        requestType: 'i20',
        reason: 'Initial I-20 for Fall 2024 admission'
      };

      const result = await makeRequest('/requests/submit', {
        method: 'POST',
        body: JSON.stringify(requestData)
      }, studentToken);

      if (result.success) {
        addResult('✓ Student request submitted successfully', true, result);
      } else {
        addResult('✗ Failed to submit request', false, result);
      }
    } catch (error: any) {
      addResult('✗ Error submitting request', false, error.message);
    }
    setLoading(false);
  };

  // Test 4: DSO views students
  const testDSOViewStudents = async () => {
    if (!dsoToken) {
      addResult('✗ Please create and sign in as DSO first', false);
      return;
    }

    setLoading(true);
    try {
      addResult('DSO fetching all students...', true);
      const result = await makeRequest(`/dso/students/${universityId}`, {
        method: 'GET'
      }, dsoToken);

      if (result.students) {
        addResult(`✓ DSO retrieved ${result.students.length} student(s)`, true, result);
      } else {
        addResult('✗ Failed to fetch students', false, result);
      }
    } catch (error: any) {
      addResult('✗ Error fetching students', false, error.message);
    }
    setLoading(false);
  };

  // Test 5: DSO views requests
  const testDSOViewRequests = async () => {
    if (!dsoToken) {
      addResult('✗ Please create and sign in as DSO first', false);
      return;
    }

    setLoading(true);
    try {
      addResult('DSO fetching pending requests...', true);
      const result = await makeRequest(`/requests/university/${universityId}`, {
        method: 'GET'
      }, dsoToken);

      if (result.requests) {
        addResult(`✓ DSO retrieved ${result.requests.length} pending request(s)`, true, result);
      } else {
        addResult('✗ Failed to fetch requests', false, result);
      }
    } catch (error: any) {
      addResult('✗ Error fetching requests', false, error.message);
    }
    setLoading(false);
  };

  // Test 6: DSO updates SEVIS status
  const testUpdateSEVIS = async () => {
    if (!dsoToken || !studentId) {
      addResult('✗ Please create DSO and Student first', false);
      return;
    }

    setLoading(true);
    try {
      addResult('DSO updating student SEVIS status...', true);
      const sevisData = {
        sevisStatus: 'Active',
        compliance: 'Compliant',
        nextCheckDate: '2024-06-01',
        notes: 'All documents verified'
      };

      const result = await makeRequest(`/dso/sevis/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(sevisData)
      }, dsoToken);

      if (result.success) {
        addResult('✓ SEVIS status updated by DSO', true, result);
      } else {
        addResult('✗ Failed to update SEVIS', false, result);
      }
    } catch (error: any) {
      addResult('✗ Error updating SEVIS', false, error.message);
    }
    setLoading(false);
  };

  // Test 7: Student views updated SEVIS
  const testStudentViewSEVIS = async () => {
    if (!studentToken) {
      addResult('✗ Please create and sign in as student first', false);
      return;
    }

    setLoading(true);
    try {
      addResult('Student fetching visa profile...', true);
      const result = await makeRequest('/visa/profile', {
        method: 'GET'
      }, studentToken);

      if (result.visaProfile) {
        addResult('✓ Student retrieved visa profile with SEVIS status', true, result);
      } else {
        addResult('✗ Failed to fetch visa profile', false, result);
      }
    } catch (error: any) {
      addResult('✗ Error fetching visa profile', false, error.message);
    }
    setLoading(false);
  };

  // Run all tests
  const runAllTests = async () => {
    setResults([]);
    addResult('🚀 Starting end-to-end integration test...', true);
    
    await testCreateDSO();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCreateStudent();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testDSOViewStudents();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testSubmitRequest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testDSOViewRequests();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testUpdateSEVIS();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testStudentViewSEVIS();
    
    addResult('✅ Integration test complete!', true);
  };

  const clearResults = () => {
    setResults([]);
    setStudentToken('');
    setDsoToken('');
    setStudentId('');
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Integration Testing Dashboard</h1>
            <p className="text-gray-600">End-to-end testing for DSO ↔ Student synchronization</p>
          </div>
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Status Cards */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2A73E8]" />
                DSO Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600">
                {dsoToken ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Authenticated
                  </span>
                ) : (
                  <span className="text-gray-400">Not authenticated</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2A73E8]" />
                Student Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600">
                {studentToken ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Authenticated
                  </span>
                ) : (
                  <span className="text-gray-400">Not authenticated</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#2A73E8]" />
                Tests Run
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600">
                {results.length} operations
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual">Individual Tests</TabsTrigger>
                <TabsTrigger value="full">Full Test Suite</TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={testCreateDSO} 
                    disabled={loading}
                    className="bg-[#2A73E8] hover:bg-[#1557b0]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    1. Create DSO
                  </Button>

                  <Button 
                    onClick={testCreateStudent} 
                    disabled={loading}
                    className="bg-[#2A73E8] hover:bg-[#1557b0]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    2. Create Student
                  </Button>

                  <Button 
                    onClick={testDSOViewStudents} 
                    disabled={loading || !dsoToken}
                    variant="outline"
                    className="border-[#2A73E8] text-[#2A73E8]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    3. DSO View Students
                  </Button>

                  <Button 
                    onClick={testSubmitRequest} 
                    disabled={loading || !studentToken}
                    variant="outline"
                    className="border-[#2A73E8] text-[#2A73E8]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    4. Student Submit Request
                  </Button>

                  <Button 
                    onClick={testDSOViewRequests} 
                    disabled={loading || !dsoToken}
                    variant="outline"
                    className="border-[#2A73E8] text-[#2A73E8]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    5. DSO View Requests
                  </Button>

                  <Button 
                    onClick={testUpdateSEVIS} 
                    disabled={loading || !dsoToken || !studentId}
                    variant="outline"
                    className="border-[#2A73E8] text-[#2A73E8]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    6. DSO Update SEVIS
                  </Button>

                  <Button 
                    onClick={testStudentViewSEVIS} 
                    disabled={loading || !studentToken}
                    variant="outline"
                    className="border-[#2A73E8] text-[#2A73E8]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    7. Student View SEVIS
                  </Button>

                  <Button 
                    onClick={clearResults}
                    variant="outline"
                    disabled={loading}
                  >
                    Clear Results
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="full" className="space-y-4 mt-4">
                <Alert>
                  <AlertDescription>
                    This will run all tests in sequence: Create DSO → Create Student → DSO Views Students → Student Submits Request → DSO Views Request → DSO Updates SEVIS → Student Views SEVIS
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button 
                    onClick={runAllTests} 
                    disabled={loading}
                    className="bg-[#2A73E8] hover:bg-[#1557b0] flex-1"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Run Full Integration Test
                  </Button>
                  
                  <Button 
                    onClick={clearResults}
                    variant="outline"
                    disabled={loading}
                  >
                    Clear Results
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Results Log */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Results Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No tests run yet. Click a test button above to start.
                </p>
              ) : (
                results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                          {result.message}
                        </p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}