/**
 * Auth Service
 * Authentication operations using the Supabase singleton client.
 */

import { supabase } from '../lib/supabase';
import type { UserData } from '../types';

export interface SignInResult {
    userData: UserData | null;
    error: string | null;
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { userData: null, error: error.message };
    return { userData: { data }, error: null };
}

export async function signOut(): Promise<void> {
    await supabase.auth.signOut();
}

export async function getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
}
