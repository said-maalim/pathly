import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Create singleton Supabase client at module level
const supabaseClient = createSupabaseClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'pathly-auth-token', // Use unique storage key to avoid conflicts
      storage: window.localStorage,
    }
  }
);

export function createClient() {
  return supabaseClient;
}

// Get current session
export async function getSession() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Error signing in:', error);
    throw error;
  }
  
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Get access token
export async function getAccessToken() {
  const session = await getSession();
  return session?.access_token;
}