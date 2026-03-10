# 🎯 Complete Migration Testing - Quick Start

**Last Updated:** March 8, 2026

This guide will help you execute the schema and test migration in ~30 minutes.

---

## 📋 Prerequisites Checklist

- [ ] Supabase account (free tier is fine)
- [ ] PostgreSQL client installed (`psql` or use Supabase SQL Editor)
- [ ] Deno runtime installed (for migration scripts)
- [ ] Access to production KV store data (optional - can use sample data)

---

## 🚀 Step-by-Step Guide (30 Minutes)

### **Step 1: Create Staging Project** (5 minutes)

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - Name: `pathly-staging`
   - Password: Generate strong password (save it!)
   - Region: Same as production
4. Wait 2-3 minutes for provisioning
5. Save your credentials:
   ```
   Project URL: https://[project-id].supabase.co
   Anon Key: eyJ...
   Service Role Key: eyJ...
   ```

### **Step 2: Execute Database Schema** (5 minutes)

**Option A: Supabase SQL Editor (Easiest)**

1. Navigate to: **SQL Editor** tab
2. Click **"New Query"**
3. Copy contents of `/DATABASE_SCHEMA.sql`
4. **Important:** Execute in 4 sections:
   
   **Section 1: Extensions & Enums**
   - Copy lines 1-80
   - Click "Run"
   - ✅ Verify no errors
   
   **Section 2: Tables**
   - Copy lines 81-600 (or do each table individually)
   - Click "Run" after each
   - ✅ Check "Table Editor" to see tables appear
   
   **Section 3: Indexes & Triggers**
   - Copy lines 601-800
   - Click "Run"
   
   **Section 4: RLS Policies**
   - Copy lines 801-1000
   - Click "Run"

5. ✅ Verify: Go to **Table Editor** → Should see 10 tables

**Option B: Command Line**

```bash
# Set connection string
export STAGING_DB="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# Execute schema
psql "$STAGING_DB" -f DATABASE_SCHEMA.sql

# Check for success
psql "$STAGING_DB" -c "\dt"
```

### **Step 3: Seed Sample Data** (3 minutes)

**Using SQL Editor:**
1. Click "New Query"
2. Copy entire contents of `/staging/seed-sample-data.sql`
3. Click "Run"
4. ✅ Verify output shows:
   ```
   Schools: 3
   Users: 8
   Students: 5
   Requests: 5
   ...
   ```

**Using Command Line:**
```bash
psql "$STAGING_DB" -f staging/seed-sample-data.sql
```

✅ **Checkpoint:** You should now have a fully populated staging database!

### **Step 4: Verify Data** (2 minutes)

Query some data to make sure it worked:

**SQL Editor:**
```sql
-- Get all students with visa info
SELECT 
  u.full_name,
  s.sevis_id,
  s.visa_type,
  s.visa_status,
  sch.name as school_name
FROM students s
JOIN users u ON s.user_id = u.id
JOIN schools sch ON s.school_id = sch.id;

-- Get pending requests
SELECT 
  u.full_name as student_name,
  r.request_type,
  r.status,
  r.submitted_at
FROM requests r
JOIN students s ON r.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE r.status = 'pending';
```

**Command Line:**
```bash
psql "$STAGING_DB" -c "
SELECT full_name, email, role 
FROM users 
ORDER BY role, full_name;
"
```

### **Step 5: Test Migration Script** (10 minutes)

**Setup Environment:**
```bash
# Create .env.staging file
cat > .env.staging << 'EOF'
STAGING_SUPABASE_URL=https://[your-project].supabase.co
STAGING_SUPABASE_ANON_KEY=eyJ...
STAGING_SUPABASE_SERVICE_ROLE_KEY=eyJ...
EOF

# Load variables
export STAGING_SUPABASE_URL="https://[your-project].supabase.co"
export STAGING_SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

**Run Migration:**
```bash
# Run the migration script
deno run \
  --allow-net \
  --allow-env \
  --allow-read \
  --allow-write \
  staging/migrations/migrate.ts
```

**Expected Output:**
```
🚀 Starting KV → Relational Migration...

📚 Step 1/8: Migrating schools...
   ✅ Created 3 schools, 0 errors

👤 Step 2/8: Migrating users...
   ✅ Created 8 users, 0 errors

... (continues for all steps)

✅ Migration completed successfully with no errors!
```

### **Step 6: Validate Migration** (3 minutes)

```bash
# Run validation script
deno run --allow-net --allow-env staging/migrations/validate.ts
```

**Expected Output:**
```
═══════════════════════════════════════
📊 VALIDATION RESULTS
═══════════════════════════════════════
Users:           KV=8, DB=8, Match=✅
Students:        KV=5, DB=5, Match=✅
Requests:        KV=5, DB=5, Match=✅
...
═══════════════════════════════════════

✅ All record counts match! Migration successful.
```

### **Step 7: Test Queries** (2 minutes)

Test some common queries to verify everything works:

```sql
-- 1. Get student dashboard data
SELECT 
  u.full_name,
  s.visa_status,
  s.sevis_status,
  s.compliance_status,
  COUNT(DISTINCT r.id) as total_requests
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN requests r ON r.student_id = s.id
WHERE u.id = 'std-1111-1111-1111-111111111111'
GROUP BY u.full_name, s.visa_status, s.sevis_status, s.compliance_status;

-- 2. Get DSO pending requests
SELECT 
  u.full_name as student_name,
  r.request_type,
  r.request_name,
  r.submitted_at,
  r.status
FROM requests r
JOIN students s ON r.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE r.school_id = '11111111-1111-1111-1111-111111111111'
AND r.status = 'pending'
ORDER BY r.submitted_at DESC;

-- 3. Get request actions with responses
SELECT 
  ra.title,
  ra.type,
  ra.completed_count,
  ra.total_responses,
  ra.completion_percent,
  ra.deadline
FROM request_actions ra
WHERE ra.school_id = '11111111-1111-1111-1111-111111111111'
AND ra.status = 'active'
ORDER BY ra.deadline ASC;
```

---

## ✅ Success Criteria

You've successfully set up staging if:

- [x] All 10 tables created in Supabase
- [x] Sample data shows correct counts (3 schools, 8 users, 5 students, etc.)
- [x] Migration script runs without errors
- [x] Validation shows all record counts match
- [x] Test queries return expected data
- [x] No foreign key violations

---

## 🐛 Troubleshooting

### Problem: Schema execution fails

**Error:** `ERROR: type "user_role" already exists`

**Solution:**
```sql
-- Drop all types and tables, then re-run schema
DROP TABLE IF EXISTS notifications, roster_imports, audit_logs, 
  documents, responses, request_actions, requests, students, users, schools CASCADE;
  
DROP TYPE IF EXISTS audit_action, import_status, document_status, 
  action_status, request_action_type, request_priority, request_status, 
  compliance_status, sevis_status, visa_status, visa_type, 
  account_status, user_role CASCADE;
```

### Problem: Migration script fails with "Student not found"

**Cause:** Migration trying to migrate production KV data, but staging has sample data with different IDs

**Solution:** Clear staging tables first:
```sql
TRUNCATE audit_logs, documents, responses, request_actions, 
  requests, students, users, schools RESTART IDENTITY CASCADE;
```

### Problem: RLS policies blocking inserts

**Solution:** Temporarily disable RLS during migration:
```sql
-- Disable RLS
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- Run migration

-- Re-enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)
```

### Problem: Can't connect via psql

**Solution:**
```bash
# Install PostgreSQL client
# macOS:
brew install postgresql

# Ubuntu/Debian:
sudo apt-get install postgresql-client

# Test connection
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" -c "SELECT 1;"
```

---

## 📚 Next Steps

After successful staging setup:

1. **Connect Frontend to Staging**
   - Update frontend environment variables
   - Test all user workflows
   - Verify API endpoints work

2. **Performance Testing**
   - Run EXPLAIN ANALYZE on common queries
   - Check index usage
   - Monitor query times

3. **Security Testing**
   - Test RLS policies with different user roles
   - Verify students can't access other schools' data
   - Test DSO can only access their school

4. **Plan Production Migration**
   - Schedule maintenance window
   - Prepare rollback plan
   - Notify users

---

## 🔗 Quick Links

**Staging Dashboard**
- Main: https://supabase.com/dashboard/project/[staging-project-id]
- SQL Editor: https://supabase.com/dashboard/project/[staging-project-id]/sql
- Tables: https://supabase.com/dashboard/project/[staging-project-id]/editor
- Logs: https://supabase.com/dashboard/project/[staging-project-id]/logs

**Documentation**
- Full Setup Guide: `/STAGING_SETUP_GUIDE.md`
- Quick Commands: `/staging/QUICK_COMMANDS.md`
- Migration Plan: `/DATA_MIGRATION_PLAN.md`
- Refactor Roadmap: `/REFACTOR_ROADMAP.md`

---

## 💡 Pro Tips

1. **Use SQL Editor for quick testing** - faster than command line for one-off queries
2. **Keep RLS disabled during migration** - enable after validation
3. **Take database snapshots** before major changes (Supabase Dashboard → Settings → Database)
4. **Use EXPLAIN ANALYZE** to debug slow queries
5. **Monitor storage usage** - Supabase Dashboard → Database → Usage

---

## 🎉 You're Done!

Your staging environment is now ready for:
- Testing the new relational schema
- Validating migration scripts
- Performance benchmarking
- Security testing
- Frontend integration testing

**Time to celebrate!** 🚀

---

**Need Help?** 
- Check `/staging/QUICK_COMMANDS.md` for command reference
- Review error logs in Supabase Dashboard → Logs
- Test queries in SQL Editor to debug issues
