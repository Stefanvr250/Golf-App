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
