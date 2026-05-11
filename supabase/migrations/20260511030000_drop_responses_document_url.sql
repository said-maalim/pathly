-- ============================================================
--  Drop redundant responses.document_url column
--
--  Context: document_url overlapped with the document_id FK
--  (just added in 20260511020000_responses_document_id_fk.sql).
--  Pre-flight on 2026-05-11 confirmed zero non-null
--  document_url values across the responses table
--  (responses.document_url_set = 0), so dropping the column
--  loses no data.
--
--  See: docs/specs/data-model-cleanup.md (Phase C)
-- ============================================================

ALTER TABLE public.responses DROP COLUMN IF EXISTS document_url;
