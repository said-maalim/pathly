-- ============================================================
--  Drop dead kv_store_268175b3 table
--
--  Context: auto-generated scratch table from a Figma Make
--  edge-function template. The kv_store.tsx helper module that
--  wrote/read it had zero callers anywhere in the codebase
--  (verified by grep across supabase/ and src/supabase/ trees
--  on 2026-05-11). Removing the table and the helper module
--  together.
--
--  See: docs/specs/data-model-cleanup.md (Phase A)
-- ============================================================

DROP TABLE IF EXISTS public.kv_store_268175b3;
