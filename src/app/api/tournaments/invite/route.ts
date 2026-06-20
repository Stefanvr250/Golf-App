import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tournamentInviteSchema } from "@/lib/validations/tournament";

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
    const parsed = tournamentInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { tournamentId } = parsed.data;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id, invite_code, organizer_id")
      .eq("id", tournamentId)
      .single();

    if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (t.organizer_id !== user.id) {
      return NextResponse.json({ error: "Only organizer can generate invites" }, { status: 403 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${origin}/join/${t.invite_code}`;
    return NextResponse.json({ inviteUrl: url, code: t.invite_code });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
