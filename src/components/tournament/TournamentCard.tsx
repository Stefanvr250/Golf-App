import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";

export interface TournamentCardProps {
  id: string;
  name: string;
  date: string;
  format: string;
  status: string;
  courseName?: string | null;
  maxParticipants: number;
  participantCount?: number;
}

export function TournamentCard({
  id,
  name,
  date,
  format,
  status,
  courseName,
  maxParticipants,
  participantCount,
}: TournamentCardProps) {
  const d = new Date(date).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" });
  const count = participantCount ?? 0;

  const statusColor =
    status === "completed" ? "secondary" : status === "in_progress" ? "default" : "outline";

  return (
    <Link href={`/tournaments/${id}`}>
      <Card className="cursor-pointer hover:border-primary/60">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold truncate">{name}</p>
              {courseName && (
                <p className="text-xs text-muted-foreground truncate">{courseName}</p>
              )}
            </div>
            <Badge variant={statusColor as any} className="shrink-0 capitalize text-[10px]">
              {status.replace("_", " ")}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {d}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {count}/{maxParticipants}
            </span>
            <span className="capitalize">{format.replace(/_/g, " ")}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
