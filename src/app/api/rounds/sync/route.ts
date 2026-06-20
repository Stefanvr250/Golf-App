import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roundSyncSchema } from "@/lib/validations/round";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = roundSyncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const results: { offlineId: string; serverId?: string; error?: string }[] = [];

    for (const offlineRound of parsed.data.rounds) {
      try {
        // Create the round
        const { data: round, error: roundErr } = await supabase
          .from("rounds")
          .insert({
            user_id: user.id,
            course_id: offlineRound.courseId,
            tee_set_id: offlineRound.teeSetId,
            tournament_id: offlineRound.tournamentId,
            date: offlineRound.date ?? new Date().toISOString().slice(0, 10),
            status: "in_progress",
          })
          .select("id")
          .single();

        if (roundErr || !round) {
          results.push({
            offlineId: offlineRound.offlineId,
            error: roundErr?.message ?? "Failed to create round",
          });
          continue;
        }

        // Insert all scores
        for (const score of offlineRound.scores) {
          // Find hole_id by course + hole_number
          const { data: hole } = await supabase
            .from("holes")
            .select("id")
            .eq("course_id", offlineRound.courseId)
            .eq("hole_number", score.holeNumber)
            .single();

          if (!hole) continue;

          await supabase.from("hole_scores").upsert(
            {
              round_id: round.id,
              hole_id: hole.id,
              hole_number: score.holeNumber,
              strokes: score.strokes,
              putts: score.putts ?? 0,
              penalties: score.penalties,
              fairway_hit: score.fairwayHit ?? null,
              green_in_regulation: score.greenInRegulation ?? null,
            },
            { onConflict: "round_id, hole_number" }
          );
        }

        // If all scores are present, calculate total and complete the round
        if (offlineRound.scores.length > 0) {
          const totalStrokes = offlineRound.scores.reduce(
            (sum, s) => sum + s.strokes,
            0
          );

          await supabase
            .from("rounds")
            .update({ status: "completed", total_strokes: totalStrokes })
            .eq("id", round.id);
        }

        results.push({
          offlineId: offlineRound.offlineId,
          serverId: round.id,
        });
      } catch (err) {
        results.push({
          offlineId: offlineRound.offlineId,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
