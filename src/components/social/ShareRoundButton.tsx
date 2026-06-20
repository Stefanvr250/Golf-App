"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, Check, Loader2 } from "lucide-react";

interface ShareRoundButtonProps {
  roundId: string;
  userId: string;
  courseName: string;
  score: number | null;
  isShared: boolean;
}

export function ShareRoundButton({
  roundId,
  userId,
  courseName,
  score,
  isShared: initialShared,
}: ShareRoundButtonProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [shared, setShared] = React.useState(initialShared);
  const [loading, setLoading] = React.useState(false);

  async function handleShare() {
    if (shared) return;
    setLoading(true);

    // Create activity_feed entry
    const { error: feedError } = await supabase.from("activity_feed").insert({
      user_id: userId,
      type: "round_shared",
      reference_id: roundId,
      metadata: {
        course_name: courseName,
        score: score,
      },
    });

    if (feedError) {
      toast({
        title: "Failed to share",
        description: feedError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Mark round as shared
    const { error: roundError } = await supabase
      .from("rounds")
      .update({ is_shared: true })
      .eq("id", roundId);

    if (roundError) {
      toast({
        title: "Warning",
        description: "Round shared to feed but could not update round status.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Round shared with friends!" });
    }

    setShared(true);
    setLoading(false);
  }

  return (
    <Button
      variant="outline"
      className="flex-1"
      size="lg"
      onClick={handleShare}
      disabled={shared || loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : shared ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Share2 className="mr-2 h-4 w-4" />
      )}
      {shared ? "Shared" : "Share Round"}
    </Button>
  );
}
