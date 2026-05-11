-- ============================================================
--  Add FK constraint: responses.document_id -> documents(id)
--
--  Context: responses.document_id is declared in the schema
--  as UUID but has no foreign-key constraint, so nothing
--  prevents it from holding orphan UUIDs. Pre-flight on
--  2026-05-11 confirmed zero rows in the responses table
--  (responses_document_id_set = 0, total_responses = 0),
--  so adding the constraint is trivially safe right now.
--
--  ON DELETE SET NULL: if a documents row is removed,
--  preserve the response but null out the reference rather
--  than cascade-deleting the response.
--
--  See: docs/specs/data-model-cleanup.md (Phase C)
-- ============================================================

ALTER TABLE public.responses
  DROP CONSTRAINT IF EXISTS responses_document_id_fkey;

ALTER TABLE public.responses
  ADD CONSTRAINT responses_document_id_fkey
  FOREIGN KEY (document_id)
  REFERENCES public.documents(id)
  ON DELETE SET NULL;
