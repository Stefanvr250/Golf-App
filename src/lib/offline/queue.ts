import { db, type OfflineAction } from "./db";

/**
 * Enqueue an offline action to be synced later.
 */
export async function enqueueAction(type: string, payload: Record<string, unknown>): Promise<number> {
  return db.actions.add({
    type,
    payload: JSON.stringify(payload),
    createdAt: new Date().toISOString(),
    retries: 0,
    status: "pending",
  });
}

/**
 * Get all pending actions, ordered by creation time.
 */
export async function getPendingActions(): Promise<OfflineAction[]> {
  return db.actions
    .where("status")
    .equals("pending")
    .sortBy("createdAt");
}

/**
 * Mark an action as syncing (in-flight).
 */
export async function markSyncing(id: number): Promise<void> {
  await db.actions.update(id, { status: "syncing" });
}

/**
 * Remove a successfully synced action.
 */
export async function removeAction(id: number): Promise<void> {
  await db.actions.delete(id);
}

/**
 * Mark an action as failed, incrementing retries.
 */
export async function markFailed(id: number): Promise<void> {
  const action = await db.actions.get(id);
  if (action) {
    await db.actions.update(id, {
      status: "pending",
      retries: action.retries + 1,
    });
  }
}

/**
 * Get the count of pending actions.
 */
export async function getPendingCount(): Promise<number> {
  return db.actions.where("status").anyOf(["pending", "syncing"]).count();
}

/**
 * Clear all completed/synced actions (cleanup).
 */
export async function clearSynced(): Promise<void> {
  // Remove actions that are no longer pending
  const synced = await db.actions.where("status").noneOf(["pending", "syncing"]).toArray();
  const ids = synced.map((a) => a.id).filter((id): id is number => id != null);
  await db.actions.bulkDelete(ids);
}
