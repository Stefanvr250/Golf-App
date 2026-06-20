"use client";

import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TournamentFormat } from "@/lib/validations/tournament";

interface LeaderboardProps {
  tournamentId: string;
  format: TournamentFormat;
}

export function Leaderboard({ tournamentId, format }: LeaderboardProps) {
  const { leaderboard, loading, lastUpdated } = useRealtimeLeaderboard({ tournamentId, format });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading leaderboard...</CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No scores recorded yet. Players need to start and complete holes.
        </CardContent>
      </Card>
    );
  }

  const isPointsBased = format === "stableford" || format === "skins" || format === "ryder_cup";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Leaderboard</CardTitle>
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium w-10">#</th>
              <th className="px-2 py-2 text-left font-medium">Player</th>
              <th className="px-2 py-2 text-center font-medium">Thru</th>
              <th className="px-4 py-2 text-right font-medium">
                {isPointsBased ? "Pts" : "Score"}
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.userId} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium">{entry.rank}</td>
                <td className="px-2 py-2">{entry.displayName}</td>
                <td className="px-2 py-2 text-center">{entry.thru}</td>
                <td className="px-4 py-2 text-right">
                  {entry.detail ? (
                    <span>{entry.detail}</span>
                  ) : (
                    <span className={cn(
                      entry.vsPar != null && entry.vsPar < 0 && "text-green-600",
                      entry.vsPar != null && entry.vsPar > 0 && "text-red-600"
                    )}>
                      {entry.score}
                      {entry.vsPar != null && (
                        <span className="ml-1 text-[10px]">
                          ({entry.vsPar > 0 ? "+" : ""}{entry.vsPar})
                        </span>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
