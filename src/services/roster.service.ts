/**
 * Roster Service
 * All roster-import API calls, typed end-to-end.
 *
 * This service is the ONLY place that calls /roster/* endpoints.
 * Uses existing apiUpload (multipart) and apiGet/apiPost helpers.
 */

import { apiGet, apiPost, apiUpload } from '../lib/api-client';
import type {
  UploadPreviewResponse,
  ConfirmImportResponse,
  RosterImport,
} from '../types';

// ─── Response wrappers (internal) ────────────────────────────────────────────

interface HistoryResponse {
  imports: RosterImport[];
}

interface DetailResponse {
  import: RosterImport;
}

// ─── Roster Service ───────────────────────────────────────────────────────────

/**
 * Upload a CSV or XLSX roster file to the server.
 * Returns a preview without writing any student records to the DB.
 */
export async function uploadRoster(file: File): Promise<UploadPreviewResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload<UploadPreviewResponse>('/roster/upload', formData);
}

/**
 * Confirm a previewed import — executes the atomic DB commit
 * and dispatches invitation emails to new students.
 */
export async function confirmImport(importId: string): Promise<ConfirmImportResponse> {
  return apiPost<ConfirmImportResponse>(`/roster/${importId}/confirm`, {});
}

/**
 * List all past imports for the authenticated DSO's school.
 */
export async function getRosterHistory(): Promise<RosterImport[]> {
  const res = await apiGet<HistoryResponse>('/roster/history');
  return res.imports ?? [];
}

/**
 * Get a single import record by ID.
 */
export async function getRosterDetail(importId: string): Promise<RosterImport> {
  const res = await apiGet<DetailResponse>(`/roster/${importId}`);
  return res.import;
}

/**
 * Download the error rows CSV for a given import.
 * Triggers a browser file download automatically.
 */
export async function downloadErrorCsv(importId: string): Promise<void> {
  const { API_BASE_URL, getAccessToken } = await import('../lib/supabase');
  const token = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/roster/${importId}/errors`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download error report: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `import-errors-${importId.slice(0, 8)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
