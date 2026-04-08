/**
 * Roster Import Domain Types
 *
 * These types define the pipeline contract:
 *   raw file → ParsedRow[] → ValidatedRow[] → DB commit
 *
 * Both the backend service and the frontend service use the same
 * shape for UploadPreviewResponse and ConfirmImportResponse.
 */

import type { SEVISStatus, VisaType } from '../types/database.types.ts';

// ─── Pipeline Internal Types ──────────────────────────────────────────────────

/** Raw row after CSV/XLSX parsing — all values are strings */
export interface ParsedRow {
  [key: string]: string;
}

/** Whether this row will create a new student or update an existing one */
export type ImportAction = 'create' | 'update';

/**
 * A row that has passed all validation checks, fully typed, ready to commit.
 * Rows tagged 'update' include the existing DB IDs.
 */
export interface ValidatedRow {
  action: ImportAction;
  /** 1-based row number in the original file, for error tracing */
  rowNumber: number;

  // ── User fields ──────────────────────────────
  email: string;
  full_name: string;
  preferred_name?: string;

  // ── Student fields ───────────────────────────
  student_id_number: string;
  sevis_id?: string;
  degree_level: string;
  major: string;
  program_of_study?: string;
  visa_type: VisaType;
  sevis_status: SEVISStatus;
  sevis_start_date: string;         // YYYY-MM-DD
  expected_graduation_date: string; // YYYY-MM-DD
  i20_expiration_date?: string;     // YYYY-MM-DD

  // ── Update-only fields ───────────────────────
  /** Set when action === 'update', references users.id */
  existing_user_id?: string;
  /** Set when action === 'update', references students.id */
  existing_student_id?: string;
}

/** A validation or processing error tied to a specific row + field */
export interface RosterError {
  row: number;        // 1-based row number
  field: string;      // which column caused the error
  code: string;       // e.g. MISSING_REQUIRED, INVALID_EMAIL
  message: string;    // human-readable
  value?: string;     // the problematic value (may be omitted for sensitive fields)
}

/** In-memory lookup indexes built from existing DB records to detect duplicates */
export interface DuplicateIndex {
  byEmail: Map<string, { userId: string; studentId: string }>;
  byStudentIdNumber: Map<string, { userId: string; studentId: string }>;
  bySevisId: Map<string, { userId: string; studentId: string }>;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

/**
 * Response from POST /roster/upload
 * Returned after parsing and validation completes. No DB writes yet.
 */
export interface UploadPreviewResponse {
  importId: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  newStudents: number;
  updatedStudents: number;
  /** All validation errors found across the file */
  errorRows: RosterError[];
  /** First 20 valid rows for the DSO preview table */
  preview: Array<{
    row: number;
    action: ImportAction;
    email: string;
    full_name: string;
    student_id_number: string;
    visa_type: string;
    sevis_status: string;
    degree_level: string;
  }>;
}

/**
 * Response from POST /roster/:id/confirm
 * Returned after the atomic DB commit and invitations are dispatched.
 */
export interface ConfirmImportResponse {
  importId: string;
  created: number;
  updated: number;
  invitationsSent: number;
  invitationErrors: number;
}

// ─── Column Alias Map ─────────────────────────────────────────────────────────

/**
 * Normalized column name → canonical field name.
 * Keys are the result of: headerValue.toLowerCase().trim()
 * Covers common SEVIS export column names and university SIS exports.
 */
export const COLUMN_ALIASES: Record<string, string> = {
  // ── student_id_number ───────────────────────
  'student id': 'student_id_number',
  'student number': 'student_id_number',
  'student_id': 'student_id_number',
  'student_id_number': 'student_id_number',
  'sid': 'student_id_number',
  'campus id': 'student_id_number',
  'id number': 'student_id_number',
  'id': 'student_id_number',

  // ── email ───────────────────────────────────
  'email': 'email',
  'email address': 'email',
  'university email': 'email',
  'school email': 'email',
  'student email': 'email',
  'e-mail': 'email',

  // ── first_name ──────────────────────────────
  'first name': 'first_name',
  'firstname': 'first_name',
  'first_name': 'first_name',
  'given name': 'first_name',
  'given_name': 'first_name',

  // ── last_name ───────────────────────────────
  'last name': 'last_name',
  'lastname': 'last_name',
  'last_name': 'last_name',
  'family name': 'last_name',
  'family_name': 'last_name',
  'surname': 'last_name',

  // ── preferred_name ──────────────────────────
  'preferred name': 'preferred_name',
  'preferred_name': 'preferred_name',
  'goes by': 'preferred_name',
  'nickname': 'preferred_name',

  // ── sevis_id ────────────────────────────────
  'sevis id': 'sevis_id',
  'sevis_id': 'sevis_id',
  'sevis number': 'sevis_id',
  'n number': 'sevis_id',
  'n-number': 'sevis_id',

  // ── degree_level ────────────────────────────
  'degree level': 'degree_level',
  'degree_level': 'degree_level',
  'program level': 'degree_level',
  'education level': 'degree_level',
  'level of study': 'degree_level',
  'degree': 'degree_level',

  // ── major ───────────────────────────────────
  'major': 'major',
  'field of study': 'major',
  'field_of_study': 'major',
  'major/field of study': 'major',

  // ── program_of_study ────────────────────────
  'program of study': 'program_of_study',
  'program_of_study': 'program_of_study',
  'program name': 'program_of_study',
  'program': 'program_of_study',

  // ── visa_type ───────────────────────────────
  'visa type': 'visa_type',
  'visa_type': 'visa_type',
  'visa': 'visa_type',
  'visa category': 'visa_type',
  'visa classification': 'visa_type',

  // ── sevis_status ────────────────────────────
  'sevis status': 'sevis_status',
  'sevis_status': 'sevis_status',
  'student status': 'sevis_status',
  'status': 'sevis_status',
  'immigration status': 'sevis_status',

  // ── sevis_start_date ────────────────────────
  'sevis start date': 'sevis_start_date',
  'sevis_start_date': 'sevis_start_date',
  'program start date': 'sevis_start_date',
  'start date': 'sevis_start_date',
  'enrollment date': 'sevis_start_date',

  // ── expected_graduation_date ─────────────────
  'expected graduation date': 'expected_graduation_date',
  'expected_graduation_date': 'expected_graduation_date',
  'graduation date': 'expected_graduation_date',
  'program end date': 'expected_graduation_date',
  'expected graduation': 'expected_graduation_date',
  'i-20 end date': 'expected_graduation_date',
  'i20 end date': 'expected_graduation_date',

  // ── i20_expiration_date ──────────────────────
  'i-20 expiration date': 'i20_expiration_date',
  'i20 expiration date': 'i20_expiration_date',
  'i20_expiration_date': 'i20_expiration_date',
  'i-20 expiry': 'i20_expiration_date',
};

// ─── Valid Enum Values ────────────────────────────────────────────────────────

export const VALID_VISA_TYPES: VisaType[] = [
  'F-1', 'F-2', 'J-1', 'J-2', 'M-1', 'M-2', 'H-1B', 'O-1', 'Other',
];

export const VALID_SEVIS_STATUSES: SEVISStatus[] = [
  'Initial', 'Active', 'Terminated', 'Completed', 'Cancelled',
];

/**
 * Normalize SEVIS status strings from exports that may use uppercase.
 * Maps 'ACTIVE' → 'Active', etc.
 */
export const SEVIS_STATUS_NORMALIZER: Record<string, SEVISStatus> = {
  'INITIAL': 'Initial',
  'initial': 'Initial',
  'Initial': 'Initial',
  'ACTIVE': 'Active',
  'active': 'Active',
  'Active': 'Active',
  'TERMINATED': 'Terminated',
  'terminated': 'Terminated',
  'Terminated': 'Terminated',
  'COMPLETED': 'Completed',
  'completed': 'Completed',
  'Completed': 'Completed',
  'CANCELLED': 'Cancelled',
  'cancelled': 'Cancelled',
  'Cancelled': 'Cancelled',
};
