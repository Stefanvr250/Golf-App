"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingDown } from "lucide-react";

interface RoundWithCourse {
  id: string;
  date: string;
  total_strokes: number | null;
  total_putts: number | null;
  course: { name: string; num_holes: number } | null;
  scores: {
    hole_number: number;
    strokes: number;
    putts: number;
    fairway_hit: string | null;
    green_in_regulation: boolean | null;
    up_and_down: boolean | null;
    sand_save: boolean | null;
  }[];
}

export default function StatsPage() {
  const supabase = createClient();
  const [rounds, setRounds] = React.useState<RoundWithCourse[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("rounds")
        .select(
          "id, date, total_strokes, total_putts, course:courses(name, num_holes), scores:hole_scores(*)"
        )
        .eq("status", "completed")
        .order("date", { ascending: false })
        .limit(50);

      setRounds(
        (data ?? []).map((r) => ({
          id: r.id,
          date: r.date,
          total_strokes: r.total_strokes,
          total_putts: r.total_putts,
          course: r.course as unknown as { name: string; num_holes: number } | null,
          scores: ((r.scores as unknown as RoundWithCourse["scores"]) ?? []).map(
            (s) => ({
              hole_number: s.hole_number,
              strokes: s.strokes,
              putts: s.putts,
              fairway_hit: s.fairway_hit,
              green_in_regulation: s.green_in_regulation,
              up_and_down: s.up_and_down,
              sand_save: s.sand_save,
            })
          ),
        }))
      );
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="container max-w-2xl space-y-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="container max-w-2xl space-y-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Complete some rounds to see your stats.
          </p>
          <Link href="/play" className="mt-2 inline-block text-sm text-primary hover:underline">
            Start a round
          </Link>
        </div>
      </div>
    );
  }

  function calcStats(roundSlice: RoundWithCourse[]) {
    const totalRounds = roundSlice.length;
    const allScores = roundSlice.flatMap((r) => r.scores);
    const scoredHoles = allScores.filter((s) => s.strokes > 0);

    const scoringAvg =
      scoredHoles.length > 0
        ? (scoredHoles.reduce((sum, s) => sum + s.strokes, 0) / scoredHoles.length).toFixed(1)
        : "—";

    const bestRound = roundSlice.reduce((best, r) => {
      if (!r.total_strokes) return best;
      if (!best || r.total_strokes < best.total_strokes!) return r;
      return best;
    }, null as RoundWithCourse | null);

    const avgPutts =
      totalRounds > 0
        ? (
            roundSlice.reduce((sum, r) => sum + (r.total_putts ?? 0), 0) / totalRounds
          ).toFixed(1)
        : "—";

    const firOpps = scoredHoles.filter((s) => {
      // Par 4+5 only; skip par 3s
      return s.hole_number !== 3 && s.hole_number !== 6 && s.hole_number !== 12 && s.hole_number !== 15;
    });
    // Simplified FIR calc: we don't know par per hole here, so estimate based on hole number
    // Actually we don't have par data here. Let's use fairway_hit presence as proxy
    const firHoles = scoredHoles.filter((s) => s.fairway_hit !== null);
    const firYes = firHoles.filter((s) => s.fairway_hit === "yes").length;
    const firPct = firHoles.length > 0 ? Math.round((firYes / firHoles.length) * 100) : null;

    const girYes = scoredHoles.filter((s) => s.green_in_regulation === true).length;
    const girPct =
      scoredHoles.length > 0 ? Math.round((girYes / scoredHoles.length) * 100) : null;

    const upDownOpps = scoredHoles.filter(
      (s) => s.green_in_regulation === false && s.up_and_down !== null
    );
    const upDownYes = upDownOpps.filter((s) => s.up_and_down === true).length;
    const upDownPct =
      upDownOpps.length > 0 ? Math.round((upDownYes / upDownOpps.length) * 100) : null;

    const sandOpps = scoredHoles.filter((s) => s.sand_save !== null);
    const sandYes = sandOpps.filter((s) => s.sand_save === true).length;
    const sandPct = sandOpps.length > 0 ? Math.round((sandYes / sandOpps.length) * 100) : null;

    return {
      totalRounds,
      scoringAvg,
      bestRound,
      avgPutts,
      firPct,
      girPct,
      upDownPct,
      sandPct,
    };
  }

  const allStats = calcStats(rounds);
  const last5 = calcStats(rounds.slice(0, 5));
  const last10 = calcStats(rounds.slice(0, 10));
  const last20 = calcStats(rounds.slice(0, 20));

  function StatGrid(stats: ReturnType<typeof calcStats>) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Rounds" value={stats.totalRounds} />
          <StatCard label="Scoring Avg" value={stats.scoringAvg} />
          <StatCard
            label="Best Round"
            value={stats.bestRound?.total_strokes ?? "—"}
          />
          <StatCard label="Avg Putts" value={stats.avgPutts} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Percentages</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatItem label="FIR %" value={stats.firPct !== null ? `${stats.firPct}%` : "—"} />
            <StatItem label="GIR %" value={stats.girPct !== null ? `${stats.girPct}%` : "—"} />
            <StatItem
              label="Up & Down %"
              value={stats.upDownPct !== null ? `${stats.upDownPct}%` : "—"}
            />
            <StatItem
              label="Sand Save %"
              value={stats.sandPct !== null ? `${stats.sandPct}%` : "—"}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Career Stats</h1>
        <Badge variant="secondary" className="text-[10px]">
          <TrendingDown className="mr-1 h-3 w-3" />
          {rounds.length} rounds
        </Badge>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All Time
          </TabsTrigger>
          <TabsTrigger value="5" className="flex-1">
            Last 5
          </TabsTrigger>
          <TabsTrigger value="10" className="flex-1">
            Last 10
          </TabsTrigger>
          <TabsTrigger value="20" className="flex-1">
            Last 20
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {StatGrid(allStats)}
        </TabsContent>
        <TabsContent value="5" className="mt-4">
          {StatGrid(last5)}
        </TabsContent>
        <TabsContent value="10" className="mt-4">
          {StatGrid(last10)}
        </TabsContent>
        <TabsContent value="20" className="mt-4">
          {StatGrid(last20)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  );
}
