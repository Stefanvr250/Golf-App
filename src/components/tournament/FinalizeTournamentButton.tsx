"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

interface FinalizeTournamentButtonProps {
  tournamentId: string;
}

export function FinalizeTournamentButton({ tournamentId }: FinalizeTournamentButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function handleFinalize() {
    if (!confirm("Are you sure you want to finalize this tournament? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/finalize`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to finalize");

      toast({ title: "Tournament finalized", description: "Results are now locked." });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Finalize failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      className="w-full"
      onClick={handleFinalize}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="mr-2 h-4 w-4" />
      )}
      Finalize Tournament
    </Button>
  );
}
