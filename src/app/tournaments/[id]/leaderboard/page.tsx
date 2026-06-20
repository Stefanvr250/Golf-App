import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Leaderboard } from "@/components/tournament/Leaderboard";
import type { TournamentFormat } from "@/lib/validations/tournament";

interface Props {
  params: { id: string };
}

export default async function LeaderboardPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, format, status, course:courses(name)")
    .eq("id", params.id)
    .single();

  if (!tournament) notFound();

  const rawCourse: any = (tournament as any).course;
  const courseObj = Array.isArray(rawCourse) ? (rawCourse[0] ?? null) : (rawCourse ?? null);

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href={`/tournaments/${params.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            {tournament.name} • {courseObj?.name}
          </p>
        </div>
        <Badge variant="outline" className="capitalize shrink-0 text-[10px]">
          {tournament.format.replace(/_/g, " ")}
        </Badge>
      </div>

      <Leaderboard
        tournamentId={params.id}
        format={tournament.format as TournamentFormat}
      />

      <p className="text-[10px] text-center text-muted-foreground">
        Scores update in real-time as players complete holes.
      </p>
    </div>
  );
}
