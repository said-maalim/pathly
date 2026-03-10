# Quick Commands Reference

## 1. Setup Staging Environment

```bash
# Create .env.staging file
cat > .env.staging << 'EOF'
STAGING_SUPABASE_URL=https://[your-project].supabase.co
STAGING_SUPABASE_ANON_KEY=eyJ...
STAGING_SUPABASE_SERVICE_ROLE_KEY=eyJ...
STAGING_SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
EOF

# Load environment variables
source .env.staging
```

## 2. Execute Schema

### Option A: Via Supabase SQL Editor (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your staging project
3. Navigate to SQL Editor
4. Copy/paste `DATABASE_SCHEMA.sql` in sections
5. Run each section separately

### Option B: Via psql Command Line

```bash
# Install psql (if not installed)
brew install postgresql  # macOS
sudo apt-get install postgresql-client  # Linux

# Connect and execute schema
psql "$STAGING_SUPABASE_DB_URL" -f DATABASE_SCHEMA.sql

# Or connect interactively
psql "$STAGING_SUPABASE_DB_URL"
```

## 3. Seed Sample Data

```bash
# Execute via psql
psql "$STAGING_SUPABASE_DB_URL" -f staging/seed-sample-data.sql

# Or via SQL Editor - copy/paste the seed script
```

## 4. Run Migration

```bash
# Run full migration
deno run \
  --allow-net \
  --allow-env \
  --allow-read \
  --allow-write \
  staging/migrations/migrate.ts

# Review migration report
cat staging/migrations/migration-report.json | jq
```

## 5. Validate Migration

```bash
# Run validation
deno run --allow-net --allow-env staging/migrations/validate.ts

# Check record counts in database
psql "$STAGING_SUPABASE_DB_URL" -c "
SELECT 
  'schools' as table_name, COUNT(*) as count FROM schools
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'requests', COUNT(*) FROM requests
UNION ALL SELECT 'request_actions', COUNT(*) FROM request_actions
UNION ALL SELECT 'responses', COUNT(*) FROM responses
UNION ALL SELECT 'documents', COUNT(*) FROM documents
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;
"
```

## 6. Query Examples

```bash
# Get all students with their visa status
psql "$STAGING_SUPABASE_DB_URL" -c "
SELECT 
  u.full_name,
  u.email,
  s.sevis_id,
  s.visa_type,
  s.visa_status,
  s.sevis_status,
  sch.name as school_name
FROM students s
JOIN users u ON s.user_id = u.id
JOIN schools sch ON s.school_id = sch.id
LIMIT 10;
"

# Get pending requests
psql "$STAGING_SUPABASE_DB_URL" -c "
SELECT 
  r.id,
  u.full_name as student_name,
  r.request_type,
  r.request_name,
  r.status,
  r.submitted_at
FROM requests r
JOIN students s ON r.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE r.status = 'pending'
ORDER BY r.submitted_at DESC;
"

# Get request actions with completion stats
psql "$STAGING_SUPABASE_DB_URL" -c "
SELECT 
  ra.title,
  ra.type,
  ra.target_type,
  ra.completed_count,
  ra.total_responses,
  ra.completion_percent,
  ra.deadline,
  sch.name as school_name
FROM request_actions ra
JOIN schools sch ON ra.school_id = sch.id
WHERE ra.status = 'active'
ORDER BY ra.deadline ASC;
"
```

## 7. Reset/Cleanup Commands

```bash
# Drop all tables (CAUTION: Destroys all data)
psql "$STAGING_SUPABASE_DB_URL" -c "
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS roster_imports CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS request_actions CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
"

# Drop enums
psql "$STAGING_SUPABASE_DB_URL" -c "
DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS import_status CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS action_status CASCADE;
DROP TYPE IF EXISTS request_action_type CASCADE;
DROP TYPE IF EXISTS request_priority CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS compliance_status CASCADE;
DROP TYPE IF EXISTS sevis_status CASCADE;
DROP TYPE IF EXISTS visa_status CASCADE;
DROP TYPE IF EXISTS visa_type CASCADE;
DROP TYPE IF EXISTS account_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
"

# Then re-run schema: psql "$STAGING_SUPABASE_DB_URL" -f DATABASE_SCHEMA.sql
```

## 8. Backup & Restore

```bash
# Backup entire staging database
pg_dump "$STAGING_SUPABASE_DB_URL" > staging/backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific table
pg_dump "$STAGING_SUPABASE_DB_URL" -t students > staging/students_backup.sql

# Restore from backup
psql "$STAGING_SUPABASE_DB_URL" < staging/backup_20260308_120000.sql
```

## 9. Monitoring Queries

```bash
# Check table sizes
psql "$STAGING_SUPABASE_DB_URL" -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Check indexes
psql "$STAGING_SUPABASE_DB_URL" -c "
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
"

# Check for missing indexes (slow queries)
psql "$STAGING_SUPABASE_DB_URL" -c "
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY n_distinct DESC;
"
```

## 10. Troubleshooting

```bash
# Check RLS policies
psql "$STAGING_SUPABASE_DB_URL" -c "
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public';
"

# Temporarily disable RLS for testing
psql "$STAGING_SUPABASE_DB_URL" -c "
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
"

# Re-enable RLS
psql "$STAGING_SUPABASE_DB_URL" -c "
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
"

# Check for foreign key violations
psql "$STAGING_SUPABASE_DB_URL" -c "
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f'
AND connamespace = 'public'::regnamespace;
"

# View recent errors in logs
# (Access via Supabase Dashboard > Logs)
```

## 11. Performance Testing

```bash
# Test query performance
psql "$STAGING_SUPABASE_DB_URL" -c "
EXPLAIN ANALYZE
SELECT 
  s.*,
  u.full_name,
  u.email
FROM students s
JOIN users u ON s.user_id = u.id
WHERE s.school_id = '11111111-1111-1111-1111-111111111111'
AND s.visa_status = 'active';
"

# Check slow queries
psql "$STAGING_SUPABASE_DB_URL" -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"
```

## 12. Export Data

```bash
# Export to CSV
psql "$STAGING_SUPABASE_DB_URL" -c "
COPY (
  SELECT * FROM students
) TO STDOUT WITH CSV HEADER
" > staging/students_export.csv

# Export to JSON
psql "$STAGING_SUPABASE_DB_URL" -t -c "
SELECT json_agg(row_to_json(t))
FROM (
  SELECT * FROM students
) t;
" > staging/students_export.json
```

## Environment Variables Quick Reference

```bash
# Production (DO NOT USE FOR TESTING)
export SUPABASE_URL="https://kjzigbozunhisvmvxbxx.supabase.co"
export SUPABASE_ANON_KEY="[production-anon-key]"
export SUPABASE_SERVICE_ROLE_KEY="[production-service-key]"

# Staging (USE THIS FOR TESTING)
export STAGING_SUPABASE_URL="https://[staging-project].supabase.co"
export STAGING_SUPABASE_ANON_KEY="[staging-anon-key]"
export STAGING_SUPABASE_SERVICE_ROLE_KEY="[staging-service-key]"
```

## Quick Links

- Staging Dashboard: https://supabase.com/dashboard/project/[staging-project-id]
- SQL Editor: https://supabase.com/dashboard/project/[staging-project-id]/sql
- Table Editor: https://supabase.com/dashboard/project/[staging-project-id]/editor
- Storage: https://supabase.com/dashboard/project/[staging-project-id]/storage
- Logs: https://supabase.com/dashboard/project/[staging-project-id]/logs

---

**Pro Tips:**

1. Always test on staging first
2. Use transactions for bulk operations
3. Create backups before major changes
4. Monitor query performance with EXPLAIN ANALYZE
5. Use indexes for frequently queried columns
6. Keep RLS policies disabled during migration testing
7. Use `jq` for pretty JSON output: `cat file.json | jq`
