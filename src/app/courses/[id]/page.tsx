import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, MapPin, Pencil } from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function CourseDetailPage({ params }: Props) {
  const supabase = createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!course) notFound();

  const { data: holes } = await supabase
    .from("holes")
    .select("*")
    .eq("course_id", params.id)
    .order("hole_number");

  const { data: teeSets } = await supabase
    .from("tee_sets")
    .select("*")
    .eq("course_id", params.id);

  const { data: holeTees } = await supabase
    .from("hole_tees")
    .select("*")
    .in(
      "hole_id",
      (holes ?? []).map((h) => h.id)
    );

  // Group hole_tees by tee_set_id
  const teeYardages: Record<string, Record<string, number>> = {};
  for (const ht of holeTees ?? []) {
    if (!teeYardages[ht.tee_set_id]) teeYardages[ht.tee_set_id] = {};
    teeYardages[ht.tee_set_id][ht.hole_id] = ht.yardage;
  }

  const totalPar = (holes ?? []).reduce((sum, h) => sum + h.par, 0);

  return (
    <div className="container max-w-4xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {course.city && <span>{course.city}</span>}
            {course.province && <span>• {course.province}</span>}
            <Badge variant="secondary" className="text-[10px]">
              {course.num_holes} holes
            </Badge>
            <Badge variant="secondary" className="text-[10px] capitalize">
              {course.source}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/courses/${params.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Request Edit
            </Button>
          </Link>
          <Link href={`/play?course=${params.id}`}>
            <Button size="sm">
              <Flag className="mr-1.5 h-3.5 w-3.5" />
              Play This Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Holes table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scorecard</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {holes && holes.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-2 py-1 text-left">Hole</th>
                  <th className="px-2 py-1 text-center">Par</th>
                  <th className="px-2 py-1 text-center">HCP</th>
                  {(teeSets ?? []).map((ts) => (
                    <th key={ts.id} className="px-2 py-1 text-center">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full mr-1"
                        style={{ backgroundColor: ts.color ?? "#888" }}
                      />
                      {ts.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holes.map((hole) => (
                  <tr key={hole.id} className="border-b last:border-0">
                    <td className="px-2 py-1.5 font-medium">{hole.hole_number}</td>
                    <td className="px-2 py-1.5 text-center">{hole.par}</td>
                    <td className="px-2 py-1.5 text-center text-muted-foreground">
                      {hole.handicap_index ?? "—"}
                    </td>
                    {(teeSets ?? []).map((ts) => (
                      <td key={ts.id} className="px-2 py-1.5 text-center">
                        {teeYardages[ts.id]?.[hole.id] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="border-t bg-muted/30 font-medium">
                  <td className="px-2 py-1.5">Total</td>
                  <td className="px-2 py-1.5 text-center">{totalPar}</td>
                  <td className="px-2 py-1.5" />
                  {(teeSets ?? []).map((ts) => {
                    const total = (holes ?? []).reduce(
                      (sum, h) => sum + (teeYardages[ts.id]?.[h.id] ?? 0),
                      0
                    );
                    return (
                      <td key={ts.id} className="px-2 py-1.5 text-center">
                        {total || "—"}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hole data available yet.{" "}
              <Link
                href={`/courses/${params.id}/edit`}
                className="font-medium text-primary hover:underline"
              >
                Request an edit
              </Link>{" "}
              to add hole information.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Course info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          {course.course_rating && (
            <div>
              <p className="text-xs text-muted-foreground">Course Rating</p>
              <p className="font-medium">{course.course_rating}</p>
            </div>
          )}
          {course.slope_rating && (
            <div>
              <p className="text-xs text-muted-foreground">Slope Rating</p>
              <p className="font-medium">{course.slope_rating}</p>
            </div>
          )}
          {course.address && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-medium">{course.address}</p>
            </div>
          )}
          {course.osm_id && (
            <div>
              <p className="text-xs text-muted-foreground">OSM ID</p>
              <p className="font-medium">{course.osm_id}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
