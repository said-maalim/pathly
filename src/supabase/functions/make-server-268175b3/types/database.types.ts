/**
 * Database Types
 * TypeScript interfaces matching Supabase schema
 */

// ==================== ENUMS ====================

export type UserRole = 'student' | 'dso' | 'admin';
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'deleted';
export type VisaType = 'F-1' | 'F-2' | 'J-1' | 'J-2' | 'M-1' | 'M-2' | 'H-1B' | 'O-1' | 'Other';
export type VisaStatus = 'pending' | 'active' | 'expired' | 'terminated' | 'completed';
export type SEVISStatus = 'Initial' | 'Active' | 'Terminated' | 'Completed' | 'Cancelled';
export type ComplianceStatus = 'In Compliance' | 'Out of Compliance' | 'Under Review' | 'N/A';
export type RequestStatus = 'pending' | 'in_review' | 'approved' | 'denied' | 'cancelled' | 'completed';
export type RequestPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type RequestActionType = 'document' | 'form' | 'confirmation' | 'survey';
export type ActionStatus = 'active' | 'completed' | 'archived' | 'cancelled';
export type DocumentStatus = 'active' | 'archived' | 'deleted' | 'expired';
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' |
  'export' | 'import' | 'approve' | 'deny' | 'submit' | 'upload';

// ==================== TABLE TYPES ====================

export interface School {
  id: string;
  name: string;
  code: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  sevis_school_code?: string;
  subscription_status: AccountStatus;
  subscription_plan?: string;
  student_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  school_id: string;
  email: string;
  full_name: string;
  preferred_name?: string;
  role: UserRole;
  status: AccountStatus;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  deleted_at?: string;
}

export interface Student {
  id: string;
  user_id: string;
  school_id: string;
  student_id_number?: string;
  sevis_id?: string;
  program_of_study?: string;
  degree_level?: string;
  major?: string;
  visa_type?: VisaType;
  visa_status: VisaStatus;
  visa_issue_date?: string;
  visa_expiration_date?: string;
  sevis_status?: SEVISStatus;
  compliance_status: ComplianceStatus;
  passport_number?: string;
  passport_country?: string;
  passport_expiration_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Request {
  id: string;
  student_id: string;
  school_id: string;
  request_type: string;
  request_name: string;
  reason?: string;
  form_data?: Record<string, any>;
  status: RequestStatus;
  priority: RequestPriority;
  submitted_at: string;
  due_date?: string;
  reviewed_at?: string;
  completed_at?: string;
  assigned_to?: string;
  processed_by?: string;
  dso_notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface RequestAction {
  id: string;
  school_id: string;
  title: string;
  type: RequestActionType;
  description?: string;
  instructions?: string;
  target_type: 'single' | 'bulk';
  target_student_id?: string;
  target_filter?: Record<string, any>;
  target_count: number;
  document_title?: string;
  accepted_file_types?: string[];
  form_template?: string;
  form_fields?: any;
  confirmation_statement?: string;
  status: ActionStatus;
  deadline?: string;
  completed_count: number;
  total_responses: number;
  completion_percent: number;
  last_response_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface Response {
  id: string;
  request_action_id: string;
  student_id: string;
  school_id: string;
  response_data?: Record<string, any>;
  document_id?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Document {
  id: string;
  student_id: string;
  school_id: string;
  title: string;
  document_type: string;
  category?: string;
  file_name: string;
  file_size_bytes?: number;
  file_type?: string;
  storage_path: string;
  storage_bucket: string;
  status: DocumentStatus;
  uploaded_by: string;
  uploaded_by_role?: string;
  related_request_id?: string;
  related_response_id?: string;
  expiration_date?: string;
  notes?: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface AuditLog {
  id: string;
  school_id?: string;
  user_id?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  school_id: string;
  title: string;
  message: string;
  type: string;
  related_resource_type?: string;
  related_resource_id?: string;
  action_url?: string;
  action_label?: string;
  read_at?: string;
  dismissed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ==================== CREATE/UPDATE TYPES ====================

export interface CreateUserData {
  id: string;
  school_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status?: AccountStatus;
}

export interface CreateStudentData {
  user_id: string;
  school_id: string;
  visa_status?: VisaStatus;
  compliance_status?: ComplianceStatus;
}

export interface UpdateStudentData {
  visa_type?: VisaType;
  visa_status?: VisaStatus;
  visa_expiration_date?: string;
  sevis_status?: SEVISStatus;
  compliance_status?: ComplianceStatus;
  sevis_last_updated_at?: string;
  sevis_last_updated_by?: string;
  passport_expiration_date?: string;
  next_compliance_check_date?: string;
}

export interface CreateRequestData {
  student_id: string;
  school_id: string;
  request_type: string;
  request_name: string;
  reason?: string;
  form_data?: Record<string, any>;
  priority?: RequestPriority;
  due_date?: string;
}

export interface UpdateRequestData {
  status?: RequestStatus;
  dso_notes?: string;
  internal_notes?: string;
  processed_by?: string;
  completed_at?: string;
}

export interface CreateDocumentData {
  student_id: string;
  school_id: string;
  title: string;
  document_type: string;
  category?: string;
  file_name: string;
  file_size_bytes?: number;
  file_type?: string;
  storage_path: string;
  uploaded_by: string;
  uploaded_by_role?: string;
  notes?: string;
}

export interface CreateAuditLogData {
  school_id?: string;
  user_id?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
}
