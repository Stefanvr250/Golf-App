export interface RoundDifferential {
  score: number;
  par: number;
  slope?: number | null;
}

/**
 * Simplified WHS table: number of best differentials to use based on rounds played (max 20).
 */
export function getBestDifferentialCount(roundCount: number): number {
  if (roundCount < 3) return 0;
  if (roundCount <= 3) return 1;
  if (roundCount <= 6) return 2;
  if (roundCount <= 8) return 2;
  if (roundCount <= 11) return 3;
  if (roundCount <= 14) return 4;
  if (roundCount <= 16) return 5;
  if (roundCount <= 18) return 6;
  if (roundCount === 19) return 7;
  return 8;
}

/**
 * Calculate simplified handicap index.
 * - Requires at least 3 valid rounds.
 * - Differential per round = (score - par) * (113 / slope) if slope, else (score - par).
 * - Use best N per simplified table, average, * 0.96, round to 1 decimal.
 */
export function calculateHandicap(rounds: RoundDifferential[]): number | null {
  const valid = rounds.filter(
    (r) => typeof r.score === "number" && typeof r.par === "number" && r.score > 0 && r.par > 0
  );
  const n = valid.length;
  if (n < 3) return null;

  const diffs = valid.map((r) => {
    const slope = r.slope && r.slope > 0 ? r.slope : null;
    const raw = slope ? (r.score - r.par) * (113 / slope) : r.score - r.par;
    return raw;
  });

  const bestN = getBestDifferentialCount(n);
  const sorted = [...diffs].sort((a, b) => a - b);
  const best = sorted.slice(0, bestN);
  const avg = best.reduce((sum, d) => sum + d, 0) / best.length;
  const hcp = Math.round(avg * 0.96 * 10) / 10;
  return hcp;
}
