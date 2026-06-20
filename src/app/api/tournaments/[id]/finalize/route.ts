import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: { id: string };
}

export async function POST(request: Request, { params }: Params) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tournamentId = params.id;

    // Verify tournament exists and user is organizer
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("id, organizer_id, status")
      .eq("id", tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.organizer_id !== user.id) {
      return NextResponse.json({ error: "Only the organizer can finalize" }, { status: 403 });
    }

    if (tournament.status === "completed") {
      return NextResponse.json({ error: "Tournament already finalized" }, { status: 400 });
    }

    // Update status to completed
    const { error: updateErr } = await supabase
      .from("tournaments")
      .update({ status: "completed" })
      .eq("id", tournamentId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // --- Prediction scoring ---
    // Fetch all rounds for this tournament to determine actual results
    const { data: rounds } = await supabase
      .from("rounds")
      .select("id, user_id, total_strokes, profiles:profiles(display_name, handicap_index)")
      .eq("tournament_id", tournamentId)
      .eq("status", "completed");

    if (rounds && rounds.length > 0) {
      // Determine actual winner (lowest total_strokes)
      const sortedByScore = [...rounds].sort(
        (a: any, b: any) => (a.total_strokes ?? 999) - (b.total_strokes ?? 999)
      );
      const actualWinnerId = sortedByScore[0]?.user_id;

      // Determine best/worst performer (score relative to handicap)
      const performances = rounds.map((r: any) => {
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        const handicap = profile?.handicap_index ?? 0;
        const netScore = (r.total_strokes ?? 0) - handicap;
        return { userId: r.user_id, netScore, totalStrokes: r.total_strokes ?? 0 };
      });
      performances.sort((a, b) => a.netScore - b.netScore);
      const bestPerformerId = performances[0]?.userId;
      const worstPerformerId = performances[performances.length - 1]?.userId;

      // Score map by user
      const scoreMap = new Map<string, number>();
      for (const r of rounds as any[]) {
        scoreMap.set(r.user_id, r.total_strokes ?? 0);
      }

      // Fetch all predictions for this tournament
      const { data: predictions } = await supabase
        .from("predictions")
        .select("id, predictor_id, prediction_type, target_user_id, predicted_value")
        .eq("tournament_id", tournamentId);

      if (predictions && predictions.length > 0) {
        const updates: { id: string; actual_value: string; points_earned: number }[] = [];

        for (const pred of predictions as any[]) {
          let points = 0;
          let actualValue = "";

          switch (pred.prediction_type) {
            case "winner": {
              actualValue = actualWinnerId ?? "";
              if (pred.target_user_id === actualWinnerId) points = 5;
              break;
            }
            case "score_guess": {
              const actualScore = scoreMap.get(pred.target_user_id) ?? null;
              actualValue = actualScore != null ? String(actualScore) : "";
              if (actualScore != null && pred.predicted_value) {
                const predicted = parseInt(pred.predicted_value, 10);
                if (!isNaN(predicted)) {
                  const diff = Math.abs(predicted - actualScore);
                  if (diff === 0) points = 5;
                  else if (diff <= 1) points = 3;
                }
              }
              break;
            }
            case "best_performer": {
              actualValue = bestPerformerId ?? "";
              if (pred.target_user_id === bestPerformerId) points = 3;
              break;
            }
            case "worst_performer": {
              actualValue = worstPerformerId ?? "";
              if (pred.target_user_id === worstPerformerId) points = 3;
              break;
            }
          }

          updates.push({ id: pred.id, actual_value: actualValue, points_earned: points });
        }

        // Batch update predictions with results
        for (const upd of updates) {
          await supabase
            .from("predictions")
            .update({ actual_value: upd.actual_value, points_earned: upd.points_earned })
            .eq("id", upd.id);
        }
      }
    }

    // Create activity_feed entry for finalization
    const { data: participants } = await supabase
      .from("tournament_participants")
      .select("user_id")
      .eq("tournament_id", tournamentId);

    if (participants && participants.length > 0) {
      const feedEntries = participants.map((p: any) => ({
        user_id: p.user_id,
        type: "tournament_completed",
        reference_id: tournamentId,
        metadata: { tournament_id: tournamentId },
      }));

      // Insert activity feed entries (best-effort, non-blocking)
      await supabase.from("activity_feed").insert(feedEntries).then(() => {});
    }

    return NextResponse.json({ status: "completed", tournamentId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
