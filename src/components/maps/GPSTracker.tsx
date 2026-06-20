"use client";

import * as React from "react";
import { Navigation, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGPS } from "@/hooks/useGPS";
import { distanceToPoint, bearingToCardinal, bearingToPoint } from "@/lib/maps/distance";

export interface TargetPoint {
  label: string;
  lat: number;
  lng: number;
}

interface GPSTrackerProps {
  targets: TargetPoint[];
  hazards?: TargetPoint[];
}

/**
 * Displays live GPS distance panel showing distance to pin (front/center/back)
 * and nearest hazards. Updates on GPS position change.
 */
export function GPSTracker({ targets, hazards = [] }: GPSTrackerProps) {
  const { position, error, isTracking, startTracking, stopTracking } = useGPS();

  React.useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!isTracking || !position) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
        <Navigation className="h-4 w-4 animate-pulse" />
        <span>Acquiring GPS signal…</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      {/* Accuracy indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              position.accuracy < 10
                ? "bg-green-500"
                : position.accuracy < 30
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
          GPS ±{Math.round(position.accuracy)}m
        </span>
      </div>

      {/* Distance to targets */}
      {targets.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {targets.map((target) => {
            const yards = distanceToPoint(
              position.lat,
              position.lng,
              target.lat,
              target.lng
            );
            const bearing = bearingToPoint(
              position.lat,
              position.lng,
              target.lat,
              target.lng
            );
            const cardinal = bearingToCardinal(bearing);

            return (
              <div key={target.label} className="text-center">
                <p className="text-xs text-muted-foreground">{target.label}</p>
                <p className="text-lg font-bold tabular-nums">{yards}</p>
                <p className="text-[10px] text-muted-foreground">yds {cardinal}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Nearest hazards */}
      {hazards.length > 0 && (
        <div className="border-t pt-2">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Hazards</p>
          <div className="flex flex-wrap gap-1.5">
            {hazards
              .map((h) => ({
                ...h,
                yards: distanceToPoint(position.lat, position.lng, h.lat, h.lng),
              }))
              .sort((a, b) => a.yards - b.yards)
              .slice(0, 4)
              .map((h) => (
                <Badge key={h.label} variant="secondary" className="text-[10px]">
                  {h.label}: {h.yards} yds
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
