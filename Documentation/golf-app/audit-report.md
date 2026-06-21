# GolfApp — Comprehensive Code Audit Report

**Date:** 2025-01-XX
**Scope:** Full static review of all app-relevant source code against documentation (PRD, tasks, technical spec, implementation plan, handoff, roadmap).
**Method:** Read-only audit — no code changes made.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Files Audited](#2-files-audited)
3. [Findings](#3-findings)
   - [P1 — Functional Regressions](#p1--functional-regressions)
   - [P2 — Spec Mismatches](#p2--spec-mismatches)
   - [P3 — Security & Auth Risks](#p3--security--auth-risks)
   - [P4 — Data & Model Inconsistencies](#p4--data--model-inconsistencies)
   - [P5 — Polish & Debt](#p5--polish--debt)
4. [OAuth Status Confirmation](#4-oauth-status-confirmation)
5. [Documentation Conflicts](#5-documentation-conflicts)
6. [Execution Plan](#6-execution-plan)

---

## 1. Executive Summary

The GolfApp codebase is substantially complete and well-structured. All 92 code tasks across M1–M12 are implemented. The architecture follows the spec closely: Next.js App Router, Supabase (auth, DB, realtime, storage), Dexie.js offline, MapLibre GL maps, and PWA configuration.

**Key stats:**
- 30 pages, 39 components, 13 API routes, 6 hooks, 7 migrations
- Auth is correctly email-only (OAuth deferred to roadmap) ✅
- No OAuth UI buttons in login/register ✅
- One **critical bug** found (offline sync HTTP method mismatch)
- One **likely migration failure** (invalid PostgreSQL syntax)
- Several medium-priority spec mismatches and validation gaps

---

## 2. Files Audited

### Pages (30)
| Path | Status |
|------|--------|
| `src/app/page.tsx` | ✅ Reviewed |
| `src/app/(auth)/login/page.tsx` | ✅ Reviewed |
| `src/app/(auth)/register/page.tsx` | ✅ Reviewed |
| `src/app/admin/page.tsx` | ✅ Reviewed |
| `src/app/admin/change-requests/page.tsx` | ✅ Exists |
| `src/app/courses/page.tsx` | ✅ Exists |
| `src/app/courses/[id]/page.tsx` | ✅ Exists |
| `src/app/courses/[id]/edit/page.tsx` | ✅ Exists |
| `src/app/courses/new/page.tsx` | ✅ Exists |
| `src/app/friends/page.tsx` | ✅ Reviewed |
| `src/app/join/[code]/page.tsx` | ✅ Reviewed |
| `src/app/leagues/page.tsx` | ✅ Exists |
| `src/app/leagues/[id]/page.tsx` | ✅ Exists |
| `src/app/leagues/new/page.tsx` | ✅ Exists |
| `src/app/play/page.tsx` | ✅ Reviewed |
| `src/app/play/PlayPageClient.tsx` | ✅ Reviewed |
| `src/app/play/[roundId]/page.tsx` | ✅ Reviewed |
| `src/app/play/[roundId]/hole/[n]/page.tsx` | ✅ Reviewed |
| `src/app/play/[roundId]/summary/page.tsx` | ✅ Reviewed |
| `src/app/privacy/page.tsx` | ✅ Reviewed |
| `src/app/profile/page.tsx` | ✅ Reviewed |
| `src/app/profile/edit/page.tsx` | ✅ Exists |
| `src/app/profile/history/page.tsx` | ✅ Exists |
| `src/app/profile/stats/page.tsx` | ✅ Exists |
| `src/app/terms/page.tsx` | ✅ Reviewed |
| `src/app/tournaments/page.tsx` | ✅ Exists |
| `src/app/tournaments/[id]/page.tsx` | ✅ Exists |
| `src/app/tournaments/[id]/chat/page.tsx` | ✅ Exists |
| `src/app/tournaments/[id]/leaderboard/page.tsx` | ✅ Exists |
| `src/app/tournaments/[id]/predictions/page.tsx` | ✅ Exists |
| `src/app/tournaments/new/page.tsx` | ✅ Exists |

### API Routes (13)
| Path | Status |
|------|--------|
| `src/app/api/account/delete/route.ts` | ✅ Reviewed |
| `src/app/api/courses/import-osm/route.ts` | ✅ Reviewed |
| `src/app/api/courses/search-osm/route.ts` | ✅ Reviewed |
| `src/app/api/export/round/[id]/route.ts` | ✅ Reviewed |
| `src/app/api/handicap/recalculate/route.ts` | ✅ Reviewed |
| `src/app/api/leagues/route.ts` | ✅ Reviewed |
| `src/app/api/rounds/route.ts` | ✅ Reviewed |
| `src/app/api/rounds/[id]/route.ts` | ✅ Reviewed |
| `src/app/api/rounds/[id]/scores/route.ts` | ✅ Reviewed |
| `src/app/api/rounds/sync/route.ts` | ✅ Reviewed |
| `src/app/api/tournaments/route.ts` | ✅ Reviewed |
| `src/app/api/tournaments/[id]/finalize/route.ts` | ✅ Reviewed |
| `src/app/api/tournaments/invite/route.ts` | ✅ Reviewed |

### Auth Route
| Path | Status |
|------|--------|
| `src/app/auth/callback/route.ts` | ✅ Reviewed (OAuth remnant — see §4) |

### Libraries
| Path | Status |
|------|--------|
| `src/lib/supabase/client.ts` | ✅ Reviewed |
| `src/lib/supabase/server.ts` | ✅ Reviewed |
| `src/lib/supabase/middleware.ts` | ✅ Reviewed |
| `src/lib/scoring/handicap.ts` | ✅ Reviewed |
| `src/lib/scoring/formats.ts` | ✅ Reviewed |
| `src/lib/scoring/recalculate.ts` | ✅ Reviewed |
| `src/lib/offline/db.ts` | ✅ Reviewed |
| `src/lib/offline/queue.ts` | ✅ Reviewed |
| `src/lib/offline/sync.ts` | ✅ Reviewed |
| `src/lib/export/csv.ts` | ✅ Reviewed |
| `src/lib/export/pdf.ts` | ✅ Reviewed |
| `src/lib/maps/overpass.ts` | ✅ Reviewed |
| `src/lib/maps/distance.ts` | ✅ Reviewed |
| `src/lib/maps/tiles.ts` | ✅ Reviewed |
| `src/lib/validations/index.ts` | ✅ Reviewed |
| `src/lib/validations/round.ts` | ✅ Reviewed |
| `src/lib/validations/tournament.ts` | ✅ Reviewed |
| `src/lib/validations/course.ts` | ✅ Reviewed |
| `src/lib/validations/profile.ts` | ✅ Reviewed |
| `src/lib/validations/prediction.ts` | ✅ Reviewed |
| `src/lib/validations/social.ts` | ✅ Reviewed |

### Components (39 total — key ones reviewed)
| Path | Status |
|------|--------|
| `src/components/layout/app-shell.tsx` | ✅ Reviewed |
| `src/components/layout/online-status.tsx` | ✅ Reviewed |
| `src/components/scoring/HoleDetailClient.tsx` | ✅ Reviewed |
| `src/components/scoring/FinishRoundButton.tsx` | ✅ Reviewed |
| `src/components/scoring/RoundSummary.tsx` | ✅ Exists |
| `src/components/scoring/HoleScoreInput.tsx` | ✅ Exists |
| `src/components/scoring/ExportButtons.tsx` | ✅ Exists |
| `src/components/social/ChatPanel.tsx` | ✅ Reviewed |
| `src/components/social/ShareRoundButton.tsx` | ✅ Reviewed |
| `src/components/social/ActivityFeed.tsx` | ✅ Reviewed |
| `src/components/social/FriendsList.tsx` | ✅ Exists |
| `src/components/profile/DeleteAccountButton.tsx` | ✅ Reviewed |
| `src/components/profile/HandicapHistory.tsx` | ✅ Exists |
| `src/components/maps/CourseMap.tsx` | ✅ Exists |
| `src/components/maps/GPSTracker.tsx` | ✅ Exists |
| `src/components/maps/ShotTracker.tsx` | ✅ Exists |
| `src/components/maps/YardageCircles.tsx` | ✅ Exists |
| `src/components/predictions/PredictionForm.tsx` | ✅ Exists |
| `src/components/predictions/PredictionResults.tsx` | ✅ Exists |
| `src/components/tournament/Leaderboard.tsx` | ✅ Exists |
| `src/components/tournament/FinalizeTournamentButton.tsx` | ✅ Exists |
| `src/components/tournament/FormatSelector.tsx` | ✅ Exists |
| `src/components/tournament/InviteButton.tsx` | ✅ Exists |
| `src/components/tournament/TournamentCard.tsx` | ✅ Exists |

### Hooks (6)
| Path | Status |
|------|--------|
| `src/hooks/useRealtimeLeaderboard.ts` | ✅ Reviewed |
| `src/hooks/useOfflineSync.ts` | ✅ Reviewed |
| `src/hooks/useHandicap.ts` | ✅ Reviewed |
| `src/hooks/useGPS.ts` | ✅ Reviewed |
| `src/hooks/use-toast.ts` | ✅ Exists (shadcn) |

### Config & Infra
| Path | Status |
|------|--------|
| `src/middleware.ts` | ✅ Reviewed |
| `next.config.js` | ✅ Reviewed |
| `package.json` | ✅ Reviewed |
| `.env.local.example` | ✅ Reviewed |
| `public/manifest.json` | ✅ Reviewed |
| `src/app/layout.tsx` | ✅ Reviewed |
| `src/app/error.tsx` | ✅ Reviewed |
| `src/app/global-error.tsx` | ✅ Reviewed |
| `src/app/not-found.tsx` | ✅ Reviewed |

### Migrations (7)
| Path | Status |
|------|--------|
| `supabase/migrations/0001_initial_schema.sql` | ✅ Reviewed |
| `supabase/migrations/0002_rls_policies.sql` | ✅ Reviewed |
| `supabase/migrations/0003_auth_profile_trigger.sql` | ✅ Reviewed |
| `supabase/migrations/0004_seed_sa_courses.sql` | ✅ Reviewed |
| `supabase/migrations/0005_search_courses_rpc.sql` | ✅ Reviewed |
| `supabase/migrations/0006_cleanup_duplicate_courses.sql` | ✅ Reviewed |
| `supabase/migrations/0007_add_league_id_to_tournaments.sql` | ✅ Reviewed |

---

## 3. Findings

### P1 — Functional Regressions

#### F-01: Offline sync uses PATCH but API only exports PUT
- **Severity:** 🔴 CRITICAL
- **Evidence:**
  - `src/lib/offline/sync.ts:140-141` — `syncCompleteRound` sends `method: "PATCH"`
  - `src/app/api/rounds/[id]/route.ts:9` — only exports `PUT`
- **Impact:** When a user completes a round offline and later syncs, the `syncCompleteRound` function sends a `PATCH` request which returns **405 Method Not Allowed**. The round stays `in_progress` on the server, handicap is never recalculated, and the sync silently fails.
- **Fix:** Change `method: "PATCH"` to `method: "PUT"` in `src/lib/offline/sync.ts:141`.

#### F-02: Migration 0006 uses invalid PostgreSQL syntax
- **Severity:** 🔴 HIGH
- **Evidence:**
  - `supabase/migrations/0006_cleanup_duplicate_courses.sql:22-23`:
    ```sql
    ALTER TABLE courses
    ADD CONSTRAINT IF NOT EXISTS courses_name_unique UNIQUE (name);
    ```
- **Impact:** `ADD CONSTRAINT IF NOT EXISTS` is **not valid PostgreSQL syntax** (not supported in PostgreSQL 15, which Supabase uses). This migration will fail on deployment. The dedup DELETE statements before it will succeed, but the unique constraint will not be created.
- **Fix:** Replace with:
  ```sql
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_name_unique') THEN
      ALTER TABLE courses ADD CONSTRAINT courses_name_unique UNIQUE (name);
    END IF;
  END $$;
  ```
- **Note:** Uncertainty flag — if Supabase has upgraded to PostgreSQL 17 (which may support this syntax), this may not be an issue. Verify the Supabase project's PostgreSQL version before deploying.

---

### P2 — Spec Mismatches

#### F-03: Team-based tournament formats are stubs
- **Severity:** 🟡 MEDIUM
- **Evidence:**
  - `src/lib/scoring/formats.ts:78-91` (best_ball), `:93-105` (scramble), `:140-152` (alternate_shot), `:154-166` (shamble), `:168-180` (two_person_scramble)
  - All team-based formats fall back to `strokePlayLeaderboard` if team data is not available — which is always, since no team assignment mechanism exists.
- **Impact:** The tech spec (§3.2) and PRD list 10 tournament formats as supported. Five of these (best_ball, scramble, alternate_shot, shamble, two_person_scramble) will produce stroke-play results instead of team-based results. Users selecting these formats will see individual rankings, not team rankings.
- **Fix:** Either:
  (a) Implement team assignment in tournament creation and pass team data to format functions, or
  (b) Remove these formats from the `tournamentFormats` list and document them as Phase 2 features.
- **Intentional deviation?** Likely intentional given time constraints. The fallback to stroke play is a reasonable MVP compromise.

#### F-04: Dashboard is a static tile grid — no dynamic widgets
- **Severity:** 🟢 LOW
- **Evidence:**
  - `src/app/page.tsx` — renders 4 static navigation tiles with no user data
  - `tasks.md` Task 12.4: "Add dashboard summary widget (recent scores, upcoming tournaments)"
- **Impact:** Users don't see personalized content on their home screen. The dashboard is functional but minimal.
- **Fix:** Add a server component that fetches recent rounds, handicap, and upcoming tournaments for the authenticated user.

#### F-05: `search-osm` route does not call Overpass API for results not in database
- **Severity:** 🟡 MEDIUM
- **Evidence:**
  - `src/app/api/courses/search-osm/route.ts` — queries only Supabase RPCs (`search_courses_by_name`, `nearby_courses`). It never calls the Overpass API functions from `src/lib/maps/overpass.ts`.
  - Tech spec §2.3 and PRD describe searching OSM for courses not yet in the database.
- **Impact:** Users can only find courses already imported into the database. The OSM search/import flow requires a two-step process (search DB → manually import from OSM), but the name implies OSM integration is live in search.
- **Fix:** Either rename the route to `/api/courses/search` to avoid confusion, or add a fallback to Overpass API when DB results are empty.
- **Intentional deviation?** Likely intentional — Overpass API is slow and rate-limited. The import-osm route handles the OSM fetching separately.

---

### P3 — Security & Auth Risks

#### F-06: No rate limiting on any API route
- **Severity:** 🟡 MEDIUM
- **Evidence:**
  - Tech spec §6.5 mentions rate-limiting middleware.
  - No rate limiting is implemented in `src/middleware.ts` or any API route handler.
- **Impact:** All API routes are vulnerable to brute-force attacks (login), abuse (creating rounds/tournaments), and denial-of-service. The account deletion route is particularly sensitive.
- **Fix:** Add rate limiting middleware using `next-rate-limit`, Upstash Redis, or a simple in-memory rate limiter for MVP.

#### F-07: Tournament `leagueId` bypasses Zod validation
- **Severity:** 🟡 MEDIUM
- **Evidence:**
  - `src/app/api/tournaments/route.ts:27`: `const leagueId = (body as any).leagueId ?? null;`
  - This extracts `leagueId` from the raw body after Zod validation, bypassing the `tournamentCreateSchema`.
- **Impact:** A malicious client could pass a non-UUID string as `leagueId`, causing a Supabase FK violation error (caught as 500) instead of a proper 400 validation error. Not a data corruption risk due to FK constraints, but exposes internal error details.
- **Fix:** Add `leagueId: z.string().uuid().optional()` to `tournamentCreateSchema` in `src/lib/validations/tournament.ts`.

#### F-08: `search-osm` route does not explicitly verify authentication
- **Severity:** 🟢 LOW
- **Evidence:**
  - `src/app/api/courses/search-osm/route.ts` — no `supabase.auth.getUser()` check. Relies solely on middleware redirect.
- **Impact:** The middleware redirects unauthenticated requests to `/login` with a 307, which is correct for browser navigation but returns an HTML redirect response for programmatic API calls instead of a JSON 401. Not exploitable since the RPC functions are `SECURITY DEFINER` and only return public course data.
- **Fix:** Add an explicit `getUser()` check at the top of the handler for consistency with other API routes.

---

### P4 — Data & Model Inconsistencies

#### F-09: `accepted_terms_at` not stored in queryable table
- **Severity:** 🟡 MEDIUM
- **Evidence:**
  - `src/app/(auth)/register/page.tsx:54` stores `accepted_terms_at` in `auth.users.raw_user_meta_data`
  - `supabase/migrations/0003_auth_profile_trigger.sql` — the `handle_new_user` trigger does NOT copy this field to `profiles`
  - The `profiles` table (migration 0001) has no `accepted_terms_at` column
- **Impact:** POPIA compliance requires proving when a user consented. The timestamp exists in Supabase auth metadata but cannot be queried via standard SQL against the `profiles` table. An admin cannot easily audit consent dates.
- **Fix:** Either:
  (a) Add `accepted_terms_at TIMESTAMPTZ` column to `profiles` and update the trigger, or
  (b) Copy it from `raw_user_meta_data` in the trigger: `COALESCE((NEW.raw_user_meta_data ->> 'accepted_terms_at')::timestamptz, now())`

#### F-10: Realtime leaderboard subscription is unfiltered
- **Severity:** 🟢 LOW
- **Evidence:**
  - `src/hooks/useRealtimeLeaderboard.ts:110-118` — subscribes to ALL `hole_scores` changes (`event: "*"`, `schema: "public"`, `table: "hole_scores"`) with no filter.
- **Impact:** Every score change in the entire database triggers a leaderboard re-fetch for every active tournament leaderboard page. In a multi-tournament scenario, this causes unnecessary network traffic and re-renders.
- **Fix:** Add a Supabase Realtime filter, though `hole_scores` doesn't have a direct `tournament_id` column. Alternatively, subscribe to `rounds` table changes filtered by `tournament_id` and only re-fetch when a relevant round is updated.

#### F-11: Account deletion relies on FK CASCADE but doesn't verify completeness
- **Severity:** 🟢 LOW
- **Evidence:**
  - `src/app/api/account/delete/route.ts:15-17` — uses `serviceClient.auth.admin.deleteUser(user.id)` with comment "cascades to all data via FK"
  - FK cascades in migration 0001 are `ON DELETE CASCADE` from `profiles.id` (which mirrors `auth.users.id`)
- **Impact:** Supabase's `deleteUser` deletes the auth user. The `profiles` FK cascade should remove all related data. However, the `activity_feed`, `chat_messages`, and `predictions` tables reference `user_id` → `profiles(id)` with CASCADE, so they should be cleaned up. This appears correct. The only risk is if Supabase's auth user deletion doesn't trigger the FK cascade on `profiles` — this depends on whether `profiles.id` has a trigger or FK back to `auth.users`. The schema shows `profiles.id UUID PRIMARY KEY` with no FK to `auth.users`, meaning the cascade may NOT automatically fire.
- **Uncertainty:** Cannot confirm without runtime testing whether Supabase `deleteUser` also deletes the corresponding `profiles` row. If it doesn't, orphaned data remains.
- **Fix:** Add an explicit `await supabase.from('profiles').delete().eq('id', user.id)` before or after the auth deletion to guarantee cleanup.

---

### P5 — Polish & Debt

#### F-12: OAuth callback route — misleading comment
- **Severity:** 🟢 LOW (cleanup debt)
- **Evidence:**
  - `src/app/auth/callback/route.ts:5-6`: Comment says "OAuth callback handler. Supabase redirects here after social login."
  - OAuth is deferred to roadmap.
  - The route itself IS needed — it handles Supabase email confirmation via `exchangeCodeForSession`.
- **Impact:** Misleading for developers. No functional impact.
- **Fix:** Update comment to: "Auth callback handler. Supabase redirects here after email confirmation. Also used for OAuth when enabled."

#### F-13: `/auth/callback` listed as public path in middleware
- **Severity:** 🟢 LOW (cleanup debt / needed)
- **Evidence:**
  - `src/middleware.ts:5`: `const publicPaths = ["/login", "/register", "/auth/callback", "/join"];`
- **Impact:** This path IS needed for email verification flows (Supabase sends users here after clicking the confirmation link). Not an OAuth remnant per se — it's required for the current email-only auth flow. But the naming may suggest OAuth.
- **Fix:** No change needed. The route is correctly public. Optionally rename to `/auth/confirm` to clarify intent, but this requires updating Supabase email templates.

#### F-14: PWA manifest has only one SVG icon — no PNG fallbacks
- **Severity:** 🟡 MEDIUM
- **Evidence:**
  - `public/manifest.json:12-18` — single `icon.svg` with `"sizes": "any"`
  - No PNG icons at 192x192 or 512x512
- **Impact:** PWA installability on Android requires at minimum 192x192 and 512x512 PNG icons. Chrome and Samsung Internet may refuse to show the "Add to Home Screen" prompt. iOS Safari requires `apple-touch-icon` (180x180 PNG).
- **Fix:** Generate PNG icons at 192x192, 384x384, 512x512 from the SVG and add them to `manifest.json`. Add `<link rel="apple-touch-icon" href="/icons/icon-180.png">` to the layout.

#### F-15: Privacy & Terms pages use dynamic "Effective Date"
- **Severity:** 🟢 LOW
- **Evidence:**
  - `src/app/privacy/page.tsx:18` and `src/app/terms/page.tsx:18`: `{new Date().toLocaleDateString("en-ZA")}`
- **Impact:** The "Effective Date" changes every day at render time. Legal documents should have a fixed effective date.
- **Fix:** Replace with a hardcoded date string, e.g., `"1 January 2025"`.

#### F-16: `not-found.tsx` says "Coming soon" instead of 404
- **Severity:** 🟢 LOW
- **Evidence:**
  - `src/app/not-found.tsx:11`: `<h1>Coming soon</h1>`
- **Impact:** A genuine 404 (e.g., deleted resource, typo in URL) shows "Coming soon" which is misleading.
- **Fix:** Change to "Page not found" with appropriate messaging, or use "Coming soon" only for known planned routes.

#### F-17: `next-pwa` is a devDependency
- **Severity:** 🟢 LOW
- **Evidence:**
  - `package.json` lists `next-pwa` under `devDependencies`
  - `next.config.js` uses `require("next-pwa")` at build time
- **Impact:** Most deployment platforms (Vercel, Netlify) install devDependencies during build, so this works. But some CI/CD configurations skip devDependencies, which would cause a build failure.
- **Fix:** Move `next-pwa` from `devDependencies` to `dependencies`.

---

## 4. OAuth Status Confirmation

### Current Implementation: ✅ Email-only

| Check | Result |
|-------|--------|
| Login page has social OAuth buttons? | ❌ No — email/password only |
| Register page has social OAuth buttons? | ❌ No — email/password only |
| OAuth provider config in env vars? | ❌ No — not in `.env.local.example` |
| OAuth-related packages in `package.json`? | ❌ No |
| `signInWithOAuth` calls anywhere in code? | ❌ No |
| OAuth callback route exists? | ⚠️ Yes — `src/app/auth/callback/route.ts` — but serves dual purpose (email confirmation + future OAuth). Comment is misleading (see F-12). |
| `/auth/callback` in public middleware paths? | ⚠️ Yes — needed for email confirmation flow (see F-13). |

### OAuth Remnants Requiring Cleanup

| Item | Location | Action |
|------|----------|--------|
| Misleading comment | `src/app/auth/callback/route.ts:5-6` | Update comment wording |

### Documentation Still Referencing OAuth as Current Scope

| Document | Location | What it says |
|----------|----------|-------------|
| `prd.md` | Technology Constraints | "Email/password + Google and Apple social login" |
| `technical-spec.md` | Technology Choices — Auth | "Email/password + Google + Apple OAuth built-in" |
| `implementation-plan.md` | Task 2.1 | "social OAuth buttons (Google, Apple)" |
| `tasks.md` | Task 2.1 deliverable | Mentions "social OAuth buttons" in description |

These documents should be updated to note OAuth is deferred to the roadmap.

---

## 5. Documentation Conflicts

| Conflict | Documents | Resolution |
|----------|-----------|------------|
| OAuth in scope vs. deferred | `prd.md`, `technical-spec.md`, `implementation-plan.md` vs. `handoff-m12-complete.md`, `future-roadmap.md` | **User confirmed:** OAuth is deferred to roadmap. Update PRD, tech spec, impl plan, and tasks to reflect this. |
| Task 2.1 deliverable wording | `tasks.md` describes OAuth buttons | Task was intentionally descoped. Mark as "descoped — see roadmap" in tasks.md. |

No other inter-document conflicts were found.

---

## 6. Execution Plan

Proposed fix order, grouped by priority. **No code changes should be made until this plan is reviewed and approved.**

### Phase 1 — Critical Fixes (do first)

| # | Finding | Effort | Risk |
|---|---------|--------|------|
| 1 | **F-01:** Fix PATCH → PUT in `sync.ts` | 1 line | High — offline sync is broken |
| 2 | **F-02:** Fix migration 0006 syntax | 5 lines | High — blocks deployment |

### Phase 2 — Security & Validation (do before launch)

| # | Finding | Effort | Risk |
|---|---------|--------|------|
| 3 | **F-06:** Add rate limiting to API routes | ~50 lines + dependency | Medium — abuse protection |
| 4 | **F-07:** Add `leagueId` to Zod schema | 1 line | Low — validation gap |
| 5 | **F-08:** Add auth check to `search-osm` | 5 lines | Low — consistency |
| 6 | **F-11:** Add explicit profile deletion in account delete | 2 lines | Medium — data cleanup |

### Phase 3 — Data & Compliance (do before launch)

| # | Finding | Effort | Risk |
|---|---------|--------|------|
| 7 | **F-09:** Store `accepted_terms_at` in profiles | Migration + trigger update | Medium — POPIA compliance |
| 8 | **F-14:** Add PNG icons for PWA installability | Asset generation + manifest update | Medium — PWA installability |
| 9 | **F-15:** Fix dynamic dates in legal pages | 2 lines | Low — legal accuracy |

### Phase 4 — Spec Alignment & Polish (post-launch OK)

| # | Finding | Effort | Risk |
|---|---------|--------|------|
| 10 | **F-03:** Document team formats as MVP stubs or remove from selector | 5 lines | Low — UX clarity |
| 11 | **F-04:** Add dashboard widgets | ~100 lines | Low — UX improvement |
| 12 | **F-05:** Rename search-osm route or add Overpass fallback | 10-50 lines | Low — UX clarity |
| 13 | **F-10:** Filter realtime subscription | 5-10 lines | Low — performance |
| 14 | **F-12:** Update auth callback comment | 1 line | None — cleanup |
| 15 | **F-16:** Fix not-found page messaging | 1 line | None — polish |
| 16 | **F-17:** Move `next-pwa` to dependencies | 1 line | None — build safety |

### Phase 5 — Documentation Updates

| # | Action | Files |
|---|--------|-------|
| 17 | Update OAuth references to "deferred" | `prd.md`, `technical-spec.md`, `implementation-plan.md`, `tasks.md` |
| 18 | Mark Task 2.1 OAuth portion as descoped | `tasks.md` |

---

## Appendix: Unverified Assumptions

The following items could not be confirmed without running the application:

1. **FK cascade on account deletion:** Whether Supabase's `deleteUser` triggers a cascade delete on the `profiles` table depends on internal Supabase behavior. The `profiles` table does not have an explicit FK to `auth.users` — it uses the same UUID as PK.
2. **Migration 0006 compatibility:** The `ADD CONSTRAINT IF NOT EXISTS` syntax validity depends on the exact PostgreSQL version running on the Supabase project.
3. **Profile join normalization:** Several pages use Supabase joins (e.g., `profile:profiles(...)`) which may return arrays or objects depending on the FK relationship type. The code normalizes with `Array.isArray()` in most places, but edge cases may exist.
4. **Overpass API reliability:** The `src/lib/maps/overpass.ts` module queries public Overpass servers which may rate-limit or timeout. This cannot be verified without live testing.
5. **PWA service worker registration:** Whether the `next-pwa` plugin correctly generates and registers a service worker depends on the build output, which was not tested.

---

*Report generated by code audit. No code changes were made during this review.*
