# Pathly Platform - API Reference (v2.0)

**Database:** Relational (PostgreSQL via Supabase)  
**Architecture:** Service-based with Repository pattern  
**Base URL:** `https://kjzigbozunhisvmvxbxx.supabase.co/functions/v1/make-server-268175b3`

---

## 🔐 Authentication

All authenticated endpoints require:
```
Authorization: Bearer {access_token}
```

---

## 📚 API Endpoints

### **Authentication** (`/auth`)

#### Sign Up Student
```http
POST /auth/signup/student
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "password123",
  "name": "John Doe",
  "schoolId": "uuid"
}

Response:
{
  "success": true,
  "userId": "uuid",
  "message": "Student account created successfully"
}
```

#### Sign Up DSO
```http
POST /auth/signup/dso
Content-Type: application/json

{
  "email": "dso@university.edu",
  "password": "password123",
  "name": "Jane Smith",
  "schoolId": "uuid"
}

Response:
{
  "success": true,
  "userId": "uuid",
  "message": "DSO account created successfully"
}
```

---

### **Users** (`/users`)

#### Get My Profile
```http
GET /users/profile
Authorization: Bearer {token}

Response:
{
  "profile": {
    "id": "uuid",
    "school_id": "uuid",
    "email": "user@university.edu",
    "full_name": "John Doe",
    "role": "student",
    "status": "active",
    "created_at": "2026-03-10T..."
  }
}
```

#### Update My Profile
```http
PUT /users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "John M. Doe",
  "preferredName": "John",
  "phone": "+1234567890",
  "avatarUrl": "https://..."
}

Response:
{
  "success": true,
  "profile": {...}
}
```

---

### **Students** (`/students`)

#### Get My Student Profile (Students only)
```http
GET /students/my-profile
Authorization: Bearer {token}

Response:
{
  "user": {
    "id": "uuid",
    "email": "student@university.edu",
    "full_name": "John Doe",
    "role": "student"
  },
  "student": {
    "id": "uuid",
    "user_id": "uuid",
    "sevis_id": "N0012345678",
    "visa_type": "F-1",
    "visa_status": "active",
    "sevis_status": "Active",
    "compliance_status": "In Compliance",
    "visa_expiration_date": "2028-05-31"
  }
}
```

#### Get Students by School (DSO only)
```http
GET /students/school/{schoolId}
Authorization: Bearer {token}

Response:
{
  "students": [
    {
      "id": "uuid",
      "user": {...},
      "visa_type": "F-1",
      "visa_status": "active",
      "sevis_status": "Active"
    }
  ]
}
```

#### Update Student SEVIS Status (DSO only)
```http
PUT /students/{studentId}/sevis
Authorization: Bearer {token}
Content-Type: application/json

{
  "sevisStatus": "Active",
  "compliance": "In Compliance",
  "nextCheckDate": "2026-09-01"
}

Response:
{
  "success": true,
  "student": {...}
}
```

#### Update Student Visa Info (DSO only)
```http
PUT /students/{studentId}/visa
Authorization: Bearer {token}
Content-Type: application/json

{
  "visaType": "F-1",
  "visaStatus": "active",
  "visaExpirationDate": "2028-05-31"
}

Response:
{
  "success": true,
  "student": {...}
}
```

---

### **Requests** (`/requests`)

#### Submit Request (Students only)
```http
POST /requests/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "requestType": "opt",
  "requestName": "OPT Application",
  "reason": "Applying for post-completion work authorization",
  "priority": "High",
  "formData": {
    "employer": "Tech Corp",
    "startDate": "2026-07-01"
  },
  "uploadedFiles": []
}

Response:
{
  "success": true,
  "request": {
    "id": "uuid",
    "student_id": "uuid",
    "request_type": "opt",
    "status": "pending",
    "submitted_at": "2026-03-10T..."
  }
}
```

#### Get My Requests (Students only)
```http
GET /requests/my-requests
Authorization: Bearer {token}

Response:
{
  "requests": [
    {
      "id": "uuid",
      "request_type": "opt",
      "request_name": "OPT Application",
      "status": "pending",
      "submitted_at": "2026-03-10T...",
      "due_date": "2026-03-24T..."
    }
  ]
}
```

#### Get School Requests (DSO only)
```http
GET /requests/school/{schoolId}?status=pending&priority=High
Authorization: Bearer {token}

Response:
{
  "requests": [
    {
      "id": "uuid",
      "student": {
        "user": {
          "full_name": "John Doe",
          "email": "john@university.edu"
        }
      },
      "request_type": "opt",
      "status": "pending",
      "priority": "High",
      "submitted_at": "2026-03-10T..."
    }
  ]
}
```

#### Update Request Status (DSO only)
```http
PUT /requests/{requestId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "approved",
  "notes": "Application approved. I-20 will be issued within 5 business days.",
  "internalNotes": "Verified all documents"
}

Response:
{
  "success": true,
  "request": {...}
}
```

#### Get Request Statistics (DSO only)
```http
GET /requests/school/{schoolId}/stats
Authorization: Bearer {token}

Response:
{
  "stats": {
    "total": 25,
    "pending": 8,
    "in_review": 5,
    "approved": 10,
    "denied": 2
  }
}
```

---

### **Documents** (`/documents`)

#### Get My Documents (Students only)
```http
GET /documents/my-documents
Authorization: Bearer {token}

Response:
{
  "documents": [
    {
      "id": "uuid",
      "title": "I-20 Form",
      "document_type": "I-20",
      "file_name": "i20_john_doe.pdf",
      "uploaded_at": "2026-03-10T...",
      "status": "active"
    }
  ]
}
```

#### Get Student Documents (DSO or student)
```http
GET /documents/student/{studentId}
Authorization: Bearer {token}

Response:
{
  "documents": [...]
}
```

#### Get School Documents (DSO only)
```http
GET /documents/school/{schoolId}
Authorization: Bearer {token}

Response:
{
  "documents": [
    {
      "id": "uuid",
      "student": {
        "user": {
          "full_name": "John Doe"
        }
      },
      "title": "I-20 Form",
      "uploaded_at": "2026-03-10T..."
    }
  ]
}
```

#### Get Document Download URL
```http
GET /documents/{documentId}/download
Authorization: Bearer {token}

Response:
{
  "url": "https://...supabase.co/storage/v1/object/sign/..."
}
```

#### Upload Document (DSO only)
```http
POST /documents/upload
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": "uuid",
  "title": "I-20 Renewal",
  "documentType": "I-20",
  "category": "Immigration",
  "fileName": "i20_renewal.pdf",
  "fileSizeBytes": 524288,
  "fileType": "application/pdf",
  "storagePath": "documents/student-uuid/i20_renewal.pdf",
  "notes": "Renewed for program extension"
}

Response:
{
  "success": true,
  "document": {...}
}
```

#### Delete Document (DSO only)
```http
DELETE /documents/{documentId}
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

---

## 🔑 Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |

---

## 🛡️ Role-Based Access Control

| Endpoint | Student | DSO | Admin |
|----------|---------|-----|-------|
| POST /auth/signup/student | ✅ | ✅ | ✅ |
| POST /auth/signup/dso | ✅ | ✅ | ✅ |
| GET /users/profile | ✅ | ✅ | ✅ |
| PUT /users/profile | ✅ | ✅ | ✅ |
| GET /students/my-profile | ✅ | ❌ | ❌ |
| GET /students/school/:id | ❌ | ✅ | ✅ |
| PUT /students/:id/sevis | ❌ | ✅ | ✅ |
| POST /requests/submit | ✅ | ❌ | ❌ |
| GET /requests/my-requests | ✅ | ❌ | ❌ |
| GET /requests/school/:id | ❌ | ✅ | ✅ |
| PUT /requests/:id/status | ❌ | ✅ | ✅ |
| GET /documents/my-documents | ✅ | ❌ | ❌ |
| GET /documents/school/:id | ❌ | ✅ | ✅ |
| POST /documents/upload | ❌ | ✅ | ✅ |

---

## 📝 Common Error Responses

### Validation Error
```json
{
  "error": "Validation error",
  "details": "Email, password, name, and school ID are required",
  "timestamp": "2026-03-10T..."
}
```

### Authorization Error
```json
{
  "error": "Unauthorized",
  "details": "Invalid or expired token",
  "timestamp": "2026-03-10T..."
}
```

### Permission Error
```json
{
  "error": "Insufficient permissions",
  "required": ["dso", "admin"],
  "current": "student",
  "timestamp": "2026-03-10T..."
}
```

### Not Found Error
```json
{
  "error": "Resource not found",
  "details": "Student not found",
  "timestamp": "2026-03-10T..."
}
```

---

## 🔄 Migration from v1.0 (KV Store)

| Old Endpoint (v1.0) | New Endpoint (v2.0) |
|---------------------|---------------------|
| `/user/profile` | `/users/profile` |
| `/visa/profile` | `/students/my-profile` |
| `/requests/submit` | `/requests/submit` (same) |
| `/requests/my-requests` | `/requests/my-requests` (same) |
| `/requests/university/:id` | `/requests/school/:id` |
| `/documents` | `/documents/my-documents` |
| `/dso/students/:universityId` | `/students/school/:schoolId` |
| `/dso/sevis/:studentId` | `/students/:studentId/sevis` |
| `/dso/visa/:studentId` | `/students/:studentId/visa` |

---

## 📊 Database Schema

See `DATABASE_SCHEMA.sql` for complete table definitions.

**Tables:**
- `schools` - Universities/colleges
- `users` - All user accounts
- `students` - Extended student profiles
- `requests` - Student-initiated requests
- `request_actions` - DSO-initiated requests
- `responses` - Student responses
- `documents` - Document metadata
- `audit_logs` - Audit trail
- `roster_imports` - CSV imports
- `notifications` - In-app notifications

---

**Version:** 2.0.0  
**Last Updated:** March 10, 2026
