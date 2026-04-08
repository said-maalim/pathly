/**
 * Student Service
 * All student-related API calls, typed end-to-end.
 *
 * This service is the ONLY place that calls student-related
 * backend endpoints. Hooks and components import from here.
 */

import { apiGet, apiPut } from '../lib/api-client';
import type {
    StudentRecord,
    UpdateVisaPayload,
    UpdateSevisPayload,
    UpdatePassportPayload,
} from '../types';

// ─── Response Shapes ─────────────────────────────────────────────────────────

interface StudentProfileResponse {
    user: Record<string, unknown>;
    student: StudentRecord;
}

interface StudentListResponse {
    students: StudentRecord[];
}

interface UpdateStudentResponse {
    success: boolean;
    student: StudentRecord;
}

// ─── Student Service ──────────────────────────────────────────────────────────

/**
 * Fetch the authenticated student's own profile.
 * Used by the student dashboard to hydrate visa/SEVIS/passport status.
 */
export async function getMyProfile(): Promise<StudentProfileResponse> {
    return apiGet<StudentProfileResponse>('/students/my-profile');
}

/**
 * Fetch all students for a given school (DSO use).
 */
export async function getStudentsBySchool(schoolId: string): Promise<StudentRecord[]> {
    const res = await apiGet<StudentListResponse>(`/students/school/${schoolId}`);
    return res.students ?? [];
}

/**
 * Update a student's visa information (DSO only).
 */
export async function updateStudentVisa(
    studentId: string,
    payload: UpdateVisaPayload
): Promise<StudentRecord> {
    const res = await apiPut<UpdateStudentResponse>(
        `/students/${studentId}/visa`,
        payload
    );
    return res.student;
}

/**
 * Update a student's SEVIS status (DSO only).
 */
export async function updateStudentSevis(
    studentId: string,
    payload: UpdateSevisPayload
): Promise<StudentRecord> {
    const res = await apiPut<UpdateStudentResponse>(
        `/students/${studentId}/sevis`,
        payload
    );
    return res.student;
}

/**
 * Update a student's passport information (DSO only).
 */
export async function updateStudentPassport(
    studentId: string,
    payload: UpdatePassportPayload
): Promise<StudentRecord> {
    const res = await apiPut<UpdateStudentResponse>(
        `/students/${studentId}/passport`,
        payload
    );
    return res.student;
}
