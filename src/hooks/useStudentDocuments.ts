/**
 * useStudentDocuments Hook
 *
 * Manages the student's recent / uploaded documents.
 *
 * Usage:
 *   const { documents, loading, refresh } = useStudentDocuments(userId);
 */

import { useState, useEffect, useCallback } from 'react';
import { getStudentDocuments } from '../services/document.service';
import type { DocumentRecord } from '../types';

interface StudentDocumentsState {
    documents: DocumentRecord[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useStudentDocuments(userId: string | undefined): StudentDocumentsState {
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            setError(null);
            const docs = await getStudentDocuments(userId);
            setDocuments(docs.slice(0, 5)); // show last 5 by default
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load documents';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { documents, loading, error, refresh: fetch };
}
