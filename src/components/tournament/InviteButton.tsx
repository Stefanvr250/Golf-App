"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, Check } from "lucide-react";

export function InviteButton({ tournamentId }: { tournamentId: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleInvite() {
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create invite");

      const url = data.inviteUrl as string;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Invite link copied", description: url });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Invite failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleInvite} disabled={loading}>
      {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
      {copied ? "Copied" : "Invite"}
    </Button>
  );
}
