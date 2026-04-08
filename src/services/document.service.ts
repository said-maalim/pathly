/**
 * Document Service
 * All document-related API calls for both students and DSOs.
 */

import { apiGet, apiUpload } from '../lib/api-client';
import type { DocumentRecord } from '../types';

interface DocumentListResponse {
    documents: DocumentRecord[];
}

/** Get documents for a specific student (used by DSO) */
export async function getStudentDocuments(userId: string): Promise<DocumentRecord[]> {
    const res = await apiGet<DocumentListResponse>(`/documents/student/${userId}`);
    return res.documents ?? [];
}

/** Get documents for the authenticated student */
export async function getMyDocuments(): Promise<DocumentRecord[]> {
    const res = await apiGet<DocumentListResponse>('/documents/my-documents');
    return res.documents ?? [];
}

/** Get all documents for a school (DSO view) */
export async function getSchoolDocuments(schoolId: string): Promise<DocumentRecord[]> {
    const res = await apiGet<DocumentListResponse>(`/documents/school/${schoolId}`);
    return res.documents ?? [];
}

/** Get a pre-signed download URL for a document */
export async function getDocumentDownloadUrl(documentId: string): Promise<{ url: string }> {
    return apiGet<{ url: string }>(`/documents/${documentId}/download`);
}

/** Upload a document file */
export async function uploadDocument(
    file: File,
    metadata: { documentType: string; studentId?: string; title?: string; notes?: string }
): Promise<{ success: boolean; document: DocumentRecord }> {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([k, v]) => {
        if (v !== undefined) formData.append(k, v);
    });
    return apiUpload<{ success: boolean; document: DocumentRecord }>('/documents/upload', formData);
}
