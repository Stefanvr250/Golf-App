import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users, Calendar, Flag } from "lucide-react";
import { InviteButton } from "@/components/tournament/InviteButton";
import { FinalizeTournamentButton } from "@/components/tournament/FinalizeTournamentButton";

interface Props {
  params: { id: string };
}

export default async function TournamentDetailPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*, course:courses(id, name, num_holes)")
    .eq("id", params.id)
    .single();

  if (!tournament) notFound();

  const rawCourse: any = (tournament as any).course;
  const course = Array.isArray(rawCourse) ? (rawCourse[0] ?? null) : (rawCourse ?? null);

  // Participants with profiles
  const { data: participants } = await supabase
    .from("tournament_participants")
    .select("user_id, joined_at, playing_handicap, profiles:profiles(id, display_name, handicap_index, avatar_url)")
    .eq("tournament_id", params.id);

  const isOrganizer = tournament.organizer_id === user.id;
  const isParticipant = (participants ?? []).some((p: any) => p.user_id === user.id);

  const formatLabel = tournament.format.replace(/_/g, " ");
  const dateLabel = new Date(tournament.date).toLocaleDateString("en-ZA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href="/tournaments">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight truncate">{tournament.name}</h1>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {dateLabel}
            </span>
            <span>•</span>
            <span className="capitalize">{formatLabel}</span>
            <span>•</span>
            <span>{tournament.num_holes} holes</span>
          </div>
        </div>
        <Badge variant="outline" className="capitalize shrink-0">
          {tournament.status.replace("_", " ")}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Course</p>
            <p className="font-medium">{course?.name ?? "—"}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span>
              { (participants ?? []).length } / {tournament.max_participants} players
            </span>
          </div>
          {isOrganizer && (
            <div className="pt-2">
              <InviteButton tournamentId={tournament.id} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Players</h2>
        <div className="space-y-2">
          {(participants ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No players yet.</p>
          )}
          {(participants ?? []).map((p: any) => {
            const prof = p.profiles;
            return (
              <div key={p.user_id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{prof?.display_name ?? "Player"}</p>
                  <p className="text-xs text-muted-foreground">
                    Handicap: {prof?.handicap_index ?? "—"}
                  </p>
                </div>
                {p.playing_handicap != null && (
                  <Badge variant="secondary">PH {p.playing_handicap}</Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        {course?.id && (
          <Link href={`/play?course=${course.id}&tournament=${tournament.id}`}>
            <Button className="w-full" size="lg">
              <Flag className="mr-2 h-4 w-4" />
              Start Round for this Tournament
            </Button>
          </Link>
        )}

        <Link href={`/tournaments/${tournament.id}/leaderboard`}>
          <Button variant="outline" className="w-full">View Leaderboard</Button>
        </Link>

        <Link href={`/tournaments/${tournament.id}/chat`}>
          <Button variant="outline" className="w-full">Open Chat</Button>
        </Link>

        <Link href={`/tournaments/${tournament.id}/predictions`}>
          <Button variant="outline" className="w-full">Predictions</Button>
        </Link>

        {isOrganizer && tournament.status !== "completed" && (
          <FinalizeTournamentButton tournamentId={tournament.id} />
        )}
      </div>

      {!isParticipant && tournament.status === "upcoming" && (
        <p className="text-center text-xs text-muted-foreground">
          Ask the organizer for an invite link to join.
        </p>
      )}
    </div>
  );
}
