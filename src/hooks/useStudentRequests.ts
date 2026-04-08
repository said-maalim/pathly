/**
 * useStudentRequests Hook
 *
 * Manages the student's request inbox — both student-submitted
 * requests and DSO-created action requests targeting the student.
 *
 * Usage:
 *   const { myRequests, dsoRequests, loading, refresh } = useStudentRequests();
 */

import { useState, useEffect, useCallback } from 'react';
import { getMyRequests, getDSORequests } from '../services/request.service';
import type { RequestRecord } from '../types';

interface StudentRequestsState {
    myRequests: RequestRecord[];
    dsoRequests: RequestRecord[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useStudentRequests(): StudentRequestsState {
    const [myRequests, setMyRequests] = useState<RequestRecord[]>([]);
    const [dsoRequests, setDsoRequests] = useState<RequestRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [mine, dso] = await Promise.all([getMyRequests(), getDSORequests()]);
            setMyRequests(mine);
            setDsoRequests(dso);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load requests';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { myRequests, dsoRequests, loading, error, refresh: fetch };
}
