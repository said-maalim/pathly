# Pathly Backend Testing Guide

## 🚀 Quick Start Testing

### Step 1: Access the Backend Demo
1. Go to your Pathly application
2. Click **"Backend Demo"** in the navigation bar
3. You'll see the testing interface

### Step 2: Create Your First Account
1. Fill in the form:
   - **Name**: Your name (e.g., "John Doe")
   - **Email**: Any email (e.g., "test@example.com")
   - **Password**: Any password (e.g., "password123")
2. Click **"Sign Up"**
3. ✅ You should see: "Account created successfully! Now sign in."

### Step 3: Sign In
1. Use the same email and password
2. Click **"Sign In"**
3. ✅ You should see: "Signed in successfully!"
4. ✅ Your profile should appear in the "User Profile" card

### Step 4: Update Visa Profile
1. Click **"Update Visa to F-1"** button
2. ✅ You should see: "Visa profile updated!"
3. ✅ Visa profile should show: F-1, Active, expires 2026-06-15

### Step 5: Upload a Document
1. Click **"Choose File"** 
2. Select any PDF, JPG, or PNG file (under 10MB)
3. ✅ You should see: "Document uploaded successfully!"

---

## 🔍 Verifying Data in Supabase Dashboard

### Accessing Supabase Dashboard

1. **Go to**: https://supabase.com/dashboard
2. **Sign in** with your Supabase account
3. **Select your project** (the one connected to Pathly)

---

## 📊 What to Check in Supabase

### 1. **Authentication** (Check Users)

**Where to find it:**
- Left sidebar → **Authentication** → **Users**

**What to look for:**
```
✅ Your test user should appear in the list
✅ Email should match what you signed up with
✅ "Email Confirmed" should be ✓ (green checkmark)
✅ User ID (UUID format like: a1b2c3d4-...)
✅ Created At timestamp
```

**User Metadata to verify:**
- Click on a user to see details
- Look for "User Metadata" section
- Should contain:
  ```json
  {
    "name": "John Doe",
    "userType": "regular"
  }
  ```

---

### 2. **Database** (Check KV Store Data)

**Where to find it:**
- Left sidebar → **Database** → **Tables**
- Look for table: `kv_store_268175b3`

**What to look for:**

#### Check User Profile
1. Click on the table
2. Look for a row where `key` = `user:{your-user-id}`
3. Click on the `value` column to expand
4. Should contain:
   ```json
   {
     "id": "user-uuid-here",
     "email": "test@example.com",
     "name": "John Doe",
     "userType": "regular",
     "createdAt": "2024-11-12T..."
   }
   ```

#### Check Visa Profile
1. Look for key = `visa:{your-user-id}`
2. Value should contain:
   ```json
   {
     "userId": "user-uuid-here",
     "visaType": "F-1",
     "status": "Active",
     "expirationDate": "2026-06-15",
     "sevisStatus": null,
     "compliance": null,
     "createdAt": "2024-11-12T...",
     "updatedAt": "2024-11-12T..."
   }
   ```

#### Check Documents List
1. Look for key = `docs:user:{your-user-id}`
2. Value should be an array:
   ```json
   [
     "doc:user-id:1731456789000"
   ]
   ```

#### Check Individual Document
1. Look for key = `doc:{your-user-id}:{timestamp}`
2. Value should contain:
   ```json
   {
     "id": "doc:user-id:timestamp",
     "userId": "user-uuid-here",
     "fileName": "my-passport.pdf",
     "storagePath": "user-id/passport_1731456789000.pdf",
     "documentType": "passport",
     "uploadedAt": "2024-11-12T...",
     "status": "pending_review"
   }
   ```

---

### 3. **Storage** (Check Uploaded Files)

**Where to find it:**
- Left sidebar → **Storage**
- Look for bucket: `make-268175b3-documents`

**What to look for:**
```
✅ Bucket should exist
✅ Bucket should be "Private" (🔒 icon)
✅ Click into the bucket
✅ You should see a folder with your user ID
✅ Inside that folder: your uploaded files
   Example: passport_1731456789000.pdf
```

**To verify file is accessible:**
1. Click on the file
2. Click **"Get shareable link"** or **"Download"**
3. Link should be a signed URL (temporary, expires in 1 hour)

---

### 4. **Edge Functions** (Check Server Logs)

**Where to find it:**
- Left sidebar → **Edge Functions**
- Click on: `make-server-268175b3`

**What to look for:**

#### Deployments
```
✅ Function should show "Active" status
✅ Recent deployment timestamp
```

#### Logs (Real-time testing)
1. Click **"Logs"** tab
2. Keep this open while testing
3. As you interact with the backend demo, you should see:
   ```
   POST /make-server-268175b3/auth/signup
   POST /make-server-268175b3/auth/signin
   GET /make-server-268175b3/user/profile
   PUT /make-server-268175b3/visa/profile
   POST /make-server-268175b3/documents/upload
   ```

**If you see errors:**
- Red text indicates errors
- Click to expand and read the error message
- Common issues: authentication, missing data, file size too large

---

## ✅ Complete Testing Checklist

### **Authentication Tests**

- [ ] **Sign Up (Regular User)**
  - Create account with test@example.com
  - Check: User appears in Supabase Auth → Users
  - Check: `user:{userId}` exists in KV store

- [ ] **Sign In**
  - Sign in with credentials
  - Check: Session token is generated
  - Check: Profile data loads correctly

- [ ] **Sign Out**
  - Click sign out
  - Check: Session is cleared
  - Check: Profile data disappears

- [ ] **Sign Up (Student)**
  - Use email ending in @university.edu
  - Check: userType = "student" in metadata
  - Check: `visa:{userId}` created automatically

### **Profile Management Tests**

- [ ] **Get User Profile**
  - Sign in
  - Check: Profile card shows your name and email
  - Check: Supabase logs show GET /user/profile

- [ ] **Update Visa Profile**
  - Click "Update Visa to F-1"
  - Check: Success message appears
  - Check: Visa profile updates in UI
  - Check: `visa:{userId}` updated in KV store
  - Check: updatedAt timestamp changed

### **Document Upload Tests**

- [ ] **Upload PDF Document**
  - Upload a PDF file
  - Check: Success message
  - Check: File appears in Storage bucket
  - Check: Document record in KV store
  - Check: File path format: {userId}/passport_{timestamp}.pdf

- [ ] **Upload Image Document**
  - Upload JPG or PNG
  - Check: Same verifications as above

- [ ] **Upload Large File**
  - Try uploading file > 10MB
  - Check: Should fail with error message

### **Student Request Tests**

- [ ] **Submit I-20 Request**
  - Go to University Student Portal
  - Submit new I-20 request
  - Check: `request:{userId}:{timestamp}` in KV store
  - Check: Request status = "pending"

- [ ] **Submit OPT Request**
  - Submit OPT application
  - Check: Request created with type = "opt"

### **DSO Admin Tests**

- [ ] **Create DSO Account**
  - Sign up as DSO
  - Check: userType = "dso" in metadata

- [ ] **Update SEVIS Status**
  - Use DSO portal to update student SEVIS
  - Check: Student's visa profile updated
  - Check: SEVIS log created

- [ ] **Send Bulk Email**
  - Send bulk email reminder
  - Check: Email log created in KV store
  - Check: Timestamp and message recorded

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to create account"
**Check:**
1. Email format is valid
2. Password is at least 6 characters
3. Supabase Edge Function is running
4. Check Edge Function logs for errors

**Solution:**
- Try different email
- Check browser console for error details

---

### Issue: "Unauthorized" error
**Check:**
1. User is signed in
2. Session token is valid
3. Browser console for auth token

**Solution:**
- Sign out and sign in again
- Clear browser cache
- Check if session expired

---

### Issue: "Document upload failed"
**Check:**
1. File size < 10MB
2. File format is PDF, JPG, or PNG
3. Storage bucket exists
4. User is authenticated

**Solution:**
- Try smaller file
- Check file format
- Verify storage bucket in Supabase

---

### Issue: Data not appearing in KV store
**Check:**
1. API call succeeded (check browser network tab)
2. Edge Function logs (no errors)
3. Correct key format

**Solution:**
- Refresh the database table view
- Check Edge Function logs for database errors
- Verify API call completed successfully

---

## 📈 Performance Checks

### Response Times (should be fast)
- Auth signup/signin: < 2 seconds
- Get profile: < 1 second
- Update profile: < 1 second
- Upload document: < 5 seconds (depends on file size)

### To check response times:
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Perform an action (e.g., sign in)
4. Look for API call to Supabase
5. Check "Time" column

---

## 🔐 Security Checks

### Verify Private Storage
1. Get the storage path of an uploaded file
2. Try to access it directly without authentication
3. ✅ Should fail with 403 Forbidden

### Verify Row-Level Security
1. Sign in as User A
2. Note User A's user ID
3. Sign out, create User B
4. Try to access User A's data
5. ✅ Should fail / return empty

### Verify DSO Permissions
1. Sign in as regular user
2. Try to call DSO-only endpoints
3. ✅ Should return 403 Forbidden

---

## 📝 Sample Test Scenarios

### Scenario 1: New Student Journey
1. Sign up with university email (student@university.edu)
2. Verify student profile created
3. Update visa information
4. Upload I-20 document
5. Submit OPT request
6. Check all data in Supabase

### Scenario 2: DSO Admin Workflow
1. Sign up as DSO admin
2. View pending student requests
3. Update student SEVIS status
4. Create document request for student
5. Send bulk email reminder
6. Verify logs in KV store

### Scenario 3: Multiple Users
1. Create 3 different users
2. Each uploads different documents
3. Verify isolation (User A can't see User B's docs)
4. Check Storage shows separate folders
5. Verify KV store has separate keys

---

## 🎯 Success Criteria

Your backend is working correctly if:

✅ Users can sign up and sign in
✅ User data appears in Supabase Auth
✅ Profile data is stored in KV store
✅ Visa profiles can be created and updated
✅ Documents upload to Storage successfully
✅ Document records appear in KV store
✅ Student requests are created and routed
✅ DSO admins can update SEVIS status
✅ Edge Function logs show successful API calls
✅ No errors in browser console
✅ Data persists after page refresh

---

## 📞 Getting Help

If something isn't working:

1. **Check Browser Console** (F12 → Console tab)
   - Look for red error messages
   - Note the error text

2. **Check Network Tab** (F12 → Network tab)
   - Filter by "Fetch/XHR"
   - Look for failed requests (red)
   - Click on failed request, check Response tab

3. **Check Supabase Logs**
   - Edge Functions → Logs
   - Look for error stack traces
   - Note the timestamp and error message

4. **Check This Guide**
   - Review the relevant section
   - Follow troubleshooting steps

5. **Common Quick Fixes**
   - Refresh the page
   - Clear browser cache
   - Sign out and sign in again
   - Check if Supabase project is active

---

## 🎉 Next Steps After Testing

Once backend testing is complete:

1. **Integrate with User Dashboard**
   - Replace mock data with real API calls
   - Load visa profile from database
   - Display real documents

2. **Integrate with University Portal**
   - Connect I-20/OPT request forms
   - Load SEVIS status from database
   - Implement real document requests

3. **Add Error Handling**
   - Show user-friendly error messages
   - Handle network failures gracefully
   - Add loading states

4. **Add Features**
   - Real-time notifications
   - Document status updates
   - Email notifications (requires email provider)

Happy Testing! 🚀
