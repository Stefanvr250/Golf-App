import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recalculateHandicap } from "@/lib/scoring/recalculate";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const roundId: string | undefined = body?.roundId;

    const result = await recalculateHandicap(supabase, user.id, roundId);

    return NextResponse.json({
      previousHandicap: result.previousHandicap,
      newHandicap: result.newHandicap,
      differential: result.differential,
      roundsUsed: result.roundsUsed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
