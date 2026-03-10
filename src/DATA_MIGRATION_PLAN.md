# Pathly Platform - Data Migration Plan

**Version:** 1.0  
**Date:** March 7, 2026  
**Migration Type:** KV Store → Relational Database  
**Target:** Zero downtime migration with gradual rollout

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Migration Strategy](#migration-strategy)
4. [Data Mapping](#data-mapping)
5. [Migration Scripts](#migration-scripts)
6. [Validation & Testing](#validation--testing)
7. [Rollback Plan](#rollback-plan)
8. [Post-Migration Tasks](#post-migration-tasks)

---

## 1. Migration Overview

### 1.1 Current State

- **Single KV Table:** `kv_store_268175b3` with TEXT key and JSONB value
- **Key Prefixes:** 11 different prefixes for different entity types
- **Index Arrays:** Relationship tracking via arrays stored as values
- **Estimated Records:** ~5,000-10,000 across all entity types (MVP phase)

### 1.2 Target State

- **10 Relational Tables:** Normalized schema with proper foreign keys
- **Row Level Security:** Multi-tenant isolation at database level
- **Audit Logging:** Comprehensive change tracking
- **Performance Optimization:** Proper indexes and query optimization

### 1.3 Migration Goals

✅ **Zero data loss**  
✅ **Minimal downtime** (< 5 minutes)  
✅ **Preserve all relationships**  
✅ **Maintain backward compatibility during transition**  
✅ **Rollback capability**

---

## 2. Pre-Migration Checklist

### 2.1 Backup & Safety

- [ ] **Full database backup** of `kv_store_268175b3`
  ```sql
  pg_dump -h [host] -U [user] -t kv_store_268175b3 -f kv_store_backup_$(date +%Y%m%d).sql
  ```

- [ ] **Export KV data to JSON**
  ```sql
  COPY (
    SELECT key, value FROM kv_store_268175b3
  ) TO '/tmp/kv_store_export.json' WITH (FORMAT json);
  ```

- [ ] **Document current record counts**
  ```typescript
  // Run this via backend API
  const stats = {
    users: await kv.getByPrefix('user:'),
    visas: await kv.getByPrefix('visa:'),
    requests: await kv.getByPrefix('request:'),
    requestActions: await kv.getByPrefix('requestaction:'),
    documents: await kv.getByPrefix('document:'),
    responses: await kv.getByPrefix('response:')
  };
  console.log(JSON.stringify(stats, null, 2));
  ```

- [ ] **Verify Supabase Storage bucket access**
  ```typescript
  const { data: files } = await supabase.storage
    .from('make-268175b3-documents')
    .list();
  console.log(`Total files in storage: ${files.length}`);
  ```

### 2.2 Environment Setup

- [ ] **Create new schema** on Supabase dashboard (run `DATABASE_SCHEMA.sql`)
- [ ] **Test schema in staging environment** first
- [ ] **Set up migration service role** with appropriate permissions
- [ ] **Configure maintenance mode** flag in application

### 2.3 Code Preparation

- [ ] **Review and test migration scripts** (see Section 5)
- [ ] **Deploy dual-mode backend** (can read/write from both KV and relational)
- [ ] **Update frontend to handle migration states**
- [ ] **Prepare rollback scripts**

---

## 3. Migration Strategy

### 3.1 Phased Approach

We will use a **three-phase migration strategy** to minimize risk:

```
Phase 1: Shadow Mode (2-3 days)
├── New schema deployed
├── Writes go to KV store (primary)
├── Writes also go to relational DB (shadow)
└── Reads from KV store only

Phase 2: Dual-Read Mode (2-3 days)
├── Writes go to both stores
├── Reads from relational DB (primary)
├── Fallback to KV if not found
└── Log any discrepancies

Phase 3: Relational-Only Mode (ongoing)
├── Writes to relational DB only
├── Reads from relational DB only
├── KV store kept as backup for 30 days
└── Archive KV data after validation
```

### 3.2 Migration Windows

**Recommended Time:** **Sunday 2:00 AM - 5:00 AM EST** (lowest traffic)

| Phase | Duration | Downtime | Status Page |
|-------|----------|----------|-------------|
| Pre-migration | 1 hour | None | "Scheduled maintenance planned" |
| Schema deployment | 10 min | None | "Maintenance in progress" |
| Data migration | 30-60 min | Read-only mode | "System in maintenance mode" |
| Validation | 30 min | None | "Verifying system integrity" |
| Cutover | 5 min | Full downtime | "Brief maintenance window" |
| Post-validation | 30 min | None | "All systems operational" |

**Total Downtime:** < 5 minutes (during cutover only)

### 3.3 Feature Flags

Use feature flags to control migration phases:

```typescript
// /server/config/feature-flags.ts
export const MIGRATION_FLAGS = {
  USE_RELATIONAL_DB: false,           // Enable relational DB reads
  SHADOW_WRITE_ENABLED: false,        // Write to relational in background
  KV_FALLBACK_ENABLED: true,          // Fallback to KV on read failures
  MIGRATION_MODE: 'kv-only',          // 'kv-only' | 'shadow' | 'dual-read' | 'relational-only'
  MAINTENANCE_MODE: false             // Block all writes except migrations
};
```

---

## 4. Data Mapping

### 4.1 Schools Table

**Source:** Implicit from `universityId` field  
**Target:** `schools` table

```typescript
// Migration logic
const schoolCodes = new Set<string>();
const allUsers = await kv.getByPrefix('user:');
allUsers.forEach(user => {
  if (user.universityId) schoolCodes.add(user.universityId);
});

// Create schools
for (const code of schoolCodes) {
  await supabase.from('schools').insert({
    name: getSchoolName(code),  // Map code to name
    code: code,
    subscription_status: 'active'
  });
}
```

**Mapping:**
- `university-001` → School record with `code: 'university-001'`
- Generate proper school names from codes or use default names

---

### 4.2 Users Table

**Source:** `user:{userId}`  
**Target:** `users` table

```typescript
interface KVUser {
  id: string;
  email: string;
  name: string;
  userType: 'student' | 'dso' | 'regular';
  universityId?: string;
  createdAt: string;
}

// Migration mapping
const kvUser = await kv.get(`user:${userId}`);
const school = await supabase
  .from('schools')
  .select('id')
  .eq('code', kvUser.universityId)
  .single();

await supabase.from('users').insert({
  id: kvUser.id,  // Preserve Supabase Auth ID
  school_id: school.id,
  email: kvUser.email,
  full_name: kvUser.name,
  role: kvUser.userType,  // Direct mapping
  status: 'active',
  created_at: kvUser.createdAt
});
```

**Field Mapping:**
| KV Field | Relational Field | Transformation |
|----------|------------------|----------------|
| `id` | `id` | Direct |
| `email` | `email` | Direct |
| `name` | `full_name` | Direct |
| `userType` | `role` | Enum conversion |
| `universityId` | `school_id` | Lookup school UUID |
| `createdAt` | `created_at` | Direct |

---

### 4.3 Students Table

**Source:** `visa:{userId}`  
**Target:** `students` table

```typescript
interface KVVisa {
  userId: string;
  visaType: string | null;
  status: string;
  expirationDate: string | null;
  sevisStatus: string | null;
  compliance: string | null;
  passportStatus?: string;
  passportExpirationDate?: string;
  nextCheckDate?: string;
  lastUpdated?: string;
  updatedBy?: string;
  createdAt: string;
}

// Migration mapping
const kvVisa = await kv.get(`visa:${userId}`);
const user = await supabase
  .from('users')
  .select('id, school_id')
  .eq('id', userId)
  .single();

await supabase.from('students').insert({
  user_id: user.id,
  school_id: user.school_id,
  visa_type: kvVisa.visaType,
  visa_status: kvVisa.status,
  visa_expiration_date: kvVisa.expirationDate,
  sevis_status: kvVisa.sevisStatus,
  compliance_status: kvVisa.compliance,
  passport_expiration_date: kvVisa.passportExpirationDate,
  next_compliance_check_date: kvVisa.nextCheckDate,
  sevis_last_updated_at: kvVisa.lastUpdated,
  sevis_last_updated_by: kvVisa.updatedBy,
  created_at: kvVisa.createdAt
});
```

**Field Mapping:**
| KV Field | Relational Field | Transformation |
|----------|------------------|----------------|
| `userId` | `user_id` | Direct |
| `visaType` | `visa_type` | Enum conversion |
| `status` | `visa_status` | Enum conversion |
| `sevisStatus` | `sevis_status` | Enum conversion |
| `compliance` | `compliance_status` | Enum conversion |

---

### 4.4 Requests Table

**Source:** `request:{userId}:{timestamp}`  
**Target:** `requests` table

```typescript
interface KVRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  universityId: string;
  requestType: string;
  requestName: string;
  reason: string;
  formData: Record<string, any>;
  uploadedFiles: any[];
  status: string;
  priority: string;
  submittedAt: string;
  dueDate: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

// Migration mapping
const kvRequest = await kv.get(requestKey);
const student = await supabase
  .from('students')
  .select('id, school_id')
  .eq('user_id', kvRequest.userId)
  .single();

await supabase.from('requests').insert({
  student_id: student.id,
  school_id: student.school_id,
  request_type: kvRequest.requestType,
  request_name: kvRequest.requestName,
  reason: kvRequest.reason,
  form_data: kvRequest.formData,
  uploaded_files: kvRequest.uploadedFiles,
  status: kvRequest.status,
  priority: kvRequest.priority,
  submitted_at: kvRequest.submittedAt,
  due_date: kvRequest.dueDate,
  completed_at: kvRequest.processedAt,
  processed_by: kvRequest.processedBy,
  dso_notes: kvRequest.notes,
  created_at: kvRequest.submittedAt
});
```

**Special Handling:**
- Parse `id` to extract `userId` and `timestamp`
- Convert `status` strings to enum values
- Lookup `student_id` from `user_id`

---

### 4.5 Request Actions Table

**Source:** `requestaction:{universityId}:{timestamp}`  
**Target:** `request_actions` table

```typescript
interface KVRequestAction {
  id: string;
  universityId: string;
  title: string;
  type: 'document' | 'form' | 'confirmation';
  sentTo: 'Single' | 'Bulk';
  targetStudent: string | null;
  bulkFilter: string | null;
  targetCount: number;
  deadline: string;
  completionPercent: number;
  completedCount: number;
  totalCount: number;
  status: string;
  createdAt: string;
  createdBy: string;
  // ... type-specific fields
}

// Migration mapping
const kvAction = await kv.get(actionKey);
const school = await supabase
  .from('schools')
  .select('id')
  .eq('code', kvAction.universityId)
  .single();

let targetStudentUuid = null;
if (kvAction.sentTo === 'Single' && kvAction.targetStudent) {
  const student = await supabase
    .from('students')
    .select('id')
    .eq('user_id', kvAction.targetStudent)
    .single();
  targetStudentUuid = student.id;
}

await supabase.from('request_actions').insert({
  school_id: school.id,
  title: kvAction.title,
  type: kvAction.type,
  target_type: kvAction.sentTo.toLowerCase(),
  target_student_id: targetStudentUuid,
  target_filter: kvAction.bulkFilter ? { filter: kvAction.bulkFilter } : null,
  target_count: kvAction.targetCount,
  deadline: kvAction.deadline,
  completed_count: kvAction.completedCount,
  total_responses: kvAction.totalCount,
  completion_percent: kvAction.completionPercent,
  status: kvAction.status,
  created_at: kvAction.createdAt,
  created_by: kvAction.createdBy,
  // ... map type-specific fields
});
```

---

### 4.6 Responses Table

**Source:** `response:{requestActionId}:{studentId}`  
**Target:** `responses` table

```typescript
interface KVResponse {
  id: string;
  requestActionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  data: Record<string, any>;
  documentUrl: string | null;
  submittedAt: string;
}

// Migration mapping
const kvResponse = await kv.get(responseKey);
const requestAction = await supabase
  .from('request_actions')
  .select('id, school_id')
  // Match by parsing original KV key
  .single();

const student = await supabase
  .from('students')
  .select('id')
  .eq('user_id', kvResponse.studentId)
  .single();

await supabase.from('responses').insert({
  request_action_id: requestAction.id,
  student_id: student.id,
  school_id: requestAction.school_id,
  response_data: kvResponse.data,
  document_url: kvResponse.documentUrl,
  submitted_at: kvResponse.submittedAt,
  created_at: kvResponse.submittedAt
});
```

---

### 4.7 Documents Table

**Source:** `document:{studentId}:{timestamp}`  
**Target:** `documents` table

```typescript
interface KVDocument {
  id: string;
  studentId: string;
  title: string;
  type: string;
  uploadedBy: string;
  uploadedDate: string;
  fileName: string;
  fileUrl: string;
  notes: string;
  status: string;
  createdAt: string;
}

// Migration mapping
const kvDoc = await kv.get(docKey);
const student = await supabase
  .from('students')
  .select('id, school_id, user_id')
  .eq('user_id', kvDoc.studentId)
  .single();

// Try to find uploader user ID
let uploadedByUuid = null;
if (kvDoc.uploadedBy !== 'DSO Office') {
  const uploader = await supabase
    .from('users')
    .select('id')
    .eq('full_name', kvDoc.uploadedBy)
    .eq('school_id', student.school_id)
    .single();
  uploadedByUuid = uploader?.id;
}

await supabase.from('documents').insert({
  student_id: student.id,
  school_id: student.school_id,
  title: kvDoc.title,
  document_type: kvDoc.type,
  file_name: kvDoc.fileName,
  storage_path: extractStoragePath(kvDoc.fileUrl),
  storage_bucket: 'make-268175b3-documents',
  status: kvDoc.status,
  uploaded_by: uploadedByUuid || student.user_id,  // Fallback to student
  uploaded_by_role: uploadedByUuid ? 'dso' : 'student',
  notes: kvDoc.notes,
  uploaded_at: kvDoc.uploadedDate,
  created_at: kvDoc.createdAt
});
```

---

### 4.8 Audit Logs Table

**Source:** `sevis:log:{studentId}:{timestamp}` and `email:log:{timestamp}`  
**Target:** `audit_logs` table

```typescript
// SEVIS logs
interface KVSEVISLog {
  studentId: string;
  sevisStatus: string;
  compliance: string;
  notes: string;
  updatedBy: string;
  updatedAt: string;
}

const kvLog = await kv.get(logKey);
const student = await supabase
  .from('students')
  .select('id, school_id')
  .eq('user_id', kvLog.studentId)
  .single();

await supabase.from('audit_logs').insert({
  school_id: student.school_id,
  user_id: kvLog.updatedBy,
  action: 'update',
  resource_type: 'student',
  resource_id: student.id,
  description: `SEVIS status updated to ${kvLog.sevisStatus}, compliance: ${kvLog.compliance}`,
  new_values: {
    sevis_status: kvLog.sevisStatus,
    compliance: kvLog.compliance,
    notes: kvLog.notes
  },
  created_at: kvLog.updatedAt
});
```

---

### 4.9 Handling Index Arrays

**Source:** Arrays like `requests:university:{universityId}`  
**Action:** These become implicit via foreign keys, no migration needed

The relational schema eliminates the need for index arrays:

❌ **Old:** `requests:university:university-001` → `["request:user1:123", "request:user2:456"]`

✅ **New:** Query directly: `SELECT * FROM requests WHERE school_id = ?`

---

## 5. Migration Scripts

### 5.1 Master Migration Script

```typescript
// /server/migrations/run-migration.ts

import { kv } from '../kv_store';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MigrationStats {
  schools: { created: number; errors: number };
  users: { created: number; errors: number };
  students: { created: number; errors: number };
  requests: { created: number; errors: number };
  requestActions: { created: number; errors: number };
  responses: { created: number; errors: number };
  documents: { created: number; errors: number };
  auditLogs: { created: number; errors: number };
}

export async function runFullMigration(): Promise<MigrationStats> {
  console.log('🚀 Starting full migration...');
  
  const stats: MigrationStats = {
    schools: { created: 0, errors: 0 },
    users: { created: 0, errors: 0 },
    students: { created: 0, errors: 0 },
    requests: { created: 0, errors: 0 },
    requestActions: { created: 0, errors: 0 },
    responses: { created: 0, errors: 0 },
    documents: { created: 0, errors: 0 },
    auditLogs: { created: 0, errors: 0 }
  };

  try {
    // Step 1: Migrate schools
    console.log('📚 Migrating schools...');
    await migrateSchools(stats);
    
    // Step 2: Migrate users
    console.log('👤 Migrating users...');
    await migrateUsers(stats);
    
    // Step 3: Migrate students
    console.log('🎓 Migrating students...');
    await migrateStudents(stats);
    
    // Step 4: Migrate requests
    console.log('📝 Migrating requests...');
    await migrateRequests(stats);
    
    // Step 5: Migrate request actions
    console.log('📋 Migrating request actions...');
    await migrateRequestActions(stats);
    
    // Step 6: Migrate responses
    console.log('💬 Migrating responses...');
    await migrateResponses(stats);
    
    // Step 7: Migrate documents
    console.log('📄 Migrating documents...');
    await migrateDocuments(stats);
    
    // Step 8: Migrate audit logs
    console.log('📊 Migrating audit logs...');
    await migrateAuditLogs(stats);
    
    console.log('✅ Migration completed!');
    console.log(JSON.stringify(stats, null, 2));
    
    return stats;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function migrateSchools(stats: MigrationStats) {
  // Get all unique university IDs
  const allUsers = await kv.getByPrefix('user:');
  const schoolCodes = new Set<string>();
  
  allUsers.forEach(user => {
    if (user.universityId) {
      schoolCodes.add(user.universityId);
    }
  });
  
  console.log(`Found ${schoolCodes.size} unique schools`);
  
  for (const code of schoolCodes) {
    try {
      const { error } = await supabase.from('schools').insert({
        name: getSchoolName(code),
        code: code,
        subscription_status: 'active',
        subscription_plan: 'standard',
        student_limit: 2000
      });
      
      if (error) throw error;
      stats.schools.created++;
    } catch (error) {
      console.error(`Error creating school ${code}:`, error);
      stats.schools.errors++;
    }
  }
}

async function migrateUsers(stats: MigrationStats) {
  const allKvUsers = await kv.getByPrefix('user:');
  console.log(`Found ${allKvUsers.length} users to migrate`);
  
  for (const kvUser of allKvUsers) {
    try {
      // Get school ID
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('code', kvUser.universityId)
        .single();
      
      if (!school) {
        throw new Error(`School not found for code: ${kvUser.universityId}`);
      }
      
      const { error } = await supabase.from('users').insert({
        id: kvUser.id,
        school_id: school.id,
        email: kvUser.email,
        full_name: kvUser.name,
        role: kvUser.userType,
        status: 'active',
        created_at: kvUser.createdAt
      });
      
      if (error) throw error;
      stats.users.created++;
    } catch (error) {
      console.error(`Error migrating user ${kvUser.id}:`, error);
      stats.users.errors++;
    }
  }
}

async function migrateStudents(stats: MigrationStats) {
  const allKvVisas = await kv.getByPrefix('visa:');
  console.log(`Found ${allKvVisas.length} student visa profiles to migrate`);
  
  for (const kvVisa of allKvVisas) {
    try {
      // Get user and school
      const { data: user } = await supabase
        .from('users')
        .select('id, school_id')
        .eq('id', kvVisa.userId)
        .single();
      
      if (!user) {
        throw new Error(`User not found for ID: ${kvVisa.userId}`);
      }
      
      const { error } = await supabase.from('students').insert({
        user_id: user.id,
        school_id: user.school_id,
        visa_type: kvVisa.visaType,
        visa_status: kvVisa.status || 'pending',
        visa_expiration_date: kvVisa.expirationDate,
        sevis_status: kvVisa.sevisStatus,
        compliance_status: kvVisa.compliance || 'N/A',
        passport_expiration_date: kvVisa.passportExpirationDate,
        next_compliance_check_date: kvVisa.nextCheckDate,
        sevis_last_updated_at: kvVisa.lastUpdated,
        sevis_last_updated_by: kvVisa.updatedBy,
        created_at: kvVisa.createdAt
      });
      
      if (error) throw error;
      stats.students.created++;
    } catch (error) {
      console.error(`Error migrating student ${kvVisa.userId}:`, error);
      stats.students.errors++;
    }
  }
}

// ... Continue with other migrate functions

function getSchoolName(code: string): string {
  const schoolNames: Record<string, string> = {
    'university-001': 'Example University',
    'university-002': 'Sample College',
    // Add more mappings as needed
  };
  
  return schoolNames[code] || `University ${code}`;
}
```

### 5.2 Validation Script

```typescript
// /server/migrations/validate-migration.ts

export async function validateMigration() {
  console.log('🔍 Validating migration...');
  
  // Count records in KV
  const kvCounts = {
    users: (await kv.getByPrefix('user:')).length,
    visas: (await kv.getByPrefix('visa:')).length,
    requests: (await kv.getByPrefix('request:')).length,
    requestActions: (await kv.getByPrefix('requestaction:')).length,
    responses: (await kv.getByPrefix('response:')).length,
    documents: (await kv.getByPrefix('document:')).length
  };
  
  // Count records in relational DB
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  const { count: studentsCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  const { count: requestsCount } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true });
  
  const { count: requestActionsCount } = await supabase
    .from('request_actions')
    .select('*', { count: 'exact', head: true });
  
  const { count: responsesCount } = await supabase
    .from('responses')
    .select('*', { count: 'exact', head: true });
  
  const { count: documentsCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true });
  
  const validation = {
    users: { kv: kvCounts.users, db: usersCount, match: kvCounts.users === usersCount },
    students: { kv: kvCounts.visas, db: studentsCount, match: kvCounts.visas === studentsCount },
    requests: { kv: kvCounts.requests, db: requestsCount, match: kvCounts.requests === requestsCount },
    requestActions: { kv: kvCounts.requestActions, db: requestActionsCount, match: kvCounts.requestActions === requestActionsCount },
    responses: { kv: kvCounts.responses, db: responsesCount, match: kvCounts.responses === responsesCount },
    documents: { kv: kvCounts.documents, db: documentsCount, match: kvCounts.documents === documentsCount }
  };
  
  console.log('Validation Results:');
  console.log(JSON.stringify(validation, null, 2));
  
  const allMatch = Object.values(validation).every(v => v.match);
  
  if (allMatch) {
    console.log('✅ All record counts match!');
  } else {
    console.log('⚠️  Record count mismatches detected!');
  }
  
  return validation;
}
```

---

## 6. Validation & Testing

### 6.1 Unit Tests

Test each migration function individually:

```typescript
describe('Migration Functions', () => {
  it('should migrate schools correctly', async () => {
    const stats = { schools: { created: 0, errors: 0 } };
    await migrateSchools(stats);
    expect(stats.schools.created).toBeGreaterThan(0);
    expect(stats.schools.errors).toBe(0);
  });
  
  it('should preserve user relationships', async () => {
    const kvUser = await kv.get('user:abc123');
    const dbUser = await supabase
      .from('users')
      .select('*, school:schools(*)')
      .eq('id', 'abc123')
      .single();
    
    expect(dbUser.data.email).toBe(kvUser.email);
    expect(dbUser.data.school.code).toBe(kvUser.universityId);
  });
});
```

### 6.2 Integration Tests

Test end-to-end workflows:

```typescript
describe('Post-Migration API Tests', () => {
  it('should fetch student profile', async () => {
    const response = await fetch('/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok).toBe(true);
  });
  
  it('should submit request', async () => {
    const response = await fetch('/requests/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        requestType: 'i20',
        requestName: 'I-20 Renewal',
        reason: 'Test'
      })
    });
    expect(response.ok).toBe(true);
  });
});
```

### 6.3 Data Integrity Checks

```sql
-- Check for orphaned records
SELECT COUNT(*) FROM students WHERE user_id NOT IN (SELECT id FROM users);
SELECT COUNT(*) FROM requests WHERE student_id NOT IN (SELECT id FROM students);
SELECT COUNT(*) FROM responses WHERE request_action_id NOT IN (SELECT id FROM request_actions);

-- Check for missing relationships
SELECT COUNT(*) FROM users WHERE school_id IS NULL;
SELECT COUNT(*) FROM students WHERE school_id IS NULL;

-- Verify foreign key constraints
SELECT * FROM pg_constraint WHERE contype = 'f';
```

---

## 7. Rollback Plan

### 7.1 Rollback Triggers

Rollback if:
- Migration errors exceed 5% of total records
- Data validation fails
- Critical API endpoints return errors > 10%
- User reports of data loss

### 7.2 Rollback Procedure

```typescript
// /server/migrations/rollback.ts

export async function rollbackMigration() {
  console.log('⏪ Rolling back migration...');
  
  // Step 1: Switch feature flags back to KV-only mode
  MIGRATION_FLAGS.MIGRATION_MODE = 'kv-only';
  MIGRATION_FLAGS.USE_RELATIONAL_DB = false;
  
  // Step 2: Clear relational tables (in reverse order)
  await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('request_actions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('schools').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Step 3: Verify KV store is intact
  const kvCounts = {
    users: (await kv.getByPrefix('user:')).length,
    visas: (await kv.getByPrefix('visa:')).length
  };
  
  console.log(`✅ Rollback complete. KV store has ${kvCounts.users} users and ${kvCounts.visas} visa profiles.`);
  
  // Step 4: Deploy previous backend version
  // (Manual step via deployment pipeline)
}
```

### 7.3 Backup Restoration

If KV store was corrupted:

```sql
-- Restore from backup
psql -h [host] -U [user] -d [database] < kv_store_backup_YYYYMMDD.sql
```

---

## 8. Post-Migration Tasks

### 8.1 Immediate (Day 1)

- [ ] **Monitor error rates** in production
- [ ] **Run validation script** every 6 hours
- [ ] **Check audit logs** for anomalies
- [ ] **Survey key users** for data accuracy

### 8.2 Week 1

- [ ] **Performance testing** (query times, page load)
- [ ] **Verify RLS policies** are working correctly
- [ ] **Test all API endpoints** with production data
- [ ] **Document any discrepancies**

### 8.3 Month 1

- [ ] **Archive KV store** (keep as read-only backup)
- [ ] **Optimize slow queries** (add indexes if needed)
- [ ] **Enable audit log retention** policies
- [ ] **Train DSOs** on new database structure (if they have direct access)

### 8.4 Cleanup (After 30 Days)

```sql
-- Archive KV store to cold storage
CREATE TABLE kv_store_268175b3_archive AS 
SELECT * FROM kv_store_268175b3;

-- Drop original table (CAUTION: Only after full validation)
-- DROP TABLE kv_store_268175b3;
```

---

## 9. Monitoring & Alerts

### 9.1 Key Metrics

- **API Response Time:** Should remain < 500ms
- **Error Rate:** Should be < 1%
- **Database Query Time:** Monitor slow queries (> 1s)
- **Storage Usage:** Track document storage growth

### 9.2 Alert Thresholds

```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    action: Notify DevOps team
  
  - name: Slow Queries
    condition: query_time > 2s
    action: Log query for optimization
  
  - name: Data Mismatch
    condition: kv_count != db_count
    action: Trigger validation script
```

---

## 10. Success Criteria

✅ **Migration is successful if:**

1. All record counts match between KV and relational DB
2. Zero data loss (verified by user testing)
3. API response times remain consistent (< 20% degradation)
4. All user workflows function correctly
5. RLS policies prevent unauthorized access
6. Audit trail captures all changes
7. No critical bugs reported in first week

---

## 11. Contact & Escalation

**Migration Lead:** [Your Name]  
**DevOps Team:** devops@pathly.com  
**Emergency Hotline:** [Phone Number]

**Escalation Path:**
1. Migration Engineer (Day-to-day issues)
2. Senior Backend Engineer (Technical blockers)
3. CTO (Business-critical failures)

---

## Appendix A: Migration Timeline

| Date | Task | Owner | Status |
|------|------|-------|--------|
| March 8 | Schema deployment to staging | Backend | ⏳ Pending |
| March 10 | Migration script testing | Backend | ⏳ Pending |
| March 12 | Validation script testing | QA | ⏳ Pending |
| March 14 | Code review & approval | Tech Lead | ⏳ Pending |
| March 16 | **Production migration** | DevOps | ⏳ Pending |
| March 17-23 | Monitoring period | All | ⏳ Pending |
| April 15 | KV store archival | DevOps | ⏳ Pending |

---

**End of Migration Plan**
