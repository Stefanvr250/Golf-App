"use client";

import * as React from "react";
import { Circle, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGPS } from "@/hooks/useGPS";
import { distanceToPoint } from "@/lib/maps/distance";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CLUBS = [
  "Driver",
  "3 Wood",
  "5 Wood",
  "Hybrid",
  "3 Iron",
  "4 Iron",
  "5 Iron",
  "6 Iron",
  "7 Iron",
  "8 Iron",
  "9 Iron",
  "PW",
  "GW",
  "SW",
  "LW",
  "Putter",
] as const;

const LIE_TYPES = ["tee", "fairway", "rough", "bunker", "green", "other"] as const;

interface ShotTrackerProps {
  roundId: string;
  holeScoreId: string;
  holeNumber: number;
  /** Called when a shot is recorded, with the shot line coordinates */
  onShotRecorded?: (shot: { startLat: number; startLng: number; endLat: number; endLng: number; yards: number }) => void;
}

export function ShotTracker({ roundId, holeScoreId, holeNumber, onShotRecorded }: ShotTrackerProps) {
  const { toast } = useToast();
  const { position, isTracking, startTracking } = useGPS();
  const [shotStart, setShotStart] = React.useState<{ lat: number; lng: number } | null>(null);
  const [club, setClub] = React.useState<string>("7 Iron");
  const [lie, setLie] = React.useState<string>("fairway");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isTracking) startTracking();
  }, [isTracking, startTracking]);

  function handleStartShot() {
    if (!position) {
      toast({ variant: "destructive", title: "Waiting for GPS position…" });
      return;
    }
    setShotStart({ lat: position.lat, lng: position.lng });
    toast({ title: "Shot started", description: "Walk to your ball and tap 'End Shot'" });
  }

  async function handleEndShot() {
    if (!shotStart || !position) return;

    const yards = distanceToPoint(shotStart.lat, shotStart.lng, position.lat, position.lng);

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("shots").insert({
      hole_score_id: holeScoreId,
      shot_number: 1, // Will be managed by caller in a real scenario
      club,
      start_location: `POINT(${shotStart.lng} ${shotStart.lat})`,
      end_location: `POINT(${position.lng} ${position.lat})`,
      distance_yards: yards,
      lie_type: lie,
    });

    if (error) {
      toast({ variant: "destructive", title: "Failed to save shot", description: error.message });
    } else {
      toast({ title: `${yards} yards`, description: `${club} from ${lie}` });
      onShotRecorded?.({
        startLat: shotStart.lat,
        startLng: shotStart.lng,
        endLat: position.lat,
        endLng: position.lng,
        yards,
      });
    }

    setShotStart(null);
    setSaving(false);
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground">Shot Tracker — Hole {holeNumber}</p>

      {/* Club & lie selectors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground">Club</label>
          <select
            value={club}
            onChange={(e) => setClub(e.target.value)}
            className="h-8 w-full rounded border bg-background px-2 text-sm"
          >
            {CLUBS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Lie</label>
          <select
            value={lie}
            onChange={(e) => setLie(e.target.value)}
            className="h-8 w-full rounded border bg-background px-2 text-sm"
          >
            {LIE_TYPES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Start/End buttons */}
      {!shotStart ? (
        <Button
          onClick={handleStartShot}
          disabled={!position}
          className="w-full"
          size="sm"
        >
          {!position ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Circle className="mr-1.5 h-3.5 w-3.5" />
          )}
          Start Shot
        </Button>
      ) : (
        <Button
          onClick={handleEndShot}
          disabled={!position || saving}
          variant="destructive"
          className="w-full"
          size="sm"
        >
          <Square className="mr-1.5 h-3.5 w-3.5" />
          {saving ? "Saving…" : "End Shot"}
        </Button>
      )}

      {shotStart && position && (
        <p className="text-center text-sm font-medium tabular-nums">
          Current: {distanceToPoint(shotStart.lat, shotStart.lng, position.lat, position.lng)} yds
        </p>
      )}
    </div>
  );
}
