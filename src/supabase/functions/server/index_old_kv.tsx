import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase clients
const getSupabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const getSupabaseClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to verify user authentication
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) {
    return { error: 'Missing authorization header', user: null };
  }
  
  const token = authHeader.split(' ')[1];
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { error: 'Unauthorized', user: null };
  }
  
  return { error: null, user };
}

// Initialize storage buckets on startup
async function initializeStorage() {
  const supabase = getSupabaseAdmin();
  const bucketName = 'make-268175b3-documents';
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      console.log(`Created storage bucket: ${bucketName}`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Initialize storage on startup
initializeStorage();

// Health check endpoint
app.get("/make-server-268175b3/health", (c) => {
  return c.json({ status: "ok" });
});

// Utility endpoint to clean up test data (for development only)
app.delete("/make-server-268175b3/utils/cleanup-test-requests/:universityId", async (c) => {
  try {
    const universityId = c.req.param('universityId');
    
    // Get all request actions for this university
    const allRequestActions = await kv.getByPrefix(`requestaction:${universityId}:`);
    
    console.log(`[Cleanup] Found ${allRequestActions.length} request actions for ${universityId}`);
    
    // Delete all request actions and their responses
    let deletedCount = 0;
    for (const requestAction of allRequestActions) {
      // Delete all responses
      const responses = await kv.getByPrefix(`response:${requestAction.id}:`);
      for (const response of responses) {
        await kv.del(response.id);
      }
      
      // Delete the request action
      await kv.del(requestAction.id);
      deletedCount++;
      console.log(`[Cleanup] Deleted request action: ${requestAction.id}`);
    }
    
    return c.json({ 
      success: true,
      message: `Cleaned up ${deletedCount} test request actions`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up test requests:', error);
    return c.json({ error: 'Failed to cleanup: ' + error.message }, 500);
  }
});

// ==================== AUTHENTICATION ROUTES ====================

// Sign up for regular users
app.post("/make-server-268175b3/auth/signup", async (c) => {
  try {
    const { email, password, name, userType } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }
    
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        userType: userType || 'regular', // 'regular', 'student', or 'dso'
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });
    
    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Create user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      userType: userType || 'regular',
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ 
      success: true, 
      userId: data.user.id,
      message: 'Account created successfully' 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

// Sign up for university students
app.post("/make-server-268175b3/auth/signup/student", async (c) => {
  try {
    const { email, password, name, universityId } = await c.req.json();
    
    if (!email || !password || !name || !universityId) {
      return c.json({ error: 'Email, password, name, and university ID are required' }, 400);
    }
    
    // Validate university email domain
    if (!email.includes('@university.edu') && !email.includes('.edu')) {
      return c.json({ error: 'Please use your university email address' }, 400);
    }
    
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        userType: 'student',
        universityId,
      },
      email_confirm: true,
    });
    
    if (error) {
      console.error('Student signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Create student profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      userType: 'student',
      universityId,
      createdAt: new Date().toISOString(),
    });
    
    // Create empty visa profile
    await kv.set(`visa:${data.user.id}`, {
      userId: data.user.id,
      visaType: null,
      status: 'pending',
      sevisStatus: null,
      compliance: null,
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ 
      success: true, 
      userId: data.user.id,
      message: 'Student account created successfully' 
    });
  } catch (error) {
    console.error('Student signup error:', error);
    return c.json({ error: 'Failed to create student account' }, 500);
  }
});

// Sign up for DSO admins
app.post("/make-server-268175b3/auth/signup/dso", async (c) => {
  try {
    const { email, password, name, universityId } = await c.req.json();
    
    if (!email || !password || !name || !universityId) {
      return c.json({ error: 'All fields are required' }, 400);
    }
    
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        userType: 'dso',
        universityId,
      },
      email_confirm: true,
    });
    
    if (error) {
      console.error('DSO signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Create DSO profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      userType: 'dso',
      universityId,
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ 
      success: true, 
      userId: data.user.id,
      message: 'DSO account created successfully' 
    });
  } catch (error) {
    console.error('DSO signup error:', error);
    return c.json({ error: 'Failed to create DSO account' }, 500);
  }
});

// ==================== USER PROFILE ROUTES ====================

// Get current user profile
app.get("/make-server-268175b3/user/profile", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const profile = await kv.get(`user:${user.id}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    return c.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user profile
app.put("/make-server-268175b3/user/profile", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const updates = await c.req.json();
    const currentProfile = await kv.get(`user:${user.id}`);
    
    if (!currentProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    const updatedProfile = { ...currentProfile, ...updates, id: user.id };
    await kv.set(`user:${user.id}`, updatedProfile);
    
    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ==================== VISA PROFILE ROUTES ====================

// Get visa profile
app.get("/make-server-268175b3/visa/profile", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const visaProfile = await kv.get(`visa:${user.id}`);
    
    if (!visaProfile) {
      // Create empty visa profile if it doesn't exist
      const newProfile = {
        userId: user.id,
        visaType: null,
        status: 'pending',
        expirationDate: null,
        sevisStatus: null,
        compliance: null,
        createdAt: new Date().toISOString(),
      };
      await kv.set(`visa:${user.id}`, newProfile);
      return c.json({ visaProfile: newProfile });
    }
    
    return c.json({ visaProfile });
  } catch (error) {
    console.error('Error fetching visa profile:', error);
    return c.json({ error: 'Failed to fetch visa profile' }, 500);
  }
});

// Update visa profile
app.put("/make-server-268175b3/visa/profile", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const updates = await c.req.json();
    const currentProfile = await kv.get(`visa:${user.id}`) || {};
    
    const updatedProfile = { 
      ...currentProfile, 
      ...updates, 
      userId: user.id,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`visa:${user.id}`, updatedProfile);
    
    return c.json({ success: true, visaProfile: updatedProfile });
  } catch (error) {
    console.error('Error updating visa profile:', error);
    return c.json({ error: 'Failed to update visa profile' }, 500);
  }
});

// ==================== DOCUMENT ROUTES (OLD - DEPRECATED) ====================
// Note: Old document upload route removed to avoid conflicts with new document management system
// Get user's documents
app.get("/make-server-268175b3/documents", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userDocsKey = `docs:user:${user.id}`;
    const docIds = await kv.get(userDocsKey) || [];
    
    const documents = [];
    for (const docId of docIds) {
      const doc = await kv.get(docId);
      if (doc) {
        documents.push(doc);
      }
    }
    
    return c.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

// Get document download URL
app.get("/make-server-268175b3/documents/:documentId/download", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const documentId = c.req.param('documentId');
    const document = await kv.get(documentId);
    
    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }
    
    // Verify user owns the document or is DSO
    const userProfile = await kv.get(`user:${user.id}`);
    if (document.userId !== user.id && userProfile?.userType !== 'dso') {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from('make-268175b3-documents')
      .createSignedUrl(document.storagePath, 3600); // 1 hour
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return c.json({ error: 'Failed to generate download URL' }, 500);
    }
    
    return c.json({ url: data.signedUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return c.json({ error: 'Failed to generate download URL' }, 500);
  }
});

// ==================== STUDENT REQUEST ROUTES ====================

// Submit I-20 or OPT request
app.post("/make-server-268175b3/requests/submit", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const { requestType, requestName, reason, formData, uploadedFiles } = await c.req.json();
    
    if (!requestType) {
      return c.json({ error: 'Request type is required' }, 400);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    console.log('User profile for request submission:', { userId: user.id, userProfile });
    
    if (!userProfile) {
      return c.json({ error: 'User profile not found. Please sign up through the student portal.' }, 403);
    }
    
    if (userProfile?.userType !== 'student') {
      return c.json({ 
        error: `Only students can submit requests. Your account type is: ${userProfile?.userType || 'unknown'}. Please sign up as a student if you need to submit requests.` 
      }, 403);
    }
    
    const requestId = `request:${user.id}:${Date.now()}`;
    const request = {
      id: requestId,
      userId: user.id,
      userName: user.user_metadata?.name || 'Unknown Student',
      userEmail: user.email,
      universityId: userProfile.universityId || 'university-001',
      requestType, // e.g., 'cpt', 'opt', 'travel', etc.
      requestName: requestName || requestType,
      reason: reason || '',
      formData: formData || {},
      uploadedFiles: uploadedFiles || [],
      status: 'pending',
      priority: 'Normal',
      submittedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    };
    
    await kv.set(requestId, request);
    
    // Add to university's pending requests
    const universityRequestsKey = `requests:university:${request.universityId}`;
    const universityRequests = await kv.get(universityRequestsKey) || [];
    universityRequests.push(requestId);
    await kv.set(universityRequestsKey, universityRequests);
    
    console.log('Request submitted successfully:', requestId);
    
    return c.json({ success: true, request });
  } catch (error) {
    console.error('Error submitting request:', error);
    return c.json({ error: 'Failed to submit request', details: error.message }, 500);
  }
});

// Get pending requests for DSO
app.get("/make-server-268175b3/requests/university/:universityId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    console.log('User profile for fetching university requests:', { userId: user.id, userProfile });
    
    if (!userProfile) {
      return c.json({ error: 'User profile not found. Please sign up through the DSO portal.' }, 403);
    }
    
    if (userProfile?.userType !== 'dso') {
      return c.json({ 
        error: `Only DSO admins can view requests. Your account type is: ${userProfile?.userType || 'unknown'}. Please sign up as a DSO admin if you need to view and manage requests.` 
      }, 403);
    }
    
    const universityId = c.req.param('universityId');
    const universityRequestsKey = `requests:university:${universityId}`;
    const requestIds = await kv.get(universityRequestsKey) || [];
    
    const requests = [];
    for (const requestId of requestIds) {
      const request = await kv.get(requestId);
      if (request) {
        // Get student name from stored data or fetch from user profile
        if (!request.userName) {
          const student = await kv.get(`user:${request.userId}`);
          request.userName = student?.name || 'Unknown Student';
          request.userEmail = student?.email || request.userEmail;
        }
        requests.push(request);
      }
    }
    
    return c.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return c.json({ error: 'Failed to fetch requests' }, 500);
  }
});

// Update request status (approve/deny)
app.put("/make-server-268175b3/requests/:requestId/status", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can update requests' }, 403);
    }
    
    const requestId = c.req.param('requestId');
    const { status, notes } = await c.req.json();
    
    const request = await kv.get(requestId);
    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }
    
    request.status = status;
    request.notes = notes;
    request.processedAt = new Date().toISOString();
    request.processedBy = user.id;
    
    await kv.set(requestId, request);
    
    return c.json({ success: true, request });
  } catch (error) {
    console.error('Error updating request:', error);
    return c.json({ error: 'Failed to update request' }, 500);
  }
});

// ==================== DSO DOCUMENT REQUEST ROUTES ====================

// Create document request
app.post("/make-server-268175b3/dso/document-request", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can request documents' }, 403);
    }
    
    const { studentId, documentType, dueDate, notes } = await c.req.json();
    
    const docRequestId = `docreq:${studentId}:${Date.now()}`;
    const docRequest = {
      id: docRequestId,
      studentId,
      requestedBy: user.id,
      documentType,
      dueDate,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(docRequestId, docRequest);
    
    // Add to student's document requests
    const studentDocReqKey = `docreqs:student:${studentId}`;
    const studentDocReqs = await kv.get(studentDocReqKey) || [];
    studentDocReqs.push(docRequestId);
    await kv.set(studentDocReqKey, studentDocReqs);
    
    return c.json({ success: true, documentRequest: docRequest });
  } catch (error) {
    console.error('Error creating document request:', error);
    return c.json({ error: 'Failed to create document request' }, 500);
  }
});

// Get document requests for student
app.get("/make-server-268175b3/document-requests", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const studentDocReqKey = `docreqs:student:${user.id}`;
    const docReqIds = await kv.get(studentDocReqKey) || [];
    
    const documentRequests = [];
    for (const docReqId of docReqIds) {
      const docReq = await kv.get(docReqId);
      if (docReq && docReq.status === 'pending') {
        documentRequests.push(docReq);
      }
    }
    
    return c.json({ documentRequests });
  } catch (error) {
    console.error('Error fetching document requests:', error);
    return c.json({ error: 'Failed to fetch document requests' }, 500);
  }
});

// ==================== SEVIS STATUS ROUTES ====================

// Get all students for a university (DSO only)
app.get("/make-server-268175b3/dso/students/:universityId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    console.error('Authorization error when fetching students:', authError);
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    console.log('DSO user profile:', userProfile);
    
    if (!userProfile) {
      console.error('User profile not found for user:', user.id);
      return c.json({ error: 'User profile not found. Please contact support.' }, 404);
    }
    
    if (userProfile?.userType !== 'dso') {
      console.error('User is not a DSO admin:', userProfile);
      return c.json({ error: 'Only DSO admins can view students' }, 403);
    }
    
    const universityId = c.req.param('universityId');
    console.log('Fetching students for university:', universityId);
    
    // Get all users with this universityId
    const allUsers = await kv.getByPrefix('user:');
    console.log(`Total users in database: ${allUsers.length}`);
    
    const students = [];
    
    for (const userData of allUsers) {
      if (userData.universityId === universityId && userData.userType === 'student') {
        // Get visa profile for each student
        const visaProfile = await kv.get(`visa:${userData.id}`) || {};
        students.push({
          ...userData,
          visaProfile
        });
      }
    }
    
    console.log(`Found ${students.length} students for university ${universityId}`);
    return c.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return c.json({ error: 'Failed to fetch students: ' + error.message }, 500);
  }
});

// Get student requests (for student dashboard)
app.get("/make-server-268175b3/requests/my-requests", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'student') {
      return c.json({ error: 'Only students can view their requests' }, 403);
    }
    
    // Get all requests for this student
    const allRequests = await kv.getByPrefix(`request:${user.id}:`);
    
    // Sort by submission date (newest first)
    const sortedRequests = allRequests.sort((a, b) => {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    
    return c.json({ requests: sortedRequests });
  } catch (error) {
    console.error('Error fetching student requests:', error);
    return c.json({ error: 'Failed to fetch requests' }, 500);
  }
});

// Get DSO request actions for a student (Student portal)
app.get("/make-server-268175b3/requests/dso-requests", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'student') {
      return c.json({ error: 'Only students can view DSO requests' }, 403);
    }
    
    const studentId = user.id;
    const universityId = userProfile.universityId;
    
    console.log(`[DSO Requests] Fetching for student: ${studentId}, university: ${universityId}`);
    
    // Get all request actions for this university
    const allRequestActions = await kv.getByPrefix(`requestaction:${universityId}:`);
    
    console.log(`[DSO Requests] Found ${allRequestActions.length} total request actions for university`);
    console.log(`[DSO Requests] All request actions:`, JSON.stringify(allRequestActions, null, 2));
    
    // Filter request actions that apply to this student
    const studentRequests = [];
    
    for (const requestAction of allRequestActions) {
      let isForThisStudent = false;
      
      console.log(`[DSO Requests] Checking request ${requestAction.id}:`, {
        sentTo: requestAction.sentTo,
        targetStudent: requestAction.targetStudent,
        currentStudentId: studentId,
        matches: requestAction.targetStudent === studentId
      });
      
      // Check if it's a single student request for this student
      if (requestAction.sentTo === 'Single' && requestAction.targetStudent === studentId) {
        isForThisStudent = true;
        console.log(`[DSO Requests] ✅ Single student match for request ${requestAction.id}`);
      }
      // Check if it's a bulk request (applies to all students or filtered students)
      else if (requestAction.sentTo === 'Bulk') {
        // For bulk requests, check if student matches the filter criteria
        if (requestAction.bulkFilter === 'all') {
          isForThisStudent = true;
          console.log(`[DSO Requests] ✅ Bulk request match (all students) for request ${requestAction.id}`);
        } else {
          // Add more sophisticated filtering logic here based on student's visa type, etc.
          // For now, include all bulk requests
          isForThisStudent = true;
          console.log(`[DSO Requests] ✅ Bulk request match (filtered) for request ${requestAction.id}`);
        }
      }
      
      if (isForThisStudent) {
        // Check if student has responded
        const responseKey = `response:${requestAction.id}:${studentId}`;
        const studentResponse = await kv.get(responseKey);
        
        studentRequests.push({
          id: requestAction.id,
          title: requestAction.title,
          type: requestAction.type,
          deadline: requestAction.deadline,
          instructions: requestAction.instructions,
          documentTitle: requestAction.documentTitle,
          formTemplate: requestAction.formTemplate,
          formFields: requestAction.formFields,
          confirmationStatement: requestAction.confirmationStatement,
          createdAt: requestAction.createdAt,
          hasResponded: !!studentResponse,
          respondedAt: studentResponse?.submittedAt || null,
          status: requestAction.status
        });
      }
    }
    
    console.log(`[DSO Requests] Returning ${studentRequests.length} requests for student`);
    
    // Separate active and completed requests
    const activeRequests = studentRequests.filter(req => !req.hasResponded && req.status === 'active');
    const completedRequests = studentRequests.filter(req => req.hasResponded || req.status === 'completed');
    
    // Return active requests first, then completed
    const sortedRequests = [
      ...activeRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      ...completedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    ];
    
    return c.json({ requests: sortedRequests });
  } catch (error) {
    console.error('Error fetching DSO requests:', error);
    return c.json({ error: 'Failed to fetch DSO requests: ' + error.message }, 500);
  }
});

// Update SEVIS status (DSO only)
app.put("/make-server-268175b3/dso/sevis/:studentId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can update SEVIS status' }, 403);
    }
    
    const studentId = c.req.param('studentId');
    const { sevisStatus, compliance, nextCheckDate, notes } = await c.req.json();
    
    const visaProfile = await kv.get(`visa:${studentId}`) || {};
    visaProfile.sevisStatus = sevisStatus;
    visaProfile.compliance = compliance;
    visaProfile.nextCheckDate = nextCheckDate;
    visaProfile.lastUpdated = new Date().toISOString();
    visaProfile.updatedBy = user.id;
    
    await kv.set(`visa:${studentId}`, visaProfile);
    
    // Log the update
    const logId = `sevis:log:${studentId}:${Date.now()}`;
    await kv.set(logId, {
      studentId,
      sevisStatus,
      compliance,
      notes,
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    });
    
    return c.json({ success: true, visaProfile });
  } catch (error) {
    console.error('Error updating SEVIS status:', error);
    return c.json({ error: 'Failed to update SEVIS status' }, 500);
  }
});

// Update Visa Status (DSO only)
app.put("/make-server-268175b3/dso/visa/:studentId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can update visa status' }, 403);
    }
    
    const studentId = c.req.param('studentId');
    const { visaType, status, expirationDate } = await c.req.json();
    
    const visaProfile = await kv.get(`visa:${studentId}`) || {};
    visaProfile.visaType = visaType;
    visaProfile.status = status;
    visaProfile.expirationDate = expirationDate;
    visaProfile.lastUpdated = new Date().toISOString();
    visaProfile.updatedBy = user.id;
    
    await kv.set(`visa:${studentId}`, visaProfile);
    
    return c.json({ success: true, visaProfile });
  } catch (error) {
    console.error('Error updating visa status:', error);
    return c.json({ error: 'Failed to update visa status' }, 500);
  }
});

// Update Passport Status (DSO only)
app.put("/make-server-268175b3/dso/passport/:studentId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can update passport status' }, 403);
    }
    
    const studentId = c.req.param('studentId');
    const { passportStatus, passportExpirationDate } = await c.req.json();
    
    const visaProfile = await kv.get(`visa:${studentId}`) || {};
    visaProfile.passportStatus = passportStatus;
    visaProfile.passportExpirationDate = passportExpirationDate;
    visaProfile.lastUpdated = new Date().toISOString();
    visaProfile.updatedBy = user.id;
    
    await kv.set(`visa:${studentId}`, visaProfile);
    
    return c.json({ success: true, visaProfile });
  } catch (error) {
    console.error('Error updating passport status:', error);
    return c.json({ error: 'Failed to update passport status' }, 500);
  }
});

// ==================== BULK EMAIL ROUTE ====================

// Send bulk email (DSO only)
app.post("/make-server-268175b3/dso/bulk-email", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can send bulk emails' }, 403);
    }
    
    const { recipientGroup, subject, message } = await c.req.json();
    
    // Log the bulk email (in production, this would trigger actual emails)
    const emailLogId = `email:log:${Date.now()}`;
    await kv.set(emailLogId, {
      sentBy: user.id,
      recipientGroup,
      subject,
      message,
      sentAt: new Date().toISOString(),
    });
    
    return c.json({ 
      success: true, 
      message: 'Bulk email sent successfully',
      // In production, return actual recipient count
      recipientCount: 23 
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return c.json({ error: 'Failed to send bulk email' }, 500);
  }
});

// ==================== DOCUMENT MANAGEMENT ROUTES ====================

// Get all documents for a student
app.get("/make-server-268175b3/documents/student/:studentId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const studentId = c.req.param('studentId');
    
    // Verify user is requesting their own documents
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType === 'student' && user.id !== studentId) {
      return c.json({ error: 'You can only access your own documents' }, 403);
    }
    
    // Get all documents for this student
    const allDocuments = await kv.getByPrefix(`document:${studentId}:`);
    
    return c.json({ documents: allDocuments });
  } catch (error) {
    console.error('Error fetching student documents:', error);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

// Get all documents for a university (DSO only)
app.get("/make-server-268175b3/documents/dso/:universityId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can view all documents' }, 403);
    }
    
    const universityId = c.req.param('universityId');
    
    // Get all students for this university
    const allUsers = await kv.getByPrefix('user:');
    const students = allUsers.filter(userData => 
      userData.universityId === universityId && userData.userType === 'student'
    );
    
    // Get documents for each student
    const allDocuments = [];
    for (const student of students) {
      const studentDocs = await kv.getByPrefix(`document:${student.id}:`);
      // Add student name to each document
      const docsWithStudentName = studentDocs.map(doc => ({
        ...doc,
        studentName: student.name
      }));
      allDocuments.push(...docsWithStudentName);
    }
    
    return c.json({ documents: allDocuments });
  } catch (error) {
    console.error('Error fetching DSO documents:', error);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

// Upload a document (DSO only)
app.post("/make-server-268175b3/documents/upload", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can upload documents' }, 403);
    }
    
    // Parse request body as JSON
    let requestBody;
    try {
      requestBody = await c.req.json();
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return c.json({ error: 'Invalid JSON in request body: ' + parseError.message }, 400);
    }
    
    const { studentId, title, type, notes, fileName, fileUrl, uploadedBy } = requestBody;
    
    if (!studentId || !title || !type || !fileName || !fileUrl) {
      console.error('Missing required fields:', { studentId, title, type, fileName, fileUrl });
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Verify student exists
    const studentProfile = await kv.get(`user:${studentId}`);
    if (!studentProfile) {
      return c.json({ error: 'Student not found' }, 404);
    }
    
    // Create document
    const documentId = `${studentId}:${Date.now()}`;
    const document = {
      id: documentId,
      studentId,
      title,
      type,
      uploadedBy: uploadedBy || 'DSO Office',
      uploadedDate: new Date().toISOString(),
      fileName,
      fileUrl,
      notes: notes || '',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`document:${documentId}`, document);
    
    console.log(`Document uploaded for student ${studentId}:`, document);
    
    return c.json({ 
      success: true, 
      documentId,
      message: 'Document uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return c.json({ error: 'Failed to upload document: ' + error.message }, 500);
  }
});

// Delete a document (DSO only)
app.delete("/make-server-268175b3/documents/:documentId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can delete documents' }, 403);
    }
    
    const documentId = c.req.param('documentId');
    const document = await kv.get(`document:${documentId}`);
    
    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }
    
    // Delete the document
    await kv.del(`document:${documentId}`);
    
    console.log(`Document deleted: ${documentId}`);
    
    return c.json({ 
      success: true,
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return c.json({ error: 'Failed to delete document: ' + error.message }, 500);
  }
});

// ==================== REQUEST ACTIONS ROUTES ====================

// Get all request actions for DSO
app.get("/make-server-268175b3/dso/request-actions", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can view request actions' }, 403);
    }
    
    const universityId = userProfile.universityId;
    
    // Get all request actions for this university
    const allRequestActions = await kv.getByPrefix(`requestaction:${universityId}:`);
    
    // Enrich request actions with student names for single requests
    const enrichedActions = await Promise.all(
      allRequestActions.map(async (action) => {
        if (action.sentTo === 'Single' && action.targetStudent) {
          // Fetch student details - students are stored as user: entries
          console.log(`[Request Actions] Fetching student for action ${action.id}: ${action.targetStudent}`);
          const student = await kv.get(`user:${action.targetStudent}`);
          console.log(`[Request Actions] Student data:`, student);
          return {
            ...action,
            targetStudentName: student?.name || 'Unknown Student'
          };
        }
        return action;
      })
    );
    
    // Sort by creation date (newest first)
    const sortedActions = enrichedActions.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return c.json({ requests: sortedActions });
  } catch (error) {
    console.error('Error fetching request actions:', error);
    return c.json({ error: 'Failed to fetch request actions' }, 500);
  }
});

// Get a specific request action with student responses (DSO only)
app.get("/make-server-268175b3/dso/request-actions/:requestActionId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can view request actions' }, 403);
    }
    
    const requestActionId = c.req.param('requestActionId');
    
    // Get the request action
    const requestAction = await kv.get(requestActionId);
    
    if (!requestAction) {
      return c.json({ error: 'Request action not found' }, 404);
    }
    
    // Verify this request belongs to the DSO's university
    if (requestAction.universityId !== userProfile.universityId) {
      return c.json({ error: 'Access denied' }, 403);
    }
    
    // Get student responses for this request
    const responses = [];
    
    // If it's a single student request
    if (requestAction.sentTo === 'Single' && requestAction.targetStudent) {
      const student = await kv.get(`user:${requestAction.targetStudent}`);
      
      if (student) {
        // Get visa profile
        const visaProfile = await kv.get(`visa:${student.id}`) || {};
        
        // Check if student has responded
        const responseKey = `response:${requestActionId}:${student.id}`;
        const studentResponse = await kv.get(responseKey);
        
        responses.push({
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          visaType: visaProfile?.visaType || 'F-1',
          status: studentResponse ? 'completed' : 'pending',
          submittedAt: studentResponse?.submittedAt || null,
          responseData: studentResponse?.data || null,
          documentUrl: studentResponse?.documentUrl || null
        });
      }
    } 
    // If it's a bulk request
    else if (requestAction.sentTo === 'Bulk') {
      // Get all users and filter for students in this university
      const allUsers = await kv.getByPrefix('user:');
      const allStudents = allUsers.filter(user => 
        user.universityId === userProfile.universityId && user.userType === 'student'
      );
      
      // Get response for each student
      for (const student of allStudents) {
        // Get visa profile for filtering and display
        const visaProfile = await kv.get(`visa:${student.id}`) || {};
        
        // Apply bulk filter if specified
        if (requestAction.bulkFilter && requestAction.bulkFilter !== 'all') {
          if (requestAction.bulkFilter === 'f1' && visaProfile?.visaType !== 'F-1') {
            continue; // Skip this student
          }
          // Add more filter logic as needed
        }
        
        const responseKey = `response:${requestActionId}:${student.id}`;
        const studentResponse = await kv.get(responseKey);
        
        responses.push({
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          visaType: visaProfile?.visaType || 'F-1',
          status: studentResponse ? 'completed' : 'pending',
          submittedAt: studentResponse?.submittedAt || null,
          responseData: studentResponse?.data || null,
          documentUrl: studentResponse?.documentUrl || null
        });
      }
    }
    
    // Calculate completion stats
    const completedCount = responses.filter(r => r.status === 'completed').length;
    const completionPercent = responses.length > 0 
      ? Math.round((completedCount / responses.length) * 100) 
      : 0;
    
    // Update the request action with latest stats
    const updatedRequest = {
      ...requestAction,
      completedCount,
      completionPercent,
      totalCount: responses.length
    };
    
    return c.json({ 
      request: updatedRequest,
      responses 
    });
  } catch (error) {
    console.error('Error fetching request action detail:', error);
    return c.json({ error: 'Failed to fetch request action detail: ' + error.message }, 500);
  }
});

// Create a new request action (DSO only)
app.post("/make-server-268175b3/dso/request-actions", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can create request actions' }, 403);
    }
    
    const requestData = await c.req.json();
    const universityId = userProfile.universityId;
    
    // Generate request action ID
    const requestActionId = `requestaction:${universityId}:${Date.now()}`;
    
    // Determine title based on type
    let title = '';
    if (requestData.type === 'document') {
      title = requestData.documentTitle;
    } else if (requestData.type === 'form') {
      title = requestData.formTemplate === 'enrollment' ? 'Enrollment Verification' :
              requestData.formTemplate === 'employment' ? 'Employment Information' :
              requestData.formTemplate === 'address' ? 'Address Update' : 'Custom Form';
    } else if (requestData.type === 'confirmation') {
      title = 'Confirmation Required';
    }
    
    // Calculate target count
    let targetCount = 1;
    if (requestData.targetType === 'bulk') {
      // Mock counts based on filter
      targetCount = requestData.bulkFilter === 'all' ? 1247 :
                    requestData.bulkFilter === 'opt' ? 156 :
                    requestData.bulkFilter === 'graduating' ? 89 : 1189;
    }
    
    // Create request action object
    const requestAction = {
      id: requestActionId,
      universityId,
      title,
      type: requestData.type,
      sentTo: requestData.targetType === 'single' ? 'Single' : 'Bulk',
      targetStudent: requestData.targetStudent || null,
      bulkFilter: requestData.bulkFilter || null,
      targetCount,
      deadline: requestData.deadline,
      completionPercent: 0,
      completedCount: 0,
      totalCount: targetCount,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      // Store request-specific data
      documentTitle: requestData.documentTitle || null,
      acceptedFileTypes: requestData.acceptedFileTypes || null,
      instructions: requestData.instructions || null,
      formTemplate: requestData.formTemplate || null,
      formFields: requestData.formFields || null,
      confirmationStatement: requestData.confirmationStatement || null,
    };
    
    // Save to KV store
    await kv.set(requestActionId, requestAction);
    
    // Add to university's request actions index
    const universityActionsKey = `requestactions:university:${universityId}`;
    const universityActions = await kv.get(universityActionsKey) || [];
    universityActions.push(requestActionId);
    await kv.set(universityActionsKey, universityActions);
    
    console.log('Request action created successfully:', requestActionId);
    
    return c.json({ success: true, requestAction });
  } catch (error) {
    console.error('Error creating request action:', error);
    return c.json({ error: 'Failed to create request action: ' + error.message }, 500);
  }
});

// Update request action status (DSO only)
app.put("/make-server-268175b3/dso/request-actions/:requestActionId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can update request actions' }, 403);
    }
    
    const requestActionId = c.req.param('requestActionId');
    const updates = await c.req.json();
    
    const requestAction = await kv.get(requestActionId);
    if (!requestAction) {
      return c.json({ error: 'Request action not found' }, 404);
    }
    
    // Update the request action
    const updatedAction = {
      ...requestAction,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };
    
    await kv.set(requestActionId, updatedAction);
    
    return c.json({ success: true, requestAction: updatedAction });
  } catch (error) {
    console.error('Error updating request action:', error);
    return c.json({ error: 'Failed to update request action' }, 500);
  }
});

// Delete request action (DSO only)
app.delete("/make-server-268175b3/dso/request-actions/:requestActionId", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'dso') {
      return c.json({ error: 'Only DSO admins can delete request actions' }, 403);
    }
    
    const requestActionId = c.req.param('requestActionId');
    const requestAction = await kv.get(requestActionId);
    
    if (!requestAction) {
      return c.json({ error: 'Request action not found' }, 404);
    }
    
    // Verify this request belongs to the DSO's university
    if (requestAction.universityId !== userProfile.universityId) {
      return c.json({ error: 'Access denied' }, 403);
    }
    
    // Delete the request action
    await kv.del(requestActionId);
    
    // Also delete all student responses to this request
    const allResponses = await kv.getByPrefix(`response:${requestActionId}:`);
    for (const response of allResponses) {
      await kv.del(response.id);
    }
    
    console.log(`Request action deleted: ${requestActionId}`);
    
    return c.json({ 
      success: true,
      message: 'Request action and all responses deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting request action:', error);
    return c.json({ error: 'Failed to delete request action: ' + error.message }, 500);
  }
});

// Submit student response to a request action (Student only)
app.post("/make-server-268175b3/requests/respond", async (c) => {
  const { error: authError, user } = await verifyAuth(c.req.header('Authorization'));
  
  if (authError || !user) {
    return c.json({ error: authError || 'Unauthorized' }, 401);
  }
  
  try {
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.userType !== 'student') {
      return c.json({ error: 'Only students can respond to requests' }, 403);
    }
    
    const { requestActionId, responseData, documentUrl } = await c.req.json();
    
    if (!requestActionId) {
      return c.json({ error: 'Request action ID is required' }, 400);
    }
    
    // Verify the request action exists
    const requestAction = await kv.get(requestActionId);
    if (!requestAction) {
      return c.json({ error: 'Request action not found' }, 404);
    }
    
    // Create response record
    const responseKey = `response:${requestActionId}:${user.id}`;
    const response = {
      id: responseKey,
      requestActionId,
      studentId: user.id,
      studentName: user.user_metadata?.name || 'Unknown Student',
      studentEmail: user.email,
      data: responseData || {},
      documentUrl: documentUrl || null,
      submittedAt: new Date().toISOString(),
    };
    
    await kv.set(responseKey, response);
    
    console.log('Student response submitted successfully:', responseKey);
    
    // Update request action completion stats
    const universityId = requestAction.universityId;
    
    // Count total responses
    let totalResponses = 0;
    if (requestAction.sentTo === 'Single') {
      const singleResponseKey = `response:${requestActionId}:${requestAction.targetStudent}`;
      const singleResponse = await kv.get(singleResponseKey);
      totalResponses = singleResponse ? 1 : 0;
    } else if (requestAction.sentTo === 'Bulk') {
      // Get all responses for this request
      const allResponses = await kv.getByPrefix(`response:${requestActionId}:`);
      totalResponses = allResponses.length;
    }
    
    // Update completion percentage
    const totalCount = requestAction.totalCount || 1;
    const completionPercent = Math.round((totalResponses / totalCount) * 100);
    
    const updatedRequestAction = {
      ...requestAction,
      completedCount: totalResponses,
      completionPercent,
      lastResponseAt: new Date().toISOString(),
    };
    
    await kv.set(requestActionId, updatedRequestAction);
    
    return c.json({ success: true, response });
  } catch (error) {
    console.error('Error submitting response:', error);
    return c.json({ error: 'Failed to submit response: ' + error.message }, 500);
  }
});

Deno.serve(app.fetch);