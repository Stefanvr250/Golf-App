import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { holeScoreSchema } from "@/lib/validations/round";

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

    const body = await request.json();
    const parsed = holeScoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const roundId = params.id;

    // Verify round belongs to user
    const { data: round } = await supabase
      .from("rounds")
      .select("id, course_id, status")
      .eq("id", roundId)
      .eq("user_id", user.id)
      .single();

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    if (round.status !== "in_progress") {
      return NextResponse.json(
        { error: "Round is not in progress" },
        { status: 400 }
      );
    }

    // Find hole_id by course_id + hole_number
    const { data: hole } = await supabase
      .from("holes")
      .select("id")
      .eq("course_id", round.course_id)
      .eq("hole_number", parsed.data.holeNumber)
      .single();

    if (!hole) {
      return NextResponse.json(
        { error: `Hole ${parsed.data.holeNumber} not found for this course` },
        { status: 404 }
      );
    }

    const scoreData = {
      round_id: roundId,
      hole_id: hole.id,
      hole_number: parsed.data.holeNumber,
      strokes: parsed.data.strokes,
      putts: parsed.data.putts ?? 0,
      penalties: parsed.data.penalties,
      fairway_hit: parsed.data.fairwayHit ?? null,
      green_in_regulation: parsed.data.greenInRegulation ?? null,
    };

    const { data: score, error } = await supabase
      .from("hole_scores")
      .upsert(scoreData, { onConflict: "round_id, hole_number" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ score }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
