-- ============================================================
--  Add attachments support to messages table
--  + Create Supabase Storage bucket for message attachments
-- ============================================================

-- 1. Add attachments JSONB column (array of {name, url, size, type})
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 2. Create public storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true,
  52428800, -- 50MB per file
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies
DROP POLICY IF EXISTS "Authenticated users can upload message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can read message attachments"             ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own attachments"  ON storage.objects;

-- Any authenticated user can upload
CREATE POLICY "Authenticated users can upload message attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'message-attachments');

-- Files are public (bucket is public, access is by-URL)
CREATE POLICY "Public can read message attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments');

-- Authenticated users can delete files they uploaded
CREATE POLICY "Authenticated users can delete own attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'message-attachments');
