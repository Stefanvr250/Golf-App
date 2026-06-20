import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { HandicapHistory, type HandicapHistoryEntry } from "@/components/profile/HandicapHistory";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { count: roundCount } = await supabase
    .from("rounds")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: hcpHistoryRaw } = await supabase
    .from("handicap_history")
    .select("id, handicap_index, differential, calculated_at, round:rounds(id, date, course:courses(name))")
    .eq("user_id", user.id)
    .order("calculated_at", { ascending: false })
    .limit(20);

  const hcpHistory: HandicapHistoryEntry[] = (hcpHistoryRaw ?? []).map((h: any) => ({
    id: h.id,
    handicap_index: h.handicap_index,
    differential: h.differential,
    calculated_at: h.calculated_at,
    round: h.round
      ? {
          id: h.round.id,
          date: h.round.date,
          course: h.round.course ? { name: h.round.course.name } : null,
        }
      : null,
  }));

  const initials = profile.display_name
    ? profile.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="container max-w-lg space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <Link href="/profile/edit">
          <Button variant="outline" size="sm">
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{profile.display_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 pt-4">
          <Stat label="Handicap" value={profile.handicap_index ?? "—"} />
          <Stat label="Rounds Played" value={roundCount ?? 0} />
          <Stat label="Role" value={<Badge variant="secondary">{profile.role}</Badge>} />
          <Stat label="Member Since" value={memberSince} />
        </CardContent>
      </Card>

      <HandicapHistory entries={hcpHistory} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{typeof value === "object" ? value : value}</p>
    </div>
  );
}
