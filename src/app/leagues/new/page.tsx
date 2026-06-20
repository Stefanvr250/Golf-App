"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function NewLeaguePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Enter a league name" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create league");
      router.push(`/leagues/${data.leagueId}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Create failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setCreating(false);
    }
  }

  return (
    <div className="container max-w-md space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">New League</h1>
        <Link href="/leagues" className="text-sm text-muted-foreground hover:underline">Cancel</Link>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">League Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekend Warriors" />
        </div>
        <div>
          <label className="text-sm font-medium">Description (optional)</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A casual league for friends" />
        </div>

        <Button className="w-full" size="lg" onClick={handleCreate} disabled={creating}>
          {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create League
        </Button>
      </div>
    </div>
  );
}
