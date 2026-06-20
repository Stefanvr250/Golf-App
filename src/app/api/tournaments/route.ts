import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tournamentCreateSchema } from "@/lib/validations/tournament";

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
    const parsed = tournamentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, courseId, format, numHoles, maxParticipants, date } = parsed.data;
    const leagueId = (body as any).leagueId ?? null;

    // Create tournament
    const { data: tournament, error: tErr } = await supabase
      .from("tournaments")
      .insert({
        name,
        organizer_id: user.id,
        course_id: courseId,
        format,
        num_holes: numHoles,
        max_participants: maxParticipants,
        date,
        league_id: leagueId,
        status: "upcoming",
      })
      .select("id, invite_code")
      .single();

    if (tErr || !tournament) {
      return NextResponse.json({ error: tErr?.message ?? "Failed to create tournament" }, { status: 500 });
    }

    // Auto-join organizer as participant
    const { error: pErr } = await supabase
      .from("tournament_participants")
      .insert({
        tournament_id: tournament.id,
        user_id: user.id,
      });

    if (pErr) {
      // Non-fatal for creation, but surface it
      return NextResponse.json({ tournamentId: tournament.id, inviteCode: tournament.invite_code, warning: "Created but failed to join as participant" });
    }

    return NextResponse.json({ tournamentId: tournament.id, inviteCode: tournament.invite_code }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // My tournaments: where I'm organizer or participant
    const { data: my } = await supabase
      .from("tournament_participants")
      .select("tournament:tournaments(id, name, date, format, status, course:courses(name), max_participants)")
      .eq("user_id", user.id);

    function normalizeCourse(t: any) {
      if (!t) return t;
      const raw = t.course;
      const c = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
      return { ...t, course: c };
    }

    const myTournaments = (my ?? [])
      .map((r: any) => normalizeCourse(r.tournament))
      .filter(Boolean);

    // Upcoming public-ish list (upcoming, not necessarily joined)
    const { data: upcoming } = await supabase
      .from("tournaments")
      .select("id, name, date, format, status, course:courses(name), max_participants")
      .eq("status", "upcoming")
      .order("date", { ascending: true })
      .limit(50);

    return NextResponse.json({
      my: myTournaments,
      upcoming: (upcoming ?? []).map(normalizeCourse),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
