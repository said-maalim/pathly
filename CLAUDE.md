# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # Vite dev server → http://localhost:3000
npm run build  # Production build → build/

npx supabase db push                      # apply migrations (preferred)
node scripts/db-tool.mjs apply <file>     # single migration in a transaction
node scripts/db-tool.mjs state            # show migration state
supabase functions deploy make-server-268175b3
```

No test framework is configured.

## Repo map

```
src/
  App.tsx                  # Router shell — all URL routes defined here
  context/UserContext.tsx  # Auth state (userData / setUserData), no persistence
  lib/
    supabase.ts            # Singleton Supabase client + getAccessToken()
    api-client.ts          # apiGet/Post/Put/Delete/Upload — adds Bearer token
  services/                # One file per domain (auth, request, student, messaging…)
  hooks/                   # Data-fetching hooks (useDSOStudents, useMessages, …)
  types/                   # Domain types barrel-exported from types/index.ts
  components/
    auth/                  # AccessPortal + sub-components, portal.css (.ap-)
    landing/               # LandingPage sections, landing.css (.lp-)
    dso/                   # DSOShell, DSOSidebar, DSOTopBar, DSODashboard, types.ts
    ui/                    # shadcn/ui primitives (do not edit)
    UniversityStudentPortal.tsx  # student sub-view switcher
    UniversityDSOPortal.tsx      # DSO sub-view switcher
    messaging.css          # .msg- scoped CSS
    dso-requests.css       # .drq- scoped CSS
supabase/functions/make-server-268175b3/
  index.ts                 # Hono router root
  middleware/              # auth, error-handler
  repositories/            # Thin DB layer, one file per table
  services/<domain>/       # Business logic + route handlers
  types/                   # Shared edge-function TS interfaces
design_reference/          # Approved HTML/CSS/JS mockups — source of truth for UI
supabase/migrations/       # YYYYMMDDHHMMSS_name.sql, must be idempotent
```

`src/supabase/` is a stale duplicate — edit only `supabase/functions/make-server-268175b3/`.

## Auth approach

Sign-in lives at `/sign-in` → `AccessPortal.tsx`. Auth uses `supabase.auth.signInWithPassword()` via `src/services/auth.service.ts`. On success:

1. `isLoggingIn.current = true` — suppresses the render-time redirect guard
2. `setUserData(result.userData)` — stores session in `UserContext`
3. `navigate(role === 'dso' ? ROUTES.dsoPortal : ROUTES.studentPortal, { replace: true })`

`ProtectedRoute` checks `userData?.data?.session?.access_token`; redirects to `/sign-in` if absent. The `isLoggingIn` ref is essential — skipping it causes a redirect loop because `setUserData` triggers a re-render before `navigate` fires.

Key fields on `userData`: `userData.data.user.user_metadata.schoolId`, `.name`, `.role`; token at `userData.data.session.access_token`. Neither portal uses URL sub-routes; each manages a `currentView` state (`StudentView` / `DSOView`) and renders child components via a `renderContent()` switch.

## Conventions

**API calls** — always use `src/lib/api-client.ts` helpers, never raw `fetch`. The backend is a single edge function; base URL is `${supabaseUrl}/functions/v1/make-server-268175b3` (defined in `src/lib/supabase.ts`).

**Student data in DSO views** — `UniversityDSOPortal` fetches students once with `useDSOStudents(schoolId)` and passes them as props. DSO child components accept `students?: StudentOption[]` and fall back to fetching only when the prop is absent.

**Styling** — Tailwind CSS v4 (no config file) for most components. For layout-heavy views, create a scoped CSS file with a short class prefix to avoid Tailwind v4 conflicts:
- `.ap-` auth · `.lp-` landing · `.msg-` messaging · `.drq-` DSO requests
- When adding a new complex view, follow the same pattern.

Design tokens used in all scoped CSS and inline styles:
`navy #1a1f2e` · `ink #111827` · `muted #6b7280` · `border #e5e7eb` · `bg #f4f5f7` · `blue #2563eb` · `indigo #6366f1` · `green #16a34a` · `amber #d97706` · `red #dc2626`

Font is **DM Sans** (loaded in `index.html`). In scoped CSS write `font-family: 'DM Sans', sans-serif` explicitly — `font-sans` from Tailwind resolves to Inter via `globals.css`.

**DSO viewport height** — the flex chain `DSOShell main` must have `flex flex-col` for child `flex-1` to work. Views with internal scroll need `overflow: hidden; min-height: 0` on the wrapper and `overflow-y: auto; min-height: 0` on the scroll container.

**Rebuilding a view from design_reference/** — extract the reference CSS into a new scoped file; do not mix reference styles inline or into Tailwind utility classes.

**Types** — import from `@/types` (barrel export). `DSOView` union lives in `src/components/dso/types.ts`.

**Migrations** — filename `YYYYMMDDHHMMSS_snake_case.sql`, every statement must be idempotent (`IF EXISTS` / `IF NOT EXISTS`).

## Known footguns

- **`src/supabase/`** is a stale duplicate of `supabase/functions/make-server-268175b3/`. Never edit it; changes there have no effect.
- **`src/styles/globals.css`** defines CSS custom properties consumed by every shadcn/ui primitive. Do not remove or rename those vars — the components break silently with no TS error.
- **`ui/` components** are shadcn/ui generated files. Customise them by wrapping, not by editing the source directly.
- **File uploads in `I20RequestFlow.tsx`** — the UI collects files but they are discarded before the API call. The backend upload endpoint is not yet wired up; don't treat the UI as complete.
