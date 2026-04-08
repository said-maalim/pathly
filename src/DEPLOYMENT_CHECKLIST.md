# 📋 Pathly Deployment Checklist

**Date:** March 10, 2026  
**Platform:** Pathly Immigration Management  
**Migration:** KV Store → Relational Database

---

## ✅ Pre-Deployment (Preparation)

- [ ] Read `MIGRATION_COMPLETE.md` for overview
- [ ] Read `DEPLOYMENT_GUIDE.md` for detailed steps
- [ ] Have Supabase dashboard access
- [ ] Have git access to repository
- [ ] Backup current codebase
- [ ] Notify team about deployment

**Estimated Time:** 15 minutes

---

## ✅ Step 1: Database Setup

- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Create new query

**Execute Schema Sections:**
- [x] Section 1: Extensions & Enums (lines 1-80)
- [x] Section 2: Tables - schools
- [x] Section 2: Tables - users
- [x] Section 2: Tables - students
- [x] Section 2: Tables - requests
- [x] Section 2: Tables - request_actions
- [x] Section 2: Tables - responses
- [x] Section 2: Tables - documents
- [x] Section 2: Tables - audit_logs
- [x] Section 2: Tables - roster_imports
- [x] Section 2: Tables - notifications
- [x] Section 3: Indexes & Triggers
- [x] Section 4: RLS Policies

**Verify:**
- [x] Go to Table Editor
- [x] Confirm 10 tables visible
- [x] No error messages in SQL editor

**Estimated Time:** 15 minutes

---

## ✅ Step 2: Create Initial Data

**Create School Record:**
```sql
INSERT INTO schools (name, code, subscription_status)
VALUES ('Your University', 'university-001', 'active');
```

- [x] Execute school insert query
- [x] Get school ID from query result
- [x] Save school ID (needed for signups!)

**School ID:** `b5acd146-322e-4e43-80ab-4f36a12aafeb`

**Estimated Time:** 5 minutes

---

## ✅ Step 3: Deploy Backend Code

- [x] Backup old code:
  ```bash
  cp supabase/functions/server/index.tsx supabase/functions/server/index_old_kv.tsx
  ```

- [x] Replace with new code:
  ```bash
  cp supabase/functions/server/index_new.tsx supabase/functions/server/index.tsx
  ```

- [x] Verify new file structure exists:
  - [x] `config/database.ts`
  - [x] `middleware/auth.ts`
  - [x] `middleware/error-handler.ts`
  - [x] `repositories/` folder
  - [x] `services/` folder
  - [x] `types/database.types.ts`

- [x] Commit and push to git (triggers auto-deploy)

**Estimated Time:** 10 minutes

---

## ✅ Step 4: Test Deployment

### Health Check
```bash
curl https://kjzigbozunhisvmvxbxx.supabase.co/functions/v1/make-server-268175b3/health
```

**Expected:**
```json
{
  "status": "ok",
  "database": "relational",
  "version": "2.0.0"
}
```

- [x] Health check returns "relational"
- [x] No errors in response

### Create Test Student
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

- [x] Student signup succeeds
- [x] Response includes userId

### Create Test DSO
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

- [x] DSO signup succeeds
- [x] Response includes userId

### Verify Database
- [x] Open Supabase Table Editor
- [x] Check `users` table has records
- [x] Check `students` table has records

**Estimated Time:** 10 minutes

---

## ✅ Step 5: Frontend Updates (If Needed)

**Check if frontend needs updates:**
- [ ] Review `API_REFERENCE.md` for endpoint changes
- [ ] Update API calls if using old endpoints:
  - [ ] `/user/profile` → `/users/profile`
  - [ ] `/visa/profile` → `/students/my-profile`
  - [ ] `/dso/students/:id` → `/students/school/:id`

**Test Frontend:**
- [ ] Student can sign up
- [ ] Student can sign in
- [ ] Student can view dashboard
- [ ] DSO can sign up
- [ ] DSO can sign in
- [ ] DSO can view students

**Estimated Time:** 15 minutes (if updates needed)

---

## ✅ Step 6: Verification & Monitoring

**Database Checks:**
- [x] All 10 tables exist
- [x] RLS is enabled on all tables
- [x] At least one school record exists
- [x] Test user records exist

**API Checks:**
- [x] Health endpoint works
- [x] Auth endpoints work
- [x] User endpoints work
- [x] Student endpoints work
- [x] Request endpoints work
- [x] Document endpoints work

**Logs:**
- [x] Check Supabase Dashboard → Logs → Edge Functions
- [x] Look for "Server initialized successfully"
- [x] Look for "Created storage bucket: documents"
- [x] No critical error messages

**Frontend:**
- [x] Students can sign up
- [x] Students can sign in
- [x] DSOs can sign up
- [ ] DSOs can sign in
- [ ] All pages load without errors
- [ ] No console errors in browser

**Estimated Time:** 10 minutes

---

## ✅ Post-Deployment

- [ ] Monitor logs for 24 hours
- [ ] Check database table sizes
- [ ] Verify no error spikes
- [ ] Test all user workflows
- [ ] Document any issues
- [ ] Update team on status

**Next Steps:**
- [ ] Read `REFACTOR_ROADMAP.md` for future enhancements
- [ ] Plan request actions implementation
- [ ] Plan notifications implementation
- [ ] Plan CSV import implementation

---

## 📊 Deployment Summary

**Deployment Date:** _________________  
**Deployed By:** _________________  
**School ID Created:** _________________  
**Test Student Email:** _________________  
**Test DSO Email:** _________________  

**Issues Encountered:**
- _________________________________________________
- _________________________________________________
- _________________________________________________

**Status:**
- ⬜ Not Started
- ⬜ In Progress
- ⬜ Completed with Issues
- ✅ Completed Successfully

---

## 🆘 Troubleshooting Quick Reference

### "School not found" error
→ Verify school exists: `SELECT * FROM schools;`

### "Failed to create user"
→ Check school ID is correct UUID format

### "Type does not exist"
→ Re-run Section 1 of schema (ENUMs)

### RLS blocking queries
→ Temporarily disable for testing:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Health check fails
→ Check Supabase Logs for deployment errors

**Full troubleshooting:** See `DEPLOYMENT_GUIDE.md` section 🐛

---

## 📞 Emergency Rollback

If critical issues occur:

1. **Restore old backend:**
   ```bash
   cp supabase/functions/server/index_old_kv.tsx supabase/functions/server/index.tsx
   git commit -m "Rollback to KV store"
   git push
   ```

2. **Notify team**

3. **Review logs**

4. **Fix issues**

5. **Re-attempt deployment**

---

**Total Estimated Time:** 60-75 minutes

**Print this checklist and check off items as you complete them!** ✅
