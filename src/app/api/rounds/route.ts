import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roundCreateSchema } from "@/lib/validations/round";

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
    const parsed = roundCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { courseId, teeSetId, tournamentId, date } = parsed.data;

    const { data: round, error } = await supabase
      .from("rounds")
      .insert({
        user_id: user.id,
        course_id: courseId,
        tee_set_id: teeSetId,
        tournament_id: tournamentId,
        date: date ?? new Date().toISOString().slice(0, 10),
        status: "in_progress",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Round creation failed:", error.message);
      return NextResponse.json({ error: "Failed to create round" }, { status: 500 });
    }

    return NextResponse.json({ roundId: round.id }, { status: 201 });
  } catch (err) {
    console.error("Round creation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
