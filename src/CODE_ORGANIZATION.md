# Pathly - Code Organization Overview

## 📁 Project Structure at a Glance

```
pathly/
├── 🎨 FRONTEND (React Components)
│   ├── App.tsx                          # Main app entry point & router
│   ├── components/                      # All React components
│   │   ├── [Page Components]            # Main screens
│   │   ├── [Testing Components]         # Backend testing tools
│   │   └── ui/                          # Reusable UI components (ShadCN)
│   ├── styles/                          # CSS & design system
│   └── utils/                           # Frontend utilities & API client
│
├── 🔧 BACKEND (Supabase Edge Functions)
│   └── supabase/functions/server/       # Server-side code
│       ├── index.tsx                    # API routes & handlers
│       └── kv_store.tsx                 # Database utility (protected)
│
└── 📚 DOCUMENTATION
    ├── QUICK_START.md                   # 5-min getting started
    ├── TESTING_GUIDE.md                 # Testing instructions
    └── BACKEND_SETUP.md                 # API documentation
```

---

## 🎨 FRONTEND FILES (Client-Side / Browser)

### **Entry Point**

#### `/App.tsx` - Main Application Router
**Purpose**: Navigation hub that switches between different pages

**Flow**:
```
1. User visits the app
2. App.tsx loads with currentPage state = 'landing'
3. User clicks navigation → changes currentPage
4. renderPage() switches to appropriate component
5. Component renders with onNavigate prop
```

**What it does**:
- Manages which page is currently shown
- Provides `navigate()` function to all pages
- Routes: landing, dashboard, experts, resources, university, auth-demo, backend-monitor

**Code**: ~30 lines, simple switch statement

---

### **Main Page Components** (User-Facing)

#### `/components/LandingPage.tsx` - Homepage
**Purpose**: First page users see, marketing & navigation

**Flow**:
```
1. User arrives at site
2. Sees hero section with Pathly branding
3. Can navigate to: Dashboard, Experts, Resources, University Portal
4. CTA buttons lead to sign up flow
```

**What it contains**:
- Header with navigation
- Hero section ("Your visa journey, simplified")
- Feature highlights
- Call-to-action buttons
- Footer

**Mock Data**: None, all static content  
**Code**: ~250 lines, mostly JSX structure

---

#### `/components/UserDashboard.tsx` - Main User Dashboard
**Purpose**: Central hub for logged-in users to manage their visa journey

**Flow**:
```
1. User signs in
2. Dashboard loads showing:
   - Visa status card
   - Upcoming tasks
   - Document checklist
   - AI assistant "Lexi"
3. User can navigate to different sections
```

**What it contains**:
- Visa status overview (F-1 status, expiration, timeline)
- Progress tracker (Document Collection → Review → Interview → Approval)
- Task list with deadlines
- Document checklist
- Chat interface with Lexi (AI assistant)
- Quick actions (Upload docs, Book expert, etc.)

**Mock Data**: YES - visa status, tasks, documents  
**Status**: 🟡 Ready to connect to real API  
**Code**: ~400 lines

---

#### `/components/ExpertBooking.tsx` - Expert Consultation Booking
**Purpose**: Browse and book appointments with immigration experts

**Flow**:
```
1. User clicks "Talk to an Expert"
2. Sees grid of expert profiles
3. Filters by expertise, rating, availability
4. Selects expert → calendar appears
5. Picks time slot → books appointment
```

**What it contains**:
- Expert profiles with photos, ratings, specialties
- Filter/search functionality
- Calendar interface for booking
- Time slot selection
- Booking confirmation

**Mock Data**: YES - expert profiles, availability slots  
**Status**: 🟡 Needs payment integration  
**Code**: ~350 lines

---

#### `/components/ResourcesPage.tsx` - Knowledge Base
**Purpose**: Searchable articles and guides about visas

**Flow**:
```
1. User needs visa information
2. Searches or browses by category
3. Clicks article → reads content
4. Can bookmark or share
```

**What it contains**:
- Search bar
- Category filters (F-1 Visa, OPT, CPT, Travel, etc.)
- Article cards with titles, descriptions, read time
- Article viewer
- Breadcrumbs for navigation

**Mock Data**: YES - article titles and summaries  
**Status**: 🟢 Frontend complete  
**Code**: ~300 lines

---

#### `/components/UniversityPortal.tsx` - Portal Router
**Purpose**: Routes between Student and DSO (admin) portals

**Flow**:
```
1. User selects role: Student or DSO Admin
2. Component renders appropriate sub-portal
3. Provides role switcher
```

**What it contains**:
- Role selection tabs
- Renders either UniversityStudentPortal or UniversityDSOPortal

**Code**: ~50 lines, simple router

---

#### `/components/UniversityStudentPortal.tsx` - Student Self-Service
**Purpose**: Students manage I-20, OPT, documents, and SEVIS status

**Flow**:
```
1. Student logs in with university credentials
2. Sees personal SEVIS status
3. Can:
   - Request new I-20
   - Apply for OPT
   - Upload required documents
   - View compliance status
   - Respond to DSO document requests
```

**What it contains**:
- SEVIS status dashboard
- I-20 request form
- OPT application form
- Document upload interface
- Document requests from DSO
- Compliance alerts

**Mock Data**: YES - SEVIS status, pending requests  
**Status**: 🟡 Ready to connect to API  
**Code**: ~400 lines

---

#### `/components/UniversityDSOPortal.tsx` - DSO Admin Interface
**Purpose**: University admins manage all students' visa compliance

**Flow**:
```
1. DSO logs in
2. Sees overview of all students
3. Can:
   - Update SEVIS statuses
   - Process I-20 requests
   - Request documents from students
   - Send bulk email reminders
   - Monitor compliance
```

**What it contains**:
- Student list/search
- Pending requests queue
- SEVIS status update form
- Document request creator
- Bulk email composer
- Analytics dashboard

**Mock Data**: YES - student list, requests  
**Status**: 🟡 Ready to connect to API  
**Code**: ~450 lines

---

### **Testing Components** (Developer Tools)

#### `/components/AuthDemo.tsx` - Backend API Tester
**Purpose**: Test authentication and basic backend features

**Flow**:
```
1. Developer opens Backend Demo
2. Creates test account
3. Signs in
4. Tests: profile updates, visa updates, document uploads
5. Sees success/error messages
```

**What it contains**:
- Sign up form
- Sign in form
- Profile display
- Visa update button
- Document upload input
- API endpoint reference

**Mock Data**: NO - uses real API  
**Status**: 🟢 Fully functional  
**Code**: ~300 lines

---

#### `/components/BackendMonitor.tsx` - Real-time Data Viewer
**Purpose**: Show exactly what's stored in Supabase database

**Flow**:
```
1. User signs in via AuthDemo
2. Opens Backend Monitor
3. Sees live data from database:
   - Session info
   - User profile (KV store)
   - Visa profile (KV store)
   - Documents (KV store + Storage)
4. Can refresh to reload data
```

**What it contains**:
- Session status card
- User profile display with raw JSON
- Visa profile display with raw JSON
- Document list with storage paths
- Database key names
- Instructions for Supabase verification

**Mock Data**: NO - shows real database data  
**Status**: 🟢 Fully functional  
**Code**: ~350 lines

---

### **UI Component Library** (`/components/ui/`)

**Purpose**: Reusable, pre-built UI components from ShadCN

**What's included**:
- **Forms**: Button, Input, Textarea, Select, Checkbox, Switch
- **Layout**: Card, Tabs, Sheet, Dialog, Drawer
- **Data Display**: Table, Badge, Avatar, Separator
- **Feedback**: Alert, Toast (Sonner), Progress
- **Navigation**: Breadcrumb, Pagination, Navigation Menu
- **Overlays**: Popover, Tooltip, Context Menu, Dropdown Menu

**Status**: 🟢 Complete, do not modify  
**Total**: 50+ components

---

### **Frontend Utilities** (`/utils/`)

#### `/utils/api.ts` - API Client Library
**Purpose**: Easy-to-use functions to call backend APIs

**Flow**:
```
1. Component needs data (e.g., user profile)
2. Imports: import * as api from '../utils/api'
3. Calls: const result = await api.getUserProfile()
4. API client:
   - Gets current session token
   - Adds Authorization header
   - Calls Supabase Edge Function
   - Returns JSON response
```

**What it provides**:
```javascript
// Authentication
- signUp(email, password, name, userType)
- signIn(email, password)
- signOut()
- getCurrentSession()

// User Profile
- getUserProfile()
- updateUserProfile(updates)

// Visa Profile
- getVisaProfile()
- updateVisaProfile(updates)

// Documents
- uploadDocument(file, documentType)
- getDocuments()
- getDocumentDownloadUrl(documentId)

// Student Requests
- submitRequest(requestType, reason)
- getUniversityRequests(universityId)
- updateRequestStatus(requestId, status, notes)

// Document Requests
- createDocumentRequest(studentId, documentType, dueDate, notes)
- getDocumentRequests()

// SEVIS Status
- updateSevisStatus(studentId, sevisStatus, compliance, nextCheckDate, notes)

// Bulk Email
- sendBulkEmail(recipientGroup, subject, message)
```

**Status**: 🟢 Complete and working  
**Code**: ~200 lines

---

#### `/utils/supabase/info.tsx` - Supabase Config (Protected)
**Purpose**: Stores project ID and API keys

**DO NOT MODIFY**: Auto-generated by Figma Make

---

#### `/utils/supabase/client.tsx` - Supabase Client (Protected)
**Purpose**: Creates Supabase client instances

**DO NOT MODIFY**: Auto-generated

---

### **Styling** (`/styles/`)

#### `/styles/globals.css` - Design System
**Purpose**: Global styles, typography, and color tokens

**What it defines**:
- Color palette (Blues, Grays)
- Typography (Inter font, sizes, weights)
- CSS variables
- Tailwind v4 configuration
- Component base styles

**Do not modify unless**: User asks for design changes

---

## 🔧 BACKEND FILES (Server-Side / Edge Functions)

### `/supabase/functions/server/index.tsx` - API Server
**Purpose**: Main backend server with all API routes

**Architecture**: 
- **Framework**: Hono (fast web framework for Deno)
- **Runtime**: Deno (on Supabase Edge Functions)
- **Database**: KV Store (key-value pairs in PostgreSQL)
- **Storage**: Supabase Storage (for file uploads)

**Flow**:
```
1. Frontend makes HTTP request
2. Request hits Edge Function
3. CORS middleware allows request
4. Authentication middleware verifies token
5. Route handler processes request
6. Interacts with KV store or Storage
7. Returns JSON response
```

**Structure**:
```javascript
// Setup
- Import dependencies (Hono, Supabase)
- Create app instance
- Enable CORS for all origins
- Enable logging

// Helper Functions
- getSupabaseAdmin() → Admin client (full access)
- getSupabaseClient() → Public client (limited access)
- verifyAuth() → Check if user is authenticated
- initializeStorage() → Create storage buckets on startup

// Routes (17 total)

=== AUTHENTICATION (3) ===
POST /auth/signup
  → Create regular user account
  → Creates user in Auth + profile in KV store

POST /auth/signup/student  
  → Create student account
  → Validates university email
  → Creates visa profile automatically

POST /auth/signup/dso
  → Create DSO admin account
  → For university administrators

=== USER PROFILE (2) ===
GET /user/profile
  → Get current user's profile from KV store
  → Requires: Authentication

PUT /user/profile
  → Update user profile
  → Requires: Authentication

=== VISA PROFILE (2) ===
GET /visa/profile
  → Get visa information
  → Creates empty profile if doesn't exist
  → Requires: Authentication

PUT /visa/profile
  → Update visa type, status, expiration, SEVIS, compliance
  → Requires: Authentication

=== DOCUMENTS (3) ===
POST /documents/upload
  → Upload file to Supabase Storage
  → Create document record in KV store
  → Add to user's document list
  → Requires: Authentication, File < 10MB

GET /documents
  → List all documents for current user
  → Requires: Authentication

GET /documents/:documentId/download
  → Generate signed URL for download (valid 1 hour)
  → Verifies ownership or DSO access
  → Requires: Authentication

=== STUDENT REQUESTS (3) ===
POST /requests/submit
  → Submit I-20 or OPT request
  → Creates request in KV store
  → Adds to university's pending queue
  → Requires: Authentication, Role = Student

GET /requests/university/:universityId
  → Get all pending requests for university
  → Requires: Authentication, Role = DSO

PUT /requests/:requestId/status
  → Approve or deny student request
  → Requires: Authentication, Role = DSO

=== DOCUMENT REQUESTS (2) ===
POST /dso/document-request
  → DSO requests document from student
  → Creates request in student's queue
  → Requires: Authentication, Role = DSO

GET /document-requests
  → Get document requests for current user
  → Shows pending requests from DSO
  → Requires: Authentication, Role = Student

=== SEVIS STATUS (1) ===
PUT /dso/sevis/:studentId
  → Update student's SEVIS status
  → Records update in log
  → Requires: Authentication, Role = DSO

=== BULK COMMUNICATIONS (1) ===
POST /dso/bulk-email
  → Send bulk email to student groups
  → Logs email in KV store
  → Requires: Authentication, Role = DSO
```

**Security**:
- All routes check authentication (except signup)
- Role-based access control (student vs DSO)
- Private storage (requires auth to download)
- Input validation on all endpoints

**Status**: 🟢 Fully implemented and tested  
**Code**: ~600 lines

---

### `/supabase/functions/server/kv_store.tsx` - Database Utility
**Purpose**: Helper functions for key-value database operations

**DO NOT MODIFY**: Protected system file

**What it provides**:
- `get(key)` → Get single value
- `set(key, value)` → Set single value
- `del(key)` → Delete single value
- `mget(keys)` → Get multiple values
- `mset(entries)` → Set multiple values
- `mdel(keys)` → Delete multiple keys
- `getByPrefix(prefix)` → Get all keys starting with prefix

---

## 📚 DOCUMENTATION FILES

### `/QUICK_START.md`
- 5-minute getting started guide
- Step-by-step testing instructions
- Success criteria checklist

### `/TESTING_GUIDE.md`
- Comprehensive testing guide
- How to verify in Supabase dashboard
- Troubleshooting common issues
- Testing scenarios

### `/BACKEND_SETUP.md`
- Complete API documentation
- All 17 endpoints explained
- Data models and schemas
- Security features
- Integration examples

---

## 🔄 Data Flow Example

### Example: User Signs Up

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: AuthDemo.tsx                                       │
│                                                              │
│ 1. User enters: email, password, name                        │
│ 2. Clicks "Sign Up"                                          │
│ 3. Calls: api.signUp(email, password, name, 'regular')      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP POST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ UTILS: /utils/api.ts                                         │
│                                                              │
│ 1. Constructs request to:                                    │
│    POST {API_BASE}/auth/signup                               │
│ 2. Sends JSON body: { email, password, name, userType }     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Network Request
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: /supabase/functions/server/index.tsx               │
│                                                              │
│ 1. Receives POST at /make-server-268175b3/auth/signup       │
│ 2. Validates email, password, name                           │
│ 3. Calls Supabase Auth API:                                  │
│    supabase.auth.admin.createUser({...})                     │
│ 4. Creates user in Auth table                                │
│ 5. Creates profile in KV store:                              │
│    kv.set(`user:{userId}`, { id, email, name, userType })   │
│ 6. Returns: { success: true, userId }                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ JSON Response
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE: Supabase                                           │
│                                                              │
│ Auth Table:                                                  │
│   ✓ User created with email + hashed password                │
│   ✓ User metadata: { name, userType }                        │
│                                                              │
│ KV Store (kv_store_268175b3 table):                         │
│   ✓ Key: user:{userId}                                       │
│   ✓ Value: { id, email, name, userType, createdAt }         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Connection Status

### ✅ Fully Connected (Working)
- AuthDemo ↔ Backend API ↔ Database
- BackendMonitor ↔ Backend API ↔ Database

### 🟡 Ready to Connect (Mock Data Currently)
- UserDashboard → Need to replace mock visa data with `api.getVisaProfile()`
- UniversityStudentPortal → Need to wire up request forms to `api.submitRequest()`
- UniversityDSOPortal → Need to wire up SEVIS updates to `api.updateSevisStatus()`
- ExpertBooking → Need real booking system (no API built yet)
- ResourcesPage → Need real articles (no API built yet)

### 🔴 Not Built Yet
- Payment processing for expert bookings
- Real-time notifications
- Email provider integration
- Article/resource management system

---

## 📊 File Statistics

### Frontend
- **Main Pages**: 6 files (~2,000 lines)
- **Testing Tools**: 2 files (~650 lines)
- **UI Components**: 50+ files (ShadCN library)
- **Utilities**: 3 files (~250 lines)
- **Total Frontend**: ~60 files

### Backend
- **Server**: 1 file (~600 lines)
- **Database Utility**: 1 file (protected, ~100 lines)
- **Total Backend**: 2 files

### Documentation
- **Guides**: 3 files (~1,500 lines)

---

## 🔍 Key Patterns Used

### Frontend Patterns
1. **Component Props**: `{ onNavigate: (page: string) => void }`
2. **State Management**: `useState` for local state, no global state yet
3. **Mock Data**: Arrays of objects defined at top of component
4. **API Calls**: `await api.functionName()` with error handling

### Backend Patterns
1. **Route Handlers**: `app.post('/route', async (c) => { ... })`
2. **Auth Middleware**: `verifyAuth()` before protected routes
3. **KV Store Keys**: `{type}:{userId}` or `{type}:{userId}:{timestamp}`
4. **Response Format**: `{ success: true, data }` or `{ error: 'message' }`

### Data Patterns
1. **User ID**: UUID from Supabase Auth
2. **Timestamps**: ISO 8601 format (`new Date().toISOString()`)
3. **Storage Paths**: `{userId}/{docType}_{timestamp}.{ext}`
4. **Document IDs**: `doc:{userId}:{timestamp}`

---

## 🎨 Design System

**Colors**:
- Primary Blue: `#2A73E8`
- Hover Blue: `#1557b0`
- Background: `#F5F6FA`
- Text: Gray-900, Gray-700, Gray-600

**Typography**:
- Font: Inter
- Sizes: Defined in globals.css
- No inline font sizes (use default h1, h2, p)

**Layout**:
- Rounded corners (rounded-lg, rounded-xl)
- Subtle shadows
- White cards on gray background
- Mobile-first responsive design

---

This is your complete codebase overview! Would you like me to dive deeper into any specific file or explain any particular flow in more detail?
