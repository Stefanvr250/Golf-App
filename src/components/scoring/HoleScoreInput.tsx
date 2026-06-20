"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const COMMON_CLUBS = [
  "Driver",
  "3 Wood",
  "5 Wood",
  "2 Hybrid",
  "3 Hybrid",
  "4 Hybrid",
  "2 Iron",
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
];

const LIE_TYPES = [
  { value: "tee", label: "Tee" },
  { value: "fairway", label: "Fairway" },
  { value: "rough", label: "Rough" },
  { value: "bunker", label: "Bunker" },
  { value: "green", label: "Green" },
  { value: "fringe", label: "Fringe" },
  { value: "recovery", label: "Recovery" },
];

export interface HoleScoreFormData {
  strokes: number;
  putts: number;
  penalties: number;
  fairwayHit: "yes" | "no" | "na" | undefined;
  greenInRegulation: boolean | undefined;
  club: string | undefined;
  lieType: string | undefined;
}

interface HoleScoreInputProps {
  par: number;
  defaultValues?: Partial<HoleScoreFormData>;
  onChange?: (data: HoleScoreFormData) => void;
}

function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <div className="flex h-8 w-10 items-center justify-center rounded-md border bg-background text-sm font-medium">
          {value}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className={cn("flex-1", className)}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function HoleScoreInput({ par, defaultValues, onChange }: HoleScoreInputProps) {
  const [strokes, setStrokes] = React.useState(defaultValues?.strokes ?? 0);
  const [putts, setPutts] = React.useState(defaultValues?.putts ?? 0);
  const [penalties, setPenalties] = React.useState(defaultValues?.penalties ?? 0);
  const [fairwayHit, setFairwayHit] = React.useState<"yes" | "no" | "na" | undefined>(
    defaultValues?.fairwayHit
  );
  const [greenInRegulation, setGreenInRegulation] = React.useState<boolean | undefined>(
    defaultValues?.greenInRegulation
  );
  const [club, setClub] = React.useState(defaultValues?.club ?? "");
  const [lieType, setLieType] = React.useState(defaultValues?.lieType ?? "");
  const [girTouched, setGirTouched] = React.useState(defaultValues?.greenInRegulation !== undefined);

  // Auto-calculate GIR if not manually set
  React.useEffect(() => {
    if (girTouched) return;
    if (strokes === 0 || putts === 0) {
      setGreenInRegulation(undefined);
      return;
    }
    // GIR = on green in regulation strokes (par + 2 for putts, but since putts >= 1)
    // Simplified: if strokes - putts <= par - 2, then GIR
    const nonPuttStrokes = strokes - putts;
    const gir = nonPuttStrokes <= par - 2;
    setGreenInRegulation(gir);
  }, [strokes, putts, par, girTouched]);

  const data: HoleScoreFormData = {
    strokes,
    putts,
    penalties,
    fairwayHit,
    greenInRegulation,
    club: club || undefined,
    lieType: lieType || undefined,
  };

  React.useEffect(() => {
    onChange?.(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, putts, penalties, fairwayHit, greenInRegulation, club, lieType]);

  return (
    <div className="space-y-5">
      {/* Core stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stepper label="Strokes" value={strokes} onChange={setStrokes} min={0} max={20} />
        <Stepper label="Putts" value={putts} onChange={setPutts} min={0} max={15} />
        <Stepper
          label="Penalties"
          value={penalties}
          onChange={setPenalties}
          min={0}
          max={10}
        />
      </div>

      {/* Score indicator */}
      {strokes > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm">
          <span className="text-muted-foreground">vs Par:</span>
          <span
            className={cn(
              "font-semibold",
              strokes < par && "text-green-600",
              strokes === par && "text-foreground",
              strokes > par && "text-red-600"
            )}
          >
            {strokes < par ? "-" : strokes > par ? "+" : ""}
            {Math.abs(strokes - par)}
          </span>
          <span className="text-muted-foreground ml-auto">
            {strokes === 1 && par === 3
              ? "Hole in One!"
              : strokes === par - 2
              ? "Eagle"
              : strokes === par - 1
              ? "Birdie"
              : strokes === par
              ? "Par"
              : strokes === par + 1
              ? "Bogey"
              : strokes === par + 2
              ? "Double Bogey"
              : strokes > par + 2
              ? `${strokes - par} Over`
              : ""}
          </span>
        </div>
      )}

      {/* Fairway hit */}
      {par !== 3 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Fairway Hit</Label>
          <div className="flex gap-2">
            <ToggleButton
              active={fairwayHit === "yes"}
              onClick={() => setFairwayHit("yes")}
            >
              Yes
            </ToggleButton>
            <ToggleButton
              active={fairwayHit === "no"}
              onClick={() => setFairwayHit("no")}
            >
              No
            </ToggleButton>
            <ToggleButton
              active={fairwayHit === "na"}
              onClick={() => setFairwayHit("na")}
            >
              N/A
            </ToggleButton>
          </div>
        </div>
      )}

      {/* GIR */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Green in Regulation</Label>
        <div className="flex gap-2">
          <ToggleButton
            active={greenInRegulation === true}
            onClick={() => {
              setGreenInRegulation(true);
              setGirTouched(true);
            }}
            className="text-green-700 data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
          >
            Yes
          </ToggleButton>
          <ToggleButton
            active={greenInRegulation === false}
            onClick={() => {
              setGreenInRegulation(false);
              setGirTouched(true);
            }}
            className="text-red-700 data-[state=active]:bg-red-100 data-[state=active]:text-red-700"
          >
            No
          </ToggleButton>
        </div>
        {!girTouched && strokes > 0 && putts > 0 && (
          <p className="text-[10px] text-muted-foreground">Auto-calculated. Tap to override.</p>
        )}
      </div>

      {/* Club & Lie */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Club (last shot)</Label>
          <Select value={club} onValueChange={setClub}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select club…" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_CLUBS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Lie Type</Label>
          <Select value={lieType} onValueChange={setLieType}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select lie…" />
            </SelectTrigger>
            <SelectContent>
              {LIE_TYPES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
