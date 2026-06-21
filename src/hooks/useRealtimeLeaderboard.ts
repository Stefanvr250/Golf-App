"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateLeaderboard, type ParticipantScore, type LeaderboardEntry } from "@/lib/scoring/formats";
import type { TournamentFormat } from "@/lib/validations/tournament";

interface UseRealtimeLeaderboardProps {
  tournamentId: string;
  format: TournamentFormat;
}

export function useRealtimeLeaderboard({ tournamentId, format }: UseRealtimeLeaderboardProps) {
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [subscribedRoundIds, setSubscribedRoundIds] = React.useState<string[]>([]);
  const supabase = React.useMemo(() => createClient(), []);

  const fetchLeaderboard = React.useCallback(async () => {
    // Get all rounds linked to this tournament
    const { data: rounds } = await supabase
      .from("rounds")
      .select("id, user_id, total_strokes, profiles:profiles(display_name, handicap_index)")
      .eq("tournament_id", tournamentId)
      .eq("status", "completed");

    if (!rounds || rounds.length === 0) {
      // Check in-progress rounds too
      const { data: inProgress } = await supabase
        .from("rounds")
        .select("id, user_id, profiles:profiles(display_name, handicap_index)")
        .eq("tournament_id", tournamentId)
        .in("status", ["in_progress", "completed"]);

      if (!inProgress || inProgress.length === 0) {
        setSubscribedRoundIds([]);
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Fetch hole scores for in-progress rounds
      const roundIds = inProgress.map((r: any) => r.id);
      setSubscribedRoundIds(roundIds);
      const { data: scores } = await supabase
        .from("hole_scores")
        .select("round_id, hole_number, strokes, holes:hole_id(par)")
        .in("round_id", roundIds);

      const participants: ParticipantScore[] = inProgress.map((r: any) => {
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        const roundScores = (scores ?? []).filter((s: any) => s.round_id === r.id);
        return {
          userId: r.user_id,
          displayName: profile?.display_name ?? "Player",
          handicap: profile?.handicap_index ?? null,
          holes: roundScores.map((s: any) => {
            const hole = Array.isArray(s.holes) ? s.holes[0] : s.holes;
            return {
              holeNumber: s.hole_number,
              strokes: s.strokes,
              par: hole?.par ?? 4,
            };
          }),
        };
      });

      const lb = calculateLeaderboard(format, participants);
      setLeaderboard(lb);
      setLastUpdated(new Date());
      setLoading(false);
      return;
    }

    // Completed rounds path
    const roundIds = rounds.map((r: any) => r.id);
    setSubscribedRoundIds(roundIds);
    const { data: scores } = await supabase
      .from("hole_scores")
      .select("round_id, hole_number, strokes, holes:hole_id(par)")
      .in("round_id", roundIds);

    const participants: ParticipantScore[] = rounds.map((r: any) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      const roundScores = (scores ?? []).filter((s: any) => s.round_id === r.id);
      return {
        userId: r.user_id,
        displayName: profile?.display_name ?? "Player",
        handicap: profile?.handicap_index ?? null,
        holes: roundScores.map((s: any) => {
          const hole = Array.isArray(s.holes) ? s.holes[0] : s.holes;
          return {
            holeNumber: s.hole_number,
            strokes: s.strokes,
            par: hole?.par ?? 4,
          };
        }),
      };
    });

    const lb = calculateLeaderboard(format, participants);
    setLeaderboard(lb);
    setLastUpdated(new Date());
    setLoading(false);
  }, [supabase, tournamentId, format]);

  React.useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  React.useEffect(() => {
    const roundFilter = subscribedRoundIds.length > 0
      ? `round_id=in.(${subscribedRoundIds.join(",")})`
      : null;

    const channel = supabase
      .channel(`tournament-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rounds",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchLeaderboard();
        }
      );

    if (roundFilter) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hole_scores",
          filter: roundFilter,
        },
        () => {
          fetchLeaderboard();
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, tournamentId, subscribedRoundIds, fetchLeaderboard]);

  return { leaderboard, loading, lastUpdated, refresh: fetchLeaderboard };
}
