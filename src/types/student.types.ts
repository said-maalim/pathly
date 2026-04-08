/**
 * Student Domain Types
 * TypeScript interfaces for student entities and status objects
 */

export type VisaStatusEnum = 'pending' | 'active' | 'expired' | 'terminated' | 'completed';
export type SEVISStatusEnum = 'Initial' | 'Active' | 'Terminated' | 'Completed' | 'Cancelled';
export type ComplianceStatusEnum = 'In Compliance' | 'Out of Compliance' | 'Under Review' | 'N/A';
export type VisaTypeEnum = 'F-1' | 'F-2' | 'J-1' | 'J-2' | 'M-1' | 'M-2' | 'H-1B' | 'O-1' | 'Other';

/** Raw student record as returned from the API */
export interface StudentRecord {
    id: string;
    user_id: string;
    school_id: string;
    student_id_number?: string;
    sevis_id?: string;
    program_of_study?: string;
    degree_level?: string;
    major?: string;
    visa_type?: VisaTypeEnum;
    visa_status: VisaStatusEnum;
    visa_issue_date?: string;
    visa_expiration_date?: string;
    sevis_status?: SEVISStatusEnum;
    sevis_start_date?: string;
    sevis_last_updated_at?: string;
    sevis_last_updated_by?: string;
    compliance_status: ComplianceStatusEnum;
    compliance_notes?: string;
    next_compliance_check_date?: string;
    passport_number?: string;
    passport_country?: string;
    passport_issue_date?: string;
    passport_expiration_date?: string;
    notes?: string;
    custom_fields?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    user?: {
        id: string;
        email: string;
        full_name: string;
        role: string;
        school_id: string;
    };
}

/** Normalized SEVIS status for UI display */
export interface SevisStatusDisplay {
    status: string;
    compliance: string;
    nextCheckDate: string | null;
    lastUpdated: string | null;
    daysUntilCheck: number | null;
}

/** Normalized Visa status for UI display */
export interface VisaStatusDisplay {
    visaType: string;
    status: string;
    expirationDate: string;
    daysRemaining: number | null;
}

/** Normalized Passport status for UI display */
export interface PassportStatusDisplay {
    status: string;
    expirationDate: string;
    daysRemaining: number | null;
}

/** DSO update payloads */
export interface UpdateVisaPayload {
    visaType?: string;
    visaStatus: string;
    visaExpirationDate?: string;
}

export interface UpdateSevisPayload {
    sevisStatus: string;
    compliance: string;
    nextCheckDate?: string;
    notes?: string;
}

export interface UpdatePassportPayload {
    passportExpirationDate: string;
}
