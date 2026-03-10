-- =====================================================
-- Pathly Staging - Sample Data Seed Script
-- =====================================================
-- Purpose: Populate staging database with realistic test data
-- Usage: psql "$STAGING_SUPABASE_DB_URL" -f staging/seed-sample-data.sql

BEGIN;

-- Insert Sample Schools
INSERT INTO schools (id, name, code, sevis_school_code, contact_email, subscription_status, subscription_plan, student_limit)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Stanford University', 'stanford', 'SEV2013123456', 'iso@stanford.edu', 'active', 'enterprise', 5000),
  ('22222222-2222-2222-2222-222222222222', 'MIT', 'mit', 'SEV2013234567', 'iso@mit.edu', 'active', 'professional', 3000),
  ('33333333-3333-3333-3333-333333333333', 'UC Berkeley', 'ucb', 'SEV2013345678', 'iso@berkeley.edu', 'active', 'standard', 2000)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample DSO Users
INSERT INTO users (id, school_id, email, full_name, role, status, created_at)
VALUES
  ('dso-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'dso@stanford.edu', 'Sarah Johnson', 'dso', 'active', NOW()),
  ('dso-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'dso@mit.edu', 'Michael Chen', 'dso', 'active', NOW()),
  ('dso-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'dso@berkeley.edu', 'Lisa Martinez', 'dso', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Student Users
INSERT INTO users (id, school_id, email, full_name, role, status, created_at)
VALUES
  ('std-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'john.doe@stanford.edu', 'John Doe', 'student', 'active', NOW() - INTERVAL '6 months'),
  ('std-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'jane.smith@stanford.edu', 'Jane Smith', 'student', 'active', NOW() - INTERVAL '1 year'),
  ('std-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'raj.patel@mit.edu', 'Raj Patel', 'student', 'active', NOW() - INTERVAL '2 months'),
  ('std-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'maria.garcia@mit.edu', 'Maria Garcia', 'student', 'active', NOW() - INTERVAL '8 months'),
  ('std-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'wei.zhang@berkeley.edu', 'Wei Zhang', 'student', 'active', NOW() - INTERVAL '3 months')
ON CONFLICT (id) DO NOTHING;

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
   'F-1', 'active', '2028-09-30', 'Active', 'In Compliance', NOW() - INTERVAL '3 months')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Requests (Student → DSO)
INSERT INTO requests (id, student_id, school_id, request_type, request_name, reason, status, priority, 
                     form_data, submitted_at, due_date, created_at)
VALUES
  ('req-1111-1111-1111-111111111111', 's-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'opt', 'OPT Application', 'Applying for Optional Practical Training after graduation',
   'pending', 'High', '{"graduationDate": "2026-06-15", "employer": "Tech Corp"}'::jsonb,
   NOW() - INTERVAL '2 days', NOW() + INTERVAL '12 days', NOW() - INTERVAL '2 days'),
   
  ('req-2222-2222-2222-222222222222', 's-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'travel', 'Travel Authorization', 'Need travel signature for summer conference in Europe',
   'approved', 'Normal', '{"destination": "France", "dates": "2026-07-01 to 2026-07-15"}'::jsonb,
   NOW() - INTERVAL '5 days', NOW() + INTERVAL '9 days', NOW() - INTERVAL '5 days'),
   
  ('req-3333-3333-3333-333333333333', 's-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'i20', 'I-20 Extension', 'Program extension due to thesis research',
   'in_review', 'Urgent', '{"extensionMonths": 6, "reason": "Additional research time needed"}'::jsonb,
   NOW() - INTERVAL '1 day', NOW() + INTERVAL '13 days', NOW() - INTERVAL '1 day'),
   
  ('req-4444-4444-4444-444444444444', 's-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
   'cpt', 'CPT Authorization', 'Internship at Google',
   'approved', 'Normal', '{"employer": "Google Inc", "position": "Software Engineering Intern"}'::jsonb,
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '10 days'),
   
  ('req-5555-5555-5555-555555555555', 's-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333',
   'i20', 'Initial I-20 Request', 'New international student',
   'completed', 'Normal', '{"programStart": "2026-09-01"}'::jsonb,
   NOW() - INTERVAL '30 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Request Actions (DSO → Students)
INSERT INTO request_actions (id, school_id, title, type, description, instructions, target_type, target_student_id, 
                            deadline, status, created_by, created_at, target_count, total_responses)
VALUES
  ('ra-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'Submit Fall 2026 Enrollment Verification', 'form', 'Please verify your enrollment status for Fall 2026',
   'Complete the form with your current course schedule and expected credits',
   'single', 's-1111-1111-1111-111111111111',
   NOW() + INTERVAL '7 days', 'active', 'dso-1111-1111-1111-111111111111', NOW(), 1, 0),
   
  ('ra-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   'Upload Current I-94 Travel Document', 'document', 'We need a copy of your most recent I-94',
   'Please upload a clear PDF or image of your I-94 arrival/departure record',
   'single', 's-3333-3333-3333-333333333333',
   NOW() + INTERVAL '10 days', 'active', 'dso-2222-2222-2222-222222222222', NOW(), 1, 0),
   
  ('ra-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'Confirm Current Address', 'confirmation', 'Please confirm your current residential address',
   'Review and confirm your address is up to date in our system',
   'single', 's-2222-2222-2222-222222222222',
   NOW() + INTERVAL '5 days', 'active', 'dso-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day', 1, 1),
   
  ('ra-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
   'Annual SEVIS Update - All F-1 Students', 'form', 'Annual SEVIS information update required',
   'Please update your passport information, address, and program details',
   'bulk', NULL,
   NOW() + INTERVAL '30 days', 'active', 'dso-1111-1111-1111-111111111111', NOW() - INTERVAL '5 days', 2, 0),
   
  ('ra-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222',
   'COVID-19 Vaccination Record Upload', 'document', 'Upload proof of COVID-19 vaccination',
   'Please provide your vaccination card or certificate',
   'bulk', NULL,
   NOW() + INTERVAL '14 days', 'active', 'dso-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', 2, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Responses
INSERT INTO responses (id, request_action_id, student_id, school_id, response_data, status, submitted_at, created_at)
VALUES
  ('resp-1111-1111-1111-111111111111', 'ra-3333-3333-3333-333333333333', 's-2222-2222-2222-222222222222', 
   '11111111-1111-1111-1111-111111111111',
   '{"confirmed": true, "address": "123 Campus Drive, Stanford, CA 94305"}'::jsonb,
   'submitted', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
   
  ('resp-2222-2222-2222-222222222222', 'ra-5555-5555-5555-555555555555', 's-3333-3333-3333-333333333333', 
   '22222222-2222-2222-2222-222222222222',
   '{"vaccinationType": "Pfizer", "doses": 2, "booster": true}'::jsonb,
   'submitted', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Documents
INSERT INTO documents (id, student_id, school_id, title, document_type, category, 
                      file_name, file_size_bytes, file_type, storage_path, 
                      uploaded_by, uploaded_by_role, status, uploaded_at, created_at)
VALUES
  ('doc-1111-1111-1111-111111111111', 's-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'I-20 Form - Initial', 'I-20', 'Immigration', 'i20_john_doe.pdf', 524288, 'application/pdf',
   'documents/s-1111/i20_john_doe.pdf',
   'dso-1111-1111-1111-111111111111', 'dso',
   'active', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months'),
   
  ('doc-2222-2222-2222-222222222222', 's-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'Passport Copy', 'Passport', 'Immigration', 'passport_john_doe.pdf', 1048576, 'application/pdf',
   'documents/s-1111/passport_john_doe.pdf',
   'std-1111-1111-1111-111111111111', 'student',
   'active', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months'),
   
  ('doc-3333-3333-3333-333333333333', 's-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Visa Copy - F-1', 'Visa', 'Immigration', 'visa_jane_smith.pdf', 786432, 'application/pdf',
   'documents/s-2222/visa_jane_smith.pdf',
   'std-2222-2222-2222-222222222222', 'student',
   'active', NOW() - INTERVAL '1 year', NOW() - INTERVAL '1 year'),
   
  ('doc-4444-4444-4444-444444444444', 's-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'Employment Authorization Document', 'EAD', 'Immigration', 'ead_raj_patel.pdf', 655360, 'application/pdf',
   'documents/s-3333/ead_raj_patel.pdf',
   'dso-2222-2222-2222-222222222222', 'dso',
   'active', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
   
  ('doc-5555-5555-5555-555555555555', 's-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
   'Transcript - Official', 'Transcript', 'Academic', 'transcript_maria.pdf', 2097152, 'application/pdf',
   'documents/s-4444/transcript_maria.pdf',
   'std-4444-4444-4444-444444444444', 'student',
   'active', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Audit Logs
INSERT INTO audit_logs (school_id, user_id, action, resource_type, resource_id, description, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'dso-1111-1111-1111-111111111111', 'create', 'request_action', 
   'ra-1111-1111-1111-111111111111', 'Created enrollment verification request', NOW()),
   
  ('11111111-1111-1111-1111-111111111111', 'std-1111-1111-1111-111111111111', 'submit', 'request',
   'req-1111-1111-1111-111111111111', 'Submitted OPT application request', NOW() - INTERVAL '2 days'),
   
  ('11111111-1111-1111-1111-111111111111', 'dso-1111-1111-1111-111111111111', 'approve', 'request',
   'req-2222-2222-2222-222222222222', 'Approved travel authorization request', NOW() - INTERVAL '3 days'),
   
  ('22222222-2222-2222-2222-222222222222', 'dso-2222-2222-2222-222222222222', 'update', 'student',
   's-3333-3333-3333-333333333333', 'Updated SEVIS status to Active', NOW() - INTERVAL '1 day'),
   
  ('11111111-1111-1111-1111-111111111111', 'dso-1111-1111-1111-111111111111', 'upload', 'document',
   'doc-1111-1111-1111-111111111111', 'Uploaded I-20 form for student', NOW() - INTERVAL '6 months')
ON CONFLICT DO NOTHING;

-- Insert Sample Notifications
INSERT INTO notifications (user_id, school_id, title, message, type, related_resource_type, 
                          related_resource_id, action_url, action_label, created_at)
VALUES
  ('std-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'New Request Action', 'You have a new enrollment verification form to complete',
   'request_action', 'request_action', 'ra-1111-1111-1111-111111111111',
   '/request-center', 'View Request', NOW()),
   
  ('dso-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'New Student Request', 'John Doe submitted an OPT application request',
   'new_request', 'request', 'req-1111-1111-1111-111111111111',
   '/dso/requests', 'Review Request', NOW() - INTERVAL '2 days'),
   
  ('std-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Request Approved', 'Your travel authorization has been approved',
   'request_update', 'request', 'req-2222-2222-2222-222222222222',
   '/request-center', 'View Details', NOW() - INTERVAL '3 days'),
   
  ('std-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'Document Request', 'Please upload your current I-94 travel document',
   'document_request', 'request_action', 'ra-2222-2222-2222-222222222222',
   '/request-center', 'Upload Document', NOW()),
   
  ('std-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333',
   'Welcome to Pathly', 'Your account has been successfully created',
   'welcome', NULL, NULL,
   '/dashboard', 'Get Started', NOW() - INTERVAL '3 months')
ON CONFLICT DO NOTHING;

COMMIT;

-- Verify data insertion
SELECT 'Data Seeding Complete!' as message;
SELECT '' as blank_line;
SELECT '═══════════════════════════════════════' as divider;
SELECT 'Record Counts' as section;
SELECT '═══════════════════════════════════════' as divider;

SELECT 'Schools' as table_name, COUNT(*) as count FROM schools
UNION ALL
SELECT 'Users (Total)', COUNT(*) FROM users
UNION ALL
SELECT 'Users (DSO)', COUNT(*) FROM users WHERE role = 'dso'
UNION ALL
SELECT 'Users (Student)', COUNT(*) FROM users WHERE role = 'student'
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

SELECT '' as blank_line;
SELECT '✅ Sample data successfully seeded!' as status;
