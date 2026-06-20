import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, MapPin, Trophy, User } from "lucide-react";
import Link from "next/link";

const tiles = [
  { href: "/play", label: "Play a Round", icon: Flag, desc: "Start scoring with GPS" },
  { href: "/courses", label: "Courses", icon: MapPin, desc: "Find or add a course" },
  { href: "/tournaments", label: "Tournaments", icon: Trophy, desc: "Compete with friends" },
  { href: "/profile", label: "Profile", icon: User, desc: "Handicap & stats" },
];

export default function HomePage() {
  return (
    <div className="container space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your all-in-one golf companion.
        </p>
      </header>

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
