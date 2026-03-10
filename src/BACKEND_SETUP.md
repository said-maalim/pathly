# Pathly Backend Documentation

## Overview

Pathly uses **Supabase** for its complete backend infrastructure, including:
- **PostgreSQL Database** (via key-value store)
- **Authentication** (email/password with role-based access)
- **Storage** (secure document uploads)
- **Edge Functions** (API server with Hono)

## Architecture

```
Frontend (React/TypeScript) 
    ↓
Supabase Auth (login/signup)
    ↓
Edge Function Server (Hono)
    ↓
KV Store (PostgreSQL database)
    ↓
Supabase Storage (documents)
```

## Getting Started

### 1. Access the Backend Demo

Click **"Backend Demo"** in the navigation bar on the landing page to test the backend functionality.

### 2. Test Authentication

The demo page allows you to:
- ✅ Create a new account (sign up)
- ✅ Sign in with email/password
- ✅ View your user profile
- ✅ Update visa information
- ✅ Upload documents

### 3. API Endpoint Structure

All API routes are prefixed with:
```
https://{projectId}.supabase.co/functions/v1/make-server-268175b3
```

## Authentication Flows

### Regular User Sign Up
```typescript
import * as api from './utils/api';

const result = await api.signUp(
  'user@example.com',
  'securePassword123',
  'John Doe',
  'regular'
);
```

### Student Sign Up (University Portal)
```typescript
const result = await api.signUp(
  'student@university.edu',
  'password',
  'Jane Smith',
  'student'
);
```

### DSO Admin Sign Up
```typescript
const result = await api.signUp(
  'dso@university.edu',
  'password',
  'Admin Name',
  'dso'
);
```

### Sign In
```typescript
const { session, error } = await api.signIn('user@example.com', 'password');

// Access token is automatically included in subsequent requests
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create regular user account |
| POST | `/auth/signup/student` | Create student account |
| POST | `/auth/signup/dso` | Create DSO admin account |

### User Profile
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/user/profile` | Get current user profile | ✅ |
| PUT | `/user/profile` | Update user profile | ✅ |

### Visa Profile
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/visa/profile` | Get visa information | ✅ |
| PUT | `/visa/profile` | Update visa status, type, expiration | ✅ |

### Documents
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/documents/upload` | Upload document (multipart/form-data) | ✅ |
| GET | `/documents` | List user's documents | ✅ |
| GET | `/documents/:id/download` | Get signed download URL | ✅ |

### Student Requests (I-20, OPT)
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/requests/submit` | Submit I-20 or OPT request | ✅ | Student |
| GET | `/requests/university/:id` | Get university's pending requests | ✅ | DSO |
| PUT | `/requests/:id/status` | Approve/deny request | ✅ | DSO |

### Document Requests (DSO → Student)
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/dso/document-request` | Request document from student | ✅ | DSO |
| GET | `/document-requests` | Get document requests for current user | ✅ | Student |

### SEVIS Status Management
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| PUT | `/dso/sevis/:studentId` | Update student's SEVIS status | ✅ | DSO |

### Bulk Communications
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/dso/bulk-email` | Send bulk reminder emails | ✅ | DSO |

## Data Models

### User Profile
```typescript
{
  id: string;           // Supabase user ID
  email: string;
  name: string;
  userType: 'regular' | 'student' | 'dso';
  universityId?: string;  // For students and DSOs
  createdAt: string;
}
```

### Visa Profile
```typescript
{
  userId: string;
  visaType: string;        // e.g., 'F-1', 'J-1', 'H-1B'
  status: string;          // e.g., 'Active', 'Expiring Soon'
  expirationDate: string;
  sevisStatus: string;     // e.g., 'Active', 'Initial', 'Terminated'
  compliance: string;      // e.g., 'Compliant', 'Action Required'
  nextCheckDate: string;
  updatedAt: string;
}
```

### Document
```typescript
{
  id: string;
  userId: string;
  fileName: string;
  storagePath: string;     // Path in Supabase Storage
  documentType: string;    // e.g., 'passport', 'i20', 'transcript'
  uploadedAt: string;
  status: string;          // e.g., 'pending_review', 'verified'
}
```

### Student Request
```typescript
{
  id: string;
  userId: string;
  universityId: string;
  requestType: 'i20' | 'opt';
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}
```

### Document Request
```typescript
{
  id: string;
  studentId: string;
  requestedBy: string;     // DSO user ID
  documentType: string;
  dueDate: string;
  notes?: string;
  status: 'pending' | 'submitted' | 'approved';
  createdAt: string;
}
```

## Storage Buckets

### Documents Bucket
- **Name**: `make-268175b3-documents`
- **Access**: Private (requires authentication)
- **Max File Size**: 10MB
- **Structure**: `{userId}/{documentType}_{timestamp}.{ext}`

### Getting Download URLs
Documents are stored privately. To download:
```typescript
const { url } = await api.getDocumentDownloadUrl(documentId);
// URL is valid for 1 hour
```

## Role-Based Access Control

### Regular Users
- ✅ Manage their own profile
- ✅ Update their visa information
- ✅ Upload and view their documents
- ✅ Access resources and book experts

### Students (University Portal)
- ✅ All regular user permissions
- ✅ Submit I-20 and OPT requests to DSO
- ✅ View SEVIS status posted by DSO
- ✅ Respond to document requests from DSO

### DSO Admins
- ✅ View all students in their university
- ✅ Update SEVIS status and compliance for students
- ✅ Process I-20 and OPT requests
- ✅ Request documents from students
- ✅ Send bulk reminder emails

## Security Features

1. **Email Confirmation**: All accounts are auto-confirmed (email server not configured)
2. **JWT Tokens**: Session tokens are managed by Supabase Auth
3. **Row-Level Security**: Users can only access their own data
4. **Private Storage**: Documents require authentication to access
5. **Role Verification**: API routes verify user roles before allowing actions

## Using the API in Components

### Example: Updating Visa Profile
```typescript
import { updateVisaProfile } from '../utils/api';

const handleUpdateVisa = async () => {
  const result = await updateVisaProfile({
    visaType: 'F-1',
    status: 'Active',
    expirationDate: '2026-06-15',
  });
  
  if (result.success) {
    console.log('Updated:', result.visaProfile);
  }
};
```

### Example: Uploading a Document
```typescript
import { uploadDocument } from '../utils/api';

const handleFileUpload = async (file: File) => {
  const result = await uploadDocument(file, 'passport');
  
  if (result.success) {
    console.log('Uploaded:', result.document);
  }
};
```

### Example: Submitting an I-20 Request
```typescript
import { submitRequest } from '../utils/api';

const handleSubmitRequest = async () => {
  const result = await submitRequest('i20', 'Program extension needed');
  
  if (result.success) {
    console.log('Request submitted:', result.request);
  }
};
```

## Error Handling

All API functions return a consistent format:
```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  error: "Error message here"
}
```

Always check for errors:
```typescript
const result = await api.signIn(email, password);

if (result.error) {
  console.error('Login failed:', result.error);
  // Show error to user
} else {
  console.log('Logged in:', result.session);
  // Proceed with authenticated actions
}
```

## Database Structure (KV Store)

Data is stored in the key-value store with these key patterns:

| Key Pattern | Description |
|-------------|-------------|
| `user:{userId}` | User profile |
| `visa:{userId}` | Visa profile |
| `doc:{userId}:{timestamp}` | Document record |
| `docs:user:{userId}` | Array of document IDs |
| `request:{userId}:{timestamp}` | Student request |
| `requests:university:{universityId}` | Array of request IDs |
| `docreq:{studentId}:{timestamp}` | Document request |
| `docreqs:student:{studentId}` | Array of doc request IDs |
| `sevis:log:{studentId}:{timestamp}` | SEVIS status change log |
| `email:log:{timestamp}` | Bulk email log |

## Next Steps

### To Connect a Real Component:

1. Import the API utilities:
```typescript
import * as api from '../utils/api';
```

2. Use React hooks for state management:
```typescript
const [session, setSession] = useState(null);
const [profile, setProfile] = useState(null);

useEffect(() => {
  async function loadData() {
    const { session } = await api.getCurrentSession();
    if (session) {
      setSession(session);
      const { profile } = await api.getUserProfile();
      setProfile(profile);
    }
  }
  loadData();
}, []);
```

3. Handle user actions:
```typescript
const handleSignIn = async () => {
  const result = await api.signIn(email, password);
  if (!result.error) {
    setSession(result.session);
    // Redirect to dashboard
  }
};
```

## Testing Checklist

Use the Backend Demo page to verify:

- [ ] User can sign up
- [ ] User can sign in
- [ ] Profile data is displayed
- [ ] Visa profile can be updated
- [ ] Documents can be uploaded
- [ ] Error messages are shown for invalid inputs
- [ ] User can sign out

## Support

For issues or questions about the backend:
1. Check the browser console for error messages
2. Verify the API endpoint URL is correct
3. Ensure you're passing the correct authorization headers
4. Check that the user is signed in before making authenticated requests

## Production Considerations

Before going to production:

1. **Email Verification**: Configure a real email provider in Supabase
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Input Validation**: Add comprehensive validation on all endpoints
4. **Monitoring**: Set up logging and error tracking
5. **Backups**: Configure automatic database backups
6. **GDPR/Privacy**: Ensure compliance with data protection regulations
7. **File Scanning**: Add virus scanning for uploaded documents
8. **Encryption**: Consider additional encryption for sensitive documents
