# Pathly Platform - Architecture Analysis

**Date:** March 7, 2026  
**Platform:** B2B SaaS for University Immigration Management  
**Current State:** Prototype/MVP using KV Store architecture  
**Target:** Production-grade multi-tenant relational database

---

## 1. System Architecture Overview

### 1.1 Technology Stack

- **Frontend:** React with TypeScript, Tailwind CSS, React Router
- **Backend:** Deno + Hono (Edge Functions on Supabase)
- **Database:** Supabase Postgres (currently using single KV table)
- **Storage:** Supabase Storage (private bucket: `make-268175b3-documents`)
- **Authentication:** Supabase Auth with JWT tokens

### 1.2 Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│  React Components → React Router → Supabase Client          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS / JWT Auth
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   BACKEND LAYER (Hono Server)                │
│  /supabase/functions/server/index.tsx                        │
│  • Authentication Routes                                     │
│  • User Profile Management                                   │
│  • Visa Profile Management                                   │
│  • Request Management (Student → DSO)                        │
│  • Request Actions (DSO → Student)                           │
│  • Document Management                                       │
│  • SEVIS Status Updates                                      │
│  • Bulk Email Logging                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │   KV    │  │ Supabase│  │ Supabase│
        │  Store  │  │  Auth   │  │ Storage │
        └─────────┘  └─────────┘  └─────────┘
```

### 1.3 Multi-Tenant Model

Currently implements **soft multi-tenancy** via `universityId` field:
- Universities identified by: `university-001`, `university-002`, etc.
- Students and DSO users have `universityId` in their profile
- Data isolation through application-level filtering
- **Gap:** No database-level tenant isolation (Row Level Security not implemented)

---

## 2. KV Store Key Prefixes

The current system stores all data in `kv_store_268175b3` table with the following key patterns:

### 2.1 User & Authentication Data

| Key Pattern | Description | Example |
|------------|-------------|---------|
| `user:{userId}` | User profile (student, DSO, or regular) | `user:abc123` |
| `visa:{userId}` | Visa and immigration status profile | `visa:abc123` |

### 2.2 Request Management (Student → DSO)

| Key Pattern | Description | Example |
|------------|-------------|---------|
| `request:{userId}:{timestamp}` | Student-submitted request (I-20, OPT, CPT, Travel) | `request:abc123:1709826000000` |
| `requests:university:{universityId}` | Array of request IDs for a university | `requests:university:university-001` |

### 2.3 Request Actions (DSO → Student)

| Key Pattern | Description | Example |
|------------|-------------|---------|
| `requestaction:{universityId}:{timestamp}` | DSO-created request (document, form, confirmation) | `requestaction:university-001:1709826000000` |
| `requestactions:university:{universityId}` | Array of request action IDs for a university | `requestactions:university:university-001` |
| `response:{requestActionId}:{studentId}` | Student response to a DSO request action | `response:requestaction:university-001:170982:abc123` |

### 2.4 Document Management

| Key Pattern | Description | Example |
|------------|-------------|---------|
| `document:{studentId}:{timestamp}` | Document metadata (file stored in Supabase Storage) | `document:abc123:1709826000000` |
| `docreq:{studentId}:{timestamp}` | Document request from DSO to student | `docreq:abc123:1709826000000` |
| `docreqs:student:{studentId}` | Array of document request IDs for a student | `docreqs:student:abc123` |

### 2.5 Audit & Logging

| Key Pattern | Description | Example |
|------------|-------------|---------|
| `sevis:log:{studentId}:{timestamp}` | SEVIS status update log | `sevis:log:abc123:1709826000000` |
| `email:log:{timestamp}` | Bulk email log | `email:log:1709826000000` |

### 2.6 Legacy/Deprecated Keys

| Key Pattern | Description | Status |
|------------|-------------|--------|
| `docs:user:{userId}` | Old document storage (pre-refactor) | Deprecated |

---

## 3. Data Models

### 3.1 User Profile

**Key:** `user:{userId}`

```typescript
interface UserProfile {
  id: string;                    // User ID from Supabase Auth
  email: string;                 // User email
  name: string;                  // Full name
  userType: 'student' | 'dso' | 'regular';
  universityId?: string;         // e.g., "university-001" (for students & DSOs)
  createdAt: string;             // ISO 8601 timestamp
}
```

**Source:** Lines 146-151, 197-204, 254-260 in `/supabase/functions/server/index.tsx`

---

### 3.2 Visa Profile

**Key:** `visa:{userId}`

```typescript
interface VisaProfile {
  userId: string;
  visaType: string | null;              // e.g., "F-1", "J-1"
  status: string;                       // "pending", "active", "expired"
  expirationDate: string | null;        // ISO 8601 date
  sevisStatus: string | null;           // "Active", "Initial", "Terminated"
  compliance: string | null;            // "In Compliance", "Out of Compliance"
  passportStatus?: string;              // "Valid", "Expiring Soon"
  passportExpirationDate?: string;      // ISO 8601 date
  nextCheckDate?: string;               // ISO 8601 date
  lastUpdated?: string;                 // ISO 8601 timestamp
  updatedBy?: string;                   // User ID of updater (DSO)
  createdAt: string;                    // ISO 8601 timestamp
}
```

**Source:** Lines 207-214, 873-880, 917-924, 950-956 in `/supabase/functions/server/index.tsx`

---

### 3.3 Student Request (Student → DSO)

**Key:** `request:{userId}:{timestamp}`

```typescript
interface StudentRequest {
  id: string;                          // Full key: "request:abc123:1709826000000"
  userId: string;                      // Student ID
  userName: string;                    // Student name
  userEmail: string;                   // Student email
  universityId: string;                // e.g., "university-001"
  requestType: string;                 // "cpt", "opt", "i20", "travel", etc.
  requestName: string;                 // Human-readable name
  reason: string;                      // Student's reason for request
  formData: Record<string, any>;       // Flexible form data
  uploadedFiles: any[];                // Array of file metadata
  status: string;                      // "pending", "approved", "denied"
  priority: string;                    // "Normal", "High", "Urgent"
  submittedAt: string;                 // ISO 8601 timestamp
  dueDate: string;                     // ISO 8601 timestamp
  processedAt?: string;                // ISO 8601 timestamp
  processedBy?: string;                // DSO user ID
  notes?: string;                      // DSO notes
}
```

**Source:** Lines 486-501, 584-594 in `/supabase/functions/server/index.tsx`

**Related Index:** `requests:university:{universityId}` → Array of request IDs

---

### 3.4 Request Action (DSO → Student)

**Key:** `requestaction:{universityId}:{timestamp}`

```typescript
interface RequestAction {
  id: string;                          // Full key
  universityId: string;
  title: string;                       // Display title
  type: 'document' | 'form' | 'confirmation';
  sentTo: 'Single' | 'Bulk';
  targetStudent: string | null;        // Student ID (if Single)
  bulkFilter: string | null;           // "all", "opt", "graduating", etc. (if Bulk)
  targetCount: number;                 // Number of students targeted
  deadline: string;                    // ISO 8601 timestamp
  completionPercent: number;           // 0-100
  completedCount: number;              // Number of students who responded
  totalCount: number;                  // Total students targeted
  status: 'active' | 'completed' | 'archived';
  createdAt: string;                   // ISO 8601 timestamp
  createdBy: string;                   // DSO user ID
  updatedAt?: string;                  // ISO 8601 timestamp
  updatedBy?: string;                  // DSO user ID
  lastResponseAt?: string;             // ISO 8601 timestamp
  
  // Type-specific fields
  documentTitle?: string | null;       // For type: 'document'
  acceptedFileTypes?: string[] | null; // For type: 'document'
  instructions?: string | null;        // For all types
  formTemplate?: string | null;        // For type: 'form' ("enrollment", "employment", "address")
  formFields?: any[] | null;           // For type: 'form'
  confirmationStatement?: string | null; // For type: 'confirmation'
}
```

**Source:** Lines 1387-1410, 1578-1585 in `/supabase/functions/server/index.tsx`

**Related Index:** `requestactions:university:{universityId}` → Array of request action IDs

---

### 3.5 Student Response to Request Action

**Key:** `response:{requestActionId}:{studentId}`

```typescript
interface StudentResponse {
  id: string;                          // Full key
  requestActionId: string;             // Parent request action ID
  studentId: string;
  studentName: string;
  studentEmail: string;
  data: Record<string, any>;           // Form data or confirmation
  documentUrl: string | null;          // URL if document was uploaded
  submittedAt: string;                 // ISO 8601 timestamp
}
```

**Source:** Lines 1544-1555 in `/supabase/functions/server/index.tsx`

---

### 3.6 Document Metadata

**Key:** `document:{studentId}:{timestamp}`

```typescript
interface Document {
  id: string;                          // Full key: "{studentId}:{timestamp}"
  studentId: string;
  title: string;                       // Display name
  type: string;                        // Document category
  uploadedBy: string;                  // User name or "DSO Office"
  uploadedDate: string;                // ISO 8601 timestamp
  fileName: string;                    // Original filename
  fileUrl: string;                     // URL (Supabase Storage signed URL)
  notes: string;                       // Optional notes
  status: string;                      // "active", "archived"
  createdAt: string;                   // ISO 8601 timestamp
}
```

**Source:** Lines 1114-1128 in `/supabase/functions/server/index.tsx`

**Storage:** Actual files stored in Supabase Storage bucket `make-268175b3-documents`

---

### 3.7 Document Request (DSO → Student)

**Key:** `docreq:{studentId}:{timestamp}`

```typescript
interface DocumentRequest {
  id: string;                          // Full key
  studentId: string;
  requestedBy: string;                 // DSO user ID
  documentType: string;                // Type of document requested
  dueDate: string;                     // ISO 8601 timestamp
  notes: string;
  status: string;                      // "pending", "completed"
  createdAt: string;                   // ISO 8601 timestamp
}
```

**Source:** Lines 622-631 in `/supabase/functions/server/index.tsx`

**Related Index:** `docreqs:student:{studentId}` → Array of document request IDs

---

### 3.8 SEVIS Update Log

**Key:** `sevis:log:{studentId}:{timestamp}`

```typescript
interface SEVISLog {
  studentId: string;
  sevisStatus: string;                 // "Active", "Initial", "Terminated"
  compliance: string;                  // "In Compliance", "Out of Compliance"
  notes: string;
  updatedBy: string;                   // DSO user ID
  updatedAt: string;                   // ISO 8601 timestamp
}
```

**Source:** Lines 884-891 in `/supabase/functions/server/index.tsx`

---

### 3.9 Bulk Email Log

**Key:** `email:log:{timestamp}`

```typescript
interface EmailLog {
  sentBy: string;                      // DSO user ID
  recipientGroup: string;              // "all", "opt", "graduating", etc.
  subject: string;
  message: string;
  sentAt: string;                      // ISO 8601 timestamp
}
```

**Source:** Lines 985-991 in `/supabase/functions/server/index.tsx`

---

## 4. API Endpoints

### 4.1 Authentication Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/signup` | POST | Public | Register regular user |
| `/auth/signup/student` | POST | Public | Register student (requires `universityId`) |
| `/auth/signup/dso` | POST | Public | Register DSO admin (requires `universityId`) |

**Note:** Sign in/out handled by Supabase Auth client-side

**Source:** Lines 120-272 in `/supabase/functions/server/index.tsx`

---

### 4.2 User Profile Routes

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/user/profile` | GET | Required | All | Get current user's profile |
| `/user/profile` | PUT | Required | All | Update current user's profile |

**Source:** Lines 277-322 in `/supabase/functions/server/index.tsx`

---

### 4.3 Visa Profile Routes

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/visa/profile` | GET | Required | All | Get current user's visa profile |
| `/visa/profile` | PUT | Required | All | Update current user's visa profile |

**Source:** Lines 327-385 in `/supabase/functions/server/index.tsx`

---

### 4.4 Student Request Routes (Student → DSO)

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/requests/submit` | POST | Required | Student | Submit I-20, OPT, CPT, or travel request |
| `/requests/my-requests` | GET | Required | Student | Get all requests submitted by student |
| `/requests/university/:universityId` | GET | Required | DSO | Get all pending requests for university |
| `/requests/:requestId/status` | PUT | Required | DSO | Approve/deny a request |

**Source:** Lines 458-601 in `/supabase/functions/server/index.tsx`

---

### 4.5 DSO Request Action Routes (DSO → Student)

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/dso/request-actions` | GET | Required | DSO | Get all request actions for DSO's university |
| `/dso/request-actions` | POST | Required | DSO | Create new request action (single or bulk) |
| `/dso/request-actions/:id` | GET | Required | DSO | Get request action detail with student responses |
| `/dso/request-actions/:id` | PUT | Required | DSO | Update request action status |
| `/dso/request-actions/:id` | DELETE | Required | DSO | Delete request action and all responses |
| `/requests/dso-requests` | GET | Required | Student | Get all DSO requests applicable to student |
| `/requests/respond` | POST | Required | Student | Submit response to a DSO request action |

**Source:** Lines 757-854, 1182-1592 in `/supabase/functions/server/index.tsx`

---

### 4.6 Document Management Routes

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/documents` | GET | Required | All | Get user's documents (deprecated) |
| `/documents/:documentId/download` | GET | Required | All | Get signed download URL (deprecated) |
| `/documents/student/:studentId` | GET | Required | Student/DSO | Get all documents for a student |
| `/documents/dso/:universityId` | GET | Required | DSO | Get all documents for university |
| `/documents/upload` | POST | Required | DSO | Upload document for a student |
| `/documents/:documentId` | DELETE | Required | DSO | Delete a document |

**Source:** Lines 390-453, 1008-1177 in `/supabase/functions/server/index.tsx`

---

### 4.7 Document Request Routes (DSO → Student)

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/dso/document-request` | POST | Required | DSO | Request document from student |
| `/document-requests` | GET | Required | Student | Get pending document requests |

**Source:** Lines 606-673 in `/supabase/functions/server/index.tsx`

---

### 4.8 Student Management Routes (DSO)

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/dso/students/:universityId` | GET | Required | DSO | Get all students for university with visa profiles |
| `/dso/sevis/:studentId` | PUT | Required | DSO | Update student's SEVIS status |
| `/dso/visa/:studentId` | PUT | Required | DSO | Update student's visa status |
| `/dso/passport/:studentId` | PUT | Required | DSO | Update student's passport status |

**Source:** Lines 678-963 in `/supabase/functions/server/index.tsx`

---

### 4.9 Communication Routes

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/dso/bulk-email` | POST | Required | DSO | Send bulk email (logged, not actually sent) |

**Source:** Lines 968-1003 in `/supabase/functions/server/index.tsx`

---

### 4.10 Utility Routes

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/health` | GET | Public | All | Health check |
| `/utils/cleanup-test-requests/:universityId` | DELETE | Public | Dev | Clean up test data (development only) |

**Source:** Lines 77-115 in `/supabase/functions/server/index.tsx`

---

## 5. Service Dependencies

### 5.1 Backend Service Architecture

The backend is currently **monolithic** with all routes in a single file:

```
/supabase/functions/server/
├── index.tsx          (1594 lines - all routes)
└── kv_store.tsx       (87 lines - database interface)
```

**Current Dependencies:**

```
┌──────────────────────────────────────────────┐
│         server/index.tsx (Hono App)          │
│                                              │
│  • Authentication Service (inline)          │
│  • User Profile Service (inline)            │
│  • Visa Management Service (inline)         │
│  • Request Management Service (inline)      │
│  • Document Management Service (inline)     │
│  • SEVIS Management Service (inline)        │
│  • Communication Service (inline)           │
│  • Request Actions Service (inline)         │
└──────────────────────┬───────────────────────┘
                       │
                       │ imports
                       │
          ┌────────────▼─────────────┐
          │   server/kv_store.tsx    │
          │                          │
          │  • get(key)             │
          │  • set(key, value)      │
          │  • del(key)             │
          │  • mget(keys)           │
          │  • mset(keys, values)   │
          │  • mdel(keys)           │
          │  • getByPrefix(prefix)  │
          └────────────┬─────────────┘
                       │
                       │ Supabase Client
                       │
              ┌────────▼────────┐
              │  kv_store_268175b3  │
              │  (Postgres Table)    │
              │                      │
              │  key   TEXT PK      │
              │  value JSONB        │
              └─────────────────────┘
```

### 5.2 External Service Dependencies

1. **Supabase Auth**
   - Used by: All authenticated endpoints
   - Purpose: JWT token verification, user management
   - Files: `verifyAuth()` helper in `index.tsx` (lines 36-50)

2. **Supabase Storage**
   - Used by: Document upload/download endpoints
   - Purpose: Store document files
   - Bucket: `make-268175b3-documents` (private)
   - Files: `initializeStorage()` in `index.tsx` (lines 53-74)

3. **Supabase Postgres**
   - Used by: All data operations via kv_store
   - Purpose: Persistent data storage
   - Files: `kv_store.tsx`

### 5.3 Frontend → Backend Flow

```
Frontend Component
      ↓
/utils/api.ts (API client functions)
      ↓
HTTPS Request + JWT Bearer Token
      ↓
Hono Server (/supabase/functions/server/index.tsx)
      ↓
verifyAuth() middleware
      ↓
Route Handler
      ↓
kv.get() / kv.set() / kv.getByPrefix()
      ↓
kv_store_268175b3 table
```

**Example Flow (Submit Request):**

```
StudentPortal.tsx
      ↓
api.submitRequest(type, reason)
      ↓
POST /requests/submit
      ↓
verifyAuth() → Check user is student
      ↓
kv.get(`user:${userId}`) → Get student profile
      ↓
kv.set(`request:${userId}:${timestamp}`, requestData)
      ↓
kv.get/set(`requests:university:${universityId}`) → Update index
      ↓
Return success response
```

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

1. **Registration:**
   - Frontend calls: `/auth/signup/student` or `/auth/signup/dso`
   - Backend creates Supabase Auth user with `email_confirm: true`
   - Backend stores user profile in KV: `user:{userId}`
   - For students: Also creates `visa:{userId}` profile

2. **Sign In:**
   - Frontend calls: `supabase.auth.signInWithPassword()`
   - Supabase returns JWT access token + session
   - Token stored in frontend and sent with all API requests

3. **Authorization:**
   - Each protected endpoint calls `verifyAuth(Authorization header)`
   - Token verified via `supabase.auth.getUser(token)`
   - User's role (`userType`) checked from `user:{userId}` profile

### 6.2 Role-Based Access Control (RBAC)

| Role | Description | Permissions |
|------|-------------|-------------|
| `student` | International student | Submit requests, respond to DSO requests, view own documents |
| `dso` | Designated School Official | View all students, manage requests, upload documents, update SEVIS |
| `regular` | Default user type | Basic profile access |

**Implementation:** Application-level checks in route handlers (e.g., line 866: `if (userProfile?.userType !== 'dso')`)

**Gap:** No database-level Row Level Security (RLS) policies

---

## 7. Critical Issues & Technical Debt

### 7.1 Database Architecture Issues

1. **Single Table Bottleneck**
   - All data in one KV table with JSONB values
   - No foreign key constraints
   - No referential integrity
   - Difficult to query and analyze

2. **No Data Validation**
   - JSON schemas not enforced at database level
   - Inconsistent data structures possible

3. **Index Arrays**
   - Using arrays to track relationships (e.g., `requests:university:university-001` → array of IDs)
   - No automatic cascade deletes
   - Orphaned records possible

4. **No Audit Trail**
   - Limited audit logging (only SEVIS logs and email logs)
   - No system-wide change tracking

### 7.2 Security Gaps

1. **No Row Level Security (RLS)**
   - All authorization in application code
   - Direct database access would bypass security

2. **Soft Multi-Tenancy**
   - Universities not isolated at database level
   - Bug in application code could expose cross-tenant data

3. **No Rate Limiting**
   - No protection against abuse or DoS

### 7.3 Scalability Concerns

1. **Prefix Queries**
   - Heavy use of `getByPrefix()` for filtering
   - Not indexed efficiently
   - Will slow down with large datasets

2. **N+1 Query Problem**
   - Many endpoints fetch related data in loops (e.g., lines 1058-1066: fetching documents for each student)
   - No batch loading or joins

3. **No Caching**
   - Every request hits database
   - Frequently accessed data (e.g., user profiles) not cached

### 7.4 Code Organization Issues

1. **Monolithic Server File**
   - 1594 lines in single file
   - Hard to maintain and test
   - No separation of concerns

2. **No Service Layer**
   - Business logic mixed with route handlers
   - Difficult to reuse logic

3. **No Validation Layer**
   - Input validation done inline
   - No centralized schema validation

---

## 8. Data Volume Estimates

Based on typical university immigration office:

| Entity | Estimated Volume (per university/year) |
|--------|----------------------------------------|
| Students | 500-2,000 |
| DSO Admins | 2-10 |
| Student Requests | 2,000-10,000 |
| DSO Request Actions | 100-500 |
| Student Responses | 5,000-50,000 |
| Documents | 10,000-50,000 |
| SEVIS Logs | 5,000-20,000 |

**Total Records (per university/year):** ~22,000-132,000

**With 50 universities:** ~1.1M - 6.6M records/year

**Current Architecture Impact:**
- All records in single table
- Prefix queries will become increasingly slow
- No efficient way to archive old data

---

## 9. Data Relationships (Implicit)

Since the KV store doesn't enforce relationships, here's the **implicit** data model:

```
universities (implicit - not stored)
    ↓ has many
users (students, DSOs)
    ↓ has one
visa_profiles
    ↓ has many
sevis_logs

students
    ↓ submits many
student_requests

students
    ↓ has many
documents

DSOs
    ↓ creates many
request_actions
    ↓ receives many
student_responses

DSOs
    ↓ creates many
document_requests
```

---

## 10. API Client Usage (Frontend)

**Location:** `/utils/api.ts`

**Pattern:**
- All API calls use `getAuthHeaders()` to inject JWT token
- Centralized base URL: `https://${projectId}.supabase.co/functions/v1/make-server-268175b3`
- Uses `fetch()` for HTTP requests
- Returns parsed JSON responses

**Example:**
```typescript
export async function getUserProfile() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    method: 'GET',
    headers,
  });
  return response.json();
}
```

---

## 11. Storage Architecture

### 11.1 Supabase Storage Bucket

**Bucket Name:** `make-268175b3-documents`

**Configuration:**
- **Access:** Private (requires signed URLs)
- **Size Limit:** 10MB per file
- **Initialization:** Idempotent on server startup (lines 53-74)

**Usage Flow:**
1. DSO uploads document via `/documents/upload`
2. File stored in Supabase Storage
3. Metadata stored in KV: `document:{studentId}:{timestamp}`
4. Signed URL generated for downloads (1 hour expiry)

**Gap:** No file versioning, no automatic cleanup of orphaned files

---

## 12. Testing & Observability

### 12.1 Logging

- Server uses Hono logger middleware: `app.use('*', logger(console.log))`
- Extensive `console.log()` statements throughout code
- Error messages logged with context

**Example:**
```typescript
console.log('[DSO Requests] Found ${allRequestActions.length} total request actions');
```

### 12.2 Error Handling

- All routes wrapped in try-catch
- Errors returned as JSON with HTTP status codes
- Error messages include context (e.g., "Failed to submit request: ${error.message}")

**Example:**
```typescript
} catch (error) {
  console.error('Error submitting request:', error);
  return c.json({ error: 'Failed to submit request', details: error.message }, 500);
}
```

### 12.3 Testing

- **No unit tests found**
- **No integration tests found**
- Utility endpoint for cleaning test data: `/utils/cleanup-test-requests/:universityId`

---

## 13. Performance Bottlenecks

### 13.1 Query Patterns

**Inefficient Patterns:**

1. **Fetching all users to filter:**
   ```typescript
   const allUsers = await kv.getByPrefix('user:');
   const students = allUsers.filter(userData => 
     userData.universityId === universityId && userData.userType === 'student'
   );
   ```
   - Fetches ALL users from database
   - Filters in application memory
   - O(n) complexity where n = total users in system

2. **N+1 queries in loops:**
   ```typescript
   for (const student of students) {
     const visaProfile = await kv.get(`visa:${student.id}`);
     // ... process
   }
   ```
   - One query per student
   - Should use batch query (`mget()`)

3. **Repeated index updates:**
   ```typescript
   const universityRequests = await kv.get(universityRequestsKey) || [];
   universityRequests.push(requestId);
   await kv.set(universityRequestsKey, universityRequests);
   ```
   - Race condition possible with concurrent requests
   - Array grows unbounded

### 13.2 Recommended Optimizations (for current architecture)

1. Use `mget()` for batch queries
2. Implement caching layer for frequently accessed data (user profiles, visa profiles)
3. Add pagination to endpoints returning large lists
4. Use Postgres `jsonb` operators for more efficient filtering

---

## 14. Migration Readiness

### 14.1 Current State Assessment

✅ **Strengths:**
- Consistent key naming conventions
- All timestamps in ISO 8601 format
- Clear separation between entity types via prefixes
- Comprehensive API coverage

❌ **Weaknesses:**
- No database constraints
- No data validation
- No referential integrity
- Application-level authorization only
- No audit trail for most entities
- Unbounded array indexes

### 14.2 Migration Complexity: **HIGH**

**Reasons:**
1. Must extract and transform JSON blobs to relational records
2. Reconstruct relationships from key patterns and arrays
3. Handle inconsistent data (no schema enforcement)
4. Migrate in-flight requests and responses
5. Update all frontend API calls to match new schema
6. Implement proper authentication/authorization at database level

### 14.3 Recommended Migration Strategy

1. **Phase 1:** Create new relational schema alongside KV store (dual-write)
2. **Phase 2:** Migrate existing data via scripts
3. **Phase 3:** Gradually switch reads from KV to relational (feature flags)
4. **Phase 4:** Switch all writes to relational
5. **Phase 5:** Deprecate KV store access (keep table for rollback)
6. **Phase 6:** Remove KV store code after validation period

---

## 15. Summary Statistics

| Metric | Value |
|--------|-------|
| **Backend Files** | 2 (index.tsx, kv_store.tsx) |
| **Lines of Backend Code** | ~1,680 |
| **API Endpoints** | 32 |
| **KV Key Patterns** | 13 primary, 3 index arrays |
| **Data Models** | 9 distinct entities |
| **User Roles** | 3 (student, dso, regular) |
| **External Services** | 3 (Auth, Storage, Postgres) |
| **Protected Routes** | 29 of 32 |

---

## 16. Recommendations for Phase 2

### 16.1 Database Schema Priorities

1. **Core Entities:**
   - `schools` (universities)
   - `users` (with proper role management)
   - `students` (extended student profile)
   - `visa_profiles`

2. **Request Management:**
   - `requests` (student → DSO)
   - `request_actions` (DSO → student)
   - `responses` (student → DSO request action)

3. **Document Management:**
   - `documents`
   - `document_requests`

4. **Audit & Compliance:**
   - `audit_logs` (SOC2 readiness)
   - `sevis_logs`

### 16.2 Critical Features for Production

1. **Row Level Security (RLS)** for multi-tenant isolation
2. **Foreign key constraints** for data integrity
3. **Database-level validation** via check constraints
4. **Indexes** on frequently queried columns (universityId, status, dates)
5. **Soft deletes** (deleted_at column) instead of hard deletes
6. **Proper audit trail** for all mutations

### 16.3 Code Refactoring Priorities

1. **Service layer extraction:**
   - `/server/services/auth.ts`
   - `/server/services/students.ts`
   - `/server/services/requests.ts`
   - `/server/services/documents.ts`

2. **Route organization:**
   - `/server/routes/auth.ts`
   - `/server/routes/students.ts`
   - `/server/routes/requests.ts`
   - `/server/routes/documents.ts`

3. **Validation layer:**
   - Use Zod or similar for schema validation
   - Centralized input validation

4. **Database repository pattern:**
   - Abstract database operations
   - Support both KV and relational during migration

---

**End of Architecture Analysis**
