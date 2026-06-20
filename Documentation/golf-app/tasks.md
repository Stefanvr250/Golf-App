# Task List: GolfApp

Each task is tagged `[P]` (parallel-safe, no blockers) or `[S]` (sequential, has dependencies).
PRD references are to user stories (US#) and acceptance criteria (AC) from `prd.md`.

---

## M1: Project Setup & Infrastructure

- [x] **Task 1.1** `[P]` Initialize Next.js 14+ project with App Router, TypeScript, TailwindCSS, and ESLint. Create `src/app/layout.tsx` with HTML metadata and viewport config for mobile.
  - **PRD**: Foundation for all features
  - **Deliverable**: Working Next.js project, `npm run dev` starts at localhost:3000

- [x] **Task 1.2** `[S→1.1]` Install shadcn/ui CLI, initialize with default theme, add base components: Button, Input, Card, Dialog, Toast, Select, Tabs, Badge, Avatar, Dropdown Menu, Sheet (mobile nav).
  - **PRD**: Foundation for all UI
  - **Deliverable**: All components importable from `@/components/ui/`

- [x] **Task 1.3** `[P]` Create Supabase project. Enable PostGIS extension (`CREATE EXTENSION postgis`). Enable `pg_trgm` extension for fuzzy search. Store `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
  - **PRD**: Foundation for all data
  - **Deliverable**: Supabase project accessible, extensions enabled

- [x] **Task 1.4** `[S→1.1,1.3]` Create `src/lib/supabase/client.ts` (browser client using `createBrowserClient` from `@supabase/ssr`), `src/lib/supabase/server.ts` (server client using `createServerClient`), and `src/middleware.ts` (auth session refresh middleware).
  - **PRD**: Foundation for auth and data access
  - **Deliverable**: Supabase clients usable in components and API routes

- [x] **Task 1.5** `[S→1.1]` Configure PWA: create `public/manifest.json` with app name "GolfApp", theme color, icons (192px, 512px). Install and configure `next-pwa` in `next.config.js` with Workbox.
  - **PRD**: AC — PWA installable on mobile
  - **Deliverable**: App installable on mobile, service worker registered

- [x] **Task 1.6** `[S→1.1,1.2]` Create root layout shell with mobile-first responsive navigation: bottom tab bar on mobile (Dashboard, Play, Courses, Tournaments, Profile), sidebar on desktop. Include online/offline status indicator.
  - **PRD**: Foundation for all navigation
  - **Deliverable**: Navigation renders on all screen sizes, routes navigable

- [x] **Task 1.7** `[S→1.3]` Create Supabase SQL migration with all 16 tables from the technical spec: `profiles`, `friendships`, `courses`, `holes`, `tee_sets`, `hole_tees`, `hazards`, `course_change_requests`, `rounds`, `hole_scores`, `shots`, `handicap_history`, `tournaments`, `tournament_participants`, `leagues`, `league_members`, `league_events`, `predictions`, `chat_messages`, `activity_feed`. Include all indexes and CHECK constraints.
  - **PRD**: Foundation for all data
  - **Deliverable**: All tables created in Supabase with correct schema

- [x] **Task 1.8** `[S→1.7]` Create RLS policies for all tables: users manage own data, tournament participants read tournament data, admins manage courses, authenticated users insert courses, chat visible to participants. Per the security section of the tech spec.
  - **PRD**: Security requirement
  - **Deliverable**: Unauthorized operations rejected, authorized operations succeed

- [x] **Task 1.9** `[S→1.1]` Create Zod validation schemas in `src/lib/validations/` for: course creation, hole score input, round creation, tournament creation, prediction submission, chat message, profile update, change request. Export from barrel file.
  - **PRD**: AC — Input validation
  - **Deliverable**: All schemas validate correctly with test cases

---

## M2: Authentication & User Profiles

- [x] **Task 2.1** `[S→1.4]` Build login page at `src/app/(auth)/login/page.tsx` with email/password form and Google + Apple OAuth buttons using Supabase Auth. Redirect to dashboard on success.
  - **PRD**: US#8 (handicap requires auth), AC — Authentication
  - **Deliverable**: User can log in with email, Google, and Apple

- [x] **Task 2.2** `[S→1.4]` Build registration page at `src/app/(auth)/register/page.tsx` with email, password, display name, and TOS/privacy consent checkbox (required). Use Supabase `signUp()`.
  - **PRD**: POPIA — Consent at registration
  - **Deliverable**: User can register, consent recorded

- [x] **Task 2.3** `[S→1.7]` Create Supabase database trigger function: on `auth.users` INSERT, create a `profiles` row with `id`, `email`, `display_name` (from metadata), and `role='player'`.
  - **PRD**: Auto-profile creation
  - **Deliverable**: Profile row exists for every registered user

- [x] **Task 2.4** `[S→2.1]` Build user profile page at `src/app/profile/page.tsx` showing display name, avatar, handicap index, total rounds played, member since date.
  - **PRD**: US#9 — Handicap display
  - **Deliverable**: Profile page renders correct user data

- [x] **Task 2.5** `[S→2.4]` Build profile edit form — update display name, upload avatar (resize to 256px client-side, upload to Supabase Storage bucket `avatars`).
  - **PRD**: Profile management
  - **Deliverable**: Display name and avatar update persisted

- [x] **Task 2.6** `[S→1.4]` Implement auth middleware in `src/middleware.ts` — redirect unauthenticated users to `/login` for protected routes. Allow public access to login, register, and invite join pages.
  - **PRD**: Security
  - **Deliverable**: Protected routes redirect, public routes accessible

---

## M3: Course Data & Maps

- [x] **Task 3.1** `[S→1.1]` Implement `src/lib/maps/overpass.ts` — Overpass QL query builder with two queries: (a) golf courses within radius of lat/lng, (b) golf course by name. Parse response into `{ osmId, name, lat, lng, holes }` array. Add 30-day cache check against Supabase `courses` table.
  - **PRD**: US#1 — Course search
  - **Deliverable**: Function returns parsed golf course data from Overpass API

- [x] **Task 3.2** `[S→3.1,1.7]` Build `GET /api/courses/search-osm` route handler at `src/app/api/courses/search-osm/route.ts`. Accept query params `lat`, `lng`, `radius`, `q`. Merge OSM results with Supabase community courses. Return sorted by distance with `inDatabase` flag. Validate with Zod.
  - **PRD**: US#1, AC — Course search
  - **Deliverable**: API returns merged course results

- [x] **Task 3.3** `[S→3.1,1.7]` Build `POST /api/courses/import-osm` route handler at `src/app/api/courses/import-osm/route.ts`. Fetch full course details from Overpass (including hole nodes if available), create `courses` + `holes` rows in Supabase. Validate with Zod.
  - **PRD**: US#1 — Course import
  - **Deliverable**: OSM course imported with hole data into DB

- [x] **Task 3.4** `[S→3.2]` Build course search page at `src/app/courses/page.tsx` with search input (text search), "Near Me" button (GPS-based), and results list using `CourseCard` components. Show "Add Course" button if course not found.
  - **PRD**: US#1, AC — Course search by name or nearby
  - **Deliverable**: User can find courses by name and location

- [x] **Task 3.5** `[S→1.7]` Build course detail page at `src/app/courses/[id]/page.tsx` — course name, address, holes table (hole#, par, yardage per tee set, handicap index), tee set selector, and "Play This Course" button.
  - **PRD**: US#1, AC — All holes displayed with par, yardage, handicap index
  - **Deliverable**: Course detail page with complete hole data

- [x] **Task 3.6** `[S→1.7,1.9]` Build "Add New Course" form at `src/app/courses/new/page.tsx` — course name, address, GPS location (auto-detect or manual), num_holes selector. Dynamic hole form: for each hole enter par, handicap index. Add tee set with per-hole yardage. Validate with Zod, insert into Supabase.
  - **PRD**: US#17, AC — Community course creation
  - **Deliverable**: User can add a full course with hole-by-hole data

- [x] **Task 3.7** `[S→1.1]` Implement `src/lib/maps/tiles.ts` — export tile source configs: OSM raster tiles URL template, MapTiler satellite URL template (with API key from env), and attribution strings.
  - **PRD**: Tech constraint — Map tiles
  - **Deliverable**: Tile configs usable by MapLibre

- [x] **Task 3.8** `[S→3.7]` Build `src/components/maps/CourseMap.tsx` — MapLibre GL JS map component (dynamic import, no SSR). Render course center point, hole pin markers (numbered), satellite/street toggle button. Accept `holes` prop with coordinates.
  - **PRD**: US#4, AC — Satellite map overlay
  - **Deliverable**: Interactive map with course data and layer toggle

- [x] **Task 3.9** `[S→1.1]` Implement `src/lib/maps/distance.ts` — export functions: `distanceToPoint(userLat, userLng, targetLat, targetLng)` returning yards, `bearingToPoint()` returning compass direction. Use `@turf/distance` and `@turf/helpers`.
  - **PRD**: US#2 — GPS distances
  - **Deliverable**: Distance function accurate to within 1 yard at golf-course scale

- [x] **Task 3.10** `[S→3.8,3.9,3.13]` Build `src/components/maps/GPSTracker.tsx` — display user's GPS position as a pulsing dot on the CourseMap. Show distance panel: distance to pin (front/center/back of green), distance to nearest hazards. Update on GPS position change (throttled to 1/s).
  - **PRD**: US#2, AC — GPS distance to pin and hazards
  - **Deliverable**: Live distance display updating as user moves

- [x] **Task 3.11** `[S→3.8]` Build `src/components/maps/YardageCircles.tsx` — render concentric circles at 50, 100, 150, 200, 250 yards from the pin using `@turf/circle`. Style as semi-transparent rings with labels.
  - **PRD**: US#4, AC — Yardage circles on map
  - **Deliverable**: Yardage circles visible on map

- [x] **Task 3.12** `[S→3.8,3.9]` Build `src/components/maps/ShotTracker.tsx` — "Start Shot" button records GPS position, "End Shot" button records end position, calculates distance in yards. Save to `shots` table with club selector and lie type. Show shot path as line on map.
  - **PRD**: US#3, AC — Shot distance measurement
  - **Deliverable**: User can track individual shot distances

- [x] **Task 3.13** `[S→1.1]` Implement `src/hooks/useGPS.ts` — custom hook wrapping `navigator.geolocation.watchPosition()` with `{ enableHighAccuracy: true, maximumAge: 5000 }`. Return `{ lat, lng, accuracy, error, isTracking, startTracking, stopTracking }`. Handle permission denied and unavailable cases.
  - **PRD**: Tech constraint — Browser Geolocation API
  - **Deliverable**: Hook provides GPS data with error handling

- [x] **Task 3.14** `[S→3.5,1.7]` Build course change request form at `src/app/courses/[id]/edit/page.tsx` — form to describe changes, select affected fields. Submit creates `course_change_requests` row with status='pending'. Show toast confirmation.
  - **PRD**: US#18, AC — Change request queued for admin
  - **Deliverable**: Change request submitted and stored in DB

---

## M4: Scoring & Round Tracking

- [ ] **Task 4.1** `[S→3.5]` Build "Start Round" page at `src/app/play/page.tsx` — select course (from recent or search), select tee set, optional tournament link. Create `rounds` row with `status='in_progress'`. Redirect to scorecard.
  - **PRD**: US#5 — Record scores
  - **Deliverable**: Round created, user redirected to scorecard

- [ ] **Task 4.2** `[S→1.2,1.9]` Build `src/components/scoring/HoleScoreInput.tsx` — form component for single hole: strokes (number stepper), putts (number stepper), penalties (number stepper), fairway hit (yes/no/na toggle), GIR (yes/no toggle), club selector (dropdown with common clubs), lie type (dropdown). Validate with Zod. Auto-calculate GIR based on strokes/putts/par if not manually set.
  - **PRD**: US#5, AC — All scoring fields
  - **Deliverable**: Complete hole score input with all fields

- [ ] **Task 4.3** `[S→4.2]` Build active scorecard page at `src/app/play/[roundId]/page.tsx` — grid showing all 18 (or 9) holes with: hole#, par, yardage, score, +/- par indicator. Tappable rows navigate to hole detail. Show running total. "Finish Round" button.
  - **PRD**: US#5 — Scorecard
  - **Deliverable**: Full scorecard with navigation to individual holes

- [ ] **Task 4.4** `[S→4.2,3.10]` Build hole detail page at `src/app/play/[roundId]/hole/[n]/page.tsx` — CourseMap centered on current hole with GPSTracker, YardageCircles, and ShotTracker. HoleScoreInput below the map. Previous/next hole navigation.
  - **PRD**: US#2, US#3, US#5 — GPS + scoring per hole
  - **Deliverable**: Complete hole play experience with map and scoring

- [ ] **Task 4.5** `[S→4.3]` Implement round finalization logic — on "Finish Round" button: calculate `total_strokes`, `total_putts`, update `rounds.status` to `completed`, update `rounds.total_strokes` and `rounds.total_putts`. Trigger handicap recalculation (M5).
  - **PRD**: US#5, AC — Round completion
  - **Deliverable**: Round marked complete with calculated totals

- [ ] **Task 4.6** `[S→4.5]` Build `src/components/scoring/RoundSummary.tsx` — calculate and display: total score, score vs par (+/-), total putts, putts per hole average, FIR % (fairways hit / par 4+5 holes), GIR %, scoring average by par 3/4/5, up-and-down %, sand save %.
  - **PRD**: US#6, AC — Round statistics
  - **Deliverable**: All stats calculated correctly

- [ ] **Task 4.7** `[S→4.6]` Build round summary page at `src/app/play/[roundId]/summary/page.tsx` — display RoundSummary component, course name, date, tee set. Include "Share Round" and "Export" buttons.
  - **PRD**: US#6
  - **Deliverable**: Summary page with all stats and actions

- [ ] **Task 4.8** `[S→4.5]` Build round history page at `src/app/profile/history/page.tsx` — list of completed rounds sorted by date descending. Each row shows: date, course name, score, vs par, putts. Tappable to view full summary.
  - **PRD**: US#6
  - **Deliverable**: Round history list with key stats

- [ ] **Task 4.9** `[S→4.8]` Build stats page at `src/app/profile/stats/page.tsx` — aggregate career stats: scoring average, best round, average putts/round, FIR %, GIR %, par 3/4/5 averages, rounds played, up-and-down %, sand save %. Filter by time period (last 5/10/20 rounds, all time).
  - **PRD**: US#6
  - **Deliverable**: Comprehensive stats dashboard

---

## M5: Handicap System

- [ ] **Task 5.1** `[S→1.1]` Implement `src/lib/scoring/handicap.ts` — export `calculateHandicap(rounds: RoundDifferential[]): number | null`. Logic: if <3 rounds return null. Calculate differential per round: `(score - par) × (113 / slope)` if slope available, else `score - par`. Take best N differentials (N based on total rounds per simplified WHS table). Return average × 0.96, rounded to 1 decimal.
  - **PRD**: US#8, AC — Simplified handicap
  - **Deliverable**: Function returns correct handicap for test cases

- [ ] **Task 5.2** `[S→5.1,1.7]` Build `POST /api/handicap/recalculate` route handler at `src/app/api/handicap/recalculate/route.ts`. Fetch last 20 completed rounds for user, call `calculateHandicap()`, update `profiles.handicap_index`, insert row into `handicap_history`. Return previous/new handicap.
  - **PRD**: US#8, AC — Auto-recalculate
  - **Deliverable**: API recalculates and persists handicap

- [ ] **Task 5.3** `[S→5.2,4.5]` Integrate handicap recalculation into round finalization — after `rounds.status` set to `completed`, call `/api/handicap/recalculate`. Show toast with handicap change.
  - **PRD**: US#8, AC — Updates after each round
  - **Deliverable**: Handicap recalculated on every round completion

- [ ] **Task 5.4** `[S→5.2]` Implement `src/hooks/useHandicap.ts` — fetch current handicap and last change from Supabase. Return `{ handicap, previousHandicap, lastUpdated }`.
  - **PRD**: US#8
  - **Deliverable**: Hook provides handicap data

- [ ] **Task 5.5** `[S→5.3]` Build handicap history view on profile page — expandable section showing list/chart of handicap changes over time (date, handicap value, round that triggered it).
  - **PRD**: US#9, AC — Handicap history
  - **Deliverable**: History visible with date and value per entry

---

## M6: Tournaments & Leagues

- [ ] **Task 6.1** `[S→3.5,1.9]` Build "Create Tournament" page at `src/app/tournaments/new/page.tsx` — form with: name, course selector (search), format selector, date picker, num_holes (9/18), max_participants (default 20). Create `tournaments` row, auto-join organizer as participant.
  - **PRD**: US#10, AC — Tournament creation
  - **Deliverable**: Tournament created with invite code

- [ ] **Task 6.2** `[S→1.2]` Build `src/components/tournament/FormatSelector.tsx` — radio/card selector for all 10 formats with name and short description. Formats: Stroke Play, Stableford, Best Ball, Scramble, Match Play, Ryder Cup, Alternate Shot, Skins, Shamble, 2-Person Scramble.
  - **PRD**: US#10, AC — Format selection
  - **Deliverable**: All formats selectable with descriptions

- [ ] **Task 6.3** `[S→1.1]` Implement `src/lib/scoring/formats.ts` — export `calculateLeaderboard(format, participants, scores)` for Stroke Play (lowest total wins) and Stableford (highest points wins, points: bogey=1, par=2, birdie=3, eagle=4, albatross=5). Return sorted leaderboard array.
  - **PRD**: US#11, AC — Leaderboard
  - **Deliverable**: Correct leaderboard for stroke play and stableford

- [ ] **Task 6.4** `[S→6.3]` Extend `formats.ts` with scoring logic for: Best Ball (lowest score per hole across team), Scramble (team plays from best shot), Match Play (holes won/lost), Skins (hole-by-hole winner takes skin), Alternate Shot, Shamble, 2-Person Scramble, Ryder Cup (point-based match play).
  - **PRD**: US#10, AC — All 10 formats
  - **Deliverable**: All format leaderboards calculate correctly

- [ ] **Task 6.5** `[S→1.7]` Build `POST /api/tournaments/invite` route handler at `src/app/api/tournaments/invite/route.ts` — return invite URL with tournament's `invite_code`. Validate that requesting user is the organizer.
  - **PRD**: US#13, AC — Invite link
  - **Deliverable**: Invite URL generated

- [ ] **Task 6.6** `[S→6.5,2.1]` Build tournament join page at `src/app/(auth)/join/[code]/page.tsx` — look up tournament by invite code, show tournament info, "Join" button. If not authenticated, redirect to register with return URL. Check participant count < max_participants. Create `tournament_participants` row.
  - **PRD**: US#13, AC — Join via invite link
  - **Deliverable**: User can join tournament, 20-player limit enforced

- [ ] **Task 6.7** `[S→6.1]` Build tournament detail page at `src/app/tournaments/[id]/page.tsx` — show name, course, format, date, status, participant list with handicaps. Show "Start Round" button (links to play page with tournament_id). Show "Invite" button for organizer. Show "Leaderboard" and "Chat" links.
  - **PRD**: US#10, US#11
  - **Deliverable**: Tournament detail with all info and actions

- [ ] **Task 6.8** `[S→6.3]` Build `src/components/tournament/Leaderboard.tsx` — table component showing rank, player name, thru (holes completed), score, vs par. Subscribe to Supabase Realtime for live updates. Color-code scores (red for over par, green for under). Show "Last updated" timestamp.
  - **PRD**: US#11, AC — Real-time leaderboard within 3 seconds
  - **Deliverable**: Leaderboard updates live as scores are entered

- [ ] **Task 6.9** `[S→6.8]` Implement `src/hooks/useRealtimeLeaderboard.ts` — subscribe to `hole_scores` table changes filtered by tournament round IDs. On change, re-fetch affected player's scores and re-sort leaderboard. Handle reconnection.
  - **PRD**: US#11, AC — Real-time updates
  - **Deliverable**: Hook provides live leaderboard data

- [ ] **Task 6.10** `[S→6.8]` Build leaderboard page at `src/app/tournaments/[id]/leaderboard/page.tsx` — full-page Leaderboard component with format-appropriate columns. Show individual scorecards expandable per player.
  - **PRD**: US#11
  - **Deliverable**: Full leaderboard page

- [ ] **Task 6.11** `[S→6.3]` Build `POST /api/tournaments/:id/finalize` route handler at `src/app/api/tournaments/[id]/finalize/route.ts` — set tournament status to 'completed', calculate final leaderboard, calculate prediction results (M8), create activity_feed entries. Only organizer can finalize.
  - **PRD**: AC — Tournament completion
  - **Deliverable**: Tournament finalized with frozen results

- [ ] **Task 6.12** `[S→6.7]` Build tournament browse page at `src/app/tournaments/page.tsx` — tabs for "My Tournaments" and "Upcoming". List TournamentCards sorted by date. Filter by status (upcoming/in_progress/completed).
  - **PRD**: US#10
  - **Deliverable**: Tournament list with filtering

- [ ] **Task 6.13** `[S→1.2]` Build `src/components/tournament/TournamentCard.tsx` — card showing tournament name, course, date, format badge, participant count (e.g., "8/20"), status badge. Tappable to navigate to detail.
  - **PRD**: UI component
  - **Deliverable**: Reusable tournament card component

- [ ] **Task 6.14** `[S→1.7]` Build league creation page at `src/app/leagues/new/page.tsx` — name, description. Create `leagues` row, manager is creator.
  - **PRD**: US#12
  - **Deliverable**: League created

- [ ] **Task 6.15** `[S→6.14,6.11]` Build league detail page at `src/app/leagues/[id]/page.tsx` — season standings (aggregate scores across league events), events list (linked tournaments), member list. "Create Event" button creates tournament linked to league.
  - **PRD**: US#12, AC — Season standings
  - **Deliverable**: League standings aggregate correctly

- [ ] **Task 6.16** `[S→6.14]` Build league browse page at `src/app/leagues/page.tsx` — list of user's leagues.
  - **PRD**: US#12
  - **Deliverable**: League list page

---

## M7: Social Features

- [ ] **Task 7.1** `[S→2.4]` Build `src/components/social/FriendsList.tsx` — search users by display name, send friend request, accept/decline incoming requests. Show friends list with avatar, name, handicap.
  - **PRD**: US#16, AC — Friend requests
  - **Deliverable**: Full friend request flow

- [ ] **Task 7.2** `[S→7.1]` Build friends page at `src/app/friends/page.tsx` — tabs for "Friends" (FriendsList) and "Activity" (ActivityFeed).
  - **PRD**: US#16
  - **Deliverable**: Friends page with both tabs

- [ ] **Task 7.3** `[S→6.7]` Build `src/components/social/ChatPanel.tsx` — message input, message list (scrollable, newest at bottom), photo upload button. Subscribe to Supabase Realtime on `chat_messages` table filtered by tournament_id. Show sender name, avatar, timestamp.
  - **PRD**: US#15, AC — Tournament chat
  - **Deliverable**: Real-time chat working

- [ ] **Task 7.4** `[S→7.3]` Build tournament chat page at `src/app/tournaments/[id]/chat/page.tsx` — full-page ChatPanel. Link from tournament detail page.
  - **PRD**: US#15
  - **Deliverable**: Chat accessible from tournament

- [ ] **Task 7.5** `[S→7.3]` Implement photo upload in chat — client-side resize (max 1920px, JPEG 80%), upload to Supabase Storage bucket `chat-photos`, store URL in `chat_messages.photo_url`. Display inline in chat. Validate MIME type and max 5MB.
  - **PRD**: US#15, AC — Photo sharing
  - **Deliverable**: Photos upload and display in chat

- [ ] **Task 7.6** `[S→7.1,4.5]` Build `src/components/social/ActivityFeed.tsx` — fetch `activity_feed` entries from friends (via friendships join). Show: round shared (course, score, date), tournament results, handicap changes. Paginated.
  - **PRD**: US#16, AC — Activity feed
  - **Deliverable**: Feed shows friends' activity

- [ ] **Task 7.7** `[S→4.7,7.6]` Add "Share Round" button to round summary page — create `activity_feed` row with type='round_shared', set `rounds.is_shared = true`. Show confirmation toast.
  - **PRD**: US#16, AC — Share completed rounds
  - **Deliverable**: Shared rounds appear in friends' feeds

---

## M8: Predictions

- [ ] **Task 8.1** `[S→6.7]` Build `src/components/predictions/PredictionForm.tsx` — form sections: (1) Vote for winner (dropdown of participants), (2) Guess score for specific player (player selector + score input), (3) Predict best performer, (4) Predict worst performer. Save to `predictions` table.
  - **PRD**: US#14, AC — Make predictions
  - **Deliverable**: All prediction types submittable

- [ ] **Task 8.2** `[S→8.1]` Build predictions page at `src/app/tournaments/[id]/predictions/page.tsx` — show PredictionForm if tournament status='upcoming'. Show PredictionResults if status='completed'. Show "Predictions locked" message if status='in_progress'.
  - **PRD**: US#14, AC — Predictions locked after start
  - **Deliverable**: Correct view based on tournament status

- [ ] **Task 8.3** `[S→8.1]` Implement prediction locking — in Supabase RLS or API validation: prevent INSERT/UPDATE on `predictions` where tournament status != 'upcoming'.
  - **PRD**: AC — Locked after tournament starts
  - **Deliverable**: Prediction changes rejected after tournament starts

- [ ] **Task 8.4** `[S→8.1,6.11]` Implement prediction scoring in tournament finalize API — compare predictions against actual results. Points: correct winner = 5pts, score guess within 1 = 3pts / exact = 5pts, correct best/worst performer = 3pts. Update `predictions.actual_value` and `predictions.points_earned`.
  - **PRD**: US#14, AC — Prediction results
  - **Deliverable**: Points calculated correctly

- [ ] **Task 8.5** `[S→8.4]` Build `src/components/predictions/PredictionResults.tsx` — show each prediction with predicted vs actual value, points earned. Show prediction leaderboard (total points per player, sorted descending).
  - **PRD**: US#14, AC — Prediction leaderboard
  - **Deliverable**: Results and leaderboard displayed

---

## M9: Offline Support

- [ ] **Task 9.1** `[S→1.1]` Implement `src/lib/offline/db.ts` — Dexie.js database with tables mirroring: `rounds` (with offline_id), `hole_scores`, `shots`, `courses` (for offline course data). Define versioned schema.
  - **PRD**: US#7, AC — Offline scoring
  - **Deliverable**: IndexedDB tables created, CRUD works

- [ ] **Task 9.2** `[S→9.1]` Implement `src/lib/offline/queue.ts` — action queue that stores pending writes (create round, insert score, update score) with type, payload, and timestamp. Persist in IndexedDB.
  - **PRD**: US#7
  - **Deliverable**: Actions queued and persisted

- [ ] **Task 9.3** `[S→9.2]` Implement `src/lib/offline/sync.ts` — on connectivity restored: process queue in order, call Supabase for each action, remove from queue on success, retry with backoff on failure. Use `navigator.onLine` and `online`/`offline` events.
  - **PRD**: US#7, AC — Sync on reconnect
  - **Deliverable**: Queued actions sync to Supabase

- [ ] **Task 9.4** `[S→9.3,1.7]` Build `POST /api/rounds/sync` route handler at `src/app/api/rounds/sync/route.ts` — accept array of offline rounds with scores. Use `offline_id` for idempotency (skip if round with same offline_id exists). Return mapping of offline_id → server_id.
  - **PRD**: US#7, AC — Idempotent sync
  - **Deliverable**: Duplicate syncs handled correctly

- [ ] **Task 9.5** `[S→9.3]` Implement `src/hooks/useOfflineSync.ts` — return `{ isOnline, pendingCount, isSyncing, lastSyncTime, triggerSync }`. Show sync status in navigation bar.
  - **PRD**: US#7
  - **Deliverable**: UI shows online/offline status and pending sync count

- [ ] **Task 9.6** `[S→9.1,4.3]` Integrate offline scoring into scorecard — when writing hole scores, write to IndexedDB first, then to Supabase if online. When offline, queue the Supabase write. On scorecard load, merge IndexedDB + Supabase data.
  - **PRD**: US#7, AC — Scores saved locally when offline
  - **Deliverable**: Scoring works offline, syncs when online

- [ ] **Task 9.7** `[S→1.5]` Configure Workbox caching strategies in service worker — precache app shell (HTML, JS, CSS), cache-first for map tiles (7-day expiry), stale-while-revalidate for API responses, network-first for auth.
  - **PRD**: AC — Offline functionality
  - **Deliverable**: App loads offline, cached tiles display

---

## M10: Data Export

- [ ] **Task 10.1** `[S→4.5]` Implement `src/lib/export/csv.ts` — export `generateRoundCSV(round, scores, course)` returning CSV string. Columns: Hole, Par, Yardage, Strokes, Putts, Penalties, FIR, GIR, Score vs Par. Include header row with course name, date, tee set, total score. Use papaparse `unparse()`.
  - **PRD**: US#20, AC — CSV export
  - **Deliverable**: Valid CSV with all scoring data

- [ ] **Task 10.2** `[S→4.5]` Implement `src/lib/export/pdf.ts` — export `generateRoundPDF(round, scores, course)` returning PDF blob. Include: course name, date, player name, tee set, scorecard table (holes 1-9 + out, 10-18 + in, total), stats summary section. Use jsPDF + jspdf-autotable.
  - **PRD**: US#20, AC — PDF export
  - **Deliverable**: Professional PDF scorecard

- [ ] **Task 10.3** `[S→10.1,10.2]` Build `GET /api/export/round/[id]` route handler at `src/app/api/export/round/[id]/route.ts` — accept `format` query param ('csv' or 'pdf'). Fetch round data, call appropriate generator, return file with correct Content-Type header.
  - **PRD**: US#20
  - **Deliverable**: File downloads with correct format

- [ ] **Task 10.4** `[S→10.3,4.7]` Add export buttons to round summary page — "Download CSV" and "Download PDF" buttons that trigger file download via the export API.
  - **PRD**: US#20
  - **Deliverable**: User can download both formats

---

## M11: Admin Panel

- [ ] **Task 11.1** `[S→2.6]` Build admin dashboard at `src/app/admin/page.tsx` — show stats: total users, total courses, total rounds played, pending change requests count. Only accessible to `role='admin'`.
  - **PRD**: US#19 — Admin management
  - **Deliverable**: Dashboard with stats, admin-only access

- [ ] **Task 11.2** `[S→3.14]` Build change request review page at `src/app/admin/change-requests/page.tsx` — list pending requests with: requester name, course name, description, proposed changes (rendered from JSONB). "Approve" button applies changes to course/holes. "Reject" button with reason text input. Update status and `reviewed_at`.
  - **PRD**: US#19, AC — Admin approve/reject
  - **Deliverable**: Admin can review, approve, or reject requests

- [ ] **Task 11.3** `[S→2.6]` Implement admin route guard — in middleware, check `profiles.role = 'admin'` for routes under `/admin/*`. Redirect non-admins to dashboard with error toast.
  - **PRD**: Security — Admin-only access
  - **Deliverable**: Non-admins cannot access admin pages

---

## M12: Polish & Deployment

- [ ] **Task 12.1** `[S→1.2]` Implement global error boundary (`src/app/error.tsx` and `src/app/global-error.tsx`) and toast notification system using shadcn/ui Toast. All API errors display user-friendly messages.
  - **PRD**: Error handling strategy
  - **Deliverable**: Errors caught and displayed gracefully

- [ ] **Task 12.2** `[P]` Add loading skeletons (`loading.tsx` files) and empty states to all list pages: courses, tournaments, leagues, friends, round history, chat, predictions.
  - **PRD**: UX polish
  - **Deliverable**: No blank screens during loading

- [ ] **Task 12.3** `[S→All UI]` Mobile responsiveness audit — test all pages on 375px (iPhone SE), 390px (iPhone 14), 412px (Android) widths. Fix any overflow, truncation, or touch target issues.
  - **PRD**: PWA — feels native on mobile
  - **Deliverable**: All pages usable on small screens

- [ ] **Task 12.4** `[P]` Create privacy policy page at `src/app/privacy/page.tsx` and terms of service page at `src/app/terms/page.tsx`. Cover POPIA requirements: data collection, storage location, right to deletion, data export, consent.
  - **PRD**: POPIA compliance
  - **Deliverable**: Legal pages accessible

- [ ] **Task 12.5** `[S→2.4]` Implement account deletion flow — button on profile page, confirmation dialog, call Supabase Admin API to delete `auth.users` row (cascades to all data). Show final confirmation.
  - **PRD**: POPIA — Right to deletion
  - **Deliverable**: Account and all data deleted on request

- [ ] **Task 12.6** `[S→All]` Deploy to Vercel — connect GitHub repo, configure environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPTILER_KEY`), verify build succeeds, test on production URL.
  - **PRD**: Deployment
  - **Deliverable**: App live on Vercel

- [ ] **Task 12.7** `[S→12.6]` End-to-end smoke test on production — full flow on mobile device: register → create course → play 9-hole round → view stats → create tournament → invite another user → enter scores → view leaderboard → make predictions → export PDF. Verify offline scoring (airplane mode test).
  - **PRD**: All acceptance criteria
  - **Deliverable**: Full user flow verified on production

---

## Summary

| Milestone | Tasks | Parallel-safe | Sequential |
|-----------|-------|---------------|------------|
| M1: Setup | 9 | 2 | 7 |
| M2: Auth | 6 | 0 | 6 |
| M3: Courses & Maps | 14 | 0 | 14 |
| M4: Scoring | 9 | 0 | 9 |
| M5: Handicap | 5 | 0 | 5 |
| M6: Tournaments | 16 | 0 | 16 |
| M7: Social | 7 | 0 | 7 |
| M8: Predictions | 5 | 0 | 5 |
| M9: Offline | 7 | 0 | 7 |
| M10: Export | 4 | 0 | 4 |
| M11: Admin | 3 | 0 | 3 |
| M12: Polish | 7 | 2 | 5 |
| **Total** | **92** | **4** | **88** |
