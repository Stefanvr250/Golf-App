"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type TournamentFormat } from "@/lib/validations/tournament";
import { FormatSelector } from "@/components/tournament/FormatSelector";
import type { CourseSearchResult } from "@/app/api/courses/search-osm/route";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Search, ChevronRight } from "lucide-react";

export default function NewTournamentPageWrapper() {
  return (
    <Suspense fallback={<div className="container py-6">Loading...</div>}>
      <NewTournamentPage />
    </Suspense>
  );
}

function NewTournamentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = React.useMemo(() => createClient(), []);
  const leagueId = searchParams.get("league");

  const [name, setName] = React.useState("");
  const [format, setFormat] = React.useState<TournamentFormat>("stroke_play");
  const [numHoles, setNumHoles] = React.useState<9 | 18>(18);
  const [maxParticipants, setMaxParticipants] = React.useState(20);
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<CourseSearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<CourseSearchResult | null>(null);
  const [creating, setCreating] = React.useState(false);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoadingSearch(true);
    try {
      const res = await fetch(`/api/courses/search-osm?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Search failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoadingSearch(false);
    }
  }

  function selectCourse(c: CourseSearchResult) {
    setSelectedCourse(c);
    setResults([]);
    setQuery("");
  }

  async function handleCreate() {
    if (!name.trim() || !selectedCourse?.id) {
      toast({ variant: "destructive", title: "Select a course and enter a name" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          courseId: selectedCourse.id,
          format,
          numHoles,
          maxParticipants,
          date,
          leagueId: leagueId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create tournament");

      router.push(`/tournaments/${data.tournamentId}`);
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
    <div className="container max-w-xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">New Tournament</h1>
        <Link href="/tournaments" className="text-sm text-muted-foreground hover:underline">Cancel</Link>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Friday Night Stableford" />
        </div>

        <div>
          <label className="text-sm font-medium">Format</label>
          <div className="mt-1">
            <FormatSelector value={format} onChange={setFormat} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Holes</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={numHoles}
              onChange={(e) => setNumHoles(parseInt(e.target.value) as 9 | 18)}
            >
              <option value={18}>18</option>
              <option value={9}>9</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Max Participants</label>
            <Input
              type="number"
              min={2}
              max={20}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Math.max(2, Math.min(20, parseInt(e.target.value) || 2)))}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {/* Course selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Course</label>
          {selectedCourse ? (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedCourse.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCourse.holes} holes</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCourse(null)}>Change</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search courses…"
                    className="pl-9"
                  />
                </div>
                <Button type="submit" disabled={loadingSearch}>Search</Button>
              </form>

              {loadingSearch && <div className="text-sm text-muted-foreground">Searching…</div>}

              {results.length > 0 && (
                <div className="space-y-1">
                  {results.map((c, i) => (
                    <Card key={`${c.id ?? c.osmId ?? i}`} className="cursor-pointer" onClick={() => selectCourse(c)}>
                      <CardContent className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.holes} holes • {c.source}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <Button className="w-full" size="lg" onClick={handleCreate} disabled={creating || !selectedCourse}>
          {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Tournament
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">Max 20 participants. You will be added automatically.</p>
      </div>
    </div>
  );
}
