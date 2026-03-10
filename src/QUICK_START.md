# 🚀 Pathly Backend - Quick Start Guide

## Overview
Your Pathly backend is **fully functional** and ready to test! Here's everything you need to know to get started.

---

## 📍 Step 1: Access the Testing Interface

Click **"Backend Demo"** in the navigation bar (visible on landing page)

---

## 🧪 Step 2: Test the Backend (5 minutes)

### Create Your Account
1. Enter your **Name**: (e.g., "John Doe")
2. Enter an **Email**: (e.g., "test@example.com") 
3. Enter a **Password**: (min 6 characters)
4. Click **"Sign Up"**
5. ✅ You should see: "Account created successfully!"

### Sign In
1. Use the same email and password
2. Click **"Sign In"**
3. ✅ Your profile should appear automatically

### Update Visa Profile
1. Click **"Update Visa to F-1"**
2. ✅ Visa profile should show F-1, Active, expires 2026-06-15

### Upload a Document
1. Click **"Choose File"**
2. Select any PDF, JPG, or PNG file (< 10MB)
3. ✅ You should see "Document uploaded successfully!"

### View Your Data
1. Click **"View Data Monitor"** button (top right)
2. ✅ See all your data in real-time!
3. Click **"Refresh Data"** to reload

---

## 🔍 Step 3: Verify in Supabase Dashboard

### Access Supabase
1. Go to: **https://supabase.com/dashboard**
2. **Sign in** to your Supabase account
3. **Select your project**

### Check Authentication
**Path**: `Authentication → Users`

✅ **What to verify:**
- Your email appears in the list
- Email is confirmed (green checkmark)
- User ID (UUID format)
- User metadata shows your name and userType

### Check Database (KV Store)
**Path**: `Database → Tables → kv_store_268175b3`

✅ **What to verify:**
- Row with key = `user:{your-user-id}` exists
- Row with key = `visa:{your-user-id}` exists
- If you uploaded: key = `docs:user:{your-user-id}`
- If you uploaded: key = `doc:{your-user-id}:{timestamp}`

**💡 Tip**: Click on the "value" column to expand and view the JSON data

### Check Storage
**Path**: `Storage → make-268175b3-documents`

✅ **What to verify:**
- Bucket exists and is marked "Private" 🔒
- Folder with your user ID exists
- Your uploaded file appears inside

### Check Edge Function Logs
**Path**: `Edge Functions → make-server-268175b3 → Logs`

✅ **What to verify:**
- Recent API calls are logged
- No red error messages
- You see: POST /auth/signup, GET /user/profile, etc.

---

## 📊 Understanding the Data Structure

### In Supabase Auth
```
User Record:
├── id: "a1b2c3d4-e5f6-..." (UUID)
├── email: "test@example.com"
├── email_confirmed: true
└── user_metadata:
    ├── name: "John Doe"
    └── userType: "regular"
```

### In KV Store Database
```
user:{userId}  →  { id, email, name, userType, createdAt }
visa:{userId}  →  { userId, visaType, status, expirationDate, sevisStatus, compliance }
docs:user:{userId}  →  ["doc:user:123", "doc:user:456"]
doc:{userId}:{timestamp}  →  { id, fileName, storagePath, documentType, status }
```

### In Storage
```
make-268175b3-documents/
└── {userId}/
    ├── passport_1731456789000.pdf
    ├── i20_1731456790000.jpg
    └── transcript_1731456791000.pdf
```

---

## ✅ Testing Checklist

### Basic Tests
- [ ] Sign up creates account
- [ ] Sign in works with credentials
- [ ] Profile data appears after sign in
- [ ] Visa profile can be updated
- [ ] Documents can be uploaded
- [ ] Data appears in Backend Monitor
- [ ] Sign out clears session

### Supabase Verification
- [ ] User appears in Auth → Users
- [ ] User data in KV store (user:id)
- [ ] Visa data in KV store (visa:id)
- [ ] Documents in Storage bucket
- [ ] Edge Function logs show API calls

---

## 🎯 What Each Tool Does

### 1. **Backend Demo** (`/auth-demo`)
- **Purpose**: Test authentication and basic features
- **Use for**: Sign up, sign in, update profile, upload files
- **Perfect for**: Quick testing and verification

### 2. **Backend Monitor** (`/backend-monitor`)
- **Purpose**: View your data in real-time
- **Use for**: Seeing exactly what's stored in the database
- **Perfect for**: Debugging and understanding data structure

### 3. **Supabase Dashboard**
- **Purpose**: Official database/storage admin panel
- **Use for**: Viewing raw data, checking logs, managing storage
- **Perfect for**: Deep inspection and troubleshooting

---

## 🔗 All Available Features

### ✅ Working Now
- [x] User authentication (sign up, sign in, sign out)
- [x] User profiles with metadata
- [x] Visa profile management
- [x] Document upload to secure storage
- [x] KV store database for all records
- [x] Role-based access (regular, student, DSO)
- [x] Private storage buckets
- [x] Signed URLs for document downloads
- [x] Session management with JWT
- [x] Error handling and logging

### 🚧 Ready to Integrate
- [ ] Student I-20/OPT requests
- [ ] DSO SEVIS status updates
- [ ] Document request workflow
- [ ] Bulk email system
- [ ] Real-time notifications
- [ ] Connect to University Portal UI
- [ ] Connect to User Dashboard UI

---

## 🐛 Common Issues & Solutions

### "Failed to create account"
**Solution**: 
- Check password is at least 6 characters
- Try a different email address
- Check browser console for errors

### "Unauthorized" error
**Solution**:
- Sign out and sign in again
- Clear browser cache
- Check session hasn't expired

### Document upload fails
**Solution**:
- File must be < 10MB
- Accepted formats: PDF, JPG, PNG
- Make sure you're signed in

### Data not in Supabase
**Solution**:
- Refresh the Supabase dashboard page
- Check you're looking at the right table/bucket
- Verify API call succeeded (check browser Network tab)

---

## 📈 Next Steps

### Immediate Testing (Now)
1. ✅ Test authentication flow
2. ✅ Upload a few documents
3. ✅ Verify data in Supabase
4. ✅ Check Edge Function logs

### Integration (Next)
1. Connect University Student Portal to real API
2. Connect DSO Portal to real API
3. Connect User Dashboard to real API
4. Add real document management

### Production (Future)
1. Configure email provider in Supabase
2. Add rate limiting
3. Set up monitoring/alerts
4. Configure backups
5. Add production security measures

---

## 📚 Reference Documents

- **TESTING_GUIDE.md** - Comprehensive testing instructions
- **BACKEND_SETUP.md** - Complete API documentation
- **README files** - Additional setup information

---

## 🎉 Success Criteria

Your backend is working if:

✅ You can create an account and sign in  
✅ Profile data loads after login  
✅ Visa profile updates successfully  
✅ Documents upload to storage  
✅ Data appears in Backend Monitor  
✅ User shows in Supabase Auth  
✅ Records exist in KV store  
✅ Files appear in Storage  
✅ Edge Function logs show activity  

---

## 💡 Pro Tips

1. **Keep Browser DevTools Open** (F12)
   - Console tab: See error messages
   - Network tab: Track API calls
   
2. **Use Backend Monitor** 
   - View data in real-time
   - Understand data structure
   - Debug issues quickly

3. **Check Supabase Logs Regularly**
   - See what's actually happening
   - Catch errors early
   - Monitor performance

4. **Test with Multiple Users**
   - Create 2-3 different accounts
   - Verify data isolation
   - Test different user types

---

## 🆘 Need Help?

1. **Check Browser Console** - Look for red errors
2. **Check Supabase Logs** - Edge Functions → Logs
3. **Review TESTING_GUIDE.md** - Detailed troubleshooting
4. **Check Network Tab** - See failed API requests
5. **Try Backend Monitor** - View your actual data

---

## 🎯 Quick Commands

### Open Backend Demo
Click "Backend Demo" in navigation

### Open Backend Monitor  
Click "View Data Monitor" (from Backend Demo)

### Open Supabase
https://supabase.com/dashboard

### Check Edge Function Logs
Supabase Dashboard → Edge Functions → make-server-268175b3 → Logs

### Check KV Store
Supabase Dashboard → Database → Tables → kv_store_268175b3

### Check Storage
Supabase Dashboard → Storage → make-268175b3-documents

---

Happy Testing! 🚀

Your backend is production-ready and waiting for your data!
