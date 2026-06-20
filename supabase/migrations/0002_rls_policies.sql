-- GolfApp — Row Level Security policies (Task 1.8)
-- Run after 0001_initial_schema.sql.

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER to avoid recursive RLS evaluation)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tournament_participant(tid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tournament_participants
    WHERE tournament_id = tid AND user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hole_tees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazards ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hole_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE shots ENABLE ROW LEVEL SECURITY;
ALTER TABLE handicap_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Profiles — readable by all authenticated users; users update only their own
-- ---------------------------------------------------------------------------
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Friendships — visible to either party; requester sends; either party updates
-- ---------------------------------------------------------------------------
CREATE POLICY "View own friendships" ON friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Send friend request" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Respond to friend request" ON friendships
  FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "Delete own friendship" ON friendships
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ---------------------------------------------------------------------------
-- Courses — readable by all; any authenticated user can add (community);
-- only admins update/delete
-- ---------------------------------------------------------------------------
CREATE POLICY "Courses readable by all" ON courses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users add courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins update courses" ON courses
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins delete courses" ON courses
  FOR DELETE USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Holes / tee_sets / hole_tees / hazards — readable by all; insert by course
-- creator; admins update/delete
-- ---------------------------------------------------------------------------
CREATE POLICY "Holes readable by all" ON holes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert holes for own course" ON holes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.created_by = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "Admins modify holes" ON holes
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins delete holes" ON holes
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Tee sets readable by all" ON tee_sets
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert tee sets for own course" ON tee_sets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.created_by = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "Admins modify tee sets" ON tee_sets
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins delete tee sets" ON tee_sets
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Hole tees readable by all" ON hole_tees
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert hole tees for own course" ON hole_tees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM holes h JOIN courses c ON c.id = h.course_id
      WHERE h.id = hole_id AND c.created_by = auth.uid()
    ) OR public.is_admin()
  );
CREATE POLICY "Admins modify hole tees" ON hole_tees
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins delete hole tees" ON hole_tees
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Hazards readable by all" ON hazards
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert hazards for own course" ON hazards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM holes h JOIN courses c ON c.id = h.course_id
      WHERE h.id = hole_id AND c.created_by = auth.uid()
    ) OR public.is_admin()
  );
CREATE POLICY "Admins modify hazards" ON hazards
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins delete hazards" ON hazards
  FOR DELETE USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Course change requests — requester creates/views own; admins view/update all
-- ---------------------------------------------------------------------------
CREATE POLICY "View own or all (admin) change requests" ON course_change_requests
  FOR SELECT USING (auth.uid() = requested_by OR public.is_admin());
CREATE POLICY "Submit change request" ON course_change_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "Admins review change requests" ON course_change_requests
  FOR UPDATE USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Tournaments — readable by all; organizer creates/updates
-- ---------------------------------------------------------------------------
CREATE POLICY "Tournaments readable by all" ON tournaments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create tournament" ON tournaments
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizer updates tournament" ON tournaments
  FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizer deletes tournament" ON tournaments
  FOR DELETE USING (auth.uid() = organizer_id);

-- ---------------------------------------------------------------------------
-- Tournament participants — readable by all; users join/leave themselves
-- ---------------------------------------------------------------------------
CREATE POLICY "Participants readable by all" ON tournament_participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Join tournament" ON tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave tournament" ON tournament_participants
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Leagues — readable by all; manager manages
-- ---------------------------------------------------------------------------
CREATE POLICY "Leagues readable by all" ON leagues
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create league" ON leagues
  FOR INSERT WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "Manager updates league" ON leagues
  FOR UPDATE USING (auth.uid() = manager_id);
CREATE POLICY "Manager deletes league" ON leagues
  FOR DELETE USING (auth.uid() = manager_id);

CREATE POLICY "League members readable by all" ON league_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Join league" ON league_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave league" ON league_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "League events readable by all" ON league_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manager creates league events" ON league_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM leagues l WHERE l.id = league_id AND l.manager_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Rounds — users manage own; tournament participants can read tournament rounds
-- ---------------------------------------------------------------------------
CREATE POLICY "Users manage own rounds" ON rounds
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Participants read tournament rounds" ON rounds
  FOR SELECT USING (
    tournament_id IS NOT NULL AND public.is_tournament_participant(tournament_id)
  );
CREATE POLICY "Read shared rounds from friends" ON rounds
  FOR SELECT USING (
    is_shared = true AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = auth.uid() AND f.addressee_id = rounds.user_id)
          OR (f.addressee_id = auth.uid() AND f.requester_id = rounds.user_id)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Hole scores — owner manages; tournament participants read
-- ---------------------------------------------------------------------------
CREATE POLICY "Users manage own hole scores" ON hole_scores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM rounds r WHERE r.id = round_id AND r.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM rounds r WHERE r.id = round_id AND r.user_id = auth.uid())
  );
CREATE POLICY "Participants read tournament hole scores" ON hole_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = round_id
        AND r.tournament_id IS NOT NULL
        AND public.is_tournament_participant(r.tournament_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Shots — owner manages (via hole_score -> round)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users manage own shots" ON shots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM hole_scores hs JOIN rounds r ON r.id = hs.round_id
      WHERE hs.id = hole_score_id AND r.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM hole_scores hs JOIN rounds r ON r.id = hs.round_id
      WHERE hs.id = hole_score_id AND r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Handicap history — users read own; inserts via service/API
-- ---------------------------------------------------------------------------
CREATE POLICY "Users read own handicap history" ON handicap_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own handicap history" ON handicap_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Predictions — participants manage own predictions within joined tournaments
-- (locking after start is enforced in API/Task 8.3)
-- ---------------------------------------------------------------------------
CREATE POLICY "Read predictions in joined tournaments" ON predictions
  FOR SELECT USING (public.is_tournament_participant(tournament_id));
CREATE POLICY "Create own predictions" ON predictions
  FOR INSERT WITH CHECK (
    auth.uid() = predictor_id AND public.is_tournament_participant(tournament_id)
  );
CREATE POLICY "Update own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = predictor_id);
CREATE POLICY "Delete own predictions" ON predictions
  FOR DELETE USING (auth.uid() = predictor_id);

-- ---------------------------------------------------------------------------
-- Chat messages — visible to tournament participants; users post own
-- ---------------------------------------------------------------------------
CREATE POLICY "Participants read chat" ON chat_messages
  FOR SELECT USING (public.is_tournament_participant(tournament_id));
CREATE POLICY "Participants post chat" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND public.is_tournament_participant(tournament_id)
  );
CREATE POLICY "Delete own chat messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Activity feed — owner + friends read; owner inserts
-- ---------------------------------------------------------------------------
CREATE POLICY "Read own and friends activity" ON activity_feed
  FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = auth.uid() AND f.addressee_id = activity_feed.user_id)
          OR (f.addressee_id = auth.uid() AND f.requester_id = activity_feed.user_id)
        )
    )
  );
CREATE POLICY "Insert own activity" ON activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);
