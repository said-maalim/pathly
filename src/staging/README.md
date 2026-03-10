# Pathly Staging Environment

This directory contains all resources for testing the database migration from KV store to relational schema.

## 📁 Directory Structure

```
pathly-platform/
├── DATABASE_SCHEMA.sql              ← Production database schema (10 tables)
├── DATA_MIGRATION_PLAN.md           ← Complete migration strategy
├── REFACTOR_ROADMAP.md              ← Backend code refactoring plan
├── ARCHITECTURE_ANALYSIS.md         ← Current system analysis
├── STAGING_SETUP_GUIDE.md          ← Detailed setup instructions
│
├── staging/
│   ├── README.md                    ← This file
│   ├── QUICK_START.md              ← 30-minute quick start guide ⭐
│   ├── QUICK_COMMANDS.md           ← Command reference cheat sheet
│   ├── seed-sample-data.sql        ← Sample data for testing
│   │
│   └── migrations/
│       ├── migrate.ts               ← Main migration script (KV → Relational)
│       ├── validate.ts              ← Validation script
│       └── migration-report.json    ← Generated after migration
│
└── supabase/
    └── functions/server/
        ├── index.tsx                ← Current monolithic backend (1594 lines)
        └── kv_store.tsx             ← KV store interface (protected)
```

## 🚀 Quick Start (Choose Your Path)

### Path 1: Just Want to Get Started? (30 min)
👉 **Go to: [`QUICK_START.md`](./QUICK_START.md)**

This is your fastest path to:
- Create staging Supabase project
- Execute database schema
- Load sample data
- Test migration
- Validate results

### Path 2: Want Full Details? (2 hours)
👉 **Go to: [`/STAGING_SETUP_GUIDE.md`](../STAGING_SETUP_GUIDE.md)**

Comprehensive guide with:
- Multiple setup methods
- Troubleshooting section
- Performance testing
- Security validation

### Path 3: Need Command Reference?
👉 **Go to: [`QUICK_COMMANDS.md`](./QUICK_COMMANDS.md)**

Quick copy-paste commands for:
- psql queries
- Database operations
- Backup/restore
- Monitoring

---

## 📚 What's in Each File?

### **Core Migration Documents**

| File | Purpose | When to Use |
|------|---------|-------------|
| `DATABASE_SCHEMA.sql` | Production-ready relational schema | Execute in staging/production |
| `DATA_MIGRATION_PLAN.md` | Migration strategy & scripts | Planning production migration |
| `REFACTOR_ROADMAP.md` | Backend code refactoring plan | After migration is complete |
| `ARCHITECTURE_ANALYSIS.md` | Current system documentation | Understanding existing system |

### **Staging Resources**

| File | Purpose | When to Use |
|------|---------|-------------|
| `QUICK_START.md` | **Start here!** 30-min setup | First time setup |
| `STAGING_SETUP_GUIDE.md` | Detailed instructions | Deep dive / troubleshooting |
| `QUICK_COMMANDS.md` | Command reference | Daily operations |
| `seed-sample-data.sql` | Sample test data | Populate staging database |

### **Migration Scripts**

| File | Purpose | When to Use |
|------|---------|-------------|
| `migrations/migrate.ts` | KV → Relational conversion | Test migration process |
| `migrations/validate.ts` | Verify migration accuracy | After migration |
| `migrations/migration-report.json` | Generated results log | Review migration stats |

---

## 🎯 Common Tasks

### I want to...

**Set up staging for the first time**
→ Follow [`QUICK_START.md`](./QUICK_START.md) steps 1-7

**Execute the database schema**
→ Copy `DATABASE_SCHEMA.sql` to Supabase SQL Editor and run

**Load test data**
→ Execute `staging/seed-sample-data.sql` in SQL Editor

**Test the migration**
→ Run `deno run --allow-net --allow-env --allow-read --allow-write staging/migrations/migrate.ts`

**Validate migration results**
→ Run `deno run --allow-net --allow-env staging/migrations/validate.ts`

**Query the database**
→ Use examples in [`QUICK_COMMANDS.md`](./QUICK_COMMANDS.md) section 6

**Reset and start over**
→ Use cleanup commands in [`QUICK_COMMANDS.md`](./QUICK_COMMANDS.md) section 7

**Backup my staging data**
→ `pg_dump "$STAGING_DB" > backup.sql`

---

## ✅ What You'll Have After Setup

✅ **Staging Supabase Project**
- 10 normalized tables
- Row Level Security policies
- Proper indexes and foreign keys
- Sample data (3 schools, 8 users, 5 students, etc.)

✅ **Migration Scripts**
- Tested KV → Relational conversion
- Validation tools
- Detailed migration report

✅ **Testing Environment**
- Isolated from production
- Safe to experiment
- Realistic data for testing

---

## 🔐 Security Notes

⚠️ **Never commit these files with real credentials:**
- `.env.staging`
- Any files with actual API keys
- Database passwords

✅ **Safe to commit:**
- All `.md` documentation files
- `.sql` schema files
- TypeScript migration scripts (without credentials)

---

## 📊 Database Schema Overview

### **10 Production Tables**

1. **schools** - University/college tenants
2. **users** - All user accounts (students, DSOs)
3. **students** - Extended student profiles with visa info
4. **requests** - Student-initiated requests (I-20, OPT, etc.)
5. **request_actions** - DSO-initiated requests to students
6. **responses** - Student responses to DSO requests
7. **documents** - Document metadata (files in Storage)
8. **audit_logs** - Compliance audit trail
9. **roster_imports** - CSV import tracking
10. **notifications** - In-app notifications

### **Key Features**

✨ Multi-tenant architecture (Row Level Security)
✨ Audit logging for SOC2 compliance
✨ Soft deletes (deleted_at column)
✨ Proper foreign key relationships
✨ Optimized indexes
✨ JSONB for flexible fields

---

## 🤝 Getting Help

### Before Asking for Help

1. Check [`QUICK_START.md`](./QUICK_START.md) troubleshooting section
2. Review Supabase Dashboard → Logs for errors
3. Run validation script to check data integrity
4. Check [`QUICK_COMMANDS.md`](./QUICK_COMMANDS.md) for examples

### Common Issues & Solutions

**"Type already exists" error**
→ Run cleanup commands to drop all types first

**"Student not found" during migration**
→ Clear staging data before migrating production data

**RLS blocking inserts**
→ Temporarily disable RLS during testing

**Can't connect via psql**
→ Verify PostgreSQL client is installed and connection string is correct

---

## 📈 Next Steps After Staging Setup

1. **Test API Endpoints**
   - Update frontend to use staging credentials
   - Test all user workflows
   - Verify data flows correctly

2. **Performance Testing**
   - Run EXPLAIN ANALYZE on queries
   - Monitor response times
   - Optimize slow queries

3. **Security Validation**
   - Test RLS policies
   - Verify multi-tenant isolation
   - Check authorization rules

4. **Plan Production Migration**
   - Review migration plan
   - Schedule maintenance window
   - Prepare rollback procedures

---

## 🎓 Learning Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Tutorial**: https://www.postgresql.org/docs/
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **Database Migrations**: https://supabase.com/docs/guides/cli/migrations

---

## 📝 Feedback & Improvements

Found an issue or have suggestions?
- Document it in staging notes
- Test the fix in staging first
- Update documentation

---

**Ready to begin? Start with [`QUICK_START.md`](./QUICK_START.md)! 🚀**
