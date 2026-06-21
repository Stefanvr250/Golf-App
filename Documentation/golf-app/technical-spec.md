# Technical Specification: GolfApp

## 1. Overview

GolfApp is a Progressive Web App (PWA) built with Next.js and Supabase that provides golfers with course selection, GPS distances, detailed scoring, handicap tracking, tournament management, social features, and prediction games. The app targets South African golfers first, using OpenStreetMap for worldwide course discovery and a community-maintained Supabase database for detailed course/scorecard data. It supports offline scoring with background sync.

### Key Technical Approach

- **Next.js (App Router)** PWA frontend deployed to Vercel (free tier)
- **Supabase** for PostgreSQL database (with PostGIS), authentication, real-time subscriptions, and file storage — all on the free tier
- **MapLibre GL JS** with OpenStreetMap + MapTiler satellite tiles for course maps and GPS
- **Overpass API** for querying OpenStreetMap golf course data worldwide
- **Service Worker + IndexedDB** for offline-first scoring

---

## 2. Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Client (PWA)                        │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐│
│  │ Next.js  │  │ MapLibre │  │ Service Worker         ││
│  │ React UI │  │ GL JS    │  │ (Workbox)              ││
│  │ shadcn/ui│  │ + GPS    │  │ ┌──────────────────┐   ││
│  │ Tailwind │  │          │  │ │ IndexedDB        │   ││
│  └────┬─────┘  └────┬─────┘  │ │ (Dexie.js)       │   ││
│       │              │        │ │ Offline score     │   ││
│       │              │        │ │ cache             │   ││
│       │              │        │ └──────────────────┘   ││
│       │              │        └────────────────────────┘│
└───────┼──────────────┼──────────────────────────────────┘
        │              │
        ▼              ▼
┌───────────────┐  ┌──────────────────┐
│   Supabase    │  │  External APIs   │
│ ┌───────────┐ │  │ ┌──────────────┐ │
│ │ PostgreSQL│ │  │ │ Overpass API │ │
│ │ + PostGIS │ │  │ │ (OSM data)   │ │
│ ├───────────┤ │  │ ├──────────────┤ │
│ │ Auth      │ │  │ │ MapTiler     │ │
│ │ (Email)   │ │  │ │ (satellite)  │ │
│ ├───────────┤ │  │ ├──────────────┤ │
│ │ Realtime  │ │  │ │ OSM Tiles    │ │
│ │ (WebSocket│ │  │ │ (map tiles)  │ │
│ ├───────────┤ │  │ └──────────────┘ │
│ │ Storage   │ │  └──────────────────┘
│ │ (photos)  │ │
│ └───────────┘ │
└───────────────┘
```

### Data Flow

1. **Course Discovery**: Client queries Overpass API for nearby golf courses (by GPS or search). Results are cached in Supabase and IndexedDB. Community-added courses come directly from Supabase.
2. **GPS & Maps**: MapLibre GL JS renders map tiles (OSM for streets, MapTiler for satellite). Browser Geolocation API provides real-time position. Distance calculations are done client-side using Turf.js.
3. **Scoring**: Scores are written to IndexedDB first (offline-safe), then synced to Supabase when online. Supabase Realtime broadcasts score changes to tournament participants.
4. **Leaderboard**: Supabase Realtime subscriptions on the `scores` table push updates to all connected clients within 3 seconds.
5. **Auth**: Supabase Auth handles email/password at launch. Google OAuth and Apple OAuth are deferred to the roadmap. Invite links generate JWT tokens for guest access.

---

## 3. Data Model / Schema

All tables live in Supabase PostgreSQL with PostGIS extension enabled.

### Users

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  handicap_index NUMERIC(4,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_display_name ON profiles (display_name);
```

### Friendships

```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);
CREATE INDEX idx_friendships_addressee ON friendships (addressee_id, status);
```

### Courses

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  country TEXT NOT NULL DEFAULT 'South Africa',
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  num_holes INTEGER NOT NULL DEFAULT 18 CHECK (num_holes IN (9, 18, 27, 36)),
  course_rating NUMERIC(4,1),
  slope_rating INTEGER CHECK (slope_rating BETWEEN 55 AND 155),
  source TEXT NOT NULL DEFAULT 'community' CHECK (source IN ('osm', 'community')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_location ON courses USING GIST (location);
CREATE INDEX idx_courses_name ON courses USING gin (name gin_trgm_ops);
```

### Holes

```sql
CREATE TABLE holes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 36),
  par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 6),
  handicap_index INTEGER CHECK (handicap_index BETWEEN 1 AND 18),
  pin_location GEOGRAPHY(POINT, 4326),
  green_front GEOGRAPHY(POINT, 4326),
  green_center GEOGRAPHY(POINT, 4326),
  green_back GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, hole_number)
);
```

### Tee Sets

```sql
CREATE TABLE tee_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  course_rating NUMERIC(4,1),
  slope_rating INTEGER CHECK (slope_rating BETWEEN 55 AND 155),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, name)
);

CREATE TABLE hole_tees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hole_id UUID NOT NULL REFERENCES holes(id) ON DELETE CASCADE,
  tee_set_id UUID NOT NULL REFERENCES tee_sets(id) ON DELETE CASCADE,
  yardage INTEGER NOT NULL CHECK (yardage > 0),
  UNIQUE (hole_id, tee_set_id)
);
```

### Hazards

```sql
CREATE TABLE hazards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hole_id UUID NOT NULL REFERENCES holes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bunker', 'water', 'ob', 'lateral_water', 'tree_line')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  label TEXT
);
```

### Course Change Requests

```sql
CREATE TABLE course_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  description TEXT NOT NULL,
  changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
```

### Rounds & Scores

```sql
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id),
  tee_set_id UUID REFERENCES tee_sets(id),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_strokes INTEGER,
  total_putts INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  is_shared BOOLEAN NOT NULL DEFAULT false,
  offline_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rounds_user ON rounds (user_id, date DESC);
CREATE INDEX idx_rounds_tournament ON rounds (tournament_id);
CREATE INDEX idx_rounds_offline ON rounds (offline_id) WHERE offline_id IS NOT NULL;

CREATE TABLE hole_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  hole_id UUID NOT NULL REFERENCES holes(id),
  hole_number INTEGER NOT NULL,
  strokes INTEGER NOT NULL CHECK (strokes >= 0),
  putts INTEGER CHECK (putts >= 0),
  penalties INTEGER NOT NULL DEFAULT 0,
  fairway_hit TEXT CHECK (fairway_hit IN ('yes', 'no', 'na')),
  green_in_regulation BOOLEAN,
  up_and_down BOOLEAN,
  sand_save BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (round_id, hole_number)
);
CREATE INDEX idx_hole_scores_round ON hole_scores (round_id);
```

### Shot Tracking

```sql
CREATE TABLE shots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hole_score_id UUID NOT NULL REFERENCES hole_scores(id) ON DELETE CASCADE,
  shot_number INTEGER NOT NULL,
  club TEXT,
  lie_type TEXT CHECK (lie_type IN ('tee', 'fairway', 'rough', 'bunker', 'green', 'fringe', 'recovery')),
  start_location GEOGRAPHY(POINT, 4326),
  end_location GEOGRAPHY(POINT, 4326),
  distance_yards NUMERIC(6,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hole_score_id, shot_number)
);
```

### Handicap History

```sql
CREATE TABLE handicap_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  handicap_index NUMERIC(4,1) NOT NULL,
  differential NUMERIC(5,1) NOT NULL,
  round_id UUID NOT NULL REFERENCES rounds(id),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_handicap_user ON handicap_history (user_id, calculated_at DESC);
```

### Tournaments & Leagues

```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organizer_id UUID NOT NULL REFERENCES profiles(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  format TEXT NOT NULL CHECK (format IN (
    'stroke_play', 'stableford', 'best_ball', 'scramble',
    'match_play', 'ryder_cup', 'alternate_shot', 'skins',
    'shamble', 'two_person_scramble'
  )),
  num_holes INTEGER NOT NULL DEFAULT 18 CHECK (num_holes IN (9, 18)),
  max_participants INTEGER NOT NULL DEFAULT 20 CHECK (max_participants <= 20),
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tournaments_date ON tournaments (date DESC);
CREATE INDEX idx_tournaments_invite ON tournaments (invite_code);

CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team TEXT,
  playing_handicap NUMERIC(4,1),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
CREATE INDEX idx_tp_tournament ON tournament_participants (tournament_id);

CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  manager_id UUID NOT NULL REFERENCES profiles(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_id)
);

CREATE TABLE league_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  event_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Predictions

```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  predictor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN (
    'winner', 'score_guess', 'best_performer', 'worst_performer'
  )),
  target_user_id UUID REFERENCES profiles(id),
  predicted_value TEXT,
  actual_value TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, predictor_id, prediction_type, target_user_id)
);
CREATE INDEX idx_predictions_tournament ON predictions (tournament_id);
```

### Social

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_tournament ON chat_messages (tournament_id, created_at DESC);

CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('round_shared', 'tournament_created', 'tournament_completed', 'handicap_updated')),
  reference_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_user ON activity_feed (user_id, created_at DESC);
```

### Entity Relationship Summary

```
profiles ──1:N──▸ rounds ──1:N──▸ hole_scores ──1:N──▸ shots
profiles ──1:N──▸ handicap_history
profiles ──N:M──▸ profiles (friendships)
courses  ──1:N──▸ holes ──1:N──▸ hole_tees
courses  ──1:N──▸ tee_sets
courses  ──1:N──▸ hazards (via holes)
tournaments ──1:N──▸ tournament_participants
tournaments ──1:N──▸ rounds
tournaments ──1:N──▸ predictions
tournaments ──1:N──▸ chat_messages
leagues ──1:N──▸ league_events ──1:1──▸ tournaments
```

---

## 4. API Contracts

The app uses **Supabase client SDK** for most data operations (auto-generated REST + Realtime). Custom logic is implemented in **Next.js API Routes** (Route Handlers) and **Supabase Edge Functions** where needed.

### Supabase Direct (Client SDK)

Standard CRUD via `supabase-js` with Row Level Security (RLS). No custom API needed for:
- Profiles (read/update own)
- Rounds, hole_scores, shots (CRUD own data)
- Tournament read, join, leave
- Chat messages (read/write within joined tournaments)
- Friendships (send/accept/decline)
- Activity feed (read friends' activities)
- Predictions (CRUD own within joined tournaments)

### Next.js API Routes

#### `POST /api/courses/import-osm`
Import a course from OpenStreetMap Overpass API into the local database.

```json
// Request
{ "osmId": 123456789, "lat": -33.9249, "lng": 18.4241 }

// Response 200
{ "courseId": "uuid", "name": "Royal Cape Golf Club", "holes": 18 }

// Error 404
{ "error": "Course not found in OpenStreetMap" }
```

#### `GET /api/courses/search-osm`
Search OpenStreetMap for golf courses near a location.

```json
// Request query params
?lat=-33.9249&lng=18.4241&radius=25000&q=royal+cape

// Response 200
{
  "courses": [
    {
      "osmId": 123456789,
      "name": "Royal Cape Golf Club",
      "lat": -33.95,
      "lng": 18.41,
      "distance_km": 2.3,
      "inDatabase": true
    }
  ]
}
```

#### `POST /api/handicap/recalculate`
Recalculate a user's handicap after a round is finalized.

```json
// Request
{ "userId": "uuid", "roundId": "uuid" }

// Response 200
{
  "previousHandicap": 18.2,
  "newHandicap": 17.8,
  "differential": 16.5,
  "roundsUsed": 8
}
```

#### `POST /api/tournaments/invite`
Generate or validate an invite link.

```json
// Request
{ "tournamentId": "uuid" }

// Response 200
{ "inviteUrl": "https://app.example.com/join/abc123def456" }
```

#### `POST /api/tournaments/:id/finalize`
Finalize a tournament, calculate predictions results.

```json
// Response 200
{
  "leaderboard": [...],
  "predictionResults": [
    { "userId": "uuid", "displayName": "John", "points": 15 }
  ]
}
```

#### `GET /api/export/round/:id`
Export a round as CSV or PDF.

```json
// Request query params
?format=pdf

// Response 200
// Content-Type: application/pdf or text/csv
// Binary file download
```

#### `POST /api/rounds/sync`
Sync offline-created rounds to the server.

```json
// Request
{
  "rounds": [
    {
      "offlineId": "local-uuid",
      "courseId": "uuid",
      "teeSetId": "uuid",
      "date": "2026-06-20",
      "scores": [
        { "holeNumber": 1, "strokes": 5, "putts": 2, "fairwayHit": "yes", ... }
      ]
    }
  ]
}

// Response 200
{
  "synced": [
    { "offlineId": "local-uuid", "serverId": "uuid" }
  ],
  "errors": []
}
```

### Supabase Realtime Subscriptions

```typescript
// Tournament leaderboard — subscribe to score changes
supabase
  .channel('tournament-scores')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'hole_scores',
    filter: `round_id=in.(${tournamentRoundIds})`
  }, handleScoreChange)
  .subscribe()

// Tournament chat
supabase
  .channel('tournament-chat')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `tournament_id=eq.${tournamentId}`
  }, handleNewMessage)
  .subscribe()
```

---

## 5. Component Inventory

### Frontend (Next.js App Router)

```
src/
├── app/
│   ├── layout.tsx                 # Root layout, providers, PWA meta
│   ├── page.tsx                   # Landing / dashboard
│   ├── (auth)/
│   │   ├── login/page.tsx         # Login page
│   │   ├── register/page.tsx      # Registration page
│   │   └── join/[code]/page.tsx   # Tournament invite join page
│   ├── courses/
│   │   ├── page.tsx               # Course search & browse
│   │   ├── [id]/page.tsx          # Course detail (holes, tees, map)
│   │   ├── new/page.tsx           # Add new course form
│   │   └── [id]/edit/page.tsx     # Course change request form
│   ├── play/
│   │   ├── page.tsx               # Start a round (select course/tees)
│   │   ├── [roundId]/page.tsx     # Active scorecard
│   │   ├── [roundId]/hole/[n]/page.tsx  # Hole detail + GPS map
│   │   └── [roundId]/summary/page.tsx   # Round summary & stats
│   ├── profile/
│   │   ├── page.tsx               # User profile + handicap
│   │   ├── stats/page.tsx         # Detailed statistics
│   │   └── history/page.tsx       # Round history
│   ├── tournaments/
│   │   ├── page.tsx               # Browse/my tournaments
│   │   ├── new/page.tsx           # Create tournament
│   │   ├── [id]/page.tsx          # Tournament detail
│   │   ├── [id]/leaderboard/page.tsx    # Live leaderboard
│   │   ├── [id]/predictions/page.tsx    # Prediction games
│   │   └── [id]/chat/page.tsx     # Tournament chat
│   ├── leagues/
│   │   ├── page.tsx               # Browse/my leagues
│   │   ├── new/page.tsx           # Create league
│   │   └── [id]/page.tsx          # League standings
│   ├── friends/
│   │   └── page.tsx               # Friends list + activity feed
│   ├── admin/
│   │   ├── page.tsx               # Admin dashboard
│   │   └── change-requests/page.tsx  # Review course changes
│   └── api/                       # Route Handlers (see API Contracts)
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── maps/
│   │   ├── CourseMap.tsx           # MapLibre course map
│   │   ├── GPSTracker.tsx         # GPS position + distance display
│   │   ├── YardageCircles.tsx     # Yardage circle overlay
│   │   └── ShotTracker.tsx        # Shot start/end GPS tracking
│   ├── scoring/
│   │   ├── Scorecard.tsx          # Full scorecard grid
│   │   ├── HoleScoreInput.tsx     # Per-hole score entry form
│   │   └── RoundSummary.tsx       # Stats summary component
│   ├── tournament/
│   │   ├── Leaderboard.tsx        # Real-time leaderboard
│   │   ├── TournamentCard.tsx     # Tournament preview card
│   │   └── FormatSelector.tsx     # Tournament format picker
│   ├── predictions/
│   │   ├── PredictionForm.tsx     # Make predictions
│   │   └── PredictionResults.tsx  # Results display
│   └── social/
│       ├── ChatPanel.tsx          # Tournament chat
│       ├── ActivityFeed.tsx       # Friends activity feed
│       └── FriendsList.tsx        # Friends management
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── server.ts              # Server-side Supabase client
│   │   └── middleware.ts          # Auth middleware
│   ├── maps/
│   │   ├── overpass.ts            # Overpass API query builder
│   │   ├── distance.ts            # Turf.js distance calculations
│   │   └── tiles.ts               # Tile source configuration
│   ├── scoring/
│   │   ├── handicap.ts            # Handicap calculation engine
│   │   ├── stableford.ts          # Stableford scoring logic
│   │   └── formats.ts             # Tournament format scoring
│   ├── offline/
│   │   ├── db.ts                  # Dexie.js IndexedDB schema
│   │   ├── sync.ts                # Background sync logic
│   │   └── queue.ts               # Offline action queue
│   └── export/
│       ├── csv.ts                 # CSV generation
│       └── pdf.ts                 # PDF scorecard generation
├── hooks/
│   ├── useGPS.ts                  # Geolocation hook
│   ├── useRealtimeLeaderboard.ts  # Supabase Realtime subscription
│   ├── useOfflineSync.ts          # Offline detection + sync
│   └── useHandicap.ts             # Handicap display hook
└── public/
    ├── manifest.json              # PWA manifest
    ├── sw.js                      # Service Worker (generated)
    └── icons/                     # App icons
```

### Key Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `lib/supabase/` | Supabase client initialization, auth helpers, server-side client for API routes |
| `lib/maps/overpass.ts` | Build and execute Overpass QL queries, parse OSM golf course data |
| `lib/maps/distance.ts` | Calculate GPS distances (user to pin, shot distances) using Turf.js |
| `lib/scoring/handicap.ts` | Simplified handicap calculation: average of best N differentials |
| `lib/scoring/formats.ts` | Scoring logic per tournament format (stroke play, stableford, etc.) |
| `lib/offline/db.ts` | Dexie.js IndexedDB schema mirroring key Supabase tables |
| `lib/offline/sync.ts` | Detect online/offline state, queue writes, batch sync on reconnect |
| `components/maps/GPSTracker.tsx` | Wrap Geolocation API, compute live distances, render on MapLibre map |
| `components/tournament/Leaderboard.tsx` | Subscribe to Supabase Realtime, render sorted leaderboard |

---

## 6. Technology Choices

| Category | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| **Framework** | Next.js 14+ (App Router) | SSR/SSG, API routes, PWA support via `next-pwa`, Vercel free hosting | Remix (less PWA ecosystem), SvelteKit (smaller community) |
| **UI Library** | React + shadcn/ui + TailwindCSS | Modern, accessible components; utility-first styling; mobile-friendly | MUI (heavier bundle), Chakra UI (less customizable) |
| **Database** | Supabase PostgreSQL + PostGIS | Free tier (500MB, 50k MAU), built-in auth/realtime/storage, PostGIS for geo queries | Firebase (no PostGIS), PlanetScale (no geo), self-hosted Postgres (hosting cost) |
| **Auth** | Supabase Auth | Email/password at launch (Google + Apple OAuth deferred to roadmap), free, JWT-based | NextAuth.js (extra complexity), Auth0 (paid at scale) |
| **Real-time** | Supabase Realtime | WebSocket subscriptions on DB changes, 2M messages/month free, 200 concurrent connections | Socket.io (requires own server), Pusher (paid) |
| **Maps** | MapLibre GL JS | Open-source, free, GPU-accelerated, supports custom tile sources | Leaflet (no vector tiles), Google Maps (paid), Mapbox (paid at scale) |
| **Map Tiles (street)** | OpenStreetMap raster tiles | Free, worldwide coverage, no API key | Stadia Maps (free tier limited) |
| **Map Tiles (satellite)** | MapTiler free tier | 100k requests/month free, good satellite imagery including South Africa | Bing Maps (restrictive license), ESRI (paid), Google (paid) |
| **GPS** | Browser Geolocation API | Native browser support, no library needed, works in PWA | No viable alternatives for web |
| **Geo calculations** | Turf.js | Client-side distance/bearing calculations, lightweight | Manual Haversine (less features) |
| **Offline storage** | Dexie.js (IndexedDB wrapper) | Clean async API, versioned schemas, works in service workers | localForage (less powerful), raw IndexedDB (verbose) |
| **PWA / Service Worker** | Workbox (via `next-pwa`) | Precaching, runtime caching strategies, background sync | Raw Service Worker (complex), sw-precache (deprecated) |
| **PDF export** | jsPDF + jspdf-autotable | Client-side PDF generation, no server needed, free | PDFKit (Node-only), Puppeteer (heavy) |
| **CSV export** | papaparse | Client-side CSV generation, lightweight | Manual string building |
| **Photo storage** | Supabase Storage | 1GB free, integrated with auth/RLS | Cloudinary (free tier small), S3 (paid) |
| **Hosting** | Vercel (free tier) | Native Next.js support, global CDN, serverless functions | Netlify (good but less Next.js-optimized), Railway (paid) |
| **Icons** | Lucide React | Open source, consistent, tree-shakeable | Heroicons, FontAwesome |

### Free Tier Budget Summary

| Service | Free Tier | Expected Usage (launch) |
|---------|-----------|------------------------|
| Supabase DB | 500MB | ~50MB (courses + scores) |
| Supabase Auth | 50k MAU | <100 users initially |
| Supabase Realtime | 2M messages/month, 200 concurrent | ~50k messages, <50 concurrent |
| Supabase Storage | 1GB | ~200MB (photos) |
| MapTiler | 100k requests/month | ~30k (satellite tiles) |
| Vercel | 100GB bandwidth, 100 hrs serverless | Well within limits |
| Overpass API | No hard limit (fair use) | ~500 queries/month |

---

## 7. Security Considerations

### Authentication & Authorization

- **Supabase Auth** handles email/password authentication at launch with bcrypt-hashed passwords. OAuth 2.0 providers are deferred to the roadmap.
- **Row Level Security (RLS)** on every table — users can only read/write their own data unless explicitly shared (tournaments, friends).
- **Admin role** checked via `profiles.role = 'admin'` in RLS policies for course data management.
- **Invite links** use random 12-character hex codes. Joining a tournament requires a valid invite code + authenticated user.
- **Guest access**: Invite link recipients without accounts are redirected to registration first, then auto-joined to the tournament.

### RLS Policy Examples

```sql
-- Users can only read/write their own rounds
CREATE POLICY "Users manage own rounds" ON rounds
  FOR ALL USING (auth.uid() = user_id);

-- Tournament participants can read all rounds in their tournament
CREATE POLICY "Participants read tournament rounds" ON rounds
  FOR SELECT USING (
    tournament_id IN (
      SELECT tournament_id FROM tournament_participants WHERE user_id = auth.uid()
    )
  );

-- Only admins can update course data directly
CREATE POLICY "Admins manage courses" ON courses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone authenticated can insert courses (community contribution)
CREATE POLICY "Users add courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Chat messages visible to tournament participants
CREATE POLICY "Participants read chat" ON chat_messages
  FOR SELECT USING (
    tournament_id IN (
      SELECT tournament_id FROM tournament_participants WHERE user_id = auth.uid()
    )
  );
```

### Input Validation

- All API route inputs validated with **Zod** schemas server-side.
- Score values constrained at database level (CHECK constraints) and validated client-side.
- Course names and text fields sanitized for XSS (React's default escaping + DOMPurify for rich content if needed).
- File uploads (photos) restricted to image MIME types, max 5MB, validated server-side.

### Data Privacy (POPIA Compliance)

- **Consent**: Users must accept terms of service and privacy policy at registration.
- **Data minimization**: Only collect data necessary for app functionality (email, display name, scores).
- **Right to deletion**: Users can delete their account, which cascades to all their data (CASCADE foreign keys).
- **Data access**: Users can export all their data via the CSV/PDF export functionality.
- **Data processing**: All data stored in Supabase (AWS infrastructure). Privacy policy must disclose data storage location.
- **Cookies**: Only essential cookies (auth session). No tracking cookies.

### Rate Limiting

- Supabase has built-in rate limiting on auth endpoints.
- Overpass API queries cached in Supabase to avoid excessive external calls.
- API routes protected with rate limiting middleware (e.g., `next-rate-limit` or custom implementation).

---

## 8. Error Handling Strategy

### Client-Side

| Scenario | Handling |
|----------|----------|
| **Network failure during scoring** | Scores saved to IndexedDB. Toast notification: "Offline mode — scores will sync when connected." |
| **GPS unavailable/denied** | Graceful degradation: map still renders, distance features disabled. User prompted to enable location. |
| **Supabase Realtime disconnection** | Auto-reconnect with exponential backoff (built into supabase-js). Stale leaderboard shows "Last updated" timestamp. |
| **API route errors** | Standardized error response `{ error: string, code: string }`. Client shows user-friendly toast messages. |
| **Photo upload failure** | Retry up to 3 times with exponential backoff. Show error toast with retry button. |
| **Invalid score input** | Client-side Zod validation with inline error messages before submission. |

### Server-Side

| Scenario | Handling |
|----------|----------|
| **Overpass API timeout/failure** | Return cached results from Supabase. If no cache, return error with suggestion to add course manually. |
| **Handicap calculation with insufficient data** | Return null handicap with message "Complete at least 3 rounds to receive a handicap index." |
| **Tournament at capacity** | Return 409 Conflict: "Tournament is full (20/20 participants)." |
| **Duplicate offline sync** | Idempotent sync using `offline_id`. If round with same `offline_id` exists, skip and return existing server ID. |
| **Database constraint violations** | Caught by Supabase, returned as structured error. Client maps to user-friendly messages. |

### Logging

- Client errors logged to console in development, could add Sentry (free tier) in production.
- API route errors logged with request context (user ID, endpoint, timestamp).
- Supabase provides built-in database and auth logs in the dashboard.

---

## 9. Performance & Scalability

### Expected Load (Launch)

- **Users**: <100 active users
- **Concurrent**: <20 users simultaneously (max tournament size)
- **Rounds/month**: ~200
- **Realtime connections**: <50 concurrent

### Optimization Strategies

| Area | Strategy |
|------|----------|
| **Course data caching** | OSM query results cached in Supabase with `updated_at` timestamp. Re-query only if >30 days stale. Client caches in IndexedDB for offline access. |
| **Map tile caching** | Service Worker caches map tiles with cache-first strategy. Satellite tiles cached with 7-day expiry. |
| **Leaderboard** | Supabase Realtime pushes deltas, not full leaderboard. Client maintains sorted state locally. |
| **GPS polling** | `watchPosition` with `{ enableHighAccuracy: true, maximumAge: 5000 }`. Updates throttled to 1/second for UI rendering. |
| **Bundle size** | Tree-shaking via Next.js. MapLibre GL JS loaded dynamically on map pages only. Turf.js: import only needed functions. |
| **Images** | Photos resized client-side before upload (max 1920px wide, JPEG 80% quality). Supabase Storage serves via CDN. |
| **Database queries** | PostGIS spatial indexes for nearby course queries. Composite indexes on frequently queried columns (see schema). Trigram index for fuzzy course name search. |

### Scalability Path

The architecture supports scaling beyond the free tier:
- **Database**: Upgrade Supabase plan for more storage/connections.
- **Realtime**: Supabase scales to 10k concurrent on Pro plan.
- **Tournament size**: Increase `max_participants` CHECK constraint. No architectural changes needed.
- **Map tiles**: Upgrade MapTiler plan or self-host tiles.

---

## 10. Dependencies & Constraints

### External Service Dependencies

| Service | Dependency Level | Fallback |
|---------|-----------------|----------|
| **Supabase** | Critical — database, auth, realtime, storage | None at free tier. Data export for backup. |
| **Overpass API** | Non-critical — course discovery | App works with community-added courses only. Results cached. |
| **MapTiler** | Non-critical — satellite imagery | Falls back to OSM street tiles (no satellite view). |
| **OpenStreetMap tiles** | Important — base map rendering | MapLibre can use any XYZ tile source as fallback. |
| **Vercel** | Critical — hosting | Can deploy to any Node.js host (Netlify, Railway, self-hosted). |

### Constraints

- **Supabase free tier**: 500MB database, 1GB storage, 2M realtime messages/month, 200 concurrent connections. Project pauses after 1 week of inactivity (requires periodic keepalive or active users).
- **MapTiler free tier**: 100k requests/month. Non-commercial use only on free plan — if the app monetizes later, must upgrade to paid plan.
- **Overpass API**: No formal rate limit but fair use policy. Aggressive querying may result in temporary bans. Must cache results.
- **Browser Geolocation**: Requires HTTPS. Accuracy varies by device (GPS chip vs. Wi-Fi triangulation). User must grant permission.
- **PWA limitations**: iOS Safari has limited PWA support (no push notifications, limited background sync). Offline scoring works via IndexedDB but background sync may not trigger automatically on iOS — must sync on next app open.
- **POPIA**: Must implement privacy policy, consent flow, data deletion, and data export. No legal review included in this spec — requires external legal consultation.
- **OSM data quality in South Africa**: Golf course coverage in OSM for South Africa is inconsistent. Many courses may lack hole-level detail. The community course creation feature is critical for launch viability.

### NPM Package Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "^0.5.0",
    "maplibre-gl": "^4.0.0",
    "react-map-gl": "^7.0.0",
    "@turf/distance": "^7.0.0",
    "@turf/helpers": "^7.0.0",
    "@turf/circle": "^7.0.0",
    "dexie": "^4.0.0",
    "dexie-react-hooks": "^1.0.0",
    "zod": "^3.0.0",
    "jspdf": "^2.0.0",
    "jspdf-autotable": "^3.0.0",
    "papaparse": "^5.0.0",
    "lucide-react": "^0.400.0",
    "tailwindcss": "^3.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "next-pwa": "^5.0.0"
  }
}
```
