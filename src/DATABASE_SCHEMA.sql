-- =====================================================
-- Pathly Platform - Production Database Schema
-- =====================================================
-- Version: 1.0
-- Date: March 7, 2026
-- Description: Multi-tenant relational schema for university immigration management
-- Target: Supabase/PostgreSQL 15+
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable timestamp utilities
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =====================================================
-- ENUMS
-- =====================================================

-- User role types
CREATE TYPE user_role AS ENUM ('student', 'dso', 'admin');

-- User account status
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');

-- Visa types
CREATE TYPE visa_type AS ENUM ('F-1', 'F-2', 'J-1', 'J-2', 'M-1', 'M-2', 'H-1B', 'O-1', 'Other');

-- Visa status
CREATE TYPE visa_status AS ENUM ('pending', 'active', 'expired', 'terminated', 'completed');

-- SEVIS status
CREATE TYPE sevis_status AS ENUM ('Initial', 'Active', 'Terminated', 'Completed', 'Cancelled');

-- Compliance status
CREATE TYPE compliance_status AS ENUM ('In Compliance', 'Out of Compliance', 'Under Review', 'N/A');

-- Request status
CREATE TYPE request_status AS ENUM ('pending', 'in_review', 'approved', 'denied', 'cancelled', 'completed');

-- Request priority
CREATE TYPE request_priority AS ENUM ('Low', 'Normal', 'High', 'Urgent');

-- Request action types
CREATE TYPE request_action_type AS ENUM ('document', 'form', 'confirmation', 'survey');

-- Request action status
CREATE TYPE action_status AS ENUM ('active', 'completed', 'archived', 'cancelled');

-- Document status
CREATE TYPE document_status AS ENUM ('active', 'archived', 'deleted', 'expired');

-- Import status
CREATE TYPE import_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'partially_completed');

-- Audit action types
CREATE TYPE audit_action AS ENUM (
  'create', 'read', 'update', 'delete', 
  'login', 'logout', 'export', 'import',
  'approve', 'deny', 'submit', 'upload'
);


-- =====================================================
-- TABLE: schools
-- =====================================================
-- Represents universities/colleges (tenants in multi-tenant architecture)

CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- School identification
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "university-001"
  
  -- Contact information
  website VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'United States',
  
  -- Immigration program details
  sevis_school_code VARCHAR(50),  -- Official SEVIS school code
  dso_contact_name VARCHAR(255),
  dso_contact_email VARCHAR(255),
  
  -- Subscription & billing (for SaaS)
  subscription_plan VARCHAR(50) DEFAULT 'standard',  -- 'trial', 'standard', 'professional', 'enterprise'
  subscription_status account_status DEFAULT 'active',
  student_limit INTEGER,  -- Max students allowed
  storage_limit_gb INTEGER DEFAULT 100,  -- Storage quota
  
  -- Settings
  settings JSONB DEFAULT '{}',  -- Flexible settings storage
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes
CREATE INDEX idx_schools_code ON schools(code);
CREATE INDEX idx_schools_status ON schools(subscription_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_schools_created_at ON schools(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- TABLE: users
-- =====================================================
-- Base user table for all user types (students, DSOs, admins)

CREATE TABLE users (
  id UUID PRIMARY KEY,  -- References Supabase Auth user ID
  
  -- School relationship
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- User identification
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  preferred_name VARCHAR(255),
  
  -- Role & status
  role user_role NOT NULL,
  status account_status DEFAULT 'active',
  
  -- Contact information
  phone VARCHAR(50),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relationship VARCHAR(100),
  
  -- Profile
  avatar_url TEXT,
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  language VARCHAR(10) DEFAULT 'en',
  
  -- Preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_school_role ON users(school_id, role) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- TABLE: students
-- =====================================================
-- Extended profile for student users with immigration data

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Student identification
  student_id_number VARCHAR(100),  -- School's internal student ID
  sevis_id VARCHAR(50) UNIQUE,  -- N number (e.g., N0012345678)
  
  -- Program information
  program_of_study VARCHAR(255),
  degree_level VARCHAR(50),  -- 'Undergraduate', 'Graduate', 'PhD', 'Certificate'
  major VARCHAR(255),
  minor VARCHAR(255),
  expected_graduation_date DATE,
  
  -- Visa information
  visa_type visa_type,
  visa_status visa_status DEFAULT 'pending',
  visa_issue_date DATE,
  visa_expiration_date DATE,
  
  -- I-20 information
  i20_issue_date DATE,
  i20_expiration_date DATE,
  i20_program_end_date DATE,
  
  -- SEVIS information
  sevis_status sevis_status,
  sevis_start_date DATE,
  sevis_last_updated_at TIMESTAMPTZ,
  sevis_last_updated_by UUID REFERENCES users(id),
  
  -- Compliance
  compliance_status compliance_status DEFAULT 'N/A',
  compliance_notes TEXT,
  next_compliance_check_date DATE,
  
  -- Passport information
  passport_number VARCHAR(100),
  passport_country VARCHAR(100),
  passport_issue_date DATE,
  passport_expiration_date DATE,
  
  -- Entry information
  port_of_entry VARCHAR(255),
  entry_date DATE,
  
  -- Employment authorization
  opt_eligible BOOLEAN DEFAULT FALSE,
  opt_start_date DATE,
  opt_end_date DATE,
  cpt_eligible BOOLEAN DEFAULT FALSE,
  
  -- Additional data
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',  -- Flexible field storage
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_sevis_id ON students(sevis_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_visa_status ON students(visa_status);
CREATE INDEX idx_students_sevis_status ON students(sevis_status);
CREATE INDEX idx_students_compliance_status ON students(compliance_status);
CREATE INDEX idx_students_graduation_date ON students(expected_graduation_date);
CREATE INDEX idx_students_school_status ON students(school_id, visa_status) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- TABLE: requests
-- =====================================================
-- Student-initiated requests to DSO (I-20, OPT, CPT, Travel, etc.)

CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Request details
  request_type VARCHAR(50) NOT NULL,  -- 'i20', 'opt', 'cpt', 'travel', 'visa_extension', etc.
  request_name VARCHAR(255) NOT NULL,
  reason TEXT,
  
  -- Request data
  form_data JSONB DEFAULT '{}',
  uploaded_files JSONB DEFAULT '[]',  -- Array of file references
  
  -- Status & priority
  status request_status DEFAULT 'pending',
  priority request_priority DEFAULT 'Normal',
  
  -- Dates
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Assignment & processing
  assigned_to UUID REFERENCES users(id),  -- DSO assigned
  processed_by UUID REFERENCES users(id),  -- DSO who processed
  
  -- DSO response
  decision VARCHAR(50),  -- 'approved', 'denied'
  dso_notes TEXT,
  internal_notes TEXT,  -- Not visible to student
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes
CREATE INDEX idx_requests_student_id ON requests(student_id);
CREATE INDEX idx_requests_school_id ON requests(school_id);
CREATE INDEX idx_requests_status ON requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_requests_priority ON requests(priority);
CREATE INDEX idx_requests_submitted_at ON requests(submitted_at DESC);
CREATE INDEX idx_requests_school_status ON requests(school_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_requests_assigned_to ON requests(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_requests_type_status ON requests(request_type, status);

-- Trigger for updated_at
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- TABLE: request_actions
-- =====================================================
-- DSO-initiated requests to students (documents, forms, confirmations)

CREATE TABLE request_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- School relationship
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Action details
  title VARCHAR(255) NOT NULL,
  type request_action_type NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Target audience
  target_type VARCHAR(20) NOT NULL,  -- 'single', 'bulk'
  target_student_id UUID REFERENCES students(id),  -- If single target
  target_filter JSONB,  -- If bulk: {visa_type: 'F-1', graduating: true}
  target_count INTEGER DEFAULT 0,  -- Estimated recipients
  
  -- Type-specific fields
  document_title VARCHAR(255),  -- For type: 'document'
  accepted_file_types TEXT[],  -- For type: 'document' e.g., ['.pdf', '.jpg']
  form_template VARCHAR(50),  -- For type: 'form' e.g., 'enrollment', 'employment'
  form_fields JSONB,  -- For type: 'form' - dynamic field definitions
  confirmation_statement TEXT,  -- For type: 'confirmation'
  
  -- Status & completion
  status action_status DEFAULT 'active',
  deadline TIMESTAMPTZ,
  completed_count INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  completion_percent NUMERIC(5,2) DEFAULT 0.00,
  
  -- Dates
  last_response_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes
CREATE INDEX idx_request_actions_school_id ON request_actions(school_id);
CREATE INDEX idx_request_actions_type ON request_actions(type);
CREATE INDEX idx_request_actions_status ON request_actions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_request_actions_created_at ON request_actions(created_at DESC);
CREATE INDEX idx_request_actions_deadline ON request_actions(deadline);
CREATE INDEX idx_request_actions_target_student ON request_actions(target_student_id) WHERE target_student_id IS NOT NULL;
CREATE INDEX idx_request_actions_school_status ON request_actions(school_id, status) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_request_actions_updated_at
  BEFORE UPDATE ON request_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- TABLE: responses
-- =====================================================
-- Student responses to DSO request actions

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  request_action_id UUID NOT NULL REFERENCES request_actions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Response data
  response_data JSONB DEFAULT '{}',  -- Form data or confirmation
  document_url TEXT,  -- URL if document was uploaded
  document_id UUID,  -- Reference to documents table (if applicable)
  
  -- Status
  status VARCHAR(50) DEFAULT 'submitted',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Unique constraint: one response per student per action
  UNIQUE(request_action_id, student_id)
);

-- Indexes
CREATE INDEX idx_responses_request_action_id ON responses(request_action_id);
CREATE INDEX idx_responses_student_id ON responses(student_id);
CREATE INDEX idx_responses_school_id ON responses(school_id);
CREATE INDEX idx_responses_submitted_at ON responses(submitted_at DESC);
CREATE INDEX idx_responses_action_student ON responses(request_action_id, student_id);

-- Trigger for updated_at
CREATE TRIGGER update_responses_updated_at
  BEFORE UPDATE ON responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- TABLE: documents
-- =====================================================
-- Document metadata (files stored in Supabase Storage)

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Document identification
  title VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,  -- 'I-20', 'Passport', 'Visa', 'OPT_Card', 'Transcript', etc.
  category VARCHAR(100),  -- 'Immigration', 'Academic', 'Personal', etc.
  
  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,
  file_type VARCHAR(50),  -- 'application/pdf', 'image/jpeg', etc.
  storage_path TEXT NOT NULL,  -- Path in Supabase Storage
  storage_bucket VARCHAR(100) DEFAULT 'documents',
  
  -- Version control
  version INTEGER DEFAULT 1,
  replaces_document_id UUID REFERENCES documents(id),  -- If this is a newer version
  
  -- Status & visibility
  status document_status DEFAULT 'active',
  visibility VARCHAR(20) DEFAULT 'all',  -- 'student_only', 'dso_only', 'all'
  
  -- Upload information
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_by_role VARCHAR(20),  -- 'student', 'dso'
  
  -- Related entities
  related_request_id UUID REFERENCES requests(id),
  related_response_id UUID REFERENCES responses(id),
  
  -- Expiration
  expiration_date DATE,
  expiration_reminder_sent BOOLEAN DEFAULT FALSE,
  
  -- Additional data
  notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  
  -- Dates
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes
CREATE INDEX idx_documents_student_id ON documents(student_id);
CREATE INDEX idx_documents_school_id ON documents(school_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX idx_documents_expiration_date ON documents(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_documents_student_type ON documents(student_id, document_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_storage_path ON documents(storage_path);

-- Trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- TABLE: audit_logs
-- =====================================================
-- Comprehensive audit trail for compliance (SOC2, FERPA)

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action details
  action audit_action NOT NULL,
  resource_type VARCHAR(100) NOT NULL,  -- 'student', 'request', 'document', etc.
  resource_id UUID,  -- ID of the affected resource
  
  -- Context
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Changes (for update actions)
  old_values JSONB,
  new_values JSONB,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_school_id ON audit_logs(school_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_school_created ON audit_logs(school_id, created_at DESC);

-- Partition by month (for better performance with large datasets)
-- Note: Requires manual partition creation and maintenance
-- CREATE TABLE audit_logs_2026_03 PARTITION OF audit_logs
--   FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');


-- =====================================================
-- TABLE: roster_imports
-- =====================================================
-- Track CSV roster imports for bulk student onboarding

CREATE TABLE roster_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Import details
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,
  storage_path TEXT,  -- Path to original CSV in storage
  
  -- Import status
  status import_status DEFAULT 'pending',
  
  -- Import statistics
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  
  -- Results
  errors JSONB DEFAULT '[]',  -- Array of error messages
  warnings JSONB DEFAULT '[]',  -- Array of warnings
  created_student_ids UUID[],  -- Array of created student IDs
  updated_student_ids UUID[],  -- Array of updated student IDs
  
  -- Processing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Settings used during import
  import_settings JSONB DEFAULT '{}',  -- Column mappings, options, etc.
  
  -- Preview/validation data
  preview_data JSONB  -- First few rows for preview
);

-- Indexes
CREATE INDEX idx_roster_imports_school_id ON roster_imports(school_id);
CREATE INDEX idx_roster_imports_status ON roster_imports(status);
CREATE INDEX idx_roster_imports_created_at ON roster_imports(created_at DESC);
CREATE INDEX idx_roster_imports_created_by ON roster_imports(created_by);

-- Trigger for updated_at
CREATE TRIGGER update_roster_imports_updated_at
  BEFORE UPDATE ON roster_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- TABLE: notifications
-- =====================================================
-- In-app notifications for users

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Notification details
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'request_update', 'document_request', 'deadline_reminder', etc.
  
  -- Related entities
  related_resource_type VARCHAR(100),  -- 'request', 'request_action', 'document', etc.
  related_resource_id UUID,
  
  -- Status
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Action
  action_url TEXT,  -- Deep link to relevant page
  action_label VARCHAR(100),  -- Button text e.g., "View Request"
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_school_id ON notifications(school_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- Auto-delete old notifications after 90 days (scheduled job)
-- SELECT id FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';


-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- RLS POLICIES: schools
-- =====================================================

-- Users can only see their own school
CREATE POLICY "Users can view their own school"
  ON schools FOR SELECT
  USING (
    id IN (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Only admins can update school settings
CREATE POLICY "Admins can update their school"
  ON schools FOR UPDATE
  USING (
    id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- =====================================================
-- RLS POLICIES: users
-- =====================================================

-- Users can view users in their school
CREATE POLICY "Users can view users in their school"
  ON users FOR SELECT
  USING (
    school_id IN (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- DSOs and admins can update users in their school
CREATE POLICY "DSOs can update users in their school"
  ON users FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );


-- =====================================================
-- RLS POLICIES: students
-- =====================================================

-- Students can view their own profile
CREATE POLICY "Students can view their own profile"
  ON students FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- DSOs can view students in their school
CREATE POLICY "DSOs can view students in their school"
  ON students FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );

-- DSOs can update students in their school
CREATE POLICY "DSOs can update students in their school"
  ON students FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );


-- =====================================================
-- RLS POLICIES: requests
-- =====================================================

-- Students can view their own requests
CREATE POLICY "Students can view their own requests"
  ON requests FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- Students can create their own requests
CREATE POLICY "Students can create their own requests"
  ON requests FOR INSERT
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- DSOs can view requests in their school
CREATE POLICY "DSOs can view requests in their school"
  ON requests FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );

-- DSOs can update requests in their school
CREATE POLICY "DSOs can update requests in their school"
  ON requests FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );


-- =====================================================
-- RLS POLICIES: request_actions
-- =====================================================

-- Students can view actions targeted at them
CREATE POLICY "Students can view actions targeted at them"
  ON request_actions FOR SELECT
  USING (
    (target_type = 'single' AND target_student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    ))
    OR
    (target_type = 'bulk' AND school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid()
    ))
  );

-- DSOs can view/manage actions in their school
CREATE POLICY "DSOs can manage actions in their school"
  ON request_actions FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );


-- =====================================================
-- RLS POLICIES: responses
-- =====================================================

-- Students can view their own responses
CREATE POLICY "Students can view their own responses"
  ON responses FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- Students can create their own responses
CREATE POLICY "Students can create their own responses"
  ON responses FOR INSERT
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- DSOs can view responses in their school
CREATE POLICY "DSOs can view responses in their school"
  ON responses FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );


-- =====================================================
-- RLS POLICIES: documents
-- =====================================================

-- Students can view their own documents
CREATE POLICY "Students can view their own documents"
  ON documents FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- DSOs can view documents in their school
CREATE POLICY "DSOs can view documents in their school"
  ON documents FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );

-- DSOs can create/update/delete documents in their school
CREATE POLICY "DSOs can manage documents in their school"
  ON documents FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );


-- =====================================================
-- RLS POLICIES: audit_logs
-- =====================================================

-- Only DSOs and admins can view audit logs
CREATE POLICY "DSOs can view audit logs in their school"
  ON audit_logs FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );

-- Audit logs are insert-only (no updates/deletes)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);


-- =====================================================
-- RLS POLICIES: roster_imports
-- =====================================================

-- DSOs can view imports in their school
CREATE POLICY "DSOs can view imports in their school"
  ON roster_imports FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );

-- DSOs can create imports in their school
CREATE POLICY "DSOs can create imports in their school"
  ON roster_imports FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM users 
      WHERE id = auth.uid() AND role IN ('dso', 'admin')
    )
  );


-- =====================================================
-- RLS POLICIES: notifications
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);


-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get current user's school_id
CREATE OR REPLACE FUNCTION get_current_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;


-- Function to check if current user is DSO
CREATE OR REPLACE FUNCTION is_current_user_dso()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('dso', 'admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;


-- Function to check if current user is student
CREATE OR REPLACE FUNCTION is_current_user_student()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'student'
  );
$$ LANGUAGE SQL SECURITY DEFINER;


-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Full student profile with user details
CREATE OR REPLACE VIEW student_profiles AS
SELECT 
  s.*,
  u.email,
  u.full_name,
  u.preferred_name,
  u.phone,
  u.status AS account_status,
  sch.name AS school_name,
  sch.code AS school_code
FROM students s
JOIN users u ON s.user_id = u.id
JOIN schools sch ON s.school_id = sch.id
WHERE s.deleted_at IS NULL AND u.deleted_at IS NULL;


-- View: Request summary with student details
CREATE OR REPLACE VIEW request_summaries AS
SELECT 
  r.*,
  s.user_id,
  u.full_name AS student_name,
  u.email AS student_email,
  s.sevis_id,
  sch.name AS school_name,
  assigned_dso.full_name AS assigned_to_name,
  processed_dso.full_name AS processed_by_name
FROM requests r
JOIN students s ON r.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN schools sch ON r.school_id = sch.id
LEFT JOIN users assigned_dso ON r.assigned_to = assigned_dso.id
LEFT JOIN users processed_dso ON r.processed_by = processed_dso.id
WHERE r.deleted_at IS NULL;


-- View: Document summary with student and uploader details
CREATE OR REPLACE VIEW document_summaries AS
SELECT 
  d.*,
  s.user_id AS student_user_id,
  u_student.full_name AS student_name,
  u_student.email AS student_email,
  u_uploader.full_name AS uploaded_by_name,
  sch.name AS school_name
FROM documents d
JOIN students s ON d.student_id = s.id
JOIN users u_student ON s.user_id = u_student.id
LEFT JOIN users u_uploader ON d.uploaded_by = u_uploader.id
JOIN schools sch ON d.school_id = sch.id
WHERE d.deleted_at IS NULL;


-- =====================================================
-- INITIAL DATA (OPTIONAL)
-- =====================================================

-- You can add seed data here for development/testing
-- Example:
-- INSERT INTO schools (name, code, sevis_school_code) 
-- VALUES ('Example University', 'example-univ', 'SEV123456789');


-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Analyze tables after creation for optimal query planning
ANALYZE schools;
ANALYZE users;
ANALYZE students;
ANALYZE requests;
ANALYZE request_actions;
ANALYZE responses;
ANALYZE documents;
ANALYZE audit_logs;
ANALYZE roster_imports;
ANALYZE notifications;


-- =====================================================
-- MAINTENANCE TASKS (Run via scheduled jobs)
-- =====================================================

-- Clean up old notifications (90 days)
-- DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive old audit logs (move to separate partition or cold storage after 2 years)
-- CREATE TABLE audit_logs_archive AS 
-- SELECT * FROM audit_logs WHERE created_at < NOW() - INTERVAL '2 years';

-- Update student compliance status based on next_compliance_check_date
-- UPDATE students SET compliance_status = 'Under Review' 
-- WHERE next_compliance_check_date < NOW() AND compliance_status = 'In Compliance';


-- =====================================================
-- END OF SCHEMA
-- =====================================================
