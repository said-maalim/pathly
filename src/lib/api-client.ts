/**
 * Centralized API Client
 *
 * All HTTP calls to the backend Edge Function go through this module.
 * Responsibilities:
 *   - Inject Authorization headers automatically
 *   - Normalize HTTP errors into typed ApiError objects
 *   - Provide typed response wrappers
 *
 * Usage:
 *   import { apiGet, apiPost, apiPut } from '../lib/api-client';
 *   const profile = await apiGet<StudentProfileResponse>('/students/my-profile');
 */

import { API_BASE_URL, getAccessToken } from './supabase';

// ─── Error Type ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

async function buildHeaders(extraHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const token = await getAccessToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...extraHeaders,
    };
}

async function handleResponse<T>(response: Response): Promise<T> {
    const text = await response.text();

    let body: unknown;
    try {
        body = JSON.parse(text);
    } catch {
        body = text;
    }

    if (!response.ok) {
        const errorBody = body as Record<string, unknown>;
        throw new ApiError(
            response.status,
            (errorBody?.code as string) ?? 'API_ERROR',
            (errorBody?.error as string) ?? (errorBody?.message as string) ?? `HTTP ${response.status}`
        );
    }

    return body as T;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function apiGet<T>(path: string): Promise<T> {
    const headers = await buildHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, { method: 'GET', headers });
    return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const headers = await buildHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
    const headers = await buildHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
    const headers = await buildHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE', headers });
    return handleResponse<T>(response);
}

/**
 * Multipart form upload (bypasses JSON headers)
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    return handleResponse<T>(response);
}
