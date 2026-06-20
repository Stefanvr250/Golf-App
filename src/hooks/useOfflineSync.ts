"use client";

import * as React from "react";
import { syncOfflineData, syncAllOfflineRounds } from "@/lib/offline/sync";
import { getPendingCount } from "@/lib/offline/queue";

interface UseOfflineSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncResult: { synced: number; failed: number } | null;
  triggerSync: () => Promise<void>;
}

/**
 * Hook that monitors online/offline status and triggers sync when connectivity
 * is restored. Also exposes manual sync trigger and pending count.
 */
export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);
  const [lastSyncResult, setLastSyncResult] = React.useState<{
    synced: number;
    failed: number;
  } | null>(null);

  // Refresh pending count
  const refreshPending = React.useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB not available (SSR)
    }
  }, []);

  // Full sync: actions queue + offline rounds
  const triggerSync = React.useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    setIsSyncing(true);
    try {
      const actionResult = await syncOfflineData();
      const roundResult = await syncAllOfflineRounds();

      const result = {
        synced: actionResult.synced + roundResult.synced,
        failed: actionResult.failed + roundResult.failed,
      };

      setLastSyncResult(result);
      await refreshPending();
    } catch {
      // Sync failed — will retry on next online event
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPending]);

  // Monitor online/offline
  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshPending();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync, refreshPending]);

  // Periodic pending count refresh
  React.useEffect(() => {
    const interval = setInterval(refreshPending, 30_000);
    return () => clearInterval(interval);
  }, [refreshPending]);

  return { isOnline, isSyncing, pendingCount, lastSyncResult, triggerSync };
}
