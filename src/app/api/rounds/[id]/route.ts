import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recalculateHandicap } from "@/lib/scoring/recalculate";

interface Params {
  params: { id: string };
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roundId = params.id;

    // Verify round belongs to user and is in_progress
    const { data: round } = await supabase
      .from("rounds")
      .select("id, status")
      .eq("id", roundId)
      .eq("user_id", user.id)
      .single();

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    if (round.status !== "in_progress") {
      return NextResponse.json(
        { error: "Round is already finalized" },
        { status: 400 }
      );
    }

    // Calculate totals from hole_scores
    const { data: scores } = await supabase
      .from("hole_scores")
      .select("strokes, putts")
      .eq("round_id", roundId);

    const totalStrokes = (scores ?? []).reduce((sum, s) => sum + (s.strokes ?? 0), 0);
    const totalPutts = (scores ?? []).reduce((sum, s) => sum + (s.putts ?? 0), 0);

    const { data: updatedRound, error } = await supabase
      .from("rounds")
      .update({
        status: "completed",
        total_strokes: totalStrokes,
        total_putts: totalPutts,
      })
      .eq("id", roundId)
      .select("id, status, total_strokes, total_putts")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Recalculate handicap (M5)
    const hcp = await recalculateHandicap(supabase, user.id, roundId);

    return NextResponse.json({
      round: updatedRound,
      handicap: {
        previous: hcp.previousHandicap,
        current: hcp.newHandicap,
        differential: hcp.differential,
        roundsUsed: hcp.roundsUsed,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
