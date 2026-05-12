/**
 * useStudentProfile Hook
 *
 * Fetches and manages the authenticated student's profile data.
 * Derives normalized SevisStatusDisplay, VisaStatusDisplay, and
 * PassportStatusDisplay objects from the raw API response.
 *
 * Usage:
 *   const { sevisStatus, visaStatus, passportStatus, loading, refresh } = useStudentProfile();
 */

import { useState, useEffect, useCallback } from 'react';
import { getMyProfile } from '../services/student.service';
import { capitalize, formatDate, daysUntil } from '../lib/utils';
import type {
    StudentRecord,
    SevisStatusDisplay,
    VisaStatusDisplay,
    PassportStatusDisplay,
} from '../types';

/** Public.users row as returned by /students/my-profile. */
export interface UserRecord {
    id: string;
    school_id: string;
    email: string;
    full_name: string;
    preferred_name?: string;
    role: 'student' | 'dso' | 'admin';
    status: string;
    phone?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
    last_login_at?: string;
    deleted_at?: string;
}

interface StudentProfileState {
    user: UserRecord | null;
    student: StudentRecord | null;
    sevisStatus: SevisStatusDisplay | null;
    visaStatus: VisaStatusDisplay | null;
    passportStatus: PassportStatusDisplay | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

function deriveSevisStatus(student: StudentRecord): SevisStatusDisplay {
    return {
        status: student.sevis_status ?? 'Not set',
        compliance: student.compliance_status ?? 'N/A',
        nextCheckDate: formatDate(student.next_compliance_check_date),
        lastUpdated: formatDate(student.sevis_last_updated_at),
        daysUntilCheck: daysUntil(student.next_compliance_check_date),
    };
}

function deriveVisaStatus(student: StudentRecord): VisaStatusDisplay {
    return {
        visaType: student.visa_type ?? 'Not set',
        status: capitalize(student.visa_status),
        expirationDate: formatDate(student.visa_expiration_date),
        daysRemaining: daysUntil(student.visa_expiration_date),
    };
}

function derivePassportStatus(student: StudentRecord): PassportStatusDisplay {
    const days = daysUntil(student.passport_expiration_date);
    const status =
        days === null
            ? 'Not set'
            : days > 180
                ? 'Valid'
                : days > 0
                    ? 'Expiring Soon'
                    : 'Expired';
    return {
        status,
        expirationDate: formatDate(student.passport_expiration_date),
        daysRemaining: days,
    };
}

export function useStudentProfile(): StudentProfileState {
    const [user, setUser] = useState<UserRecord | null>(null);
    const [student, setStudent] = useState<StudentRecord | null>(null);
    const [sevisStatus, setSevisStatus] = useState<SevisStatusDisplay | null>(null);
    const [visaStatus, setVisaStatus] = useState<VisaStatusDisplay | null>(null);
    const [passportStatus, setPassportStatus] = useState<PassportStatusDisplay | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { user: u, student: s } = await getMyProfile();
            setUser(u as unknown as UserRecord);
            setStudent(s);
            setSevisStatus(deriveSevisStatus(s));
            setVisaStatus(deriveVisaStatus(s));
            setPassportStatus(derivePassportStatus(s));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load profile';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { user, student, sevisStatus, visaStatus, passportStatus, loading, error, refresh: fetch };
}
