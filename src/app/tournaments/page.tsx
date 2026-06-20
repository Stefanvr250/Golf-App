"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { Plus } from "lucide-react";

interface TournamentItem {
  id: string;
  name: string;
  date: string;
  format: string;
  status: string;
  course?: { name: string } | null;
  max_participants: number;
}

export default function TournamentsPage() {
  const [my, setMy] = React.useState<TournamentItem[]>([]);
  const [upcoming, setUpcoming] = React.useState<TournamentItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tournaments");
        const data = await res.json();
        if (res.ok) {
          setMy(data.my ?? []);
          setUpcoming(data.upcoming ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tournaments</h1>
        <Link href="/tournaments/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">My Tournaments</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-4 space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && my.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No tournaments yet. <Link href="/tournaments/new" className="text-primary underline">Create one</Link>.
              </CardContent>
            </Card>
          )}
          {my.map((t) => (
            <TournamentCard
              key={t.id}
              id={t.id}
              name={t.name}
              date={t.date}
              format={t.format}
              status={t.status}
              courseName={t.course?.name}
              maxParticipants={t.max_participants}
            />
          ))}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4 space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && upcoming.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No upcoming tournaments found.
              </CardContent>
            </Card>
          )}
          {upcoming.map((t) => (
            <TournamentCard
              key={t.id}
              id={t.id}
              name={t.name}
              date={t.date}
              format={t.format}
              status={t.status}
              courseName={t.course?.name}
              maxParticipants={t.max_participants}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
