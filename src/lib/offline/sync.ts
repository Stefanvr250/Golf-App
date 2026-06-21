import { db } from "./db";
import { getPendingActions, markSyncing, removeAction, markFailed } from "./queue";

/**
 * Process all pending offline actions by replaying them against the server.
 * Returns the number of successfully synced actions.
 */
export async function syncOfflineData(): Promise<{ synced: number; failed: number }> {
  const actions = await getPendingActions();
  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    if (!action.id) continue;

    // Skip actions that have been retried too many times
    if (action.retries >= 5) {
      failed++;
      continue;
    }

    await markSyncing(action.id);

    try {
      const payload = JSON.parse(action.payload);
      let success = false;

      switch (action.type) {
        case "save_score":
          success = await syncSaveScore(payload);
          break;
        case "create_round":
          success = await syncCreateRound(payload);
          break;
        case "complete_round":
          success = await syncCompleteRound(payload);
          break;
        case "sync_rounds_batch":
          success = await syncRoundsBatch(payload);
          break;
        default:
          // Unknown action type — skip
          success = false;
      }

      if (success) {
        await removeAction(action.id);
        synced++;
      } else {
        await markFailed(action.id);
        failed++;
      }
    } catch {
      await markFailed(action.id);
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Sync a single score save to the server.
 */
async function syncSaveScore(payload: {
  roundId: string;
  holeNumber: number;
  strokes: number;
  putts: number;
  penalties: number;
  fairwayHit?: string;
  greenInRegulation?: boolean;
}): Promise<boolean> {
  const res = await fetch(`/api/rounds/${payload.roundId}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      holeNumber: payload.holeNumber,
      strokes: payload.strokes,
      putts: payload.putts,
      penalties: payload.penalties,
      fairwayHit: payload.fairwayHit,
      greenInRegulation: payload.greenInRegulation,
    }),
  });

  if (res.ok) {
    // Mark the offline score as synced
    const score = await db.holeScores
      .where("[offlineRoundId+holeNumber]")
      .equals([payload.roundId, payload.holeNumber])
      .first();
    if (score?.id) {
      await db.holeScores.update(score.id, { synced: 1 });
    }
    return true;
  }

  return false;
}

/**
 * Sync a round creation.
 */
async function syncCreateRound(payload: {
  offlineId: string;
  courseId: string;
  teeSetId?: string;
  tournamentId?: string;
  date?: string;
}): Promise<boolean> {
  const res = await fetch("/api/rounds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      courseId: payload.courseId,
      teeSetId: payload.teeSetId,
      tournamentId: payload.tournamentId,
      date: payload.date,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    // Update offline round with server ID
    await db.rounds.update(payload.offlineId, {
      serverId: data.roundId,
      synced: 1,
    });
    return true;
  }

  return false;
}

/**
 * Sync a round completion.
 */
async function syncCompleteRound(payload: { roundId: string }): Promise<boolean> {
  const res = await fetch(`/api/rounds/${payload.roundId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "completed" }),
  });

  return res.ok;
}

/**
 * Sync a batch of offline rounds via the /api/rounds/sync endpoint.
 */
async function syncRoundsBatch(payload: {
  rounds: {
    offlineId: string;
    courseId: string;
    teeSetId?: string;
    tournamentId?: string;
    date?: string;
    scores: {
      holeNumber: number;
      strokes: number;
      putts: number;
      penalties: number;
      fairwayHit?: string;
      greenInRegulation?: boolean;
    }[];
  }[];
}): Promise<boolean> {
  const res = await fetch("/api/rounds/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const data = await res.json();
    // Map offline IDs to server IDs
    if (data.results) {
      for (const result of data.results) {
        if (result.offlineId && result.serverId) {
          await db.rounds.update(result.offlineId, {
            serverId: result.serverId,
            synced: 1,
          });
        }
      }
    }
    // Mark all scores as synced
    for (const round of payload.rounds) {
      await db.holeScores
        .where("offlineRoundId")
        .equals(round.offlineId)
        .modify({ synced: 1 });
    }
    return true;
  }

  return false;
}

/**
 * Sync all unsynced offline rounds as a batch.
 */
export async function syncAllOfflineRounds(): Promise<{ synced: number; failed: number }> {
  const unsyncedRounds = await db.rounds.where("synced").equals(0).toArray();

  if (unsyncedRounds.length === 0) {
    return { synced: 0, failed: 0 };
  }

  const roundsPayload = [];

  for (const round of unsyncedRounds) {
    const scores = await db.holeScores
      .where("offlineRoundId")
      .equals(round.offlineId)
      .toArray();

    roundsPayload.push({
      offlineId: round.offlineId,
      courseId: round.courseId,
      teeSetId: round.teeSetId,
      tournamentId: round.tournamentId,
      date: round.date,
      scores: scores.map((s) => ({
        holeNumber: s.holeNumber,
        strokes: s.strokes,
        putts: s.putts,
        penalties: s.penalties,
        fairwayHit: s.fairwayHit,
        greenInRegulation: s.greenInRegulation,
      })),
    });
  }

  const success = await syncRoundsBatch({ rounds: roundsPayload });
  return success
    ? { synced: roundsPayload.length, failed: 0 }
    : { synced: 0, failed: roundsPayload.length };
}
