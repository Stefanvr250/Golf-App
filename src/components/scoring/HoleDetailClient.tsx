"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Save, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { HoleScoreInput, HoleScoreFormData } from "@/components/scoring/HoleScoreInput";
import { CourseMap } from "@/components/maps/CourseMap";
import { GPSTracker, TargetPoint } from "@/components/maps/GPSTracker";
import { YardageCircles } from "@/components/maps/YardageCircles";
import { cn } from "@/lib/utils";

interface HoleDetailClientProps {
  roundId: string;
  courseName: string;
  numHoles: number;
  hole: {
    id: string;
    number: number;
    par: number;
    yardage?: number;
    handicapIndex?: number;
  };
  center: { lat: number; lng: number } | null;
  targets: TargetPoint[];
  hazards: TargetPoint[];
  existingScore?: Partial<HoleScoreFormData>;
  holeScoreId?: string;
}

export function HoleDetailClient({
  roundId,
  courseName,
  numHoles,
  hole,
  center,
  targets,
  hazards,
  existingScore,
}: HoleDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [scoreData, setScoreData] = React.useState<HoleScoreFormData>({
    strokes: existingScore?.strokes ?? 0,
    putts: existingScore?.putts ?? 0,
    penalties: existingScore?.penalties ?? 0,
    fairwayHit: existingScore?.fairwayHit,
    greenInRegulation: existingScore?.greenInRegulation,
    club: existingScore?.club,
    lieType: existingScore?.lieType,
  });

  const prevHole = hole.number > 1 ? hole.number - 1 : null;
  const nextHole = hole.number < numHoles ? hole.number + 1 : null;

  async function handleSave() {
    if (scoreData.strokes === 0) {
      toast({ variant: "destructive", title: "Enter your score before saving" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/rounds/${roundId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holeNumber: hole.number,
          strokes: scoreData.strokes,
          putts: scoreData.putts,
          penalties: scoreData.penalties,
          fairwayHit: scoreData.fairwayHit,
          greenInRegulation: scoreData.greenInRegulation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save score");

      toast({ title: "Score saved" });
      router.push(`/play/${roundId}`);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container max-w-2xl space-y-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/play/${roundId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold leading-tight truncate">{courseName}</h1>
          <p className="text-xs text-muted-foreground">
            Hole {hole.number} of {numHoles}
          </p>
        </div>
      </div>

      {/* Hole info card */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {hole.number}
            </div>
            <div>
              <p className="text-sm font-medium">Par {hole.par}</p>
              {hole.yardage && (
                <p className="text-xs text-muted-foreground">{hole.yardage} yards</p>
              )}
              {hole.handicapIndex != null && (
                <p className="text-xs text-muted-foreground">
                  Handicap {hole.handicapIndex}
                </p>
              )}
            </div>
          </div>
          {scoreData.strokes > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold">{scoreData.strokes}</p>
              <p
                className={cn(
                  "text-xs font-medium",
                  scoreData.strokes < hole.par && "text-green-600",
                  scoreData.strokes > hole.par && "text-red-600"
                )}
              >
                {scoreData.strokes < hole.par
                  ? `-${hole.par - scoreData.strokes}`
                  : scoreData.strokes > hole.par
                  ? `+${scoreData.strokes - hole.par}`
                  : "Par"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      {center ? (
        <div className="space-y-3">
          <CourseMap
            centerLat={center.lat}
            centerLng={center.lng}
            zoom={16}
            className="h-[300px] w-full rounded-lg overflow-hidden"
          >
            {targets.length > 0 && targets[0].lat && targets[0].lng && (
              <YardageCircles pinLat={targets[0].lat} pinLng={targets[0].lng} />
            )}
          </CourseMap>
          {targets.length > 0 && (
            <GPSTracker targets={targets} hazards={hazards} />
          )}
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No map coordinates for this hole yet.
            </p>
          </div>
        </div>
      )}

      {/* Score input */}
      <div>
        <h2 className="mb-3 text-sm font-medium">Enter Score</h2>
        <HoleScoreInput
          par={hole.par}
          defaultValues={existingScore}
          onChange={setScoreData}
        />
      </div>

      {/* Save & navigation */}
      <div className="space-y-3">
        <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save & Return to Scorecard"}
        </Button>

        <div className="flex gap-3">
          {prevHole ? (
            <Link href={`/play/${roundId}/hole/${prevHole}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                Hole {prevHole}
              </Button>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextHole ? (
            <Link href={`/play/${roundId}/hole/${nextHole}`} className="flex-1">
              <Button variant="outline" className="w-full">
                Hole {nextHole}
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
}
