/**
 * Supabase Singleton Client
 * Use this file everywhere that needs the Supabase client.
 * Do NOT create new clients elsewhere — this prevents multiple GoTrue instances.
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export const supabaseUrl = `https://${projectId}.supabase.co`;
export const API_BASE_URL = `${supabaseUrl}/functions/v1/make-server-268175b3`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

/** Get the current user's access token from the live Supabase session */
export async function getAccessToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? publicAnonKey;
}
