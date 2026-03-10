/**
 * Database Configuration
 * Supabase client setup and connection management
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Create Supabase admin client (full access)
export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

// Create Supabase client with anon key (RLS enforced)
export function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
}

// Initialize storage buckets on startup
export async function initializeStorage() {
  const supabase = getSupabaseAdmin();
  const bucketName = 'documents';
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      console.log(`✅ Created storage bucket: ${bucketName}`);
    } else {
      console.log(`✓ Storage bucket already exists: ${bucketName}`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}
