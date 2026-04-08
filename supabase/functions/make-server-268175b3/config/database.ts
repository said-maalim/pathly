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
  const bucketsToCreate = [
    { name: 'documents', fileSizeLimit: 10485760 },      // 10MB — student documents
    { name: 'roster-imports', fileSizeLimit: 26214400 }, // 25MB — DSO roster CSV/XLSX files
  ];

  try {
    const { data: existing } = await supabase.storage.listBuckets();
    const existingNames = new Set((existing ?? []).map((b: { name: string }) => b.name));

    for (const bucket of bucketsToCreate) {
      if (!existingNames.has(bucket.name)) {
        await supabase.storage.createBucket(bucket.name, {
          public: false,
          fileSizeLimit: bucket.fileSizeLimit,
        });
        console.log(`✅ Created storage bucket: ${bucket.name}`);
      } else {
        console.log(`✓ Storage bucket already exists: ${bucket.name}`);
      }
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}
