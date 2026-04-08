/**
 * Roster Import Frontend Types
 * Mirror of backend response shapes for the DSO roster upload UI.
 */

export type ImportAction = 'create' | 'update';

export type ImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'partially_completed';

/** Row-level validation error returned by the preview endpoint */
export interface RosterError {
  row: number;
  field: string;
  code: string;
  message: string;
  value?: string;
}

/** Single preview row shown in the DSO review table */
export interface PreviewRow {
  row: number;
  action: ImportAction;
  email: string;
  full_name: string;
  student_id_number: string;
  visa_type: string;
  sevis_status: string;
  degree_level: string;
}

/** Response from POST /roster/upload */
export interface UploadPreviewResponse {
  importId: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  newStudents: number;
  updatedStudents: number;
  errorRows: RosterError[];
  preview: PreviewRow[];
}

/** Response from POST /roster/:id/confirm */
export interface ConfirmImportResponse {
  importId: string;
  created: number;
  updated: number;
  invitationsSent: number;
  invitationErrors: number;
}

/** Roster import record as returned by /roster/history and /roster/:id */
export interface RosterImport {
  id: string;
  school_id: string;
  file_name: string;
  file_size_bytes?: number;
  status: ImportStatus;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors?: RosterError[];
  created_student_ids?: string[];
  updated_student_ids?: string[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
