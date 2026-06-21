import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { leagueCreateSchema } from "@/lib/validations/tournament";

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
    const parsed = leagueCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;

    const { data: league, error } = await supabase
      .from("leagues")
      .insert({
        name,
        description: description ?? null,
        manager_id: user.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("League creation failed:", error.message);
      return NextResponse.json({ error: "Failed to create league" }, { status: 500 });
    }

    // Auto-join manager as member
    await supabase.from("league_members").insert({
      league_id: league.id,
      user_id: user.id,
    });

    return NextResponse.json({ leagueId: league.id }, { status: 201 });
  } catch (err) {
    console.error("League creation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const { data: memberships } = await supabase
      .from("league_members")
      .select("league:leagues(id, name, description, manager_id, created_at)")
      .eq("user_id", user.id);

    const leagues = (memberships ?? [])
      .map((m: any) => {
        const raw = m.league;
        return Array.isArray(raw) ? raw[0] : raw;
      })
      .filter(Boolean);

    return NextResponse.json({ leagues });
  } catch (err) {
    console.error("League list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
