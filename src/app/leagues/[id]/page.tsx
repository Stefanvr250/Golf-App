import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Trophy } from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function LeagueDetailPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!league) notFound();

  // Members
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, joined_at, profiles:profiles(display_name, handicap_index)")
    .eq("league_id", params.id);

  // Events (tournaments linked to this league)
  const { data: events } = await supabase
    .from("tournaments")
    .select("id, name, date, format, status")
    .eq("league_id", params.id)
    .order("date", { ascending: false })
    .limit(20);

  const isManager = league.manager_id === user.id;

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href="/leagues">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold truncate">{league.name}</h1>
          {league.description && (
            <p className="text-sm text-muted-foreground">{league.description}</p>
          )}
        </div>
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Members ({(members ?? []).length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(members ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
          {(members ?? []).map((m: any) => {
            const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
            return (
              <div key={m.user_id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{prof?.display_name ?? "Player"}</span>
                <span className="text-muted-foreground">HC {prof?.handicap_index ?? "—"}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Events
            </CardTitle>
            {isManager && (
              <Link href={`/tournaments/new?league=${params.id}`}>
                <Button size="sm" variant="outline">Create Event</Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {(events ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          )}
          {(events ?? []).map((e: any) => (
            <Link key={e.id} href={`/tournaments/${e.id}`}>
              <div className="flex items-center justify-between rounded border p-3 text-sm hover:bg-muted/50">
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("en-ZA")} • <span className="capitalize">{e.format.replace(/_/g, " ")}</span>
                  </p>
                </div>
                <span className="capitalize text-xs text-muted-foreground">{e.status}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Season Standings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Season Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Standings are calculated by aggregating tournament results across league events.
            Full standings will populate as events are completed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
