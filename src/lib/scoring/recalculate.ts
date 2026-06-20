import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateHandicap, type RoundDifferential } from "./handicap";

export interface HandicapRecalcResult {
  previousHandicap: number | null;
  newHandicap: number | null;
  differential: number | null;
  roundsUsed: number;
}

export async function recalculateHandicap(
  supabase: SupabaseClient,
  userId: string,
  triggeringRoundId?: string
): Promise<HandicapRecalcResult> {
  // Fetch last 20 completed rounds with course holes for par and slope info
  const { data: roundsData } = await supabase
    .from("rounds")
    .select(`
      id,
      total_strokes,
      course:courses(
        slope_rating,
        holes(par)
      ),
      tee_set:tee_sets(
        slope_rating
      )
    `)
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("total_strokes", "is", null)
    .order("date", { ascending: false })
    .limit(20);

  if (!roundsData || roundsData.length === 0) {
    return { previousHandicap: null, newHandicap: null, differential: null, roundsUsed: 0 };
  }

  const diffs: RoundDifferential[] = [];
  let triggeringDifferential: number | null = null;

  for (const r of roundsData as any[]) {
    const totalStrokes = typeof r.total_strokes === "number" ? r.total_strokes : 0;
    const course = r.course as any;
    const holes: { par: number }[] = (course?.holes ?? []) as { par: number }[];
    const totalPar = holes.reduce((sum, h) => sum + (h.par || 0), 0);
    if (!totalPar || totalPar <= 0) continue;

    const teeSlope = (r.tee_set as any)?.slope_rating;
    const courseSlope = course?.slope_rating;
    const slope = (teeSlope && teeSlope > 0 ? teeSlope : null) ?? (courseSlope && courseSlope > 0 ? courseSlope : null);

    const rawDiff = slope
      ? (totalStrokes - totalPar) * (113 / slope)
      : (totalStrokes - totalPar);

    diffs.push({ score: totalStrokes, par: totalPar, slope: slope ?? undefined });

    if (triggeringRoundId && r.id === triggeringRoundId) {
      triggeringDifferential = Math.round(rawDiff * 10) / 10;
    }
  }

  // Get previous handicap
  const { data: profile } = await supabase
    .from("profiles")
    .select("handicap_index")
    .eq("id", userId)
    .single();

  const previousHandicap = (profile?.handicap_index as number | null) ?? null;

  const newHandicap = calculateHandicap(diffs);

  if (newHandicap !== null) {
    await supabase
      .from("profiles")
      .update({ handicap_index: newHandicap })
      .eq("id", userId);

    if (triggeringRoundId && triggeringDifferential !== null) {
      await supabase.from("handicap_history").insert({
        user_id: userId,
        handicap_index: newHandicap,
        differential: triggeringDifferential,
        round_id: triggeringRoundId,
      });
    }
  }

  return {
    previousHandicap,
    newHandicap,
    differential: triggeringDifferential,
    roundsUsed: diffs.length,
  };
}
