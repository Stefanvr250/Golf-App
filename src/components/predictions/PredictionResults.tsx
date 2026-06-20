"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp, TrendingDown, Medal } from "lucide-react";

interface Prediction {
  id: string;
  predictor_id: string;
  prediction_type: string;
  target_user_id: string | null;
  predicted_value: string | null;
  actual_value: string | null;
  points_earned: number;
  predictor_name: string;
  target_name: string | null;
}

interface PredictionResultsProps {
  predictions: Prediction[];
  participants: { user_id: string; display_name: string }[];
}

function typeIcon(type: string) {
  switch (type) {
    case "winner":
      return <Trophy className="h-3.5 w-3.5 text-amber-500" />;
    case "score_guess":
      return <Target className="h-3.5 w-3.5 text-blue-500" />;
    case "best_performer":
      return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
    case "worst_performer":
      return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
    default:
      return null;
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "winner":
      return "Winner";
    case "score_guess":
      return "Score Guess";
    case "best_performer":
      return "Best Performer";
    case "worst_performer":
      return "Worst Performer";
    default:
      return type;
  }
}

export function PredictionResults({ predictions, participants }: PredictionResultsProps) {
  // Build prediction leaderboard: total points per predictor
  const leaderboardMap = new Map<string, { name: string; points: number }>();

  for (const pred of predictions) {
    const existing = leaderboardMap.get(pred.predictor_id);
    if (existing) {
      existing.points += pred.points_earned;
    } else {
      leaderboardMap.set(pred.predictor_id, {
        name: pred.predictor_name,
        points: pred.points_earned,
      });
    }
  }

  const leaderboard = Array.from(leaderboardMap.values())
    .sort((a, b) => b.points - a.points);

  // Group predictions by predictor
  const byPredictor = new Map<string, Prediction[]>();
  for (const pred of predictions) {
    const list = byPredictor.get(pred.predictor_id) ?? [];
    list.push(pred);
    byPredictor.set(pred.predictor_id, list);
  }

  return (
    <div className="space-y-4">
      {/* Prediction leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Medal className="h-4 w-4 text-amber-500" />
            Prediction Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboard.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No predictions were made.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium w-10">#</th>
                  <th className="px-2 py-2 text-left font-medium">Player</th>
                  <th className="px-4 py-2 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.name} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                    </td>
                    <td className="px-2 py-2">{entry.name}</td>
                    <td className="px-4 py-2 text-right font-semibold">{entry.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Individual predictions */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">All Predictions</p>
        {predictions.map((pred) => (
          <div key={pred.id} className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2 min-w-0">
              {typeIcon(pred.prediction_type)}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {pred.predictor_name}
                  <span className="font-normal text-muted-foreground">
                    {" "}— {typeLabel(pred.prediction_type)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Predicted: {pred.target_name ?? pred.predicted_value ?? "—"}
                  {pred.prediction_type === "score_guess" && pred.predicted_value
                    ? ` (score: ${pred.predicted_value})`
                    : ""}
                </p>
                {pred.actual_value && (
                  <p className="text-xs text-muted-foreground">
                    Actual: {pred.actual_value}
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant={pred.points_earned > 0 ? "default" : "secondary"}
              className="shrink-0 ml-2"
            >
              {pred.points_earned} pts
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
