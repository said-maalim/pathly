# Spec: Data-Model Cleanup — Drop `kv_store_268175b3`, Dedupe File Storage

**Status:** Phase A + C shipped (commits `8372661`, `9d184d5`); Phase B simplified after pre-flight recon — see [Recon Update](#recon-update-2026-05-11) below
**Owner:** Said Maalim
**Branch:** `u/saidmaalim/data-model-cleanup`
**Created:** 2026-05-11
**Last updated:** 2026-05-11

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

## Recon Update (2026-05-11)

Pre-flight SQL run against the linked Supabase project surfaced two
material facts that changed Phase B and Phase C:

### `responses` table is empty
```
document_url_set: 0
document_id_set:  0
url_only_no_id:   0
total_responses:  0
```
Implication: T3 orphan check is trivially 0; Phase C migrations C1 and
C2 are safe immediately, no remediation needed.

### `requests.uploaded_files` has never held real data
```
null_rows:        0
empty_array_rows: 5
non_empty_rows:   0
total_requests:   5
```
All 5 existing request rows carry the default `'[]'::jsonb`. Tracing
the code:

- `I20RequestFlow.tsx:125-145` collects `File` objects in local state
  and passes them via `onSubmit(requestData)`.
- `UniversityStudentPortal.tsx:96-108` (`handleI20RequestSubmit`)
  receives `requestData.uploadedFiles` but **drops it on the floor** —
  the call to `submitRequest()` only forwards
  `{requestType, requestName, reason, formData}`.
- `SubmitRequestPayload` (`src/types/request.types.ts:56-61`) has no
  `uploadedFiles` field at all — the frontend type contract has no
  shape for it.
- Backend `requests.routes.ts:24` destructures `uploadedFiles` from
  the body, but no client ever sends it.

The end-to-end file-upload wiring for student requests **was broken
from the start.** The `uploaded_files` column is dead plumbing, not a
live data source.

### What this changes
- **Phase B backfill (B1, T6) — DELETED.** Nothing to back up.
- **Phase B soak (B3, T8) — DELETED.** Nothing to monitor.
- **Phase B becomes pure code-removal:** drop the column + strip
  `uploaded_files` / `uploadedFiles` from every layer of the stack.
- The broken file-upload UX in `I20RequestFlow.tsx` is **out of
  scope** for this spec. New open question (#6) tracks it as a
  follow-up: should we wire uploads through Supabase Storage +
  `documents` table, or remove the file-picker UI until we do?

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

**Phase B — Drop dead `uploaded_files` plumbing (revised after recon)**

Original plan assumed live data and required backfill + soak. Recon
proved the column never held real data and the end-to-end pipeline
was never wired (see [Recon Update](#recon-update-2026-05-11)).
Phase B reduces to single-pass removal.

- B1. Migration: `20260511040000_drop_requests_uploaded_files.sql` —
  `ALTER TABLE requests DROP COLUMN IF EXISTS uploaded_files`.
- B2. Strip the field from every layer of the stack in the same
  commit (otherwise stale reads would 500 against the dropped column):
  - Backend types: `CreateRequestData`, `Request` interfaces in
    `database.types.ts` (both supabase/ and src/supabase/ copies).
  - Backend service: `requests.service.ts` — remove `uploadedFiles`
    parameter and the `uploaded_files` write.
  - Backend routes: `requests.routes.ts` — remove `uploadedFiles`
    from body destructure and the forwarded call.
  - Frontend types: `src/types/request.types.ts` — remove
    `uploaded_files` from `RequestRecord`.
  - Frontend reader: `src/components/DSORequestCenter.tsx:115` —
    drop the `req.uploaded_files || req.uploadedFiles || []`
    fallback chain; default to `[]`.
  - Schema doc: `src/DATABASE_SCHEMA.sql` — remove the
    `uploaded_files JSONB` line.
- B3. `I20RequestFlow.tsx` retains its file-picker UI. Files are
  collected but discarded silently (current behavior unchanged).
  Wiring this up via `documents` + Supabase Storage is **out of
  scope** — see Open Question #6.

**Phase C — Dedupe response document reference (parallel with B after B1)**
- C1. Migration: `20260511020000_responses_document_id_fk.sql` — add `ALTER TABLE responses ADD CONSTRAINT responses_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL`. Pre-flight: any orphan rows where `document_id` doesn't match a `documents.id`? If so, NULL them first or fail loudly.
- C2. Migration: `20260511030000_drop_responses_document_url.sql` — `ALTER TABLE responses DROP COLUMN IF EXISTS document_url`.
- C3. App: remove `document_url` from `database.types.ts`. The `documentUrl` in `DSORequestActionDetail.tsx` is hardcoded mock — leave it for now or replace with a `documents.storage_path` lookup if that component is being wired to real data (separate scope).

**Risks & mitigations:**
- ~~*Backfill loses metadata.*~~ N/A after recon — column has no data.
- ~~*Orphaned `responses.document_id` values.*~~ N/A after recon — table is empty.
- *Two-supabase-tree drift.* If anything under `src/supabase/` is somehow live, refactors in `supabase/` won't catch it. Mitigation in this branch: every code change touches both copies. Pre-flight: confirm Vite/Deno entry point only loads from `supabase/`, not `src/supabase/`.
- *Future file-upload feature work.* Anyone implementing the wired-up version (open question #6) must touch `documents` directly — there is no longer a `uploaded_files` column to fall back to. This is intentional; the dead column was the bug.

---

## Tasks (Phase 3)

- [ ] **T1.** Verify `kv_store_268175b3` has no external readers
  - Acceptance: confirmed with human owner that no analytics export, third-party tool, or non-repo code reads this table
  - Verify: human sign-off captured in PR description
  - Files: none

- [x] **T2.** ~~Pre-flight: shape of `requests.uploaded_files` payloads~~ → **Recon (2026-05-11) found 0 non-empty rows; no shape to document.**

- [x] **T3.** ~~Pre-flight: orphan check on `responses.document_id`~~ → **Recon (2026-05-11) found `responses` table is empty; orphan count is 0.**

- [x] **T4.** Write migration A1 — drop kv_store (commit `8372661`)

- [x] **T5.** Delete kv_store.tsx + update schema doc (commit `8372661`)
  - Note: `src/DATABASE_SCHEMA.sql` did not contain a `kv_store` block; only the `kv_store.tsx` file held the DDL, in a comment header. No schema-doc edit was needed.

- [x] **T6.** ~~Migration B1 — backfill request files into documents~~ → **DELETED after recon. No data to back up.**

- [ ] **T7.** Strip `uploaded_files` / `uploadedFiles` from every layer of the stack
  - Acceptance: zero references to `uploaded_files` / `uploadedFiles` in `src/` and `supabase/` outside `docs/specs/`
  - Verify: `grep -rn "uploaded_files\|uploadedFiles" --include="*.ts" --include="*.tsx" --include="*.sql" . | grep -v node_modules | grep -v "docs/specs"` returns only the new migration file
  - Verify: `npm run build` passes
  - Files: `supabase/functions/make-server-268175b3/types/database.types.ts`, `supabase/functions/make-server-268175b3/services/requests/requests.service.ts`, `supabase/functions/make-server-268175b3/services/requests/requests.routes.ts`, `src/supabase/functions/make-server-268175b3/types/database.types.ts`, `src/supabase/functions/make-server-268175b3/services/requests/requests.service.ts`, `src/supabase/functions/make-server-268175b3/services/requests/requests.routes.ts`, `src/types/request.types.ts`, `src/components/DSORequestCenter.tsx`, `src/DATABASE_SCHEMA.sql`

- [x] **T8.** ~~Soak period~~ → **DELETED after recon. No live writes to monitor.**

- [ ] **T9.** Write migration B (renumbered) — drop `uploaded_files` column
  - Acceptance: migration drops the column idempotently
  - Verify: `\d requests` confirms column gone
  - Files: `supabase/migrations/20260511040000_drop_requests_uploaded_files.sql`

- [x] **T10.** Write migration C1 — add FK on `responses.document_id` (commit `9d184d5`)

- [x] **T11.** Write migration C2 — drop `responses.document_url` (commit `9d184d5`)

- [x] **T12.** Remove `document_url` from TS types (commit `9d184d5`)
  - Note: also removed from stale `src/supabase/` copy and `src/DATABASE_SCHEMA.sql` to satisfy the verify-step grep.

---

## Open Questions

1. Does anything outside this repo (analytics, BI tooling, exports) read `kv_store_268175b3`?
2. Are there production rows in `requests.uploaded_files` that wouldn't survive the backfill (missing fields, malformed JSON)? Need a sample query before committing to the backfill shape.
3. The duplicate edge-function tree at `src/supabase/` — does Vite or any build artifact load from there? If yes, this spec needs a sibling spec to consolidate. If no, we can prune in a follow-up.
4. `DSORequestActionDetail.tsx` uses a hardcoded `documentUrl` in mock data. Is this component scheduled to be wired to real data soon? Affects whether we delete the field outright or replace with a `documents.storage_path` join.
5. No test framework — is adding one (Vitest + React Testing Library) a precondition for this work, a parallel track, or a follow-up?
6. **(Added 2026-05-11 after recon)** The student request file-upload pipeline (`I20RequestFlow.tsx` → `UniversityStudentPortal.handleI20RequestSubmit` → `submitRequest`) collects files in the UI and silently discards them — files never reach storage or the DB. After Phase B drops `requests.uploaded_files`, the dead column is gone but the UI still has a file picker that does nothing. Options:
   - **(a) Wire it up:** upload to Supabase Storage `request-attachments` bucket on submit, then create `documents` rows with `related_request_id`. Needs storage bucket, RLS policies, frontend upload flow.
   - **(b) Remove the UI:** strip the file-picker UI from `I20RequestFlow.tsx` until the backend can accept files.
   - Current spec assumes neither — UI stays, files silently dropped, same as today. Pick (a) or (b) in a follow-up.
