"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface TournamentInfo {
  id: string;
  name: string;
  date: string;
  format: string;
  num_holes: number;
  max_participants: number;
  status: string;
  course?: { name: string } | null;
  participant_count?: number;
}

export default function JoinTournamentPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const router = useRouter();
  const { toast } = useToast();
  const supabase = React.useMemo(() => createClient(), []);

  const [tournament, setTournament] = React.useState<TournamentInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [alreadyJoined, setAlreadyJoined] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        // Find tournament by invite_code
        const { data: t, error } = await supabase
          .from("tournaments")
          .select("id, name, date, format, num_holes, max_participants, status, course:courses(name)")
          .eq("invite_code", code)
          .single();

        if (error || !t) {
          toast({ variant: "destructive", title: "Invalid invite", description: "Tournament not found." });
          setLoading(false);
          return;
        }

        // Count participants
        const { count } = await supabase
          .from("tournament_participants")
          .select("*", { count: "exact", head: true })
          .eq("tournament_id", t.id);

        // Check if current user (if any) is already in it
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let joined = false;
        if (user) {
          const { data: me } = await supabase
            .from("tournament_participants")
            .select("id")
            .eq("tournament_id", t.id)
            .eq("user_id", user.id)
            .maybeSingle();
          joined = !!me;
        }

        const rawCourse = (t as any)?.course;
        const courseArr = Array.isArray(rawCourse) ? rawCourse : (rawCourse ? [rawCourse] : []);
        const firstCourse = courseArr[0] ?? null;
        setTournament({
          id: (t as any).id,
          name: (t as any).name,
          date: (t as any).date,
          format: (t as any).format,
          num_holes: (t as any).num_holes,
          max_participants: (t as any).max_participants,
          status: (t as any).status,
          course: firstCourse ? { name: firstCourse.name } : null,
          participant_count: count ?? 0,
        } as unknown as TournamentInfo);
        setAlreadyJoined(joined);
      } finally {
        setLoading(false);
      }
    })();
  }, [code, supabase, toast]);

  async function handleJoin() {
    if (!tournament) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to register with return URL
      const next = `/join/${code}`;
      router.push(`/register?next=${encodeURIComponent(next)}`);
      return;
    }

    setJoining(true);
    try {
      // Re-check capacity
      const { count } = await supabase
        .from("tournament_participants")
        .select("*", { count: "exact", head: true })
        .eq("tournament_id", tournament.id);

      if ((count ?? 0) >= tournament.max_participants) {
        toast({ variant: "destructive", title: "Tournament full" });
        setJoining(false);
        return;
      }

      const { error } = await supabase
        .from("tournament_participants")
        .insert({ tournament_id: tournament.id, user_id: user.id });

      if (error) throw error;

      toast({ title: "Joined!", description: "You&apos;re in the tournament." });
      router.push(`/tournaments/${tournament.id}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Join failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="p-6 text-sm">This invite link is invalid or expired.</CardContent>
        </Card>
      </div>
    );
  }

  const dateLabel = new Date(tournament.date).toLocaleDateString("en-ZA");
  const full = (tournament.participant_count ?? 0) >= tournament.max_participants;

  return (
    <div className="container max-w-md py-10 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Join Tournament</h1>

      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-xl font-semibold">{tournament.name}</p>
          <p className="text-sm text-muted-foreground">{tournament.course?.name ?? "Course TBD"}</p>
          <div className="text-sm">
            {dateLabel} • {tournament.num_holes} holes • <span className="capitalize">{tournament.format.replace(/_/g, " ")}</span>
          </div>
          <div className="text-sm">
            Players: {tournament.participant_count} / {tournament.max_participants}
          </div>
          <div className="text-xs text-muted-foreground">Status: {tournament.status}</div>
        </CardContent>
      </Card>

      {alreadyJoined ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">You&apos;re already in this tournament.</p>
          <Link href={`/tournaments/${tournament.id}`}>
            <Button className="w-full">Go to Tournament</Button>
          </Link>
        </div>
      ) : full ? (
        <Button disabled className="w-full">Tournament is full</Button>
      ) : (
        <Button onClick={handleJoin} disabled={joining} className="w-full">
          {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Join Tournament
        </Button>
      )}

      <p className="text-[10px] text-center text-muted-foreground">
        You will be able to start a round linked to this tournament from the tournament page.
      </p>
    </div>
  );
}
