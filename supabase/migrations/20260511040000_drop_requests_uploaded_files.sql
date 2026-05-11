-- ============================================================
--  Drop dead requests.uploaded_files JSONB column
--
--  Context: this column duplicated the role of the documents
--  table for storing file attachments. Pre-flight on 2026-05-11
--  showed 5 total requests, all with the default '[]'::jsonb
--  value and zero non-empty rows. End-to-end recon also showed
--  the file-upload pipeline (I20RequestFlow -> handleI20RequestSubmit
--  -> submitRequest) was never wired through: the frontend
--  callback discards uploadedFiles before the API call, and
--  SubmitRequestPayload has no field for it. The column has
--  never held real data.
--
--  Future file attachments on requests should be stored as
--  rows in the documents table with related_request_id set.
--
--  See: docs/specs/data-model-cleanup.md (Phase B, revised)
-- ============================================================

ALTER TABLE public.requests DROP COLUMN IF EXISTS uploaded_files;
