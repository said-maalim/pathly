# 🚀 Pathly Platform - Relational DB Deployment Guide

**Date:** March 10, 2026  
**Migration Type:** KV Store → Relational Database (Direct)  
**Downtime:** None (MVP phase)

---

## 📋 Overview

This guide will help you deploy the new relational database architecture with service-based backend.

**What's Changing:**
- ❌ Remove: KV store dependencies (except protected kv_store.tsx)
- ✅ Add: 10 normalized relational tables
- ✅ Add: Service-based architecture (files <400 lines)
- ✅ Add: Repository pattern for data access
- ✅ Add: Row Level Security for multi-tenant isolation

---

## ✅ Step 1: Execute Database Schema (15 minutes)

### Option A: Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/kjzigbozunhisvmvxbxx
   ```

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Execute Schema in Sections**

   **Run Section 1:** Extensions & Enums
   ```sql
   -- Copy lines 1-80 from DATABASE_SCHEMA.sql
   -- Includes: CREATE EXTENSION, CREATE TYPE statements
   ```
   Click "Run" ✅

   **Run Section 2:** Tables (Run each table separately)
   ```sql
   -- Copy and run one at a time:
   -- schools table (lines 81-120)
   -- users table (lines 121-180)
   -- students table (lines 181-280)
   -- requests table (lines 281-350)
   -- request_actions table (lines 351-420)
   -- responses table (lines 421-470)
   -- documents table (lines 471-540)
   -- audit_logs table (lines 541-590)
   -- roster_imports table (lines 591-640)
   -- notifications table (lines 641-690)
   ```
   Click "Run" after each table ✅

   **Run Section 3:** Indexes & Triggers
   ```sql
   -- Copy lines 691-800 from DATABASE_SCHEMA.sql
   ```
   Click "Run" ✅

   **Run Section 4:** RLS Policies
   ```sql
   -- Copy lines 801-end from DATABASE_SCHEMA.sql
   ```
   Click "Run" ✅

4. **Verify Tables Created**
   - Go to "Table Editor" tab
   - You should see 10 tables listed

### Option B: psql Command Line

```bash
# Set connection URL
export DB_URL="postgresql://postgres:[PASSWORD]@db.kjzigbozunhisvmvxbxx.supabase.co:5432/postgres"

# Execute full schema
psql "$DB_URL" -f DATABASE_SCHEMA.sql

# Verify tables
psql "$DB_URL" -c "\dt"
```

---

## ✅ Step 2: Create Initial School Record (5 minutes)

You need at least one school in the database for signups to work.

**Run this in SQL Editor:**

```sql
-- Create your university/school
INSERT INTO schools (name, code, sevis_school_code, contact_email, subscription_status, subscription_plan, student_limit)
VALUES (
  'Example University',  -- Change this to your university name
  'university-001',      -- This is the schoolId used in signup
  'SEV2013123456',       -- Optional: Your SEVIS school code
  'iso@university.edu',  -- Optional: Contact email
  'active',
  'standard',
  2000
);

-- Get the school ID (save this!)
SELECT id, name, code FROM schools;
```

**Save the school ID** - you'll need it for student/DSO signups!

---

## ✅ Step 3: Deploy New Backend Code (10 minutes)

### Replace Old Backend with New Service-Based Architecture

1. **Backup Current index.tsx**
   ```bash
   # This creates a backup
   cp supabase/functions/server/index.tsx supabase/functions/server/index_old_kv.tsx
   ```

2. **Replace with New Index**
   ```bash
   # Replace old monolithic file with new modular version
   cp supabase/functions/server/index_new.tsx supabase/functions/server/index.tsx
   ```

3. **Verify New Structure**
   
   You should now have this structure:
   ```
   /supabase/functions/server/
   ├── index.tsx                    ← NEW (70 lines)
   ├── index_old_kv.tsx            ← BACKUP (1594 lines)
   ├── kv_store.tsx                ← PROTECTED (don't touch)
   │
   ├── config/
   │   └── database.ts
   │
   ├── middleware/
   │   ├── auth.ts
   │   └── error-handler.ts
   │
   ├── repositories/
   │   ├── user.repository.ts
   │   ├── student.repository.ts
   │   ├── request.repository.ts
   │   ├── document.repository.ts
   │   └── school.repository.ts
   │
   ├── services/
   │   ├── auth/
   │   │   ├── auth.service.ts
   │   │   └── auth.routes.ts
   │   ├── users/
   │   │   ├── users.service.ts
   │   │   └── users.routes.ts
   │   ├── students/
   │   │   ├── students.service.ts
   │   │   └── students.routes.ts
   │   ├── requests/
   │   │   ├── requests.service.ts
   │   │   └── requests.routes.ts
   │   └── documents/
   │       ├── documents.service.ts
   │       └── documents.routes.ts
   │
   └── types/
       └── database.types.ts
   ```

4. **Deploy to Supabase**

   The backend will auto-deploy when you push to your git repository (if you have Supabase CLI connected).

   **OR manually test locally:**
   ```bash
   # From project root
   deno run --allow-net --allow-env --allow-read supabase/functions/server/index.tsx
   ```

---

## ✅ Step 4: Test the New API (10 minutes)

### Test 1: Health Check

```bash
curl https://kjzigbozunhisvmvxbxx.supabase.co/functions/v1/make-server-268175b3/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-10T...",
  "version": "2.0.0",
  "database": "relational"
}
```

### Test 2: Create Test Student Account

```bash
curl -X POST https://kjzigbozunhisvmvxbxx.supabase.co/functions/v1/make-server-268175b3/auth/signup/student \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.student@university.edu",
    "password": "Test1234!",
    "name": "Test Student",
    "schoolId": "YOUR_SCHOOL_ID_HERE"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "userId": "uuid-here",
  "message": "Student account created successfully"
}
```

### Test 3: Create Test DSO Account

```bash
curl -X POST https://kjzigbozunhisvmvxbxx.supabase.co/functions/v1/make-server-268175b3/auth/signup/dso \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.dso@university.edu",
    "password": "Test1234!",
    "name": "Test DSO",
    "schoolId": "YOUR_SCHOOL_ID_HERE"
  }'
```

### Test 4: Verify Database

**Check users table:**
```sql
SELECT id, email, full_name, role FROM users;
```

**Check students table:**
```sql
SELECT s.id, u.full_name, s.visa_status, s.sevis_status
FROM students s
JOIN users u ON s.user_id = u.id;
```

---

## ✅ Step 5: Update Frontend (If Needed)

The API endpoints remain mostly the same, but check these changes:

### API Endpoint Changes

| Old Endpoint | New Endpoint | Status |
|--------------|--------------|--------|
| `/user/profile` | `/users/profile` | ✅ Updated |
| `/visa/profile` | `/students/my-profile` | ✅ Updated |
| `/requests/submit` | `/requests/submit` | ✅ Same |
| `/requests/my-requests` | `/requests/my-requests` | ✅ Same |
| `/documents` | `/documents/my-documents` | ✅ Updated |
| `/dso/students/:universityId` | `/students/school/:schoolId` | ✅ Updated |

### Update Frontend API Calls

**Example: Get User Profile**

❌ **Old:**
```typescript
const response = await fetch(`${API_BASE_URL}/user/profile`, { headers });
```

✅ **New:**
```typescript
const response = await fetch(`${API_BASE_URL}/users/profile`, { headers });
```

**Example: Get Visa Profile**

❌ **Old:**
```typescript
const response = await fetch(`${API_BASE_URL}/visa/profile`, { headers });
```

✅ **New:**
```typescript
const response = await fetch(`${API_BASE_URL}/students/my-profile`, { headers });
// Returns: { user: {...}, student: {...} }
```

---

## ✅ Step 6: Migrate Existing Data (Optional)

If you have test data in KV store you want to preserve:

```bash
# Run migration script
deno run \
  --allow-net \
  --allow-env \
  --allow-read \
  --allow-write \
  staging/migrations/migrate.ts
```

**OR start fresh** - just skip this step!

---

## ✅ Step 7: Verification Checklist

- [ ] All 10 tables created in Supabase
- [ ] At least one school record exists
- [ ] Health check returns "database": "relational"
- [ ] Can create student account successfully
- [ ] Can create DSO account successfully
- [ ] Users table has new records
- [ ] Students table has corresponding student profiles
- [ ] Frontend can sign up new users
- [ ] Frontend can sign in existing users
- [ ] All API endpoints responding correctly

---

## 🐛 Troubleshooting

### Issue: "School not found" during signup

**Solution:**
```sql
-- Check if school exists
SELECT * FROM schools WHERE code = 'university-001';

-- If not, create it
INSERT INTO schools (name, code, subscription_status) 
VALUES ('Your University', 'university-001', 'active');
```

### Issue: "Failed to create user" error

**Check:**
1. School ID is correct (UUID format)
2. Email is unique
3. Email contains `.edu` for students

### Issue: RLS blocking queries

**Temporary fix for testing:**
```sql
-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- ... repeat for other tables

-- Test your API

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ... repeat for other tables
```

### Issue: "Type X does not exist"

**Solution:**
```sql
-- Drop and recreate schema
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS notifications, roster_imports, audit_logs, 
  documents, responses, request_actions, requests, students, users, schools CASCADE;

DROP TYPE IF EXISTS audit_action, import_status, document_status, 
  action_status, request_action_type, request_priority, request_status, 
  compliance_status, sevis_status, visa_status, visa_type, 
  account_status, user_role CASCADE;

-- Then re-run DATABASE_SCHEMA.sql
```

---

## 📊 Post-Deployment Monitoring

### Check Database Performance

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT COUNT(*) FROM pg_stat_activity;
```

### Monitor API Logs

Go to Supabase Dashboard → Logs → Edge Functions

Look for:
- ✅ "Server initialized successfully"
- ✅ "Created storage bucket: documents"
- ❌ Any error messages

---

## 🎉 Success!

You've successfully migrated to the relational database architecture!

**What You Have Now:**
- ✅ Production-ready relational database
- ✅ Service-based backend architecture
- ✅ All files under 400 lines
- ✅ Proper data relationships with foreign keys
- ✅ Row Level Security for multi-tenant isolation
- ✅ Audit logging infrastructure
- ✅ Scalable and maintainable codebase

**Next Steps:**
1. Test all user workflows
2. Monitor performance
3. Set up data backups
4. Document any custom changes

---

## 📞 Need Help?

1. Check logs in Supabase Dashboard
2. Review error messages in console
3. Test SQL queries in SQL Editor
4. Verify all environment variables are set

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Status:** ⬜ Pending ⬜ In Progress ✅ Complete
