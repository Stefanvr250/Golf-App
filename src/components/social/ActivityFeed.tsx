"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Flag, TrendingDown, Share2 } from "lucide-react";

interface FeedEntry {
  id: string;
  user_id: string;
  type: string;
  reference_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
}

function FeedIcon({ type }: { type: string }) {
  switch (type) {
    case "round_shared":
      return <Share2 className="h-4 w-4 text-blue-500" />;
    case "tournament_created":
      return <Trophy className="h-4 w-4 text-amber-500" />;
    case "tournament_completed":
      return <Flag className="h-4 w-4 text-green-500" />;
    case "handicap_updated":
      return <TrendingDown className="h-4 w-4 text-purple-500" />;
    default:
      return <Flag className="h-4 w-4 text-muted-foreground" />;
  }
}

function feedDescription(entry: FeedEntry): string {
  const name = entry.profile?.display_name ?? "A player";
  const meta = entry.metadata ?? {};

  switch (entry.type) {
    case "round_shared":
      return `${name} shared a round${meta.course_name ? ` at ${meta.course_name}` : ""}${meta.score ? ` — scored ${meta.score}` : ""}`;
    case "tournament_created":
      return `${name} created a tournament${meta.tournament_name ? `: ${meta.tournament_name}` : ""}`;
    case "tournament_completed":
      return `${name} completed a tournament${meta.tournament_name ? `: ${meta.tournament_name}` : ""}`;
    case "handicap_updated":
      return `${name}'s handicap updated${meta.new_handicap != null ? ` to ${meta.new_handicap}` : ""}${meta.previous_handicap != null ? ` (was ${meta.previous_handicap})` : ""}`;
    default:
      return `${name} had some activity`;
  }
}

const PAGE_SIZE = 20;

export function ActivityFeed({ userId }: { userId: string }) {
  const supabase = React.useMemo(() => createClient(), []);
  const [entries, setEntries] = React.useState<FeedEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const fetchFeed = React.useCallback(
    async (offset: number) => {
      // Step 1: Get friend IDs
      const { data: friendships1 } = await supabase
        .from("friendships")
        .select("addressee_id")
        .eq("requester_id", userId)
        .eq("status", "accepted");

      const { data: friendships2 } = await supabase
        .from("friendships")
        .select("requester_id")
        .eq("addressee_id", userId)
        .eq("status", "accepted");

      const friendIds = [
        ...(friendships1 ?? []).map((f: any) => f.addressee_id),
        ...(friendships2 ?? []).map((f: any) => f.requester_id),
      ];

      if (friendIds.length === 0) {
        setLoading(false);
        setHasMore(false);
        return;
      }

      // Step 2: Fetch activity_feed entries from friends
      const { data } = await supabase
        .from("activity_feed")
        .select("id, user_id, type, reference_id, metadata, created_at, profile:profiles(display_name, avatar_url)")
        .in("user_id", friendIds)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      const normalized: FeedEntry[] = (data ?? []).map((e: any) => ({
        ...e,
        profile: Array.isArray(e.profile) ? e.profile[0] : e.profile,
      }));

      if (offset === 0) {
        setEntries(normalized);
      } else {
        setEntries((prev) => [...prev, ...normalized]);
      }

      setHasMore(normalized.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    },
    [supabase, userId]
  );

  React.useEffect(() => {
    fetchFeed(0);
  }, [fetchFeed]);

  function loadMore() {
    setLoadingMore(true);
    fetchFeed(entries.length);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No activity yet. Add friends to see their activity here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 rounded-md border p-3"
        >
          <Avatar className="h-9 w-9 shrink-0 mt-0.5">
            <AvatarImage src={entry.profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(entry.profile?.display_name ?? "?")}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <FeedIcon type={entry.type} />
              <p className="text-sm">{feedDescription(entry)}</p>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {timeAgo(entry.created_at)}
            </p>
          </div>
        </div>
      ))}

      {hasMore && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Load more
        </Button>
      )}
    </div>
  );
}
