import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Trophy } from "lucide-react";

export default async function RoundHistoryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, course:courses(name, num_holes)")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("date", { ascending: false })
    .limit(50);

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Round History</h1>
      </div>

      {!rounds || rounds.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="mt-2 text-sm text-muted-foreground">No completed rounds yet.</p>
          <Link href="/play" className="mt-2 inline-block text-sm text-primary hover:underline">
            Start your first round
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rounds.map((round) => {
            const course = round.course as unknown as {
              name: string;
              num_holes: number;
            };
            const vsPar =
              round.total_strokes && course
                ? round.total_strokes - (course.num_holes === 9 ? 36 : 72)
                : null;

            return (
              <Link key={round.id} href={`/play/${round.id}/summary`}>
                <Card className="cursor-pointer transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{course?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(round.date).toLocaleDateString("en-ZA")}
                        {course?.num_holes && ` • ${course.num_holes} holes`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold">{round.total_strokes ?? "—"}</p>
                        {vsPar !== null && (
                          <p
                            className={`text-xs font-medium ${
                              vsPar < 0 ? "text-green-600" : vsPar > 0 ? "text-red-600" : ""
                            }`}
                          >
                            {vsPar > 0 ? `+${vsPar}` : `${vsPar}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Putts</p>
                        <p className="text-sm font-medium">
                          {round.total_putts ?? "—"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
