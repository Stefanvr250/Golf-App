"use client";

import * as React from "react";
import { Wifi, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Lightweight online/offline indicator based on `navigator.onLine`.
 * The full offline sync status (pending count etc.) is added in M9 via
 * `useOfflineSync`.
 */
export function OnlineStatus({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Avoid hydration mismatch — render nothing until mounted.
  if (!mounted) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        isOnline
          ? "bg-primary/10 text-primary"
          : "bg-destructive/10 text-destructive",
        className
      )}
      title={isOnline ? "Online" : "Offline — scores will sync when reconnected"}
    >
      {isOnline ? (
        <Wifi className="h-3.5 w-3.5" />
      ) : (
        <WifiOff className="h-3.5 w-3.5" />
      )}
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}
