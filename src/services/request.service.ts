/**
 * Request Service
 * All student and DSO request-related API calls.
 */

import { apiGet, apiPost, apiPut } from '../lib/api-client';
import type { RequestRecord, SubmitRequestPayload, RespondToRequestPayload } from '../types';

// ─── Response Shapes ─────────────────────────────────────────────────────────

interface MyRequestsResponse {
    requests: RequestRecord[];
}

interface DSORequestsResponse {
    requests: RequestRecord[];
}

interface SingleRequestResponse {
    request: RequestRecord;
}

interface SubmitRequestResponse {
    success: boolean;
    request: RequestRecord;
}

// ─── Request Service ──────────────────────────────────────────────────────────

/** Get the authenticated student's own requests */
export async function getMyRequests(): Promise<RequestRecord[]> {
    const res = await apiGet<MyRequestsResponse>('/requests/my-requests');
    return res.requests ?? [];
}

/** Get DSO-created actions targeting the current student */
export async function getDSORequests(): Promise<RequestRecord[]> {
    const res = await apiGet<DSORequestsResponse>('/requests/dso-requests');
    return res.requests ?? [];
}

/** Get all requests for a school (DSO view) */
export async function getSchoolRequests(schoolId: string): Promise<RequestRecord[]> {
    const res = await apiGet<MyRequestsResponse>(`/requests/school/${schoolId}`);
    return res.requests ?? [];
}

/** Get a single request with its actions */
export async function getRequestById(requestId: string): Promise<RequestRecord> {
    const res = await apiGet<SingleRequestResponse>(`/requests/${requestId}`);
    return res.request;
}

/** Submit a new student request */
export async function submitRequest(payload: SubmitRequestPayload): Promise<RequestRecord> {
    const res = await apiPost<SubmitRequestResponse>('/requests/submit', payload);
    return res.request;
}

/** Respond to a DSO request action */
export async function respondToRequest(payload: RespondToRequestPayload): Promise<void> {
    await apiPost<{ success: boolean }>('/requests/respond', payload);
}

/** Update request status (DSO only) */
export async function updateRequestStatus(
    requestId: string,
    status: string,
    notes?: string
): Promise<RequestRecord> {
    const res = await apiPut<SingleRequestResponse>(`/requests/${requestId}/status`, { status, notes });
    return res.request;
}

/** Get all request actions for a school (DSO request actions dashboard) */
export async function getRequestActions(schoolId: string): Promise<RequestRecord[]> {
    const res = await apiGet<DSORequestsResponse>(`/request-actions/${schoolId}`);
    return res.requests ?? [];
}

/** Get a single request action (DSO) */
export async function getRequestActionById(actionId: string): Promise<RequestRecord> {
    const res = await apiGet<SingleRequestResponse>(`/dso/request-actions/${actionId}`);
    return res.request;
}

/** Create a new DSO request action to send to student(s) */
export async function createRequestAction(payload: Record<string, unknown>): Promise<{ success: boolean; requestAction: RequestRecord }> {
    return apiPost<{ success: boolean; requestAction: RequestRecord }>('/dso/request-actions', payload);
}
