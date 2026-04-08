/**
 * Request Domain Types
 */

export type RequestStatus = 'pending' | 'in_review' | 'approved' | 'denied' | 'cancelled' | 'completed';
export type RequestPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type RequestActionType = 'document' | 'form' | 'confirmation' | 'survey';
export type ActionStatus = 'active' | 'completed' | 'archived' | 'cancelled';

export interface RequestRecord {
    id: string;
    student_id: string;
    school_id: string;
    request_type: string;
    request_name: string;
    reason?: string;
    form_data?: Record<string, unknown>;
    uploaded_files?: unknown[];
    status: RequestStatus;
    priority: RequestPriority;
    submitted_at: string;
    due_date?: string;
    reviewed_at?: string;
    completed_at?: string;
    assigned_to?: string;
    processed_by?: string;
    dso_notes?: string;
    internal_notes?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    student?: {
        id: string;
        user_id: string;
        user?: { full_name: string; email: string };
    };
}

export interface RequestAction {
    id: string;
    request_id: string;
    action_type: RequestActionType;
    title: string;
    description?: string;
    required: boolean;
    order_index: number;
    status: ActionStatus;
    due_date?: string;
    completed_at?: string;
    completed_by?: string;
    response_data?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface SubmitRequestPayload {
    requestType: string;
    requestName?: string;
    reason?: string;
    formData?: Record<string, unknown>;
}

export interface RespondToRequestPayload {
    requestId: string;
    actionId?: string;
    responseData?: Record<string, unknown>;
    confirmation?: boolean;
}
