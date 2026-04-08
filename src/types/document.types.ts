/**
 * Document Domain Types
 */

export type DocumentStatus = 'active' | 'archived' | 'deleted' | 'expired';

export interface DocumentRecord {
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
    status: DocumentStatus;
    uploaded_by: string;
    uploaded_by_role?: string;
    notes?: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}
