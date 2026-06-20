"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Target, TrendingUp, TrendingDown, Save } from "lucide-react";

interface Participant {
  user_id: string;
  display_name: string;
}

interface ExistingPrediction {
  id: string;
  prediction_type: string;
  target_user_id: string | null;
  predicted_value: string | null;
}

interface PredictionFormProps {
  tournamentId: string;
  userId: string;
  participants: Participant[];
  existing: ExistingPrediction[];
}

export function PredictionForm({
  tournamentId,
  userId,
  participants,
  existing,
}: PredictionFormProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  // State for each prediction type
  const [winner, setWinner] = React.useState<string>(
    existing.find((p) => p.prediction_type === "winner")?.target_user_id ?? ""
  );
  const [scoreGuessPlayer, setScoreGuessPlayer] = React.useState<string>(
    existing.find((p) => p.prediction_type === "score_guess")?.target_user_id ?? ""
  );
  const [scoreGuessValue, setScoreGuessValue] = React.useState<string>(
    existing.find((p) => p.prediction_type === "score_guess")?.predicted_value ?? ""
  );
  const [bestPerformer, setBestPerformer] = React.useState<string>(
    existing.find((p) => p.prediction_type === "best_performer")?.target_user_id ?? ""
  );
  const [worstPerformer, setWorstPerformer] = React.useState<string>(
    existing.find((p) => p.prediction_type === "worst_performer")?.target_user_id ?? ""
  );

  const otherParticipants = participants.filter((p) => p.user_id !== userId);

  async function handleSave() {
    setSaving(true);

    const predictions: {
      tournament_id: string;
      predictor_id: string;
      prediction_type: string;
      target_user_id: string | null;
      predicted_value: string | null;
    }[] = [];

    if (winner) {
      predictions.push({
        tournament_id: tournamentId,
        predictor_id: userId,
        prediction_type: "winner",
        target_user_id: winner,
        predicted_value: null,
      });
    }

    if (scoreGuessPlayer && scoreGuessValue) {
      predictions.push({
        tournament_id: tournamentId,
        predictor_id: userId,
        prediction_type: "score_guess",
        target_user_id: scoreGuessPlayer,
        predicted_value: scoreGuessValue,
      });
    }

    if (bestPerformer) {
      predictions.push({
        tournament_id: tournamentId,
        predictor_id: userId,
        prediction_type: "best_performer",
        target_user_id: bestPerformer,
        predicted_value: null,
      });
    }

    if (worstPerformer) {
      predictions.push({
        tournament_id: tournamentId,
        predictor_id: userId,
        prediction_type: "worst_performer",
        target_user_id: worstPerformer,
        predicted_value: null,
      });
    }

    if (predictions.length === 0) {
      toast({ title: "No predictions to save", description: "Make at least one prediction.", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Delete existing predictions for this user/tournament, then insert fresh
    await supabase
      .from("predictions")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("predictor_id", userId);

    const { error } = await supabase.from("predictions").insert(predictions);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Predictions saved!" });
    }

    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Winner prediction */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500" />
            Predict the Winner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-xs text-muted-foreground">Who will win?</Label>
          <Select value={winner} onValueChange={setWinner}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a player" />
            </SelectTrigger>
            <SelectContent>
              {otherParticipants.map((p) => (
                <SelectItem key={p.user_id} value={p.user_id}>
                  {p.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Score guess */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-blue-500" />
            Guess a Player&apos;s Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Player</Label>
            <Select value={scoreGuessPlayer} onValueChange={setScoreGuessPlayer}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a player" />
              </SelectTrigger>
              <SelectContent>
                {otherParticipants.map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {p.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Predicted total score</Label>
            <Input
              type="number"
              className="mt-1"
              placeholder="e.g. 82"
              value={scoreGuessValue}
              onChange={(e) => setScoreGuessValue(e.target.value)}
              min={50}
              max={200}
            />
          </div>
        </CardContent>
      </Card>

      {/* Best performer */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Best Performer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-xs text-muted-foreground">Who will play the best relative to their handicap?</Label>
          <Select value={bestPerformer} onValueChange={setBestPerformer}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a player" />
            </SelectTrigger>
            <SelectContent>
              {otherParticipants.map((p) => (
                <SelectItem key={p.user_id} value={p.user_id}>
                  {p.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Worst performer */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Worst Performer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-xs text-muted-foreground">Who will struggle the most?</Label>
          <Select value={worstPerformer} onValueChange={setWorstPerformer}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a player" />
            </SelectTrigger>
            <SelectContent>
              {otherParticipants.map((p) => (
                <SelectItem key={p.user_id} value={p.user_id}>
                  {p.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Predictions
      </Button>
    </div>
  );
}
