import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChatPanel } from "@/components/social/ChatPanel";

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

  // Verify user is a participant
  const { data: participant } = await supabase
    .from("tournament_participants")
    .select("id")
    .eq("tournament_id", params.id)
    .eq("user_id", user.id)
    .single();

  return (
    <div className="container max-w-2xl space-y-4 py-6">
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

      {participant ? (
        <ChatPanel tournamentId={params.id} userId={user.id} />
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          You must be a participant to access this chat.
        </p>
      )}
    </div>
  );
}
