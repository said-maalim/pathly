# Pathly Platform - Refactor Roadmap

**Version:** 1.0  
**Date:** March 7, 2026  
**Objective:** Transform monolithic backend into modular, maintainable service architecture

---

## Table of Contents

1. [Refactor Overview](#refactor-overview)
2. [Current State Analysis](#current-state-analysis)
3. [Target Architecture](#target-architecture)
4. [Phase 1: Service Extraction](#phase-1-service-extraction)
5. [Phase 2: Data Layer Refactor](#phase-2-data-layer-refactor)
6. [Phase 3: Code Reorganization](#phase-3-code-reorganization)
7. [Phase 4: Testing & Documentation](#phase-4-testing--documentation)
8. [Implementation Timeline](#implementation-timeline)

---

## 1. Refactor Overview

### 1.1 Goals

✅ **Modularity:** Break monolithic `index.tsx` into focused service modules  
✅ **Maintainability:** Clear separation of concerns, easier to understand and modify  
✅ **Testability:** Independent unit tests for each service  
✅ **Scalability:** Prepare for future microservices architecture  
✅ **Type Safety:** Comprehensive TypeScript interfaces and validation  

### 1.2 Success Metrics

- **Code Coverage:** > 80% test coverage
- **File Size:** No file > 500 lines
- **Cyclomatic Complexity:** Max complexity of 10 per function
- **Documentation:** 100% of public APIs documented
- **Performance:** No regression in API response times

---

## 2. Current State Analysis

### 2.1 Problems with Current Architecture

❌ **Monolithic File:** `/supabase/functions/server/index.tsx` is 1594 lines  
❌ **No Separation:** All logic (auth, requests, documents) in one file  
❌ **Hard to Test:** Can't test individual services in isolation  
❌ **Code Duplication:** Similar patterns repeated across routes  
❌ **No Validation Layer:** Input validation mixed with business logic  
❌ **Poor Type Safety:** Inconsistent use of TypeScript interfaces  

### 2.2 Current File Structure

```
/supabase/functions/server/
├── index.tsx          (1594 lines - ALL backend logic)
└── kv_store.tsx       (87 lines - database interface)
```

### 2.3 Route Distribution (Current)

| Category | Line Range | Routes | Complexity |
|----------|-----------|--------|------------|
| Authentication | 120-272 | 3 | Medium |
| User Profiles | 277-385 | 4 | Low |
| Documents (Old) | 390-453 | 2 | Low |
| Student Requests | 458-755 | 4 | High |
| Document Requests | 606-673 | 2 | Medium |
| Student Management | 678-963 | 4 | Medium |
| Communications | 968-1003 | 1 | Low |
| Document Management | 1008-1177 | 4 | High |
| Request Actions | 1182-1592 | 5 | Very High |

**Total Complexity Score:** 47/100 (needs refactoring)

---

## 3. Target Architecture

### 3.1 New File Structure

```
/supabase/functions/server/
├── index.tsx                      # Main Hono app + route registration
├── config/
│   ├── database.ts               # Database connection config
│   ├── storage.ts                # Supabase Storage config
│   ├── feature-flags.ts          # Feature toggle configuration
│   └── constants.ts              # App-wide constants
├── middleware/
│   ├── auth.ts                   # Authentication middleware
│   ├── validation.ts             # Request validation middleware
│   ├── error-handler.ts          # Global error handling
│   └── logger.ts                 # Structured logging
├── services/
│   ├── auth/
│   │   ├── auth.service.ts       # Authentication business logic
│   │   ├── auth.types.ts         # Auth-related types
│   │   └── auth.routes.ts        # Auth route handlers
│   ├── users/
│   │   ├── users.service.ts      # User management logic
│   │   ├── users.types.ts        # User-related types
│   │   └── users.routes.ts       # User route handlers
│   ├── students/
│   │   ├── students.service.ts   # Student management logic
│   │   ├── students.types.ts     # Student-related types
│   │   ├── students.routes.ts    # Student route handlers
│   │   └── sevis.service.ts      # SEVIS status management
│   ├── requests/
│   │   ├── requests.service.ts   # Request management logic
│   │   ├── requests.types.ts     # Request-related types
│   │   ├── requests.routes.ts    # Request route handlers
│   │   └── request-actions.service.ts  # DSO request actions
│   ├── documents/
│   │   ├── documents.service.ts  # Document management logic
│   │   ├── documents.types.ts    # Document-related types
│   │   ├── documents.routes.ts   # Document route handlers
│   │   └── storage.service.ts    # Supabase Storage wrapper
│   ├── imports/
│   │   ├── imports.service.ts    # CSV import logic
│   │   ├── imports.types.ts      # Import-related types
│   │   ├── imports.routes.ts     # Import route handlers
│   │   └── roster-parser.ts      # CSV parsing utilities
│   ├── audit/
│   │   ├── audit.service.ts      # Audit logging service
│   │   ├── audit.types.ts        # Audit-related types
│   │   └── audit.routes.ts       # Audit route handlers
│   └── notifications/
│       ├── notifications.service.ts  # Notification service
│       ├── notifications.types.ts    # Notification types
│       └── notifications.routes.ts   # Notification routes
├── repositories/
│   ├── school.repository.ts      # School data access
│   ├── user.repository.ts        # User data access
│   ├── student.repository.ts     # Student data access
│   ├── request.repository.ts     # Request data access
│   ├── document.repository.ts    # Document data access
│   └── audit.repository.ts       # Audit log data access
├── utils/
│   ├── date.utils.ts             # Date formatting utilities
│   ├── validation.utils.ts       # Validation helpers
│   ├── error.utils.ts            # Error handling utilities
│   └── response.utils.ts         # Standard response formatters
└── types/
    ├── common.types.ts           # Shared types
    ├── database.types.ts         # Database types (auto-generated)
    └── api.types.ts              # API request/response types
```

### 3.2 Architecture Layers

```
┌─────────────────────────────────────────┐
│          Route Handlers (.routes.ts)    │  ← HTTP request/response
├─────────────────────────────────────────┤
│       Middleware (auth, validation)      │  ← Cross-cutting concerns
├─────────────────────────────────────────┤
│      Services (.service.ts)             │  ← Business logic
├─────────────────────────────────────────┤
│      Repositories (.repository.ts)      │  ← Data access
├─────────────────────────────────────────┤
│         Database (Supabase)             │  ← Persistence
└─────────────────────────────────────────┘
```

**Benefits:**
- Each layer has a single responsibility
- Easy to mock for testing
- Can swap implementations (e.g., different database)

---

## 4. Phase 1: Service Extraction

### 4.1 Authentication Service

**File:** `/services/auth/auth.service.ts`

```typescript
// /services/auth/auth.service.ts

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { SignupData, AuthResult } from './auth.types.ts';
import { userRepository } from '../../repositories/user.repository.ts';
import { studentRepository } from '../../repositories/student.repository.ts';
import { auditService } from '../audit/audit.service.ts';

export class AuthService {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }
  
  /**
   * Register a new student account
   */
  async signupStudent(data: SignupData): Promise<AuthResult> {
    // Validate university email
    if (!this.isValidUniversityEmail(data.email)) {
      throw new Error('Please use your university email address');
    }
    
    // Create Supabase Auth user
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: {
        name: data.name,
        userType: 'student',
        universityId: data.universityId
      },
      email_confirm: true
    });
    
    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }
    
    // Create user profile
    await userRepository.create({
      id: authData.user.id,
      schoolId: data.schoolId,
      email: data.email,
      fullName: data.name,
      role: 'student',
      status: 'active'
    });
    
    // Create student profile
    await studentRepository.create({
      userId: authData.user.id,
      schoolId: data.schoolId,
      visaStatus: 'pending'
    });
    
    // Log audit event
    await auditService.log({
      action: 'create',
      resourceType: 'user',
      resourceId: authData.user.id,
      description: `Student account created: ${data.email}`
    });
    
    return {
      success: true,
      userId: authData.user.id
    };
  }
  
  /**
   * Register a new DSO account
   */
  async signupDSO(data: SignupData): Promise<AuthResult> {
    // Similar implementation...
  }
  
  /**
   * Verify authentication token
   */
  async verifyToken(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid or expired token');
    }
    
    return user;
  }
  
  private isValidUniversityEmail(email: string): boolean {
    return email.includes('.edu');
  }
}

export const authService = new AuthService();
```

**File:** `/services/auth/auth.routes.ts`

```typescript
// /services/auth/auth.routes.ts

import { Hono } from 'npm:hono';
import { authService } from './auth.service.ts';
import { validateRequest } from '../../middleware/validation.ts';
import { signupStudentSchema, signupDSOSchema } from './auth.types.ts';

export const authRoutes = new Hono();

authRoutes.post('/signup/student', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validated = await validateRequest(signupStudentSchema, body);
    
    // Process signup
    const result = await authService.signupStudent(validated);
    
    return c.json({ success: true, userId: result.userId });
  } catch (error) {
    console.error('Student signup error:', error);
    return c.json({ error: error.message }, 400);
  }
});

authRoutes.post('/signup/dso', async (c) => {
  try {
    const body = await c.req.json();
    const validated = await validateRequest(signupDSOSchema, body);
    const result = await authService.signupDSO(validated);
    
    return c.json({ success: true, userId: result.userId });
  } catch (error) {
    console.error('DSO signup error:', error);
    return c.json({ error: error.message }, 400);
  }
});
```

**File:** `/services/auth/auth.types.ts`

```typescript
// /services/auth/auth.types.ts

export interface SignupData {
  email: string;
  password: string;
  name: string;
  universityId?: string;
  schoolId: string;
}

export interface AuthResult {
  success: boolean;
  userId: string;
  message?: string;
}

// Validation schemas (using Zod or similar)
export const signupStudentSchema = {
  email: { type: 'string', required: true, format: 'email' },
  password: { type: 'string', required: true, minLength: 8 },
  name: { type: 'string', required: true },
  universityId: { type: 'string', required: true },
  schoolId: { type: 'string', required: true, format: 'uuid' }
};

export const signupDSOSchema = {
  email: { type: 'string', required: true, format: 'email' },
  password: { type: 'string', required: true, minLength: 8 },
  name: { type: 'string', required: true },
  universityId: { type: 'string', required: true },
  schoolId: { type: 'string', required: true, format: 'uuid' }
};
```

### 4.2 Students Service

**File:** `/services/students/students.service.ts`

```typescript
// /services/students/students.service.ts

import { studentRepository } from '../../repositories/student.repository.ts';
import { auditService } from '../audit/audit.service.ts';
import type { UpdateSEVISData, UpdateVisaData } from './students.types.ts';

export class StudentsService {
  /**
   * Get all students for a school
   */
  async getStudentsBySchool(schoolId: string) {
    return await studentRepository.findBySchool(schoolId);
  }
  
  /**
   * Get single student by ID
   */
  async getStudentById(studentId: string) {
    return await studentRepository.findById(studentId);
  }
  
  /**
   * Update SEVIS status
   */
  async updateSEVISStatus(
    studentId: string,
    data: UpdateSEVISData,
    updatedBy: string
  ) {
    const student = await studentRepository.findById(studentId);
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    // Update student record
    await studentRepository.update(studentId, {
      sevisStatus: data.sevisStatus,
      complianceStatus: data.compliance,
      nextComplianceCheckDate: data.nextCheckDate,
      sevisLastUpdatedAt: new Date().toISOString(),
      sevisLastUpdatedBy: updatedBy
    });
    
    // Log audit event
    await auditService.log({
      schoolId: student.schoolId,
      userId: updatedBy,
      action: 'update',
      resourceType: 'student',
      resourceId: studentId,
      description: `SEVIS status updated to ${data.sevisStatus}`,
      newValues: {
        sevisStatus: data.sevisStatus,
        compliance: data.compliance
      }
    });
    
    return { success: true };
  }
  
  /**
   * Update visa status
   */
  async updateVisaStatus(
    studentId: string,
    data: UpdateVisaData,
    updatedBy: string
  ) {
    // Similar implementation...
  }
}

export const studentsService = new StudentsService();
```

### 4.3 Requests Service

**File:** `/services/requests/requests.service.ts`

```typescript
// /services/requests/requests.service.ts

import { requestRepository } from '../../repositories/request.repository.ts';
import { studentRepository } from '../../repositories/student.repository.ts';
import { auditService } from '../audit/audit.service.ts';
import { notificationsService } from '../notifications/notifications.service.ts';
import type { SubmitRequestData, UpdateRequestData } from './requests.types.ts';

export class RequestsService {
  /**
   * Submit a new student request
   */
  async submitRequest(userId: string, data: SubmitRequestData) {
    // Get student profile
    const student = await studentRepository.findByUserId(userId);
    
    if (!student) {
      throw new Error('Student profile not found');
    }
    
    // Create request
    const request = await requestRepository.create({
      studentId: student.id,
      schoolId: student.schoolId,
      requestType: data.requestType,
      requestName: data.requestName,
      reason: data.reason,
      formData: data.formData,
      uploadedFiles: data.uploadedFiles,
      status: 'pending',
      priority: data.priority || 'Normal',
      dueDate: this.calculateDueDate(data.requestType)
    });
    
    // Create notification for DSOs
    await notificationsService.notifyDSOs(student.schoolId, {
      title: 'New Request Submitted',
      message: `${student.fullName} submitted a ${data.requestType} request`,
      type: 'new_request',
      relatedResourceType: 'request',
      relatedResourceId: request.id
    });
    
    // Log audit event
    await auditService.log({
      schoolId: student.schoolId,
      userId: userId,
      action: 'submit',
      resourceType: 'request',
      resourceId: request.id,
      description: `Request submitted: ${data.requestType}`
    });
    
    return request;
  }
  
  /**
   * Get requests for a student
   */
  async getStudentRequests(userId: string) {
    const student = await studentRepository.findByUserId(userId);
    
    if (!student) {
      throw new Error('Student profile not found');
    }
    
    return await requestRepository.findByStudent(student.id);
  }
  
  /**
   * Get requests for a school (DSO view)
   */
  async getSchoolRequests(schoolId: string, filters?: any) {
    return await requestRepository.findBySchool(schoolId, filters);
  }
  
  /**
   * Update request status
   */
  async updateRequestStatus(
    requestId: string,
    data: UpdateRequestData,
    updatedBy: string
  ) {
    const request = await requestRepository.findById(requestId);
    
    if (!request) {
      throw new Error('Request not found');
    }
    
    // Update request
    await requestRepository.update(requestId, {
      status: data.status,
      dsoNotes: data.notes,
      processedBy: updatedBy,
      completedAt: data.status === 'completed' ? new Date().toISOString() : null
    });
    
    // Notify student
    await notificationsService.notifyUser(request.studentUserId, {
      title: 'Request Updated',
      message: `Your ${request.requestType} request has been ${data.status}`,
      type: 'request_update',
      relatedResourceType: 'request',
      relatedResourceId: requestId
    });
    
    // Log audit
    await auditService.log({
      schoolId: request.schoolId,
      userId: updatedBy,
      action: data.status === 'approved' ? 'approve' : 'update',
      resourceType: 'request',
      resourceId: requestId,
      description: `Request ${data.status}`,
      oldValues: { status: request.status },
      newValues: { status: data.status }
    });
    
    return { success: true };
  }
  
  private calculateDueDate(requestType: string): string {
    const daysToAdd = requestType === 'urgent' ? 3 : 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate.toISOString();
  }
}

export const requestsService = new RequestsService();
```

### 4.4 Documents Service

**File:** `/services/documents/documents.service.ts`

```typescript
// /services/documents/documents.service.ts

import { documentRepository } from '../../repositories/document.repository.ts';
import { storageService } from './storage.service.ts';
import { auditService } from '../audit/audit.service.ts';
import type { UploadDocumentData } from './documents.types.ts';

export class DocumentsService {
  /**
   * Upload a document
   */
  async uploadDocument(data: UploadDocumentData, uploadedBy: string) {
    // Upload file to Supabase Storage
    const storagePath = await storageService.uploadFile(
      data.file,
      `${data.studentId}/${Date.now()}_${data.fileName}`
    );
    
    // Create document record
    const document = await documentRepository.create({
      studentId: data.studentId,
      schoolId: data.schoolId,
      title: data.title,
      documentType: data.documentType,
      category: data.category,
      fileName: data.fileName,
      fileSizeBytes: data.fileSizeBytes,
      fileType: data.fileType,
      storagePath: storagePath,
      storageBucket: 'documents',
      uploadedBy: uploadedBy,
      uploadedByRole: data.uploadedByRole,
      notes: data.notes
    });
    
    // Log audit event
    await auditService.log({
      schoolId: data.schoolId,
      userId: uploadedBy,
      action: 'upload',
      resourceType: 'document',
      resourceId: document.id,
      description: `Document uploaded: ${data.title}`
    });
    
    return document;
  }
  
  /**
   * Get documents for a student
   */
  async getStudentDocuments(studentId: string) {
    return await documentRepository.findByStudent(studentId);
  }
  
  /**
   * Get download URL for a document
   */
  async getDownloadUrl(documentId: string, userId: string) {
    const document = await documentRepository.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Verify access (student owns it or user is DSO at same school)
    const hasAccess = await this.verifyDocumentAccess(document, userId);
    
    if (!hasAccess) {
      throw new Error('Unauthorized access to document');
    }
    
    // Generate signed URL
    const signedUrl = await storageService.getSignedUrl(
      document.storagePath,
      3600 // 1 hour
    );
    
    // Log access
    await auditService.log({
      schoolId: document.schoolId,
      userId: userId,
      action: 'read',
      resourceType: 'document',
      resourceId: documentId,
      description: `Document accessed: ${document.title}`
    });
    
    return signedUrl;
  }
  
  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, deletedBy: string) {
    const document = await documentRepository.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Soft delete in database
    await documentRepository.softDelete(documentId);
    
    // Optionally delete from storage (or keep for audit)
    // await storageService.deleteFile(document.storagePath);
    
    // Log audit event
    await auditService.log({
      schoolId: document.schoolId,
      userId: deletedBy,
      action: 'delete',
      resourceType: 'document',
      resourceId: documentId,
      description: `Document deleted: ${document.title}`
    });
    
    return { success: true };
  }
  
  private async verifyDocumentAccess(document: any, userId: string): Promise<boolean> {
    // Implementation would check if user is student owner or DSO at school
    return true; // Simplified
  }
}

export const documentsService = new DocumentsService();
```

### 4.5 Audit Service

**File:** `/services/audit/audit.service.ts`

```typescript
// /services/audit/audit.service.ts

import { auditRepository } from '../../repositories/audit.repository.ts';
import type { AuditLogData } from './audit.types.ts';

export class AuditService {
  /**
   * Log an audit event
   */
  async log(data: AuditLogData) {
    return await auditRepository.create({
      schoolId: data.schoolId,
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      oldValues: data.oldValues,
      newValues: data.newValues,
      metadata: data.metadata
    });
  }
  
  /**
   * Get audit logs for a school
   */
  async getSchoolAuditLogs(schoolId: string, filters?: any) {
    return await auditRepository.findBySchool(schoolId, filters);
  }
  
  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(resourceType: string, resourceId: string) {
    return await auditRepository.findByResource(resourceType, resourceId);
  }
}

export const auditService = new AuditService();
```

---

## 5. Phase 2: Data Layer Refactor

### 5.1 Repository Pattern

Repositories handle all database operations:

**File:** `/repositories/student.repository.ts`

```typescript
// /repositories/student.repository.ts

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Student, CreateStudentData, UpdateStudentData } from '../types/database.types.ts';

class StudentRepository {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }
  
  async findById(id: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*, user:users(*), school:schools(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) throw new Error(`Failed to fetch student: ${error.message}`);
    return data;
  }
  
  async findByUserId(userId: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*, user:users(*), school:schools(*)')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();
    
    if (error) throw new Error(`Failed to fetch student: ${error.message}`);
    return data;
  }
  
  async findBySchool(schoolId: string): Promise<Student[]> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*, user:users(*)')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch students: ${error.message}`);
    return data || [];
  }
  
  async create(data: CreateStudentData): Promise<Student> {
    const { data: student, error } = await this.supabase
      .from('students')
      .insert(data)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create student: ${error.message}`);
    return student;
  }
  
  async update(id: string, data: UpdateStudentData): Promise<Student> {
    const { data: student, error } = await this.supabase
      .from('students')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update student: ${error.message}`);
    return student;
  }
  
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('students')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete student: ${error.message}`);
  }
}

export const studentRepository = new StudentRepository();
```

### 5.2 Type Definitions

**File:** `/types/database.types.ts`

```typescript
// /types/database.types.ts
// Auto-generated from Supabase schema

export interface School {
  id: string;
  name: string;
  code: string;
  // ... other fields
}

export interface User {
  id: string;
  schoolId: string;
  email: string;
  fullName: string;
  role: 'student' | 'dso' | 'admin';
  // ... other fields
}

export interface Student {
  id: string;
  userId: string;
  schoolId: string;
  sevisId?: string;
  visaType?: string;
  visaStatus: string;
  // ... other fields
  user?: User;
  school?: School;
}

export interface CreateStudentData {
  userId: string;
  schoolId: string;
  visaStatus: string;
  // ... required fields
}

export interface UpdateStudentData {
  visaType?: string;
  visaStatus?: string;
  sevisStatus?: string;
  // ... updatable fields
}
```

---

## 6. Phase 3: Code Reorganization

### 6.1 Main Application File

**File:** `/supabase/functions/server/index.tsx`

```typescript
// /supabase/functions/server/index.tsx

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';

// Middleware
import { errorHandler } from './middleware/error-handler.ts';
import { authMiddleware } from './middleware/auth.ts';

// Routes
import { authRoutes } from './services/auth/auth.routes.ts';
import { usersRoutes } from './services/users/users.routes.ts';
import { studentsRoutes } from './services/students/students.routes.ts';
import { requestsRoutes } from './services/requests/requests.routes.ts';
import { documentsRoutes } from './services/documents/documents.routes.ts';
import { importsRoutes } from './services/imports/imports.routes.ts';
import { auditRoutes } from './services/audit/audit.routes.ts';

// Initialize app
const app = new Hono();

// Global middleware
app.use('*', logger(console.log));
app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600
}));

// Health check
app.get('/make-server-268175b3/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount route modules
app.route('/make-server-268175b3/auth', authRoutes);
app.route('/make-server-268175b3/users', usersRoutes);
app.route('/make-server-268175b3/students', studentsRoutes);
app.route('/make-server-268175b3/requests', requestsRoutes);
app.route('/make-server-268175b3/documents', documentsRoutes);
app.route('/make-server-268175b3/imports', importsRoutes);
app.route('/make-server-268175b3/audit', auditRoutes);

// Global error handler
app.onError(errorHandler);

// Start server
Deno.serve(app.fetch);
```

**New file size:** ~50 lines (down from 1594!)

### 6.2 Middleware

**File:** `/middleware/auth.ts`

```typescript
// /middleware/auth.ts

import { Context, Next } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { userRepository } from '../repositories/user.repository.ts';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({ error: 'Missing authorization header' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  
  // Attach user to context
  c.set('user', user);
  c.set('userId', user.id);
  
  await next();
}

export async function requireRole(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    const user = await userRepository.findById(userId);
    
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    c.set('userRole', user.role);
    c.set('schoolId', user.schoolId);
    
    await next();
  };
}
```

**File:** `/middleware/error-handler.ts`

```typescript
// /middleware/error-handler.ts

import { Context } from 'npm:hono';

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);
  
  // Determine status code
  let status = 500;
  let message = 'Internal server error';
  
  if (err.message.includes('not found')) status = 404;
  if (err.message.includes('Unauthorized')) status = 401;
  if (err.message.includes('Forbidden')) status = 403;
  if (err.message.includes('validation')) status = 400;
  
  return c.json({
    error: message,
    details: err.message,
    timestamp: new Date().toISOString()
  }, status);
}
```

---

## 7. Phase 4: Testing & Documentation

### 7.1 Unit Tests

**File:** `/services/students/students.service.test.ts`

```typescript
// /services/students/students.service.test.ts

import { assertEquals, assertRejects } from 'https://deno.land/std/testing/asserts.ts';
import { studentsService } from './students.service.ts';
import { studentRepository } from '../../repositories/student.repository.ts';

// Mock repository
const mockStudentRepository = {
  findById: (id: string) => Promise.resolve({ id, fullName: 'Test Student' }),
  update: (id: string, data: any) => Promise.resolve({ id, ...data })
};

Deno.test('StudentsService - updateSEVISStatus', async () => {
  const result = await studentsService.updateSEVISStatus(
    'student-123',
    {
      sevisStatus: 'Active',
      compliance: 'In Compliance',
      nextCheckDate: '2026-06-01'
    },
    'dso-456'
  );
  
  assertEquals(result.success, true);
});

Deno.test('StudentsService - updateSEVISStatus throws for invalid student', async () => {
  await assertRejects(
    async () => {
      await studentsService.updateSEVISStatus('invalid-id', {}, 'dso-456');
    },
    Error,
    'Student not found'
  );
});
```

### 7.2 Integration Tests

**File:** `/services/requests/requests.integration.test.ts`

```typescript
// /services/requests/requests.integration.test.ts

import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';
import { requestsService } from './requests.service.ts';

Deno.test('RequestsService - full request workflow', async () => {
  // Submit request
  const request = await requestsService.submitRequest('user-123', {
    requestType: 'i20',
    requestName: 'I-20 Renewal',
    reason: 'Program extension',
    formData: { currentI20: 'N1234567' }
  });
  
  assertEquals(request.status, 'pending');
  
  // Update request status
  await requestsService.updateRequestStatus(
    request.id,
    { status: 'approved', notes: 'Approved' },
    'dso-456'
  );
  
  // Verify update
  const updated = await requestsService.getRequestById(request.id);
  assertEquals(updated.status, 'approved');
});
```

### 7.3 API Documentation

**File:** `/docs/API.md`

```markdown
# Pathly API Documentation

## Authentication

### Sign Up Student
POST /auth/signup/student

**Request:**
```json
{
  "email": "student@university.edu",
  "password": "securepassword",
  "name": "John Doe",
  "universityId": "university-001",
  "schoolId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "uuid"
}
```

## Students

### Get Students (DSO)
GET /students?schoolId={schoolId}

**Headers:**
- Authorization: Bearer {token}

**Response:**
```json
{
  "students": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@university.edu",
      "sevisStatus": "Active",
      "visaStatus": "active"
    }
  ]
}
```

... (continue for all endpoints)
```

---

## 8. Implementation Timeline

### Week 1: Planning & Setup
- [ ] Review and approve architecture design
- [ ] Set up feature flags
- [ ] Create new folder structure
- [ ] Set up testing framework

### Week 2-3: Service Extraction
- [ ] Extract Auth service
- [ ] Extract Students service
- [ ] Extract Requests service
- [ ] Extract Documents service
- [ ] Write unit tests for each service

### Week 4: Repository Layer
- [ ] Create repository classes
- [ ] Migrate from KV store to repositories
- [ ] Test repository operations

### Week 5: Middleware & Utilities
- [ ] Create authentication middleware
- [ ] Create validation middleware
- [ ] Create error handling utilities
- [ ] Add structured logging

### Week 6: Testing & Documentation
- [ ] Write integration tests
- [ ] Write API documentation
- [ ] Code review
- [ ] Performance testing

### Week 7: Deployment
- [ ] Deploy to staging
- [ ] Run full test suite
- [ ] Monitor for issues
- [ ] Deploy to production

### Week 8: Cleanup
- [ ] Archive old code
- [ ] Update team documentation
- [ ] Train team on new architecture
- [ ] Post-mortem & lessons learned

---

## 9. Success Checklist

✅ **Code Quality**
- [ ] All files < 500 lines
- [ ] Test coverage > 80%
- [ ] No console.log in production code
- [ ] All TypeScript types defined

✅ **Performance**
- [ ] API response time < 500ms (95th percentile)
- [ ] No N+1 query problems
- [ ] Proper database indexes

✅ **Documentation**
- [ ] All public APIs documented
- [ ] README updated
- [ ] Architecture diagrams created
- [ ] Migration guide written

✅ **Testing**
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Load tests pass
- [ ] Security audit complete

---

## 10. Maintenance Guidelines

### Adding a New Service

1. Create folder structure:
   ```
   /services/new-service/
   ├── new-service.service.ts
   ├── new-service.types.ts
   ├── new-service.routes.ts
   └── new-service.test.ts
   ```

2. Implement service class
3. Create repository if needed
4. Write tests
5. Register routes in `index.tsx`
6. Update API documentation

### Code Review Checklist

- [ ] Service methods have single responsibility
- [ ] Error handling is comprehensive
- [ ] Audit logging is in place
- [ ] Tests cover edge cases
- [ ] Documentation is updated
- [ ] Performance impact assessed

---

**End of Refactor Roadmap**
