"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";

interface LeagueItem {
  id: string;
  name: string;
  description?: string | null;
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = React.useState<LeagueItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leagues");
        const data = await res.json();
        if (res.ok) setLeagues(data.leagues ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Leagues</h1>
        <Link href="/leagues/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New League
          </Button>
        </Link>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!loading && leagues.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            You haven&apos;t joined any leagues yet.{" "}
            <Link href="/leagues/new" className="text-primary underline">Create one</Link>.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {leagues.map((l) => (
          <Link key={l.id} href={`/leagues/${l.id}`}>
            <Card className="cursor-pointer hover:border-primary/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{l.name}</p>
                    {l.description && (
                      <p className="text-xs text-muted-foreground truncate">{l.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
