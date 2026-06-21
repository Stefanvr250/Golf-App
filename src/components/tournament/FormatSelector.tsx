"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TournamentFormat } from "@/lib/validations/tournament";

interface FormatOption {
  value: TournamentFormat;
  label: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { value: "stroke_play", label: "Stroke Play", description: "Lowest total strokes wins." },
  { value: "stableford", label: "Stableford", description: "Points per hole: bogey=1, par=2, birdie=3, eagle=4, albatross=5." },
  { value: "match_play", label: "Match Play", description: "Head-to-head, win or lose each hole. Most holes won wins." },
  { value: "ryder_cup", label: "Ryder Cup", description: "Team match play with point-based scoring." },
  { value: "skins", label: "Skins", description: "Lowest score wins the hole (skin). Ties carry over." },
];

interface FormatSelectorProps {
  value: TournamentFormat;
  onChange: (format: TournamentFormat) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {FORMAT_OPTIONS.map((opt) => (
        <Card
          key={opt.value}
          className={cn(
            "cursor-pointer transition-colors",
            value === opt.value
              ? "border-primary bg-primary/5"
              : "hover:border-primary/40"
          )}
          onClick={() => onChange(opt.value)}
        >
          <CardContent className="p-3">
            <p className="font-medium text-sm">{opt.label}</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {opt.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
