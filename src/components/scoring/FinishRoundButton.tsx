"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function FinishRoundButton({ roundId }: { roundId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleFinish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/rounds/${roundId}`, {
        method: "PUT",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to finalize round");

      const h = data.handicap;
      if (h && h.previous != null && h.current != null) {
        const delta = (h.current - h.previous).toFixed(1);
        const sign = h.current < h.previous ? "" : "+";
        toast({
          title: "Round completed!",
          description: `Handicap ${h.previous} → ${h.current} (${sign}${delta})`,
        });
      } else {
        toast({ title: "Round completed!", description: "View your summary." });
      }

      router.push(`/play/${roundId}/summary`);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Finish Round
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finish Round?</DialogTitle>
          <DialogDescription>
            This will mark your round as completed and calculate your stats. You
            won&apos;t be able to edit scores after finishing.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleFinish} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
