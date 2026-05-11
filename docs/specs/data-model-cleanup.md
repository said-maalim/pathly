# Spec: Data-Model Cleanup — Drop `kv_store_268175b3`, Dedupe File Storage

**Status:** Draft — awaiting human review
**Owner:** Said Maalim
**Branch:** `u/saidmaalim/data-model-cleanup`
**Created:** 2026-05-11

---

## Objective

Three data-model defects identified during a schema audit are eroding clarity and creating two-sources-of-truth bugs:

1. **`kv_store_268175b3`** — auto-generated Supabase edge-function scratch table. Has helper functions in `kv_store.tsx` but **zero callers** anywhere in the codebase. Pure dead weight.
2. **`requests.uploaded_files` JSONB** — duplicates the file-attachment role of the `documents` table (which has `related_request_id` for exactly this). Two writers, two readers, drift inevitable.
3. **`responses.document_url` TEXT** — overlaps with `responses.document_id` (which has no FK constraint). The TEXT URL is not populated by any live code path; the FK is the right primitive.

**Success means:** one canonical path for storing file attachments tied to requests/responses; one fewer table; foreign-key integrity on `responses.document_id`; no behavior regressions in the request-submission or DSO-review flows.

### Assumptions

1. `documents` is the canonical attachments table going forward. Files attached to requests/responses live there with `related_request_id` / `related_response_id` set.
2. Existing `requests.uploaded_files` JSONB payloads contain enough metadata (storage path or URL + name) to backfill `documents` rows without re-uploading files.
3. No external system (analytics, exports, third-party integrations) reads `kv_store_268175b3`, `requests.uploaded_files`, or `responses.document_url`.
4. The canonical edge-function tree is `supabase/functions/make-server-268175b3/`. The duplicate at `src/supabase/functions/make-server-268175b3/` is stale and out of scope for this spec.
5. Production DB has data — migrations must be safe to run on a populated table.

→ Correct any of these now or the plan below proceeds on them.

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite 6 (`@vitejs/plugin-react-swc`)
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions on Deno/Hono)
- **DB migrations:** raw SQL in `supabase/migrations/`, filename `YYYYMMDDHHMMSS_name.sql`
- **No test framework configured** (see Testing Strategy below)

## Commands

```
Dev (frontend):     npm run dev
Build (frontend):   npm run build
Apply migrations:   supabase db push                  (against linked project)
Local DB reset:     supabase db reset                 (re-runs all migrations)
Generate types:     supabase gen types typescript ... (manual; types are hand-maintained today)
```

## Project Structure (relevant slice)

```
supabase/migrations/                              → SQL migrations, timestamp-prefixed
supabase/functions/make-server-268175b3/         → Canonical edge-function tree
  kv_store.tsx                                    → TO BE DELETED (dead module)
  repositories/document.repository.ts             → Documents CRUD — already exists
  repositories/request.repository.ts              → Writes `uploaded_files` today
  services/requests/requests.service.ts:40        → Passes `uploadedFiles` into request row
  types/database.types.ts                         → Hand-maintained types

src/components/
  DSORequestCenter.tsx:115                        → Reads `req.uploaded_files` (fallback chain)
  DSORequestActionDetail.tsx                      → Mock `documentUrl` only; no live DB read

src/types/request.types.ts                       → Mirrors `uploaded_files`

src/DATABASE_SCHEMA.sql                          → Schema reference doc (not authoritative)
docs/specs/data-model-cleanup.md                  → This spec
```

## Code Style — Migration Conventions

```sql
-- ============================================================
--  Drop dead kv_store_268175b3 table
-- ============================================================

-- Idempotent: safe to re-run
DROP TABLE IF EXISTS public.kv_store_268175b3;
```

Rules observed from existing migrations:
- Banner comment header explaining the migration's intent
- `IF EXISTS` / `IF NOT EXISTS` on every DDL statement (re-runnable)
- Numbered sections (`-- 1.`, `-- 2.`) when migration has multiple steps
- One concern per migration file — don't bundle unrelated changes
- Filename: `YYYYMMDDHHMMSS_snake_case_description.sql`

## Testing Strategy

This repo has **no test framework configured** (no `test` script, no test files visible in the working tree). Verification is therefore manual + SQL-driven:

1. **Pre-migration backup snapshot** — `pg_dump` of `requests`, `responses`, `documents`, `kv_store_268175b3` rows before migration runs.
2. **Migration dry-run on a local Supabase instance** — `supabase db reset` then run target migration; inspect resulting schema with `\d requests`, `\d responses`, `\dt`.
3. **Row-count invariant checks** — after backfill migration:
   - `SELECT COUNT(*) FROM documents WHERE related_request_id IS NOT NULL` ≥ count of distinct file refs across `requests.uploaded_files` before migration
   - Sample 20 random `requests` rows; for each, the union of `documents.related_request_id = requests.id` should equal what `uploaded_files` contained.
4. **Smoke test in the running dev server** (`npm run dev`):
   - Submit a student request with two file attachments → confirm they appear in DSORequestCenter
   - As DSO, open the request → confirm files render and downloadable
   - Verify network tab: no requests reference `uploaded_files` field
5. **Type check:** `npx tsc --noEmit` after refactor to confirm no dangling `uploaded_files` / `document_url` references in TypeScript.

**Adding a test framework is out of scope for this spec** but flagged as a follow-up.

## Boundaries

**Always:**
- Make every migration idempotent (`IF EXISTS` / `IF NOT EXISTS`).
- Backfill before dropping. Never drop a column whose data hasn't been moved to its new home and verified.
- Take a `pg_dump` before each migration runs against the linked Supabase project.
- Update `src/DATABASE_SCHEMA.sql` reference doc in the same PR that ships the migration.
- Run the smoke flow in the dev server before declaring a task done — TypeScript passing is necessary, not sufficient.

**Ask first:**
- Running any migration against a production/linked Supabase project.
- Touching `kv_store_268175b3` if any external system (analytics export, third-party integration) might reference it — verify with the user first.
- Resolving the `supabase/` vs `src/supabase/` duplication (out of scope here; flag if you find live callers under `src/supabase/`).
- Changing the shape of types in `database.types.ts` beyond removing the three target fields.

**Never:**
- Drop `kv_store_268175b3`, `uploaded_files`, or `document_url` in the same migration that backfills `documents`. Separate migrations, separate review gates.
- Force-push to `main` or to this branch once it's been shared.
- Delete `kv_store.tsx` without confirming grep across the repo + both `supabase/` trees turns up zero callers.
- Combine the three deprecations into a single migration. One concern per migration.

## Success Criteria

This spec is "done" when all of the following hold on `main`:

- [ ] `kv_store_268175b3` table no longer exists in the Supabase project.
- [ ] `supabase/functions/make-server-268175b3/kv_store.tsx` is deleted.
- [ ] `requests.uploaded_files` column no longer exists.
- [ ] Files previously stored in `requests.uploaded_files` are reachable via `SELECT * FROM documents WHERE related_request_id = ?`.
- [ ] `responses.document_url` column no longer exists.
- [ ] `responses.document_id` has a `REFERENCES documents(id) ON DELETE SET NULL` FK constraint.
- [ ] `requests.service.ts`, `request.repository.ts`, `DSORequestCenter.tsx`, and `request.types.ts` no longer reference `uploaded_files` / `uploadedFiles`.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.
- [ ] Manual smoke test confirms file-upload + file-view flows work end-to-end.
- [ ] `src/DATABASE_SCHEMA.sql` reflects the new shape.

---

## Plan (Phase 2)

Migrations are sequential; app-code refactors in phase B can be parallelized after the corresponding migration lands.

**Phase A — Drop dead weight (parallel-safe with Phase B prep)**
- A1. Migration: `20260511000000_drop_kv_store_268175b3.sql` — `DROP TABLE IF EXISTS public.kv_store_268175b3`.
- A2. Delete `supabase/functions/make-server-268175b3/kv_store.tsx`.
- A3. Update `src/DATABASE_SCHEMA.sql` to remove the kv_store table block.

**Phase B — Dedupe request file storage (sequential)**
- B1. Migration: `20260511010000_backfill_request_files_to_documents.sql` — INSERT INTO `documents` from `requests.uploaded_files` JSONB elements with `related_request_id = requests.id`. **Does NOT drop the column.** Re-runnable via `ON CONFLICT DO NOTHING` keyed on `(related_request_id, storage_path)`.
- B2. App refactor: change `requests.service.ts` to insert document rows instead of writing `uploaded_files`. Change `request.repository.ts` to stop selecting/passing the column. Change `DSORequestCenter.tsx:115` to read from `documents` joined by `related_request_id`. Update `request.types.ts`.
- B3. **Verify in production-like env** that no client writes `uploaded_files` for ≥1 week of usage (or run a query confirming no new non-empty values).
- B4. Migration: `20260518000000_drop_requests_uploaded_files.sql` — `ALTER TABLE requests DROP COLUMN IF EXISTS uploaded_files`. Update `DATABASE_SCHEMA.sql`.

**Phase C — Dedupe response document reference (parallel with B after B1)**
- C1. Migration: `20260511020000_responses_document_id_fk.sql` — add `ALTER TABLE responses ADD CONSTRAINT responses_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL`. Pre-flight: any orphan rows where `document_id` doesn't match a `documents.id`? If so, NULL them first or fail loudly.
- C2. Migration: `20260511030000_drop_responses_document_url.sql` — `ALTER TABLE responses DROP COLUMN IF EXISTS document_url`.
- C3. App: remove `document_url` from `database.types.ts`. The `documentUrl` in `DSORequestActionDetail.tsx` is hardcoded mock — leave it for now or replace with a `documents.storage_path` lookup if that component is being wired to real data (separate scope).

**Risks & mitigations:**
- *Backfill loses metadata.* Inspect 5–10 `uploaded_files` payloads first; confirm shape is `{name, url|storage_path, size, type}`. If shape varies, write the backfill to handle each variant or quarantine rows that don't fit.
- *Orphaned `responses.document_id` values.* Run `SELECT COUNT(*) FROM responses r WHERE r.document_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.id = r.document_id)` before C1.
- *Two-supabase-tree drift.* If anything under `src/supabase/` is somehow live, refactors in `supabase/` won't catch it. Pre-flight: confirm Vite/Deno entry point only loads from `supabase/`, not `src/supabase/`.

---

## Tasks (Phase 3)

- [ ] **T1.** Verify `kv_store_268175b3` has no external readers
  - Acceptance: confirmed with human owner that no analytics export, third-party tool, or non-repo code reads this table
  - Verify: human sign-off captured in PR description
  - Files: none

- [ ] **T2.** Pre-flight: shape of `requests.uploaded_files` payloads
  - Acceptance: documented JSON shape (keys present, types) based on ≥10 real rows
  - Verify: `SELECT uploaded_files FROM requests WHERE jsonb_array_length(uploaded_files) > 0 LIMIT 10`; record findings in the PR
  - Files: none

- [ ] **T3.** Pre-flight: orphan check on `responses.document_id`
  - Acceptance: zero orphans, OR a remediation plan documented for non-zero
  - Verify: orphan-count SQL above returns 0
  - Files: none

- [ ] **T4.** Write migration A1 — drop kv_store
  - Acceptance: file `supabase/migrations/20260511000000_drop_kv_store_268175b3.sql` exists and is idempotent
  - Verify: `supabase db reset` locally completes cleanly; `\dt` shows no `kv_store_*`
  - Files: `supabase/migrations/20260511000000_drop_kv_store_268175b3.sql`

- [ ] **T5.** Delete kv_store.tsx + update schema doc
  - Acceptance: file gone, `src/DATABASE_SCHEMA.sql` no longer contains the kv_store CREATE TABLE block
  - Verify: `grep -r "kv_store_268175b3" .` returns zero matches outside this spec
  - Files: `supabase/functions/make-server-268175b3/kv_store.tsx`, `src/DATABASE_SCHEMA.sql`

- [ ] **T6.** Write migration B1 — backfill request files into documents
  - Acceptance: re-runnable migration that copies non-null `requests.uploaded_files` entries into `documents` rows with `related_request_id` set
  - Verify: row-count invariant holds locally; spot-check 5 random requests
  - Files: `supabase/migrations/20260511010000_backfill_request_files_to_documents.sql`

- [ ] **T7.** Refactor app to write/read documents instead of `uploaded_files`
  - Acceptance: zero references to `uploaded_files` / `uploadedFiles` in `src/` and `supabase/` outside the schema dump
  - Verify: smoke test (create request w/ attachments → DSO sees them); `npx tsc --noEmit` passes; `npm run build` passes
  - Files: `supabase/functions/make-server-268175b3/services/requests/requests.service.ts`, `supabase/functions/make-server-268175b3/repositories/request.repository.ts`, `supabase/functions/make-server-268175b3/types/database.types.ts`, `src/components/DSORequestCenter.tsx`, `src/types/request.types.ts`

- [ ] **T8.** Soak period for B1+T7 in deployed env
  - Acceptance: ≥7 days of usage post-deploy with no new non-empty `uploaded_files` values written
  - Verify: `SELECT COUNT(*) FROM requests WHERE uploaded_files IS NOT NULL AND uploaded_files <> '[]'::jsonb AND created_at > <deploy-date>` returns 0
  - Files: none

- [ ] **T9.** Write migration B4 — drop `uploaded_files` column
  - Acceptance: migration drops the column idempotently and updates schema doc
  - Verify: `supabase db reset` clean; `\d requests` confirms column gone
  - Files: `supabase/migrations/20260518000000_drop_requests_uploaded_files.sql`, `src/DATABASE_SCHEMA.sql`

- [ ] **T10.** Write migration C1 — add FK on `responses.document_id`
  - Acceptance: FK constraint exists with `ON DELETE SET NULL`
  - Verify: `\d responses` shows the constraint
  - Files: `supabase/migrations/20260511020000_responses_document_id_fk.sql`

- [ ] **T11.** Write migration C2 — drop `responses.document_url`
  - Acceptance: column dropped, schema doc updated
  - Verify: `\d responses` confirms column gone; `grep document_url` returns only this spec
  - Files: `supabase/migrations/20260511030000_drop_responses_document_url.sql`, `src/DATABASE_SCHEMA.sql`

- [ ] **T12.** Remove `document_url` from TS types
  - Acceptance: `database.types.ts` no longer declares the field
  - Verify: `npx tsc --noEmit` passes
  - Files: `supabase/functions/make-server-268175b3/types/database.types.ts`

---

## Open Questions

1. Does anything outside this repo (analytics, BI tooling, exports) read `kv_store_268175b3`?
2. Are there production rows in `requests.uploaded_files` that wouldn't survive the backfill (missing fields, malformed JSON)? Need a sample query before committing to the backfill shape.
3. The duplicate edge-function tree at `src/supabase/` — does Vite or any build artifact load from there? If yes, this spec needs a sibling spec to consolidate. If no, we can prune in a follow-up.
4. `DSORequestActionDetail.tsx` uses a hardcoded `documentUrl` in mock data. Is this component scheduled to be wired to real data soon? Affects whether we delete the field outright or replace with a `documents.storage_path` join.
5. No test framework — is adding one (Vitest + React Testing Library) a precondition for this work, a parallel track, or a follow-up?
