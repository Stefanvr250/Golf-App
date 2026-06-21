# Implementation Plan: GolfApp

## Milestones

| # | Milestone | Description | Estimated Effort |
|---|-----------|-------------|-----------------|
| M1 | Project Setup & Infrastructure | Next.js project, Supabase setup, PWA config, CI/CD | Medium |
| M2 | Authentication & User Profiles | Supabase Auth, profile management, admin roles | Medium |
| M3 | Course Data & Maps | OSM integration, community courses, MapLibre maps, GPS | Large |
| M4 | Scoring & Round Tracking | Scorecard UI, hole-by-hole input, round summary stats | Large |
| M5 | Handicap System | Simplified handicap calculation, history tracking | Small |
| M6 | Tournaments & Leagues | Tournament CRUD, formats, live leaderboard, leagues | Large |
| M7 | Social Features | Friends, chat, photos, activity feed | Medium |
| M8 | Predictions | Prediction games, scoring, results | Medium |
| M9 | Offline Support | IndexedDB, service worker, background sync | Medium |
| M10 | Data Export | CSV and PDF scorecard export | Small |
| M11 | Admin Panel | Course change request review, admin dashboard | Small |
| M12 | Polish & Deployment | UI polish, error handling, Vercel deployment, POPIA | Medium |

---

## Task Breakdown by Milestone

### M1: Project Setup & Infrastructure

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 1.1 Initialize Next.js project with App Router, TypeScript, TailwindCSS | Small | None | `npm run dev` starts successfully |
| 1.2 Install and configure shadcn/ui with base components (Button, Input, Card, Dialog, Toast, etc.) | Small | 1.1 | Components render correctly |
| 1.3 Create Supabase project, enable PostGIS extension, configure environment variables | Small | None | Supabase dashboard accessible, PostGIS queries work |
| 1.4 Set up Supabase client (`lib/supabase/client.ts`, `lib/supabase/server.ts`) and auth middleware | Small | 1.1, 1.3 | Client connects to Supabase from browser and server |
| 1.5 Configure PWA manifest, icons, and next-pwa/Workbox service worker | Small | 1.1 | App installable on mobile, service worker registered |
| 1.6 Set up root layout with navigation shell (mobile-first responsive sidebar/bottom nav) | Small | 1.1, 1.2 | Navigation works across all routes |
| 1.7 Create Supabase database migration: all tables, indexes, and CHECK constraints from tech spec | Medium | 1.3 | All 16 tables created with correct schema |
| 1.8 Create RLS policies for all tables per tech spec security section | Medium | 1.7 | RLS enforced; unauthorized access denied |
| 1.9 Set up Zod validation schemas for all API inputs | Small | 1.1 | Schemas importable and validate correctly |

### M2: Authentication & User Profiles

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 2.1 Build login page with email/password authentication (Google and Apple OAuth deferred to roadmap) | Small | 1.4 | User can log in with email/password |
| 2.2 Build registration page with email/password, display name, TOS/privacy consent checkbox | Small | 1.4 | User can register, profile row created automatically |
| 2.3 Create Supabase trigger: auto-create `profiles` row on `auth.users` insert | Small | 1.7 | Profile created on signup with default role='player' |
| 2.4 Build user profile page showing display name, avatar, handicap, round count | Small | 2.1 | Profile displays correct data |
| 2.5 Build profile edit form (display name, avatar upload to Supabase Storage) | Small | 2.4 | User can update profile, avatar stored in Storage |
| 2.6 Implement auth middleware to protect routes (redirect unauthenticated users to login) | Small | 1.4 | Protected routes redirect correctly |

### M3: Course Data & Maps

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 3.1 Implement `lib/maps/overpass.ts` — Overpass QL query builder for golf courses by location/name | Medium | 1.1 | Queries return golf course data from OSM |
| 3.2 Build `GET /api/courses/search-osm` API route — search OSM courses, cross-reference with DB | Medium | 3.1, 1.7 | Returns merged results (OSM + community), sorted by distance |
| 3.3 Build `POST /api/courses/import-osm` API route — import OSM course into Supabase | Medium | 3.1, 1.7 | Course + holes created in DB from OSM data |
| 3.4 Build course search page (`courses/page.tsx`) with text search and GPS-based nearby search | Medium | 3.2 | User can search courses by name or "near me" |
| 3.5 Build course detail page (`courses/[id]/page.tsx`) showing holes, tees, par, yardage table | Medium | 1.7 | All hole data displayed in a clear table/card layout |
| 3.6 Build "Add New Course" form (`courses/new/page.tsx`) for community course creation | Medium | 1.7 | User can add course with name, location, and hole-by-hole data |
| 3.7 Implement `lib/maps/tiles.ts` — configure OSM street tiles + MapTiler satellite tile sources | Small | 1.1 | Tile sources return valid map tiles |
| 3.8 Build `CourseMap.tsx` component — MapLibre GL JS map with course boundary and hole pins | Large | 3.7 | Map renders with course data, holes marked |
| 3.9 Implement `lib/maps/distance.ts` — Turf.js distance calculations (user→pin, shot distance) | Small | 1.1 | Accurate distance calculations (verified against known distances) |
| 3.10 Build `GPSTracker.tsx` component — live GPS position on map with distances to pin/hazards | Medium | 3.8, 3.9 | GPS dot moves on map, distances update live |
| 3.11 Build `YardageCircles.tsx` — concentric distance circles overlaid on map | Small | 3.8 | Circles render at 50/100/150/200yd from pin |
| 3.12 Build `ShotTracker.tsx` — mark shot start/end on map, calculate distance | Medium | 3.8, 3.9 | User can tap start/end, distance shown |
| 3.13 Implement `useGPS.ts` hook — wrap Geolocation API with error handling, permission flow | Small | 1.1 | Hook provides lat/lng, handles denied/unavailable |
| 3.14 Build course change request form (`courses/[id]/edit/page.tsx`) | Small | 3.5, 1.7 | User can submit change request, saved to DB as 'pending' |

### M4: Scoring & Round Tracking

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 4.1 Build "Start Round" page (`play/page.tsx`) — select course, tee set, start round | Medium | 3.5 | Round created in DB with status='in_progress' |
| 4.2 Build `HoleScoreInput.tsx` — form for strokes, putts, penalties, FIR, GIR, club, lie type | Medium | 1.2 | All fields functional with validation |
| 4.3 Build active scorecard page (`play/[roundId]/page.tsx`) — grid of all holes with scores | Medium | 4.2 | Scorecard shows all holes, navigable, scores editable |
| 4.4 Build hole detail page (`play/[roundId]/hole/[n]/page.tsx`) — GPS map + score input for single hole | Medium | 4.2, 3.10 | Map shows hole, GPS distance displayed, score entry works |
| 4.5 Implement round finalization logic — calculate totals, update round status to 'completed' | Small | 4.3 | Total strokes/putts calculated, status updated |
| 4.6 Build `RoundSummary.tsx` — stats display (total, vs par, putts, FIR%, GIR%, par 3/4/5 avg, up-and-down%, sand save%) | Medium | 4.5 | All stats calculated and displayed correctly |
| 4.7 Build round summary page (`play/[roundId]/summary/page.tsx`) | Small | 4.6 | Summary accessible after round completion |
| 4.8 Build round history page (`profile/history/page.tsx`) — list of past rounds with key stats | Small | 4.5 | Rounds listed in reverse chronological order |
| 4.9 Build detailed stats page (`profile/stats/page.tsx`) — aggregated career statistics | Medium | 4.8 | Aggregate stats across all rounds |

### M5: Handicap System

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 5.1 Implement `lib/scoring/handicap.ts` — simplified handicap calculation (best N of last 20 differentials) | Medium | 1.1 | Correct handicap for various test cases (3, 10, 20 rounds) |
| 5.2 Build `POST /api/handicap/recalculate` API route | Small | 5.1, 1.7 | Returns correct new handicap, stores in handicap_history |
| 5.3 Integrate handicap recalculation into round finalization flow | Small | 5.2, 4.5 | Handicap auto-updates after every completed round |
| 5.4 Build `useHandicap.ts` hook — display handicap on profile | Small | 5.2 | Handicap shown on profile, updates after rounds |
| 5.5 Build handicap history view — chart/list of handicap changes over time | Small | 5.3 | History visible, shows date + handicap per entry |

### M6: Tournaments & Leagues

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 6.1 Build "Create Tournament" page (`tournaments/new/page.tsx`) — name, course, format, date, holes | Medium | 3.5 | Tournament created in DB with invite_code |
| 6.2 Build `FormatSelector.tsx` — picker for all 10 tournament formats with descriptions | Small | 1.2 | All formats selectable, descriptions shown |
| 6.3 Implement `lib/scoring/formats.ts` — scoring logic for stroke play + stableford (priority formats) | Medium | 1.1 | Correct leaderboard sorting per format |
| 6.4 Implement scoring logic for remaining formats (best ball, scramble, match play, skins, etc.) | Large | 6.3 | All 10 formats produce correct leaderboard |
| 6.5 Build `POST /api/tournaments/invite` API route — generate invite URL | Small | 1.7 | Valid invite URL returned |
| 6.6 Build tournament join page (`(auth)/join/[code]/page.tsx`) — join via invite link | Small | 6.5, 2.1 | User joins tournament, participant row created |
| 6.7 Build tournament detail page (`tournaments/[id]/page.tsx`) — info, participants, status | Medium | 6.1 | Tournament info displayed, participant list shown |
| 6.8 Build `Leaderboard.tsx` — real-time leaderboard with Supabase Realtime | Large | 6.3 | Leaderboard updates within 3 seconds of score entry |
| 6.9 Implement `useRealtimeLeaderboard.ts` hook — subscribe to score changes | Medium | 6.8 | Real-time subscription works, reconnects on disconnect |
| 6.10 Build leaderboard page (`tournaments/[id]/leaderboard/page.tsx`) | Small | 6.8 | Full leaderboard rendered with rank, scores, stats |
| 6.11 Build `POST /api/tournaments/:id/finalize` API route — finalize tournament, calculate results | Medium | 6.3 | Tournament status set to 'completed', final leaderboard frozen |
| 6.12 Build tournament browse page (`tournaments/page.tsx`) — list upcoming/active/past tournaments | Small | 6.7 | Tournaments filterable by status |
| 6.13 Build `TournamentCard.tsx` — preview card for tournament lists | Small | 1.2 | Card shows name, course, date, format, participant count |
| 6.14 Build league creation page (`leagues/new/page.tsx`) | Small | 1.7 | League created, manager assigned |
| 6.15 Build league detail page (`leagues/[id]/page.tsx`) — season standings, events list | Medium | 6.14, 6.11 | Standings aggregate across league events |
| 6.16 Build league browse page (`leagues/page.tsx`) | Small | 6.14 | User sees their leagues |

### M7: Social Features

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 7.1 Build `FriendsList.tsx` — search users, send/accept/decline friend requests | Medium | 2.4 | Friend requests flow works end-to-end |
| 7.2 Build friends page (`friends/page.tsx`) — friends list + activity feed | Medium | 7.1 | Page shows friends and recent activity |
| 7.3 Build `ChatPanel.tsx` — real-time tournament chat with Supabase Realtime | Medium | 6.7 | Messages appear in real-time for all participants |
| 7.4 Build tournament chat page (`tournaments/[id]/chat/page.tsx`) | Small | 7.3 | Chat accessible from tournament detail |
| 7.5 Implement photo upload in chat (resize client-side, upload to Supabase Storage) | Medium | 7.3 | Photos display inline, max 5MB enforced |
| 7.6 Build `ActivityFeed.tsx` — display friends' shared rounds, tournament results | Medium | 7.1, 4.5 | Feed shows recent activity from friends |
| 7.7 Add "Share Round" button to round summary — creates activity_feed entry | Small | 4.7, 7.6 | Shared rounds appear in friends' feeds |

### M8: Predictions

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 8.1 Build `PredictionForm.tsx` — vote for winner, guess scores, predict best/worst | Medium | 6.7 | All prediction types submittable |
| 8.2 Build predictions page (`tournaments/[id]/predictions/page.tsx`) | Small | 8.1 | Predictions viewable/editable before tournament starts |
| 8.3 Implement prediction locking — prevent changes after tournament starts | Small | 8.1 | Submissions blocked once tournament status='in_progress' |
| 8.4 Implement prediction scoring logic in tournament finalize API | Medium | 8.1, 6.11 | Points calculated correctly per prediction type |
| 8.5 Build `PredictionResults.tsx` — results display with prediction leaderboard | Medium | 8.4 | Results shown after tournament completion, ranked by points |

### M9: Offline Support

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 9.1 Implement `lib/offline/db.ts` — Dexie.js schema mirroring rounds, hole_scores, shots, courses | Medium | 1.1 | IndexedDB tables created, CRUD operations work |
| 9.2 Implement `lib/offline/queue.ts` — queue offline writes (scores, rounds) | Medium | 9.1 | Actions queued when offline, persisted across app restarts |
| 9.3 Implement `lib/offline/sync.ts` — detect connectivity, batch sync queued actions | Medium | 9.2 | Queued scores synced to Supabase on reconnect |
| 9.4 Build `POST /api/rounds/sync` API route — idempotent offline round sync | Medium | 9.3, 1.7 | Duplicate syncs handled via offline_id |
| 9.5 Implement `useOfflineSync.ts` hook — connectivity status, trigger sync, show status | Small | 9.3 | UI shows online/offline status, sync count |
| 9.6 Integrate offline scoring into scorecard — write to IndexedDB first, sync later | Medium | 9.1, 4.3 | Scores saved locally when offline, synced when online |
| 9.7 Configure Workbox caching strategies — precache app shell, cache-first for map tiles | Medium | 1.5 | App loads offline, cached tiles display |

### M10: Data Export

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 10.1 Implement `lib/export/csv.ts` — generate CSV from round data using papaparse | Small | 4.5 | Valid CSV file with all hole scores and stats |
| 10.2 Implement `lib/export/pdf.ts` — generate PDF scorecard using jsPDF + jspdf-autotable | Medium | 4.5 | Professional-looking PDF with course info, scores, stats |
| 10.3 Build `GET /api/export/round/:id` API route — serve CSV or PDF | Small | 10.1, 10.2 | File downloads with correct content type |
| 10.4 Add export buttons to round summary page | Small | 10.3, 4.7 | User can download CSV or PDF from completed round |

### M11: Admin Panel

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 11.1 Build admin dashboard page (`admin/page.tsx`) — overview stats (users, courses, pending requests) | Small | 2.6 | Dashboard accessible only to admin role |
| 11.2 Build change request review page (`admin/change-requests/page.tsx`) — list, approve, reject with notes | Medium | 3.14 | Admin can approve (data updated) or reject (requester notified) |
| 11.3 Add admin role guard — middleware check for admin-only routes | Small | 2.6 | Non-admin users redirected away from admin routes |

### M12: Polish & Deployment

| Task | Effort | Dependencies | Acceptance Criteria |
|------|--------|-------------|---------------------|
| 12.1 Implement global error boundary and toast notification system | Small | 1.2 | Errors caught and displayed as user-friendly toasts |
| 12.2 Add loading skeletons and empty states to all list/detail pages | Small | All UI tasks | No blank screens during loading |
| 12.3 Mobile responsiveness audit — test all pages on small screens | Medium | All UI tasks | All pages usable on 375px-wide screens |
| 12.4 Create privacy policy and terms of service pages (POPIA compliance) | Small | None | Pages accessible, consent checkbox on registration |
| 12.5 Implement account deletion flow (POPIA right to deletion) | Small | 2.4 | User can delete account, all data cascaded |
| 12.6 Deploy to Vercel — configure environment variables, custom domain (optional) | Small | All tasks | App live on Vercel, all features working |
| 12.7 End-to-end smoke test — register, create course, play round, create tournament, score, view leaderboard | Medium | All tasks | Full user flow completes without errors |

---

## Parallelization Map

```
M1 (Setup) ──────────────────────────────────────────────────────────────
  │
  ├──▸ M2 (Auth) ───┐
  │                  ├──▸ M7 (Social) ──▸ M8 (Predictions)
  ├──▸ M3 (Courses)──┤
  │                  ├──▸ M4 (Scoring) ──▸ M5 (Handicap) ──▸ M10 (Export)
  │                  │         │
  │                  │         └──▸ M6 (Tournaments) ──▸ M8 (Predictions)
  │                  │
  │                  └──▸ M11 (Admin)
  │
  ├──▸ M9 (Offline) ── depends on M4 for integration
  │
  └──▸ M12 (Polish) ── after all other milestones
```

### What can run in parallel

| Parallel Group | Tasks |
|----------------|-------|
| **After M1** | M2 (Auth) ∥ M3.1-3.3 (OSM backend) ∥ M9.1-9.2 (offline DB) |
| **After M2 + M3** | M4 (Scoring) ∥ M7 (Social) ∥ M11 (Admin) |
| **After M4** | M5 (Handicap) ∥ M6 (Tournaments) ∥ M10 (Export) ∥ M9.3-9.6 (offline integration) |
| **After M6** | M8 (Predictions) |
| **After all** | M12 (Polish & Deploy) |

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OSM golf course coverage in South Africa is poor | Medium | High | Community course creation is prioritized in M3. App is usable without OSM data. |
| MapTiler free tier exhausted (100k requests/month) | Low | Medium | Cache tiles aggressively in Service Worker. Fall back to OSM street tiles. Monitor usage in MapTiler dashboard. |
| Supabase free project pauses after 1 week inactivity | Medium | High | Set up a cron job (e.g., GitHub Actions) to ping the Supabase project weekly. Alternatively, upgrade to Pro ($25/month) before production launch. |
| Offline sync conflicts (same round edited on multiple devices) | Low | Medium | Rounds tied to single user; offline_id ensures idempotent sync. Last-write-wins for hole scores. |
| GPS accuracy issues on golf course | Medium | Low | Show accuracy indicator in UI. Allow manual pin placement for inaccurate GPS. |
| Browser Geolocation permission denied by user | Medium | Medium | Graceful degradation: app works without GPS, distance features disabled with clear messaging. |
| Complex tournament formats (Ryder Cup, Scramble) hard to implement correctly | Medium | Medium | Launch with Stroke Play + Stableford first. Add other formats incrementally. |

---

## Validation Strategy

| Milestone | Validation |
|-----------|-----------|
| **M1** | `npm run build` succeeds. Supabase tables created. PWA installable on mobile. |
| **M2** | User can register and login with email/password, view/edit profile. Unauthorized routes redirect. |
| **M3** | Search finds courses near a SA golf course location. Course detail page shows holes. Map renders with GPS dot. |
| **M4** | Full 18-hole round can be played and completed. All stats calculate correctly. |
| **M5** | Handicap updates after round. History shows correct values. |
| **M6** | Tournament created, players invited via link, scores entered, leaderboard updates in real-time (<3s). |
| **M7** | Friend request flow works. Chat messages appear in real-time. Photos upload and display. |
| **M8** | Predictions submitted before tournament, locked during, results shown after with correct scoring. |
| **M9** | Airplane mode test: score 3 holes offline, reconnect, scores appear in Supabase. |
| **M10** | CSV opens in Excel with correct data. PDF looks professional with course branding. |
| **M11** | Admin can approve change request → course data updates. Non-admin cannot access admin pages. |
| **M12** | Full smoke test on Vercel deployment on a mobile device over cellular connection. |
