-- ============================================================
--  Drop dead requests.uploaded_files JSONB column
--  (and rebuild request_summaries view without the column)
--
--  Context: this column duplicated the role of the documents
--  table for storing file attachments. Pre-flight on 2026-05-11
--  showed 5 total requests, all with the default '[]'::jsonb
--  value and zero non-empty rows. End-to-end recon showed the
--  file-upload pipeline (I20RequestFlow -> handleI20RequestSubmit
--  -> submitRequest) was never wired through, so the column
--  has never held real data.
--
--  Initial drop attempt failed because public.request_summaries
--  view selects r.uploaded_files. The view is not referenced by
--  any application code (confirmed by grep across src/ and
--  supabase/ on 2026-05-11) — it's a denormalized DSO-facing
--  view for ad-hoc queries. Safe to drop and recreate without
--  the column.
--
--  Future file attachments on requests should be stored as
--  rows in the documents table with related_request_id set.
--
--  See: docs/specs/data-model-cleanup.md (Phase B, revised)
-- ============================================================

-- 1. Drop the dependent view first
DROP VIEW IF EXISTS public.request_summaries;

-- 2. Drop the now-unblocked column
ALTER TABLE public.requests DROP COLUMN IF EXISTS uploaded_files;

-- 3. Recreate the view without uploaded_files
CREATE OR REPLACE VIEW public.request_summaries AS
  SELECT
    r.id,
    r.student_id,
    r.school_id,
    r.request_type,
    r.request_name,
    r.reason,
    r.form_data,
    -- uploaded_files removed (column dropped above)
    r.status,
    r.priority,
    r.submitted_at,
    r.due_date,
    r.reviewed_at,
    r.completed_at,
    r.assigned_to,
    r.processed_by,
    r.decision,
    r.dso_notes,
    r.internal_notes,
    r.created_at,
    r.updated_at,
    r.deleted_at,
    s.user_id,
    u.full_name AS student_name,
    u.email AS student_email,
    s.sevis_id,
    sch.name AS school_name,
    assigned_dso.full_name AS assigned_to_name,
    processed_dso.full_name AS processed_by_name
  FROM requests r
  JOIN students s ON r.student_id = s.id
  JOIN users u ON s.user_id = u.id
  JOIN schools sch ON r.school_id = sch.id
  LEFT JOIN users assigned_dso ON r.assigned_to = assigned_dso.id
  LEFT JOIN users processed_dso ON r.processed_by = processed_dso.id
  WHERE r.deleted_at IS NULL;

-- 4. Restore grants to match the prior state
--    NOTE: the prior state granted full CRUD to anon and authenticated.
--    That is overly permissive for a multi-tenant student-data view
--    and should be tightened in a follow-up (see open question in spec).
--    Preserved verbatim here so this migration is a pure data-model
--    cleanup, not a security change.
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.request_summaries TO postgres, authenticated, anon, service_role;
