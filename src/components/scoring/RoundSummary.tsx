"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HoleData {
  hole_number: number;
  par: number;
}

interface ScoreData {
  hole_number: number;
  strokes: number;
  putts: number;
  penalties: number;
  fairway_hit: string | null;
  green_in_regulation: boolean | null;
  up_and_down: boolean | null;
  sand_save: boolean | null;
}

interface RoundSummaryProps {
  holes: HoleData[];
  scores: ScoreData[];
}

export function RoundSummary({ holes, scores }: RoundSummaryProps) {
  const holeMap: Record<number, HoleData> = {};
  for (const h of holes) holeMap[h.hole_number] = h;

  const scoreMap: Record<number, ScoreData> = {};
  for (const s of scores) scoreMap[s.hole_number] = s;

  const totalStrokes = scores.reduce((sum, s) => sum + (s.strokes ?? 0), 0);
  const totalPutts = scores.reduce((sum, s) => sum + (s.putts ?? 0), 0);
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const vsPar = totalStrokes - totalPar;

  const holesPlayed = scores.filter((s) => s.strokes > 0).length;
  const puttsPerHole = holesPlayed > 0 ? (totalPutts / holesPlayed).toFixed(1) : "—";

  // FIR: fairways hit on par 4+5 holes
  const firHoles = holes.filter((h) => h.par > 3);
  const firScores = firHoles
    .map((h) => scoreMap[h.hole_number])
    .filter(Boolean);
  const firYes = firScores.filter((s) => s.fairway_hit === "yes").length;
  const firPct =
    firScores.length > 0 ? Math.round((firYes / firScores.length) * 100) : null;

  // GIR
  const girYes = scores.filter(
    (s) => s.green_in_regulation === true && s.strokes > 0
  ).length;
  const girPct =
    holesPlayed > 0 ? Math.round((girYes / holesPlayed) * 100) : null;

  // Scoring average by par
  const parGroups: Record<number, number[]> = { 3: [], 4: [], 5: [] };
  for (const s of scores) {
    const par = holeMap[s.hole_number]?.par;
    if (par && s.strokes > 0) {
      if (!parGroups[par]) parGroups[par] = [];
      parGroups[par].push(s.strokes);
    }
  }

  const avgByPar = (par: number) => {
    const arr = parGroups[par] ?? [];
    if (arr.length === 0) return null;
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  };

  // Up-and-down: missed GIR but made par or better
  const upAndDownOpportunities = scores.filter(
    (s) =>
      s.strokes > 0 &&
      s.green_in_regulation === false &&
      holeMap[s.hole_number] &&
      s.strokes <= (holeMap[s.hole_number].par + 1)
  );
  const upAndDownYes = upAndDownOpportunities.filter(
    (s) => s.up_and_down === true
  ).length;
  const upAndDownPct =
    upAndDownOpportunities.length > 0
      ? Math.round((upAndDownYes / upAndDownOpportunities.length) * 100)
      : null;

  // Sand saves: similar logic (simplified — any bunker opportunity with up_and_down)
  const sandOpportunities = scores.filter(
    (s) =>
      s.strokes > 0 &&
      s.sand_save !== null &&
      holeMap[s.hole_number] &&
      s.strokes <= (holeMap[s.hole_number].par + 1)
  );
  const sandYes = sandOpportunities.filter((s) => s.sand_save === true).length;
  const sandPct =
    sandOpportunities.length > 0
      ? Math.round((sandYes / sandOpportunities.length) * 100)
      : null;

  return (
    <div className="space-y-4">
      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Score" value={totalStrokes} />
        <StatCard
          label="vs Par"
          value={vsPar > 0 ? `+${vsPar}` : `${vsPar}`}
          valueClass={cn(
            vsPar < 0 && "text-green-600",
            vsPar > 0 && "text-red-600"
          )}
        />
        <StatCard label="Total Putts" value={totalPutts} />
        <StatCard label="Putts/Hole" value={puttsPerHole} />
      </div>

      {/* Percentages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatItem label="FIR %" value={firPct !== null ? `${firPct}%` : "—"} />
          <StatItem label="GIR %" value={girPct !== null ? `${girPct}%` : "—"} />
          <StatItem
            label="Up & Down %"
            value={upAndDownPct !== null ? `${upAndDownPct}%` : "—"}
          />
          <StatItem
            label="Sand Save %"
            value={sandPct !== null ? `${sandPct}%` : "—"}
          />
        </CardContent>
      </Card>

      {/* Scoring by par */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Average by Par</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <StatItem label="Par 3" value={avgByPar(3) ?? "—"} />
          <StatItem label="Par 4" value={avgByPar(4) ?? "—"} />
          <StatItem label="Par 5" value={avgByPar(5) ?? "—"} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-xl font-bold", valueClass)}>{value}</p>
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
