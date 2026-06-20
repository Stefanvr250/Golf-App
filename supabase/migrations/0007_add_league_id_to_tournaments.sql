-- Add league_id column to tournaments table to support linking tournaments to leagues.
-- This enables the league detail page to query tournaments by league.

ALTER TABLE tournaments
  ADD COLUMN league_id UUID REFERENCES leagues(id) ON DELETE SET NULL;

CREATE INDEX idx_tournaments_league ON tournaments (league_id) WHERE league_id IS NOT NULL;
