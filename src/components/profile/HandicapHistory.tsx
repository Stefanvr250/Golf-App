"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface HandicapHistoryEntry {
  id: string;
  handicap_index: number;
  differential: number;
  calculated_at: string;
  round?: {
    id: string;
    date: string;
    course?: { name: string } | null;
  } | null;
}

export function HandicapHistory({ entries }: { entries: HandicapHistoryEntry[] }) {
  const [open, setOpen] = React.useState(false);

  if (!entries || entries.length === 0) {
    return null;
  }

  const visible = open ? entries : entries.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Handicap History</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="h-8 px-2"
          >
            {open ? (
              <>
                Less <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                More <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {visible.map((e) => {
          const date = new Date(e.calculated_at).toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const courseName = e.round?.course?.name;
          return (
            <div key={e.id} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <div className="font-medium">{e.handicap_index}</div>
                <div className="text-xs text-muted-foreground">
                  {date}
                  {courseName ? ` • ${courseName}` : ""}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {e.differential != null ? (
                  <span>
                    diff {e.differential > 0 ? "+" : ""}
                    {e.differential}
                  </span>
                ) : null}
                {e.round?.id && (
                  <div>
                    <Link href={`/play/${e.round.id}/summary`} className="text-primary hover:underline">
                      View round
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {!open && entries.length > 3 && (
          <div className="text-xs text-muted-foreground">+{entries.length - 3} more</div>
        )}
      </CardContent>
    </Card>
  );
}
