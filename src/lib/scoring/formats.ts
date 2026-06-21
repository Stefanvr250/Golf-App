import type { TournamentFormat } from "@/lib/validations/tournament";

export interface ParticipantScore {
  userId: string;
  displayName: string;
  handicap: number | null;
  holes: HoleResult[];
}

export interface HoleResult {
  holeNumber: number;
  strokes: number;
  par: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  thru: number;
  vsPar: number | null;
  detail?: string;
}

// ─── Stroke Play ─────────────────────────────────────────────────────────────

function strokePlayLeaderboard(participants: ParticipantScore[]): LeaderboardEntry[] {
  const entries = participants.map((p) => {
    const totalStrokes = p.holes.reduce((s, h) => s + h.strokes, 0);
    const totalPar = p.holes.reduce((s, h) => s + h.par, 0);
    return {
      rank: 0,
      userId: p.userId,
      displayName: p.displayName,
      score: totalStrokes,
      thru: p.holes.length,
      vsPar: totalStrokes - totalPar,
    };
  });
  entries.sort((a, b) => a.score - b.score);
  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}

// ─── Stableford ──────────────────────────────────────────────────────────────

function stablefordPoints(strokes: number, par: number): number {
  const diff = strokes - par;
  if (diff <= -3) return 5; // albatross or better
  if (diff === -2) return 4; // eagle
  if (diff === -1) return 3; // birdie
  if (diff === 0) return 2; // par
  if (diff === 1) return 1; // bogey
  return 0; // double bogey or worse
}

function stablefordLeaderboard(participants: ParticipantScore[]): LeaderboardEntry[] {
  const entries = participants.map((p) => {
    const pts = p.holes.reduce((s, h) => s + stablefordPoints(h.strokes, h.par), 0);
    return {
      rank: 0,
      userId: p.userId,
      displayName: p.displayName,
      score: pts,
      thru: p.holes.length,
      vsPar: null,
      detail: `${pts} pts`,
    };
  });
  entries.sort((a, b) => b.score - a.score); // highest points wins
  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}

// ─── Match Play ──────────────────────────────────────────────────────────────

function matchPlayLeaderboard(participants: ParticipantScore[]): LeaderboardEntry[] {
  // Match play is head-to-head; without bracket info, show holes won count
  if (participants.length !== 2) {
    return strokePlayLeaderboard(participants);
  }
  const [a, b] = participants;
  let aWins = 0;
  let bWins = 0;
  const maxHoles = Math.min(a.holes.length, b.holes.length);
  for (let i = 0; i < maxHoles; i++) {
    if (a.holes[i].strokes < b.holes[i].strokes) aWins++;
    else if (b.holes[i].strokes < a.holes[i].strokes) bWins++;
  }
  const entries: LeaderboardEntry[] = [
    { rank: 1, userId: a.userId, displayName: a.displayName, score: aWins, thru: maxHoles, vsPar: null, detail: `${aWins} holes won` },
    { rank: 2, userId: b.userId, displayName: b.displayName, score: bWins, thru: maxHoles, vsPar: null, detail: `${bWins} holes won` },
  ];
  if (bWins > aWins) {
    entries[0].rank = 2;
    entries[1].rank = 1;
    entries.reverse();
  }
  return entries;
}

// ─── Skins ───────────────────────────────────────────────────────────────────

function skinsLeaderboard(participants: ParticipantScore[]): LeaderboardEntry[] {
  const skinCount: Record<string, number> = {};
  participants.forEach((p) => (skinCount[p.userId] = 0));

  if (participants.length < 2) return strokePlayLeaderboard(participants);

  const maxHoles = Math.min(...participants.map((p) => p.holes.length));
  let carryOver = 0;

  for (let i = 0; i < maxHoles; i++) {
    const scores = participants.map((p) => ({ userId: p.userId, strokes: p.holes[i].strokes }));
    scores.sort((a, b) => a.strokes - b.strokes);
    if (scores[0].strokes < scores[1].strokes) {
      skinCount[scores[0].userId] += 1 + carryOver;
      carryOver = 0;
    } else {
      carryOver++;
    }
  }

  const entries: LeaderboardEntry[] = participants.map((p) => ({
    rank: 0,
    userId: p.userId,
    displayName: p.displayName,
    score: skinCount[p.userId],
    thru: maxHoles,
    vsPar: null,
    detail: `${skinCount[p.userId]} skins`,
  }));
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}

// ─── Ryder Cup ───────────────────────────────────────────────────────────────

function ryderCupLeaderboard(participants: ParticipantScore[]): LeaderboardEntry[] {
  // Point-based match play — simplified: each hole worth 1 point, half for tie
  if (participants.length !== 2) return strokePlayLeaderboard(participants);
  const [a, b] = participants;
  let aPoints = 0;
  let bPoints = 0;
  const maxHoles = Math.min(a.holes.length, b.holes.length);
  for (let i = 0; i < maxHoles; i++) {
    if (a.holes[i].strokes < b.holes[i].strokes) aPoints++;
    else if (b.holes[i].strokes < a.holes[i].strokes) bPoints++;
    else { aPoints += 0.5; bPoints += 0.5; }
  }
  const entries: LeaderboardEntry[] = [
    { rank: 1, userId: a.userId, displayName: a.displayName, score: aPoints, thru: maxHoles, vsPar: null, detail: `${aPoints} pts` },
    { rank: 2, userId: b.userId, displayName: b.displayName, score: bPoints, thru: maxHoles, vsPar: null, detail: `${bPoints} pts` },
  ];
  if (bPoints > aPoints) { entries[0].rank = 2; entries[1].rank = 1; entries.reverse(); }
  return entries;
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export function calculateLeaderboard(
  format: TournamentFormat,
  participants: ParticipantScore[]
): LeaderboardEntry[] {
  switch (format) {
    case "stroke_play":
      return strokePlayLeaderboard(participants);
    case "stableford":
      return stablefordLeaderboard(participants);
    case "match_play":
      return matchPlayLeaderboard(participants);
    case "ryder_cup":
      return ryderCupLeaderboard(participants);
    case "skins":
      return skinsLeaderboard(participants);
    default:
      return strokePlayLeaderboard(participants);
  }
}
