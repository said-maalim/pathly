# Pathly

International-student management platform (SEVIS / DSO compliance) for U.S. universities. Students submit visa-related requests (I-20 travel signatures, OPT/CPT applications, program extensions, etc.); Designated School Officials (DSOs) review them, run roster imports, send bulk request actions, and message students.

---

## Tech stack

- **Frontend:** React 18 + TypeScript + Vite 6 (`@vitejs/plugin-react-swc`), Tailwind CSS, Radix UI primitives via shadcn/ui
- **Backend:** Supabase — Postgres (relational schema), Supabase Auth, Supabase Storage, Edge Functions (Deno + Hono)
- **Routing:** React Router v7
- **Migrations:** SQL files in `supabase/migrations/`, timestamp-prefixed (`YYYYMMDDHHMMSS_name.sql`)

There is no test framework configured yet.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Browser (React SPA)                       │
│                                                                   │
│   src/App.tsx       ─── Router shell                              │
│   src/components/   ─── Page components + shadcn/ui primitives    │
│   src/services/     ─── Typed API client functions                │
│   src/hooks/        ─── React hooks (auth, data fetch)            │
│   src/lib/          ─── api-client, supabase client init          │
└──────────────────────────────────┬───────────────────────────────┘
                                   │  HTTPS (REST + Supabase JS)
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Supabase Edge Function                         │
│      supabase/functions/make-server-268175b3/                     │
│                                                                   │
│   index.ts          ─── Hono router, mounts service routes        │
│   middleware/       ─── auth, error-handler                       │
│   services/<x>/     ─── auth, students, requests, documents,      │
│                          messaging, roster, users                 │
│   repositories/     ─── Thin DB-access layer (one per table)      │
│   config/database.ts ── Supabase admin + anon client factories    │
│   types/            ─── Hand-maintained TS interfaces             │
└──────────────────────────────────┬───────────────────────────────┘
                                   │  postgres / supabase-js
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Supabase Project                            │
│                                                                   │
│   auth.users               ─── Supabase Auth identities           │
│   public.users/students    ─── Application-level profiles         │
│   public.requests          ─── Student-initiated requests         │
│   public.request_actions   ─── DSO-initiated actions              │
│   public.responses         ─── Student replies to actions         │
│   public.documents         ─── File metadata (FK to storage)      │
│   public.messages          ─── Student↔DSO threaded messaging     │
│   public.notifications     ─── In-app alerts                      │
│   public.audit_logs        ─── Compliance trail                   │
│   public.roster_imports    ─── CSV bulk-upload tracking           │
│   Storage: message-attachments bucket                             │
│   Auth: Row Level Security keyed on school_id                     │
└──────────────────────────────────────────────────────────────────┘
```

**Multi-tenant model.** Every domain row carries `school_id`. RLS policies enforce tenant isolation in the database; the edge function additionally re-checks role/school in route handlers.

---

## Code flow — student submits a request

This is the canonical happy-path round-trip:

```
User clicks "Start CPT Application" in RequestCenter
    │
    ▼
src/components/RequestCenter.tsx
    └─→ renders <I20RequestFlow requestId="cpt" ...>
            │
            ▼
src/components/I20RequestFlow.tsx
    ├─ collects formData via controlled inputs
    └─→ on submit, calls onSubmit(requestData) callback
            │
            ▼
src/components/UniversityStudentPortal.tsx
    └─→ handleI20RequestSubmit(requestData)
            └─→ submitRequest({ requestType, requestName, reason, formData })
                    │
                    ▼
src/services/request.service.ts
    └─→ apiPost('/requests/submit', payload)
            │
            ▼  src/lib/api-client.ts attaches Authorization: Bearer <jwt>
            ▼
Supabase Edge Function — POST /requests/submit
    ├─ middleware/auth.ts validates JWT, sets c.userId / c.schoolId
    ├─ services/requests/requests.routes.ts destructures body
    └─→ requestsService.submitRequest(userId, data)
            ├─ studentRepository.findByUserId(userId) → look up student profile
            ├─ build CreateRequestData payload
            └─→ requestRepository.create(payload)
                    └─ supabase.from('requests').insert(...) → returns Request row
                                │
                                ▼ Postgres + RLS
                                INSERT INTO public.requests (...) WHERE school_id matches user
```

DSO-side reads (`DSORequestCenter`, `request_summaries` view) fetch the same rows joined with student/user/school metadata, filtered by `school_id` and visa status.

---

## Project structure

```
.
├── README.md                       # This file
├── package.json                    # npm scripts: dev, build
├── vite.config.ts
├── index.html
├── docs/specs/                     # Spec-driven dev: per-feature spec docs
├── scripts/                        # One-off operator scripts (e.g. db-tool.mjs)
├── src/
│   ├── App.tsx                     # Router shell
│   ├── main.tsx                    # Vite entry
│   ├── components/                 # Pages + shadcn/ui primitives in ui/
│   ├── services/                   # API client functions, one per domain
│   ├── hooks/                      # React hooks
│   ├── context/                    # React contexts (UserContext, etc.)
│   ├── lib/                        # api-client, supabase init
│   ├── utils/                      # Small helpers
│   ├── types/                      # Frontend-facing TS types
│   ├── styles/                     # globals.css, design tokens
│   └── DATABASE_SCHEMA.sql         # Reference schema dump
└── supabase/
    ├── migrations/                 # Source-of-truth schema migrations
    └── functions/
        └── make-server-268175b3/   # Single Hono app, multi-route
            ├── index.ts            # Router root
            ├── config/             # Supabase client factories
            ├── middleware/         # auth, error-handler
            ├── repositories/       # One file per table; thin DB CRUD
            ├── services/<domain>/  # Business logic + routes
            └── types/              # Shared TS interfaces
```

**Note on `src/supabase/`.** A duplicate, stale copy of the edge-function tree lives under `src/supabase/`. The canonical tree is at `supabase/`. Consolidation is tracked as a follow-up.

---

## Local development

### Prerequisites
- Node 20+
- A Supabase project (free tier is fine)
- `.env.supabase.local` with at minimum:
  ```
  SUPABASE_URL="https://<project-ref>.supabase.co"
  SUPABASE_ANON_KEY="<anon-key>"
  DB_URL="postgresql://postgres.<project-ref>:<password>@aws-<region>.pooler.supabase.com:5432/postgres"
  ```
  Use the **Session pooler** connection string from Supabase Dashboard → Settings → Database. The direct `db.<project>.supabase.co` host is IPv6-only and won't resolve on most IPv4 networks.

### Run
```bash
npm install
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # Production build → build/
```

### Apply migrations
```bash
# Recommended (Supabase CLI):
npx supabase db push

# Or via the operator script in scripts/:
node scripts/db-tool.mjs state              # show current state
node scripts/db-tool.mjs backup             # JSON snapshot of touched tables
node scripts/db-tool.mjs apply <migration>  # one migration, wrapped in tx
node scripts/db-tool.mjs verify             # check spec success criteria
```

The migration filename convention is `YYYYMMDDHHMMSS_snake_case_description.sql`. Each migration should be idempotent (`IF EXISTS` / `IF NOT EXISTS` everywhere) and address one concern.

### Edge function development
The Supabase edge functions live in `supabase/functions/make-server-268175b3/`. To run them locally use the Supabase CLI (`supabase functions serve`). They're written in Deno-flavored TypeScript with Hono as the router.

---

## Deployment

- **Frontend:** `npm run build` outputs `build/`. Deploy as static assets (Vercel, Netlify, Cloudflare Pages, S3+CloudFront, etc.).
- **Edge functions:** `supabase functions deploy make-server-268175b3` from the project root.
- **Migrations:** `supabase db push` against the production project. Always take a `pg_dump` (or use `scripts/db-tool.mjs backup`) before any DROP statement runs.

The single edge function host (`make-server-268175b3`) is a leftover from the Figma Make scaffold — it's a multi-domain Hono app, not actually one function per route.

---

## Spec-driven changes

Non-trivial changes start with a spec in `docs/specs/`. The spec covers objective, plan, tasks, success criteria, and is reviewed before any code is written. Migrations and code changes reference the spec they implement.

See `docs/specs/data-model-cleanup.md` for an example.

---

## Open follow-ups

- Consolidate the duplicate `supabase/` and `src/supabase/` edge-function trees.
- Wire up the request file-upload flow end-to-end (currently the UI collects files via `I20RequestFlow.tsx` but they're discarded before reaching the backend).
- Tighten grants on the `request_summaries` view (currently grants full CRUD to `anon` and `authenticated`).
- Add a test framework (Vitest + React Testing Library is the natural fit).
- Consider code-splitting — the production bundle is ~930kB before gzip.

---

## Attributions

- UI primitives from [shadcn/ui](https://ui.shadcn.com/) under MIT license
- Icons from [lucide-react](https://lucide.dev/)
- Stock photography from [Unsplash](https://unsplash.com) under their [license](https://unsplash.com/license)
