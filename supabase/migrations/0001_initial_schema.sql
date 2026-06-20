-- GolfApp — Initial schema (Task 1.7)
-- Creates extensions, all tables, indexes, and CHECK constraints per the
-- technical specification. Run this in the Supabase SQL editor or via the
-- Supabase CLI (`supabase db push`).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- gen_random_uuid() / gen_random_bytes() come from pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at fresh
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
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
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Friendships
-- ---------------------------------------------------------------------------
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);
CREATE INDEX idx_friendships_addressee ON friendships (addressee_id, status);

-- ---------------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------------
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
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Holes
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Tee sets & per-hole yardages
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Hazards
-- ---------------------------------------------------------------------------
CREATE TABLE hazards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hole_id UUID NOT NULL REFERENCES holes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bunker', 'water', 'ob', 'lateral_water', 'tree_line')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  label TEXT
);
CREATE INDEX idx_hazards_hole ON hazards (hole_id);

-- ---------------------------------------------------------------------------
-- Course change requests
-- ---------------------------------------------------------------------------
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
CREATE INDEX idx_ccr_status ON course_change_requests (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Tournaments & leagues
-- ---------------------------------------------------------------------------
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
CREATE TRIGGER trg_tournaments_updated_at BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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

-- ---------------------------------------------------------------------------
-- Rounds & scores
-- ---------------------------------------------------------------------------
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
CREATE UNIQUE INDEX idx_rounds_offline ON rounds (user_id, offline_id) WHERE offline_id IS NOT NULL;
CREATE TRIGGER trg_rounds_updated_at BEFORE UPDATE ON rounds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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
CREATE TRIGGER trg_hole_scores_updated_at BEFORE UPDATE ON hole_scores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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

-- ---------------------------------------------------------------------------
-- Handicap history
-- ---------------------------------------------------------------------------
CREATE TABLE handicap_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  handicap_index NUMERIC(4,1) NOT NULL,
  differential NUMERIC(5,1) NOT NULL,
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_handicap_user ON handicap_history (user_id, calculated_at DESC);

-- ---------------------------------------------------------------------------
-- Predictions
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Social
-- ---------------------------------------------------------------------------
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
