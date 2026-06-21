import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, MapPin, Trophy, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const tiles = [
  { href: "/play", label: "Play a Round", icon: Flag, desc: "Start scoring with GPS" },
  { href: "/courses", label: "Courses", icon: MapPin, desc: "Find or add a course" },
  { href: "/tournaments", label: "Tournaments", icon: Trophy, desc: "Compete with friends" },
  { href: "/profile", label: "Profile", icon: User, desc: "Handicap & stats" },
];

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: recentRounds }, { data: tournamentRows }] = await Promise.all([
    supabase.from("profiles").select("display_name, handicap_index").eq("id", user.id).single(),
    supabase
      .from("rounds")
      .select("id, date, total_strokes, course:courses(name)")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(3),
    supabase
      .from("tournament_participants")
      .select("tournament:tournaments(id, name, date, status)")
      .eq("user_id", user.id)
      .in("tournament.status", ["upcoming", "in_progress"]),
  ]);

  const upcomingTournaments = (tournamentRows ?? [])
    .map((row: any) => {
      const raw = row.tournament;
      return Array.isArray(raw) ? raw[0] : raw;
    })
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="container space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Handicap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{profile?.handicap_index ?? "—"}</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Rounds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recentRounds ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed rounds yet.</p>
            ) : (
              (recentRounds ?? []).map((round: any) => {
                const course = Array.isArray(round.course) ? round.course[0] : round.course;
                return (
                  <div key={round.id} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2">{course?.name ?? "Course"}</span>
                    <span className="text-muted-foreground">
                      {round.total_strokes ?? "—"} • {new Date(round.date).toLocaleDateString("en-ZA")}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Upcoming Tournaments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingTournaments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming tournaments joined.</p>
          ) : (
            upcomingTournaments.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="truncate pr-2">{t.name}</span>
                <span className="text-muted-foreground">{new Date(t.date).toLocaleDateString("en-ZA")}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="p-4 pb-2">
                <tile.icon className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardTitle className="text-base">{tile.label}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tile.desc}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
