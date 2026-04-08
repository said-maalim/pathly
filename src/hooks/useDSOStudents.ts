/**
 * useDSOStudents Hook
 *
 * Fetches and manages the list of students for a given school (DSO view).
 * Derives the school ID from userData automatically.
 *
 * Usage:
 *   const { students, loading, refresh } = useDSOStudents(schoolId);
 */

import { useState, useEffect, useCallback } from 'react';
import { getStudentsBySchool } from '../services/student.service';
import type { StudentRecord } from '../types';

interface DSOStudentsState {
    students: StudentRecord[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useDSOStudents(schoolId: string | undefined): DSOStudentsState {
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!schoolId) return;
        try {
            setLoading(true);
            setError(null);
            const list = await getStudentsBySchool(schoolId);
            setStudents(list);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load students';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [schoolId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { students, loading, error, refresh: fetch };
}
