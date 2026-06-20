import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoundSummary } from "@/components/scoring/RoundSummary";
import { ArrowLeft, Share2, Download } from "lucide-react";

interface Props {
  params: { roundId: string };
}

export default async function RoundSummaryPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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

  // Fetch holes
  const { data: holes } = await supabase
    .from("holes")
    .select("*")
    .eq("course_id", course.id)
    .order("hole_number");

  // Fetch scores
  const { data: scores } = await supabase
    .from("hole_scores")
    .select("*")
    .eq("round_id", params.roundId);

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/play/${params.roundId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight truncate">{course.name}</h1>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{new Date(round.date).toLocaleDateString("en-ZA")}</span>
            {teeSet && (
              <>
                <span>•</span>
                <Badge variant="secondary" className="text-[10px]">
                  <span
                    className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: teeSet.color ?? "#888" }}
                  />
                  {teeSet.name}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <RoundSummary holes={holes ?? []} scores={scores ?? []} />

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" size="lg">
          <Share2 className="mr-2 h-4 w-4" />
          Share Round
        </Button>
        <Button variant="outline" className="flex-1" size="lg">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Export features coming in Milestone 10.
      </p>
    </div>
  );
}
