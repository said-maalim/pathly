/**
 * Auth Types
 * Shared interfaces for authentication state
 */

export interface UserMetadata {
    name?: string;
    userType?: 'student' | 'dso' | 'admin';
    schoolId?: string;
    universityId?: string;
}

export interface SupabaseUser {
    id: string;
    email: string;
    user_metadata: UserMetadata;
}

export interface SupabaseSession {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    user: SupabaseUser;
}

/** The shape of userData passed from App.tsx after login */
export interface UserData {
    data?: {
        user?: SupabaseUser;
        session?: SupabaseSession;
    };
    session?: SupabaseSession;
}
