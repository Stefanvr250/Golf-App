import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HoleDetailClient } from "@/components/scoring/HoleDetailClient";

interface Props {
  params: { roundId: string; n: string };
}

function parsePoint(point: unknown): { lat: number; lng: number } | null {
  if (!point) return null;
  if (typeof point === "object" && point !== null) {
    const p = point as { type?: string; coordinates?: number[] };
    if (p.type === "Point" && Array.isArray(p.coordinates) && p.coordinates.length >= 2) {
      return { lat: p.coordinates[1], lng: p.coordinates[0] };
    }
  }
  if (typeof point === "string") {
    // Try to parse "POINT(lng lat)"
    const match = point.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);
    if (match) return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
  }
  return null;
}

export default async function HoleDetailPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const holeNumber = parseInt(params.n, 10);
  if (isNaN(holeNumber) || holeNumber < 1 || holeNumber > 36) notFound();

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
  } | null;

  // Fetch hole
  const { data: hole } = await supabase
    .from("holes")
    .select("*")
    .eq("course_id", course.id)
    .eq("hole_number", holeNumber)
    .single();

  if (!hole) notFound();

  // Fetch yardage for this hole + tee set
  let yardage: number | undefined;
  if (teeSet) {
    const { data: holeTee } = await supabase
      .from("hole_tees")
      .select("yardage")
      .eq("hole_id", hole.id)
      .eq("tee_set_id", teeSet.id)
      .single();
    if (holeTee) yardage = holeTee.yardage;
  }

  // Fetch existing score
  const { data: holeScore } = await supabase
    .from("hole_scores")
    .select("*")
    .eq("round_id", params.roundId)
    .eq("hole_number", holeNumber)
    .maybeSingle();

  // Parse coordinates
  const greenCenter = parsePoint(hole.green_center);
  const greenFront = parsePoint(hole.green_front);
  const greenBack = parsePoint(hole.green_back);
  const pinLocation = parsePoint(hole.pin_location);

  const center = greenCenter ?? pinLocation;

  // Fetch hazards for this hole
  const { data: hazards } = await supabase
    .from("hazards")
    .select("*")
    .eq("hole_id", hole.id);

  return (
    <HoleDetailClient
      roundId={params.roundId}
      courseName={course.name}
      numHoles={course.num_holes ?? 18}
      hole={{
        id: hole.id,
        number: hole.hole_number,
        par: hole.par,
        yardage,
        handicapIndex: hole.handicap_index,
      }}
      center={center}
      targets={
        greenFront && greenCenter && greenBack
          ? [
              { label: "Front", lat: greenFront.lat, lng: greenFront.lng },
              { label: "Center", lat: greenCenter.lat, lng: greenCenter.lng },
              { label: "Back", lat: greenBack.lat, lng: greenBack.lng },
            ]
          : center
          ? [{ label: "Pin", lat: center.lat, lng: center.lng }]
          : []
      }
      hazards={
        (hazards ?? [])
          .map((h) => {
            const loc = parsePoint(h.location);
            return loc
              ? { label: h.label ?? h.type, lat: loc.lat, lng: loc.lng }
              : null;
          })
          .filter(Boolean) as { label: string; lat: number; lng: number }[]
      }
      existingScore={
        holeScore
          ? {
              strokes: holeScore.strokes ?? 0,
              putts: holeScore.putts ?? 0,
              penalties: holeScore.penalties ?? 0,
              fairwayHit: holeScore.fairway_hit as "yes" | "no" | "na" | undefined,
              greenInRegulation: holeScore.green_in_regulation ?? undefined,
              club: undefined,
              lieType: undefined,
            }
          : undefined
      }
      holeScoreId={holeScore?.id}
    />
  );
}
