import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function TournamentChatPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, course:courses(name)")
    .eq("id", params.id)
    .single();

  if (!tournament) notFound();

  const rawCourse: any = (tournament as any).course;
  const courseObj = Array.isArray(rawCourse) ? (rawCourse[0] ?? null) : (rawCourse ?? null);

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href={`/tournaments/${params.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Chat</h1>
          <p className="text-sm text-muted-foreground">{tournament.name} • {courseObj?.name}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Real-time tournament chat (with photo sharing) will be implemented in a later milestone.
          <br />
          This page exists so navigation from the tournament detail does not 404.
        </CardContent>
      </Card>

      <Link href={`/tournaments/${params.id}`}>
        <Button variant="outline">Back to Tournament</Button>
      </Link>
    </div>
  );
}
