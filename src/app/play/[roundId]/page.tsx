import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Flag } from "lucide-react";
import { FinishRoundButton } from "@/components/scoring/FinishRoundButton";
import { cn } from "@/lib/utils";

interface HoleScore {
  id: string;
  round_id: string;
  hole_id: string;
  hole_number: number;
  strokes: number;
  putts: number;
  penalties: number;
  fairway_hit: string | null;
  green_in_regulation: boolean | null;
}

interface Props {
  params: { roundId: string };
}

export default async function ScorecardPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch round with course
  const { data: round } = await supabase
    .from("rounds")
    .select("*, course:courses(*), tee_set:tee_sets(*)")
    .eq("id", params.roundId)
    .eq("user_id", user.id)
    .single();

  if (!round) notFound();

  const course = round.course as unknown as {
    id: string;
    name: string;
    num_holes: number;
  };

  const teeSet = round.tee_set as unknown as {
    id: string;
    name: string;
    color: string | null;
  } | null;

  // Fetch holes for this course
  const { data: holes } = await supabase
    .from("holes")
    .select("*")
    .eq("course_id", course.id)
    .order("hole_number");

  // Fetch hole scores for this round
  const { data: holeScores } = await supabase
    .from("hole_scores")
    .select("*")
    .eq("round_id", params.roundId);

  const scoreMap: Record<number, HoleScore> = {};
  for (const s of (holeScores ?? []) as HoleScore[]) {
    scoreMap[s.hole_number] = s;
  }

  // Fetch yardages for selected tee set
  const holeIds = (holes ?? []).map((h) => h.id);
  let yardageMap: Record<string, number> = {};
  if (teeSet && holeIds.length > 0) {
    const { data: holeTees } = await supabase
      .from("hole_tees")
      .select("hole_id, yardage")
      .eq("tee_set_id", teeSet.id)
      .in("hole_id", holeIds);

    for (const ht of holeTees ?? []) {
      yardageMap[ht.hole_id] = ht.yardage;
    }
  }

  const numHoles = course.num_holes ?? 18;
  const front9 = (holes ?? []).filter((h) => h.hole_number <= 9);
  const back9 = (holes ?? []).filter((h) => h.hole_number > 9);

  function calcTotals(holeList: typeof holes) {
    let par = 0;
    let yards = 0;
    let score = 0;
    for (const h of holeList ?? []) {
      par += h.par ?? 0;
      yards += yardageMap[h.id] ?? 0;
      score += scoreMap[h.hole_number]?.strokes ?? 0;
    }
    return { par, yards, score };
  }

  const frontTotals = calcTotals(front9);
  const backTotals = calcTotals(back9);
  const grandTotals = {
    par: frontTotals.par + backTotals.par,
    yards: frontTotals.yards + backTotals.yards,
    score: frontTotals.score + backTotals.score,
  };

  const isCompleted = round.status === "completed";

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{new Date(round.date).toLocaleDateString("en-ZA")}</span>
            {teeSet && (
              <>
                <span>•</span>
                <Badge variant="secondary" className="text-[10px]">
                  <span
                    className="mr-1 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: teeSet.color ?? "#888" }}
                  />
                  {teeSet.name}
                </Badge>
              </>
            )}
            <Badge
              variant={isCompleted ? "default" : "outline"}
              className="text-[10px]"
            >
              {isCompleted ? "Completed" : "In Progress"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Scorecard table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scorecard</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-2 py-1.5 text-left">Hole</th>
                <th className="px-2 py-1.5 text-center">Par</th>
                <th className="px-2 py-1.5 text-center">Yds</th>
                <th className="px-2 py-1.5 text-center">Score</th>
                <th className="px-2 py-1.5 text-center">+/-</th>
              </tr>
            </thead>
            <tbody>
              {front9.map((hole) => (
                <ScoreRow
                  key={hole.id}
                  hole={hole}
                  score={scoreMap[hole.hole_number]}
                  yardage={yardageMap[hole.id]}
                  roundId={params.roundId}
                />
              ))}
              {/* Out */}
              <tr className="border-t bg-muted/30 font-medium">
                <td className="px-2 py-1.5">Out</td>
                <td className="px-2 py-1.5 text-center">{frontTotals.par}</td>
                <td className="px-2 py-1.5 text-center">
                  {frontTotals.yards || "—"}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {frontTotals.score || "—"}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {frontTotals.score > 0 ? (
                    <VsPar par={frontTotals.par} score={frontTotals.score} />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
              {back9.map((hole) => (
                <ScoreRow
                  key={hole.id}
                  hole={hole}
                  score={scoreMap[hole.hole_number]}
                  yardage={yardageMap[hole.id]}
                  roundId={params.roundId}
                />
              ))}
              {/* In */}
              {numHoles === 18 && (
                <tr className="border-t bg-muted/30 font-medium">
                  <td className="px-2 py-1.5">In</td>
                  <td className="px-2 py-1.5 text-center">{backTotals.par}</td>
                  <td className="px-2 py-1.5 text-center">
                    {backTotals.yards || "—"}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {backTotals.score || "—"}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {backTotals.score > 0 ? (
                      <VsPar par={backTotals.par} score={backTotals.score} />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              )}
              {/* Total */}
              <tr className="border-t bg-muted/50 font-semibold">
                <td className="px-2 py-1.5">Total</td>
                <td className="px-2 py-1.5 text-center">{grandTotals.par}</td>
                <td className="px-2 py-1.5 text-center">
                  {grandTotals.yards || "—"}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {grandTotals.score || "—"}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {grandTotals.score > 0 ? (
                    <VsPar par={grandTotals.par} score={grandTotals.score} />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Running total */}
      {grandTotals.score > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">Running Total</p>
            <p className="text-xl font-bold">
              {grandTotals.score}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({grandTotals.par} par)
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">vs Par</p>
            <p
              className={cn(
                "text-xl font-bold",
                grandTotals.score < grandTotals.par && "text-green-600",
                grandTotals.score > grandTotals.par && "text-red-600"
              )}
            >
              {grandTotals.score < grandTotals.par ? "-" : grandTotals.score > grandTotals.par ? "+" : ""}
              {Math.abs(grandTotals.score - grandTotals.par)}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isCompleted ? (
        <div className="space-y-3">
          <FinishRoundButton roundId={params.roundId} />
          <p className="text-center text-xs text-muted-foreground">
            Tap a hole row above to enter or edit your score.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Link href={`/play/${params.roundId}/summary`}>
            <Button className="w-full" size="lg" variant="outline">
              <Flag className="mr-2 h-4 w-4" />
              View Summary
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function ScoreRow({
  hole,
  score,
  yardage,
  roundId,
}: {
  hole: {
    id: string;
    hole_number: number;
    par: number;
  };
  score?: { strokes: number; putts?: number };
  yardage?: number;
  roundId: string;
}) {
  const hasScore = score && score.strokes > 0;
  return (
    <tr className="border-b last:border-0">
      <td className="px-2 py-1.5">
        <Link
          href={`/play/${roundId}/hole/${hole.hole_number}`}
          className="flex items-center gap-1 font-medium hover:text-primary"
        >
          {hole.hole_number}
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </Link>
      </td>
      <td className="px-2 py-1.5 text-center">{hole.par}</td>
      <td className="px-2 py-1.5 text-center text-muted-foreground">
        {yardage ?? "—"}
      </td>
      <td className="px-2 py-1.5 text-center">
        {hasScore ? (
          <span className="font-semibold">{score.strokes}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-2 py-1.5 text-center">
        {hasScore ? (
          <VsPar par={hole.par} score={score.strokes} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

function VsPar({ par, score }: { par: number; score: number }) {
  const diff = score - par;
  return (
    <span
      className={cn(
        "font-semibold",
        diff < 0 && "text-green-600",
        diff === 0 && "text-foreground",
        diff > 0 && "text-red-600"
      )}
    >
      {diff > 0 ? `+${diff}` : diff}
    </span>
  );
}
