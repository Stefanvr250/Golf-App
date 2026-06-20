import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock } from "lucide-react";
import { PredictionForm } from "@/components/predictions/PredictionForm";
import { PredictionResults } from "@/components/predictions/PredictionResults";

interface Props {
  params: { id: string };
}

export default async function PredictionsPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch tournament
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, status, organizer_id, course:courses(name)")
    .eq("id", params.id)
    .single();

  if (!tournament) notFound();

  const rawCourse: any = (tournament as any).course;
  const courseObj = Array.isArray(rawCourse) ? (rawCourse[0] ?? null) : (rawCourse ?? null);

  // Verify participant
  const { data: participant } = await supabase
    .from("tournament_participants")
    .select("id")
    .eq("tournament_id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return (
      <div className="container max-w-2xl space-y-6 py-6">
        <p className="py-12 text-center text-sm text-muted-foreground">
          You must be a participant to view predictions.
        </p>
      </div>
    );
  }

  // Fetch participants with display names
  const { data: participantsRaw } = await supabase
    .from("tournament_participants")
    .select("user_id, profiles:profiles(display_name)")
    .eq("tournament_id", params.id);

  const participants = (participantsRaw ?? []).map((p: any) => {
    const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    return {
      user_id: p.user_id,
      display_name: prof?.display_name ?? "Player",
    };
  });

  // Fetch existing predictions for current user (for form pre-fill)
  const { data: existingPreds } = await supabase
    .from("predictions")
    .select("id, prediction_type, target_user_id, predicted_value")
    .eq("tournament_id", params.id)
    .eq("predictor_id", user.id);

  // For results: fetch ALL predictions with predictor names
  const { data: allPredsRaw } = await supabase
    .from("predictions")
    .select("id, predictor_id, prediction_type, target_user_id, predicted_value, actual_value, points_earned, predictor:profiles!predictions_predictor_id_fkey(display_name)")
    .eq("tournament_id", params.id);

  const allPredictions = (allPredsRaw ?? []).map((p: any) => {
    const predictorProf = Array.isArray(p.predictor) ? p.predictor[0] : p.predictor;
    const targetParticipant = participants.find((pp: any) => pp.user_id === p.target_user_id);
    return {
      id: p.id,
      predictor_id: p.predictor_id,
      prediction_type: p.prediction_type,
      target_user_id: p.target_user_id,
      predicted_value: p.predicted_value,
      actual_value: p.actual_value,
      points_earned: p.points_earned ?? 0,
      predictor_name: predictorProf?.display_name ?? "Player",
      target_name: targetParticipant?.display_name ?? null,
    };
  });

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href={`/tournaments/${params.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Predictions</h1>
          <p className="text-sm text-muted-foreground">
            {tournament.name} • {courseObj?.name}
          </p>
        </div>
        <Badge variant="outline" className="ml-auto capitalize">
          {tournament.status.replace("_", " ")}
        </Badge>
      </div>

      {tournament.status === "upcoming" && (
        <PredictionForm
          tournamentId={params.id}
          userId={user.id}
          participants={participants}
          existing={(existingPreds ?? []).map((p: any) => ({
            id: p.id,
            prediction_type: p.prediction_type,
            target_user_id: p.target_user_id,
            predicted_value: p.predicted_value,
          }))}
        />
      )}

      {tournament.status === "in_progress" && (
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Predictions Locked</p>
              <p className="text-sm text-muted-foreground">
                The tournament is in progress. Predictions can no longer be changed.
                Results will be shown after the tournament is finalized.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {tournament.status === "completed" && (
        <PredictionResults predictions={allPredictions} participants={participants} />
      )}

      {tournament.status === "cancelled" && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            This tournament was cancelled. Predictions are void.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
