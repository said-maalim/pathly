# Staging Setup & Migration Testing Guide

**Version:** 1.0  
**Date:** March 8, 2026  
**Purpose:** Execute database schema and test migration scripts in staging environment

---

## Table of Contents

1. [Create Staging Environment](#1-create-staging-environment)
2. [Execute Database Schema](#2-execute-database-schema)
3. [Create Sample Data](#3-create-sample-data)
4. [Build Migration Scripts](#4-build-migration-scripts)
5. [Test Migration](#5-test-migration)
6. [Validate Results](#6-validate-results)

---

## 1. Create Staging Environment

### Option A: Create New Supabase Project (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account

2. **Create New Project**
   - Click "New Project"
   - Name: `pathly-staging`
   - Database Password: Generate a strong password and save it securely
   - Region: Same as production (for consistency)
   - Pricing: Free tier is fine for testing

3. **Wait for Project Setup**
   - Takes 2-3 minutes to provision
   - Note down your project credentials:
     - Project URL: `https://[project-id].supabase.co`
     - Anon Key: `eyJ...` (public)
     - Service Role Key: `eyJ...` (secret - keep secure)

4. **Save Credentials**
   Create a `.env.staging` file (DO NOT commit to git):
   ```bash
   SUPABASE_URL=https://your-staging-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
   SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-staging-project.supabase.co:5432/postgres
   ```

### Option B: Use Production with Separate Schema (Not Recommended)

If you must use production (not recommended for testing):
```sql
-- Create separate schema
CREATE SCHEMA staging;
SET search_path TO staging;
-- Then run all DDL statements
```

---

## 2. Execute Database Schema

### Method 1: Using Supabase SQL Editor (Easiest)

1. **Open SQL Editor**
   - Go to Supabase Dashboard → SQL Editor
   - Click "New Query"

2. **Copy Schema in Sections**
   
   The schema is large (~1000 lines), so execute in sections:

   **Section 1: Extensions & Enums** (Lines 1-80)
   ```sql
   -- Copy from DATABASE_SCHEMA.sql lines 1-80
   -- Extensions and ENUM definitions
   ```
   Click "Run" and verify no errors

   **Section 2: Tables** (Lines 81-600)
   ```sql
   -- Copy schools table
   -- Copy users table
   -- Copy students table
   -- etc.
   ```
   Execute each table individually and check for errors

   **Section 3: Indexes & Triggers** (Lines 601-800)
   ```sql
   -- Copy all indexes
   -- Copy all triggers
   ```

   **Section 4: RLS Policies** (Lines 801-1000)
   ```sql
   -- Copy RLS enable statements
   -- Copy all policies
   ```

3. **Verify Execution**
   - Check for any error messages
   - Go to "Table Editor" tab to see your new tables

### Method 2: Using psql Command Line

1. **Install PostgreSQL Client**
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # Windows
   # Download from: https://www.postgresql.org/download/windows/
   ```

2. **Connect to Staging Database**
   ```bash
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
   ```

3. **Execute Schema File**
   ```bash
   # From project root
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" \
     -f DATABASE_SCHEMA.sql
   ```

4. **Check for Errors**
   ```bash
   # If errors occur, check the output
   # Fix any issues and re-run
   ```

### Method 3: Using Migration File (Supabase CLI)

1. **Install Supabase CLI**
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # Windows (via scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   
   # Linux
   npm install -g supabase
   ```

2. **Link to Staging Project**
   ```bash
   supabase link --project-ref [your-staging-project-id]
   ```

3. **Create Migration**
   ```bash
   supabase migration new initial_schema
   ```

4. **Copy Schema to Migration File**
   ```bash
   # This creates: supabase/migrations/[timestamp]_initial_schema.sql
   # Copy contents of DATABASE_SCHEMA.sql to this file
   cp DATABASE_SCHEMA.sql supabase/migrations/20260308000000_initial_schema.sql
   ```

5. **Apply Migration**
   ```bash
   supabase db push
   ```

---

## 3. Create Sample Data

Now let's populate the staging database with realistic test data.

### Sample Data Script

Create a file: `/staging/seed-sample-data.sql`

```sql
-- =====================================================
-- Pathly Staging - Sample Data Seed Script
-- =====================================================

-- Insert Sample Schools
INSERT INTO schools (id, name, code, sevis_school_code, subscription_status, subscription_plan, student_limit)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Stanford University', 'stanford', 'SEV2013123456', 'active', 'enterprise', 5000),
  ('22222222-2222-2222-2222-222222222222', 'MIT', 'mit', 'SEV2013234567', 'active', 'professional', 3000),
  ('33333333-3333-3333-3333-333333333333', 'UC Berkeley', 'ucb', 'SEV2013345678', 'active', 'standard', 2000);

-- Insert Sample DSO Users
INSERT INTO users (id, school_id, email, full_name, role, status, created_at)
VALUES
  ('dso-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'dso@stanford.edu', 'Sarah Johnson', 'dso', 'active', NOW()),
  ('dso-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'dso@mit.edu', 'Michael Chen', 'dso', 'active', NOW()),
  ('dso-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'dso@berkeley.edu', 'Lisa Martinez', 'dso', 'active', NOW());

-- Insert Sample Student Users
INSERT INTO users (id, school_id, email, full_name, role, status, created_at)
VALUES
  ('std-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'john.doe@stanford.edu', 'John Doe', 'student', 'active', NOW() - INTERVAL '6 months'),
  ('std-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'jane.smith@stanford.edu', 'Jane Smith', 'student', 'active', NOW() - INTERVAL '1 year'),
  ('std-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'raj.patel@mit.edu', 'Raj Patel', 'student', 'active', NOW() - INTERVAL '2 months'),
  ('std-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'maria.garcia@mit.edu', 'Maria Garcia', 'student', 'active', NOW() - INTERVAL '8 months'),
  ('std-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'wei.zhang@berkeley.edu', 'Wei Zhang', 'student', 'active', NOW() - INTERVAL '3 months');

-- Insert Sample Student Profiles
INSERT INTO students (id, user_id, school_id, student_id_number, sevis_id, program_of_study, degree_level, major, 
                     visa_type, visa_status, visa_expiration_date, sevis_status, compliance_status, created_at)
VALUES
  ('s-1111-1111-1111-111111111111', 'std-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 
   'STU001', 'N0012345678', 'Computer Science', 'Graduate', 'Artificial Intelligence',
   'F-1', 'active', '2028-05-31', 'Active', 'In Compliance', NOW() - INTERVAL '6 months'),
   
  ('s-2222-2222-2222-222222222222', 'std-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'STU002', 'N0012345679', 'Electrical Engineering', 'PhD', 'Robotics',
   'F-1', 'active', '2027-12-31', 'Active', 'In Compliance', NOW() - INTERVAL '1 year'),
   
  ('s-3333-3333-3333-333333333333', 'std-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'STU003', 'N0012345680', 'Business Administration', 'Graduate', 'MBA',
   'F-1', 'active', '2027-08-31', 'Active', 'In Compliance', NOW() - INTERVAL '2 months'),
   
  ('s-4444-4444-4444-444444444444', 'std-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
   'STU004', 'N0012345681', 'Physics', 'PhD', 'Quantum Computing',
   'F-1', 'active', '2029-01-15', 'Active', 'In Compliance', NOW() - INTERVAL '8 months'),
   
  ('s-5555-5555-5555-555555555555', 'std-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333',
   'STU005', 'N0012345682', 'Data Science', 'Graduate', 'Machine Learning',
   'F-1', 'active', '2028-09-30', 'Active', 'In Compliance', NOW() - INTERVAL '3 months');

-- Insert Sample Requests (Student → DSO)
INSERT INTO requests (id, student_id, school_id, request_type, request_name, reason, status, priority, 
                     form_data, submitted_at, due_date, created_at)
VALUES
  ('req-1111-1111-1111-111111111111', 's-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'opt', 'OPT Application', 'Applying for Optional Practical Training after graduation',
   'pending', 'High', '{"graduationDate": "2026-06-15", "employer": "Tech Corp"}',
   NOW() - INTERVAL '2 days', NOW() + INTERVAL '12 days', NOW() - INTERVAL '2 days'),
   
  ('req-2222-2222-2222-222222222222', 's-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'travel', 'Travel Authorization', 'Need travel signature for summer conference in Europe',
   'approved', 'Normal', '{"destination": "France", "dates": "2026-07-01 to 2026-07-15"}',
   NOW() - INTERVAL '5 days', NOW() + INTERVAL '9 days', NOW() - INTERVAL '5 days'),
   
  ('req-3333-3333-3333-333333333333', 's-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'i20', 'I-20 Extension', 'Program extension due to thesis research',
   'in_review', 'Urgent', '{"extensionMonths": 6, "reason": "Additional research time needed"}',
   NOW() - INTERVAL '1 day', NOW() + INTERVAL '13 days', NOW() - INTERVAL '1 day');

-- Insert Sample Request Actions (DSO → Students)
INSERT INTO request_actions (id, school_id, title, type, target_type, target_student_id, 
                            deadline, status, created_by, created_at)
VALUES
  ('ra-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'Submit Fall 2026 Enrollment Verification', 'form', 'single', 's-1111-1111-1111-111111111111',
   NOW() + INTERVAL '7 days', 'active', 'dso-1111-1111-1111-111111111111', NOW()),
   
  ('ra-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   'Upload Current I-94 Travel Document', 'document', 'single', 's-3333-3333-3333-333333333333',
   NOW() + INTERVAL '10 days', 'active', 'dso-2222-2222-2222-222222222222', NOW()),
   
  ('ra-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'Confirm Current Address', 'confirmation', 'single', 's-2222-2222-2222-222222222222',
   NOW() + INTERVAL '5 days', 'active', 'dso-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day');

-- Insert Sample Responses
INSERT INTO responses (id, request_action_id, student_id, school_id, response_data, status, submitted_at, created_at)
VALUES
  ('resp-1111-1111-1111-111111111111', 'ra-3333-3333-3333-333333333333', 's-2222-2222-2222-222222222222', 
   '11111111-1111-1111-1111-111111111111',
   '{"confirmed": true, "address": "123 Campus Drive, Stanford, CA 94305"}',
   'submitted', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');

-- Insert Sample Documents
INSERT INTO documents (id, student_id, school_id, title, document_type, category, 
                      file_name, storage_path, uploaded_by, uploaded_by_role, status, uploaded_at, created_at)
VALUES
  ('doc-1111-1111-1111-111111111111', 's-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'I-20 Form - Initial', 'I-20', 'Immigration', 'i20_john_doe.pdf',
   'documents/s-1111/i20_john_doe.pdf', 'dso-1111-1111-1111-111111111111', 'dso',
   'active', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months'),
   
  ('doc-2222-2222-2222-222222222222', 's-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'Passport Copy', 'Passport', 'Immigration', 'passport_john_doe.pdf',
   'documents/s-1111/passport_john_doe.pdf', 'std-1111-1111-1111-111111111111', 'student',
   'active', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months'),
   
  ('doc-3333-3333-3333-333333333333', 's-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Visa Copy - F-1', 'Visa', 'Immigration', 'visa_jane_smith.pdf',
   'documents/s-2222/visa_jane_smith.pdf', 'std-2222-2222-2222-222222222222', 'student',
   'active', NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year');

-- Insert Sample Audit Logs
INSERT INTO audit_logs (school_id, user_id, action, resource_type, resource_id, description, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'dso-1111-1111-1111-111111111111', 'create', 'request_action', 
   'ra-1111-1111-1111-111111111111', 'Created enrollment verification request', NOW()),
   
  ('11111111-1111-1111-1111-111111111111', 'std-1111-1111-1111-111111111111', 'submit', 'request',
   'req-1111-1111-1111-111111111111', 'Submitted OPT application request', NOW() - INTERVAL '2 days'),
   
  ('11111111-1111-1111-1111-111111111111', 'dso-1111-1111-1111-111111111111', 'approve', 'request',
   'req-2222-2222-2222-222222222222', 'Approved travel authorization request', NOW() - INTERVAL '3 days');

-- Insert Sample Notifications
INSERT INTO notifications (user_id, school_id, title, message, type, related_resource_type, 
                          related_resource_id, action_url, created_at)
VALUES
  ('std-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'New Request Action', 'You have a new enrollment verification form to complete',
   'request_action', 'request_action', 'ra-1111-1111-1111-111111111111',
   '/request-center', NOW()),
   
  ('dso-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'New Student Request', 'John Doe submitted an OPT application request',
   'new_request', 'request', 'req-1111-1111-1111-111111111111',
   '/dso/requests', NOW() - INTERVAL '2 days');

-- Verify data insertion
SELECT 'Schools' as table_name, COUNT(*) as count FROM schools
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Requests', COUNT(*) FROM requests
UNION ALL
SELECT 'Request Actions', COUNT(*) FROM request_actions
UNION ALL
SELECT 'Responses', COUNT(*) FROM responses
UNION ALL
SELECT 'Documents', COUNT(*) FROM documents
UNION ALL
SELECT 'Audit Logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;
```

### Execute Sample Data

**Using Supabase SQL Editor:**
1. Go to SQL Editor
2. Copy and paste the entire seed script
3. Click "Run"
4. Verify the count query at the end shows data

**Using psql:**
```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" \
  -f staging/seed-sample-data.sql
```

---

## 4. Build Migration Scripts

Now let's create the actual migration scripts that will convert your production KV data to relational tables.

Create directory: `/staging/migrations/`

### Migration Script: Main Entry Point

Create: `/staging/migrations/migrate.ts`

```typescript
// staging/migrations/migrate.ts

import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from '../../supabase/functions/server/kv_store.tsx';

// Load staging credentials
const STAGING_URL = Deno.env.get('STAGING_SUPABASE_URL')!;
const STAGING_KEY = Deno.env.get('STAGING_SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(STAGING_URL, STAGING_KEY);

interface MigrationStats {
  schools: { created: number; errors: number; details: any[] };
  users: { created: number; errors: number; details: any[] };
  students: { created: number; errors: number; details: any[] };
  requests: { created: number; errors: number; details: any[] };
  requestActions: { created: number; errors: number; details: any[] };
  responses: { created: number; errors: number; details: any[] };
  documents: { created: number; errors: number; details: any[] };
  auditLogs: { created: number; errors: number; details: any[] };
}

async function main() {
  console.log('🚀 Starting KV → Relational Migration...\n');
  
  const stats: MigrationStats = {
    schools: { created: 0, errors: 0, details: [] },
    users: { created: 0, errors: 0, details: [] },
    students: { created: 0, errors: 0, details: [] },
    requests: { created: 0, errors: 0, details: [] },
    requestActions: { created: 0, errors: 0, details: [] },
    responses: { created: 0, errors: 0, details: [] },
    documents: { created: 0, errors: 0, details: [] },
    auditLogs: { created: 0, errors: 0, details: [] }
  };
  
  try {
    // Step 1: Migrate schools
    console.log('📚 Step 1/8: Migrating schools...');
    await migrateSchools(stats);
    console.log(`   ✅ Created ${stats.schools.created} schools, ${stats.schools.errors} errors\n`);
    
    // Step 2: Migrate users
    console.log('👤 Step 2/8: Migrating users...');
    await migrateUsers(stats);
    console.log(`   ✅ Created ${stats.users.created} users, ${stats.users.errors} errors\n`);
    
    // Step 3: Migrate students
    console.log('🎓 Step 3/8: Migrating students...');
    await migrateStudents(stats);
    console.log(`   ✅ Created ${stats.students.created} students, ${stats.students.errors} errors\n`);
    
    // Step 4: Migrate requests
    console.log('📝 Step 4/8: Migrating requests...');
    await migrateRequests(stats);
    console.log(`   ✅ Created ${stats.requests.created} requests, ${stats.requests.errors} errors\n`);
    
    // Step 5: Migrate request actions
    console.log('📋 Step 5/8: Migrating request actions...');
    await migrateRequestActions(stats);
    console.log(`   ✅ Created ${stats.requestActions.created} request actions, ${stats.requestActions.errors} errors\n`);
    
    // Step 6: Migrate responses
    console.log('💬 Step 6/8: Migrating responses...');
    await migrateResponses(stats);
    console.log(`   ✅ Created ${stats.responses.created} responses, ${stats.responses.errors} errors\n`);
    
    // Step 7: Migrate documents
    console.log('📄 Step 7/8: Migrating documents...');
    await migrateDocuments(stats);
    console.log(`   ✅ Created ${stats.documents.created} documents, ${stats.documents.errors} errors\n`);
    
    // Step 8: Migrate audit logs
    console.log('📊 Step 8/8: Migrating audit logs...');
    await migrateAuditLogs(stats);
    console.log(`   ✅ Created ${stats.auditLogs.created} audit logs, ${stats.auditLogs.errors} errors\n`);
    
    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Schools:         ${stats.schools.created} created, ${stats.schools.errors} errors`);
    console.log(`Users:           ${stats.users.created} created, ${stats.users.errors} errors`);
    console.log(`Students:        ${stats.students.created} created, ${stats.students.errors} errors`);
    console.log(`Requests:        ${stats.requests.created} created, ${stats.requests.errors} errors`);
    console.log(`Request Actions: ${stats.requestActions.created} created, ${stats.requestActions.errors} errors`);
    console.log(`Responses:       ${stats.responses.created} created, ${stats.responses.errors} errors`);
    console.log(`Documents:       ${stats.documents.created} created, ${stats.documents.errors} errors`);
    console.log(`Audit Logs:      ${stats.auditLogs.created} created, ${stats.auditLogs.errors} errors`);
    console.log('═══════════════════════════════════════\n');
    
    const totalErrors = Object.values(stats).reduce((sum, s) => sum + s.errors, 0);
    
    if (totalErrors === 0) {
      console.log('✅ Migration completed successfully with no errors!');
    } else {
      console.log(`⚠️  Migration completed with ${totalErrors} errors. Review details above.`);
    }
    
    // Save detailed report
    await Deno.writeTextFile(
      './staging/migrations/migration-report.json',
      JSON.stringify(stats, null, 2)
    );
    console.log('\n📝 Detailed report saved to: staging/migrations/migration-report.json');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function migrateSchools(stats: MigrationStats) {
  // Get all unique university IDs from users
  const allUsers = await kv.getByPrefix('user:');
  const schoolCodes = new Set<string>();
  
  allUsers.forEach((user: any) => {
    if (user.universityId) {
      schoolCodes.add(user.universityId);
    }
  });
  
  console.log(`   Found ${schoolCodes.size} unique schools in KV store`);
  
  for (const code of schoolCodes) {
    try {
      const schoolName = getSchoolName(code);
      
      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: schoolName,
          code: code,
          sevis_school_code: `SEV${code.replace('university-', '')}`,
          subscription_status: 'active',
          subscription_plan: 'standard',
          student_limit: 2000
        })
        .select()
        .single();
      
      if (error) throw error;
      
      stats.schools.created++;
      stats.schools.details.push({ code, id: data.id, name: schoolName });
      
    } catch (error) {
      console.error(`   ❌ Error migrating school ${code}:`, error.message);
      stats.schools.errors++;
    }
  }
}

async function migrateUsers(stats: MigrationStats) {
  const allKvUsers = await kv.getByPrefix('user:');
  console.log(`   Found ${allKvUsers.length} users in KV store`);
  
  for (const kvUser of allKvUsers) {
    try {
      // Get school ID
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('code', kvUser.universityId)
        .single();
      
      if (schoolError || !school) {
        throw new Error(`School not found for code: ${kvUser.universityId}`);
      }
      
      const { error } = await supabase
        .from('users')
        .insert({
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
      stats.users.details.push({ id: kvUser.id, email: kvUser.email });
      
    } catch (error) {
      console.error(`   ❌ Error migrating user ${kvUser.id}:`, error.message);
      stats.users.errors++;
    }
  }
}

async function migrateStudents(stats: MigrationStats) {
  const allKvVisas = await kv.getByPrefix('visa:');
  console.log(`   Found ${allKvVisas.length} student visa profiles in KV store`);
  
  for (const kvVisa of allKvVisas) {
    try {
      // Get user and school
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, school_id')
        .eq('id', kvVisa.userId)
        .single();
      
      if (userError || !user) {
        throw new Error(`User not found for ID: ${kvVisa.userId}`);
      }
      
      const { error } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          school_id: user.school_id,
          visa_type: kvVisa.visaType || null,
          visa_status: kvVisa.status || 'pending',
          visa_expiration_date: kvVisa.expirationDate || null,
          sevis_status: kvVisa.sevisStatus || null,
          compliance_status: kvVisa.compliance || 'N/A',
          passport_expiration_date: kvVisa.passportExpirationDate || null,
          next_compliance_check_date: kvVisa.nextCheckDate || null,
          sevis_last_updated_at: kvVisa.lastUpdated || null,
          sevis_last_updated_by: kvVisa.updatedBy || null,
          created_at: kvVisa.createdAt
        });
      
      if (error) throw error;
      
      stats.students.created++;
      stats.students.details.push({ userId: user.id });
      
    } catch (error) {
      console.error(`   ❌ Error migrating student ${kvVisa.userId}:`, error.message);
      stats.students.errors++;
    }
  }
}

async function migrateRequests(stats: MigrationStats) {
  const allKvRequests = await kv.getByPrefix('request:');
  console.log(`   Found ${allKvRequests.length} requests in KV store`);
  
  for (const kvRequest of allKvRequests) {
    try {
      // Get student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, school_id')
        .eq('user_id', kvRequest.userId)
        .single();
      
      if (studentError || !student) {
        throw new Error(`Student not found for user ID: ${kvRequest.userId}`);
      }
      
      const { error } = await supabase
        .from('requests')
        .insert({
          student_id: student.id,
          school_id: student.school_id,
          request_type: kvRequest.requestType,
          request_name: kvRequest.requestName,
          reason: kvRequest.reason || '',
          form_data: kvRequest.formData || {},
          uploaded_files: kvRequest.uploadedFiles || [],
          status: kvRequest.status || 'pending',
          priority: kvRequest.priority || 'Normal',
          submitted_at: kvRequest.submittedAt,
          due_date: kvRequest.dueDate,
          completed_at: kvRequest.processedAt || null,
          processed_by: kvRequest.processedBy || null,
          dso_notes: kvRequest.notes || null,
          created_at: kvRequest.submittedAt
        });
      
      if (error) throw error;
      
      stats.requests.created++;
      stats.requests.details.push({ id: kvRequest.id, type: kvRequest.requestType });
      
    } catch (error) {
      console.error(`   ❌ Error migrating request ${kvRequest.id}:`, error.message);
      stats.requests.errors++;
    }
  }
}

async function migrateRequestActions(stats: MigrationStats) {
  const allKvActions = await kv.getByPrefix('requestaction:');
  console.log(`   Found ${allKvActions.length} request actions in KV store`);
  
  for (const kvAction of allKvActions) {
    try {
      // Get school
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('code', kvAction.universityId)
        .single();
      
      if (schoolError || !school) {
        throw new Error(`School not found for code: ${kvAction.universityId}`);
      }
      
      // Get target student if single
      let targetStudentId = null;
      if (kvAction.sentTo === 'Single' && kvAction.targetStudent) {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', kvAction.targetStudent)
          .single();
        
        targetStudentId = student?.id || null;
      }
      
      const { error } = await supabase
        .from('request_actions')
        .insert({
          school_id: school.id,
          title: kvAction.title,
          type: kvAction.type,
          description: kvAction.description || null,
          instructions: kvAction.instructions || null,
          target_type: kvAction.sentTo.toLowerCase(),
          target_student_id: targetStudentId,
          target_filter: kvAction.bulkFilter ? { filter: kvAction.bulkFilter } : null,
          target_count: kvAction.targetCount || 0,
          deadline: kvAction.deadline,
          completed_count: kvAction.completedCount || 0,
          total_responses: kvAction.totalCount || 0,
          completion_percent: kvAction.completionPercent || 0,
          status: kvAction.status || 'active',
          document_title: kvAction.documentTitle || null,
          accepted_file_types: kvAction.acceptedFileTypes || null,
          form_template: kvAction.formTemplate || null,
          form_fields: kvAction.formFields || null,
          confirmation_statement: kvAction.confirmationStatement || null,
          created_at: kvAction.createdAt,
          created_by: kvAction.createdBy,
          updated_at: kvAction.updatedAt || null,
          updated_by: kvAction.updatedBy || null,
          last_response_at: kvAction.lastResponseAt || null
        });
      
      if (error) throw error;
      
      stats.requestActions.created++;
      stats.requestActions.details.push({ id: kvAction.id, title: kvAction.title });
      
    } catch (error) {
      console.error(`   ❌ Error migrating request action ${kvAction.id}:`, error.message);
      stats.requestActions.errors++;
    }
  }
}

async function migrateResponses(stats: MigrationStats) {
  const allKvResponses = await kv.getByPrefix('response:');
  console.log(`   Found ${allKvResponses.length} responses in KV store`);
  
  for (const kvResponse of allKvResponses) {
    try {
      // Parse key to get requestActionId and studentId
      // Key format: response:{requestActionId}:{studentId}
      const keyParts = kvResponse.id.split(':');
      const requestActionId = keyParts[1];
      const studentUserId = keyParts[2];
      
      // Get request action (by finding it)
      const { data: requestAction, error: actionError } = await supabase
        .from('request_actions')
        .select('id, school_id')
        .limit(1)
        .single();
      
      // Get student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', studentUserId)
        .single();
      
      if (!requestAction || !student) {
        throw new Error('Request action or student not found');
      }
      
      const { error } = await supabase
        .from('responses')
        .insert({
          request_action_id: requestAction.id,
          student_id: student.id,
          school_id: requestAction.school_id,
          response_data: kvResponse.data || {},
          document_url: kvResponse.documentUrl || null,
          status: 'submitted',
          submitted_at: kvResponse.submittedAt,
          created_at: kvResponse.submittedAt
        });
      
      if (error) throw error;
      
      stats.responses.created++;
      stats.responses.details.push({ id: kvResponse.id });
      
    } catch (error) {
      console.error(`   ❌ Error migrating response ${kvResponse.id}:`, error.message);
      stats.responses.errors++;
    }
  }
}

async function migrateDocuments(stats: MigrationStats) {
  const allKvDocuments = await kv.getByPrefix('document:');
  console.log(`   Found ${allKvDocuments.length} documents in KV store`);
  
  for (const kvDoc of allKvDocuments) {
    try {
      // Get student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, school_id, user_id')
        .eq('user_id', kvDoc.studentId)
        .single();
      
      if (studentError || !student) {
        throw new Error(`Student not found for ID: ${kvDoc.studentId}`);
      }
      
      // Try to find uploader user
      let uploadedBy = student.user_id; // Default to student
      if (kvDoc.uploadedBy && kvDoc.uploadedBy !== 'DSO Office') {
        const { data: uploader } = await supabase
          .from('users')
          .select('id')
          .eq('full_name', kvDoc.uploadedBy)
          .eq('school_id', student.school_id)
          .single();
        
        if (uploader) uploadedBy = uploader.id;
      }
      
      const { error } = await supabase
        .from('documents')
        .insert({
          student_id: student.id,
          school_id: student.school_id,
          title: kvDoc.title,
          document_type: kvDoc.type,
          file_name: kvDoc.fileName,
          storage_path: kvDoc.fileUrl || `documents/${kvDoc.id}`,
          storage_bucket: 'make-268175b3-documents',
          status: kvDoc.status || 'active',
          uploaded_by: uploadedBy,
          uploaded_by_role: kvDoc.uploadedBy === 'DSO Office' ? 'dso' : 'student',
          notes: kvDoc.notes || '',
          uploaded_at: kvDoc.uploadedDate,
          created_at: kvDoc.createdAt
        });
      
      if (error) throw error;
      
      stats.documents.created++;
      stats.documents.details.push({ id: kvDoc.id, title: kvDoc.title });
      
    } catch (error) {
      console.error(`   ❌ Error migrating document ${kvDoc.id}:`, error.message);
      stats.documents.errors++;
    }
  }
}

async function migrateAuditLogs(stats: MigrationStats) {
  const allKvLogs = await kv.getByPrefix('sevis:log:');
  console.log(`   Found ${allKvLogs.length} SEVIS logs in KV store`);
  
  for (const kvLog of allKvLogs) {
    try {
      // Get student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, school_id')
        .eq('user_id', kvLog.studentId)
        .single();
      
      if (studentError || !student) {
        throw new Error(`Student not found for ID: ${kvLog.studentId}`);
      }
      
      const { error } = await supabase
        .from('audit_logs')
        .insert({
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
      
      if (error) throw error;
      
      stats.auditLogs.created++;
      stats.auditLogs.details.push({ studentId: kvLog.studentId });
      
    } catch (error) {
      console.error(`   ❌ Error migrating audit log:`, error.message);
      stats.auditLogs.errors++;
    }
  }
}

function getSchoolName(code: string): string {
  const schoolNames: Record<string, string> = {
    'university-001': 'Example University',
    'university-002': 'Sample College',
    'stanford': 'Stanford University',
    'mit': 'Massachusetts Institute of Technology',
    'ucb': 'UC Berkeley'
  };
  
  return schoolNames[code] || `University ${code}`;
}

// Run migration
if (import.meta.main) {
  main();
}
```

---

## 5. Test Migration

### Run the Migration

1. **Set environment variables:**
   ```bash
   export STAGING_SUPABASE_URL="https://your-staging-project.supabase.co"
   export STAGING_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **Run migration script:**
   ```bash
   deno run --allow-net --allow-env --allow-read --allow-write staging/migrations/migrate.ts
   ```

3. **Review output:**
   - Check for any errors
   - Review `staging/migrations/migration-report.json`

---

## 6. Validate Results

### Validation Script

Create: `/staging/migrations/validate.ts`

```typescript
// staging/migrations/validate.ts

import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from '../../supabase/functions/server/kv_store.tsx';

const STAGING_URL = Deno.env.get('STAGING_SUPABASE_URL')!;
const STAGING_KEY = Deno.env.get('STAGING_SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(STAGING_URL, STAGING_KEY);

async function validate() {
  console.log('🔍 Validating Migration...\n');
  
  // Count KV records
  const kvCounts = {
    users: (await kv.getByPrefix('user:')).length,
    visas: (await kv.getByPrefix('visa:')).length,
    requests: (await kv.getByPrefix('request:')).length,
    requestActions: (await kv.getByPrefix('requestaction:')).length,
    responses: (await kv.getByPrefix('response:')).length,
    documents: (await kv.getByPrefix('document:')).length
  };
  
  // Count DB records
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
  
  console.log('═══════════════════════════════════════');
  console.log('📊 VALIDATION RESULTS');
  console.log('═══════════════════════════════════════');
  console.log(`Users:           KV=${kvCounts.users}, DB=${usersCount}, Match=${kvCounts.users === usersCount ? '✅' : '❌'}`);
  console.log(`Students:        KV=${kvCounts.visas}, DB=${studentsCount}, Match=${kvCounts.visas === studentsCount ? '✅' : '❌'}`);
  console.log(`Requests:        KV=${kvCounts.requests}, DB=${requestsCount}, Match=${kvCounts.requests === requestsCount ? '✅' : '❌'}`);
  console.log(`Request Actions: KV=${kvCounts.requestActions}, DB=${requestActionsCount}, Match=${kvCounts.requestActions === requestActionsCount ? '✅' : '❌'}`);
  console.log(`Responses:       KV=${kvCounts.responses}, DB=${responsesCount}, Match=${kvCounts.responses === responsesCount ? '✅' : '❌'}`);
  console.log(`Documents:       KV=${kvCounts.documents}, DB=${documentsCount}, Match=${kvCounts.documents === documentsCount ? '✅' : '❌'}`);
  console.log('═══════════════════════════════════════\n');
  
  const allMatch = 
    kvCounts.users === usersCount &&
    kvCounts.visas === studentsCount &&
    kvCounts.requests === requestsCount &&
    kvCounts.requestActions === requestActionsCount &&
    kvCounts.responses === responsesCount &&
    kvCounts.documents === documentsCount;
  
  if (allMatch) {
    console.log('✅ All record counts match! Migration successful.');
  } else {
    console.log('⚠️  Record count mismatches detected. Review migration logs.');
  }
}

if (import.meta.main) {
  validate();
}
```

### Run Validation

```bash
deno run --allow-net --allow-env staging/migrations/validate.ts
```

---

## Quick Start Checklist

- [ ] Create staging Supabase project
- [ ] Save credentials to `.env.staging`
- [ ] Execute `DATABASE_SCHEMA.sql` via SQL Editor
- [ ] Run `seed-sample-data.sql` to create test data
- [ ] Update environment variables for migration script
- [ ] Run `migrate.ts` to test KV → Relational conversion
- [ ] Run `validate.ts` to verify migration accuracy
- [ ] Review migration report JSON file
- [ ] Test API endpoints against staging database
- [ ] Document any issues or improvements

---

**Need Help?**

If you encounter errors:
1. Check Supabase SQL Editor for detailed error messages
2. Review `migration-report.json` for failure details
3. Verify foreign key relationships are correct
4. Check RLS policies aren't blocking inserts (disable temporarily for testing)

---

**End of Staging Setup Guide**
