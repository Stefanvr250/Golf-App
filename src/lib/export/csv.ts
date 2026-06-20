import Papa from "papaparse";

interface HoleData {
  holeNumber: number;
  par: number;
  yardage?: number;
}

interface ScoreData {
  hole_number: number;
  strokes: number;
  putts: number;
  penalties: number;
  fairway_hit: string | null;
  green_in_regulation: boolean | null;
}

interface RoundInfo {
  date: string;
  totalStrokes: number | null;
  courseName: string;
  teeSetName?: string;
  playerName?: string;
}

/**
 * Generate a CSV string for a completed round.
 */
export function generateRoundCSV(
  round: RoundInfo,
  holes: HoleData[],
  scores: ScoreData[]
): string {
  const scoreMap = new Map<number, ScoreData>();
  for (const s of scores) {
    scoreMap.set(s.hole_number, s);
  }

  const rows = holes.map((hole) => {
    const score = scoreMap.get(hole.holeNumber);
    const strokes = score?.strokes ?? 0;
    const vsPar = strokes > 0 ? strokes - hole.par : 0;

    return {
      Hole: hole.holeNumber,
      Par: hole.par,
      Yardage: hole.yardage ?? "",
      Strokes: strokes || "",
      Putts: score?.putts ?? "",
      Penalties: score?.penalties ?? "",
      FIR: score?.fairway_hit ?? "",
      GIR: score?.green_in_regulation != null
        ? score.green_in_regulation
          ? "Yes"
          : "No"
        : "",
      "Score vs Par": strokes > 0
        ? vsPar > 0
          ? `+${vsPar}`
          : vsPar === 0
          ? "E"
          : String(vsPar)
        : "",
    };
  });

  // Add totals row
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const totalYards = holes.reduce((sum, h) => sum + (h.yardage ?? 0), 0);
  const totalStrokes = scores.reduce((sum, s) => sum + s.strokes, 0);
  const totalPutts = scores.reduce((sum, s) => sum + s.putts, 0);
  const totalPenalties = scores.reduce((sum, s) => sum + s.penalties, 0);
  const totalVsPar = totalStrokes > 0 ? totalStrokes - totalPar : 0;

  rows.push({
    Hole: "Total" as any,
    Par: totalPar,
    Yardage: totalYards || ("" as any),
    Strokes: totalStrokes || ("" as any),
    Putts: totalPutts || ("" as any),
    Penalties: totalPenalties || ("" as any),
    FIR: "",
    GIR: "",
    "Score vs Par": totalStrokes > 0
      ? totalVsPar > 0
        ? `+${totalVsPar}`
        : totalVsPar === 0
        ? "E"
        : String(totalVsPar)
      : "",
  });

  // Build header comment lines
  const headerLines = [
    `Course: ${round.courseName}`,
    `Date: ${round.date}`,
    round.teeSetName ? `Tee Set: ${round.teeSetName}` : null,
    round.playerName ? `Player: ${round.playerName}` : null,
    round.totalStrokes != null ? `Total Score: ${round.totalStrokes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const csvData = Papa.unparse(rows);

  return `${headerLines}\n\n${csvData}`;
}
