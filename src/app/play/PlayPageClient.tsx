"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Flag,
  Search,
  Loader2,
  ChevronRight,
  History,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import type { CourseSearchResult } from "@/app/api/courses/search-osm/route";

interface TeeSet {
  id: string;
  name: string;
  color: string | null;
  course_rating: number | null;
  slope_rating: number | null;
}

interface RecentCourse {
  id: string;
  name: string;
  city: string | null;
  num_holes: number;
  last_played: string;
}

export default function PlayPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();

  const preselectedCourseId = searchParams.get("course");
  const preselectedTournamentId = searchParams.get("tournament");

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(
    preselectedCourseId
  );
  const [selectedCourse, setSelectedCourse] = React.useState<CourseSearchResult | null>(null);
  const [teeSets, setTeeSets] = React.useState<TeeSet[]>([]);
  const [selectedTeeSetId, setSelectedTeeSetId] = React.useState<string>("");
  const [recentCourses, setRecentCourses] = React.useState<RecentCourse[]>([]);
  const [creating, setCreating] = React.useState(false);

  // Load recent courses
  React.useEffect(() => {
    async function loadRecent() {
      const { data } = await supabase
        .from("rounds")
        .select("course_id, course:courses(id, name, city, num_holes), date")
        .order("date", { ascending: false })
        .limit(5);

      const seen = new Set<string>();
      const recent: RecentCourse[] = [];
      for (const row of data ?? []) {
        const course = row.course as unknown as {
          id: string;
          name: string;
          city: string | null;
          num_holes: number;
        } | null;
        if (course && !seen.has(course.id)) {
          seen.add(course.id);
          recent.push({
            id: course.id,
            name: course.name,
            city: course.city,
            num_holes: course.num_holes,
            last_played: row.date,
          });
        }
      }
      setRecentCourses(recent);
    }
    loadRecent();
  }, [supabase]);

  // Load preselected course details and tee sets
  React.useEffect(() => {
    if (!preselectedCourseId) return;

    async function loadCourse() {
      const { data: course } = await supabase
        .from("courses")
        .select("id, name, city, num_holes")
        .eq("id", preselectedCourseId)
        .single();

      if (course) {
        setSelectedCourse({
          id: course.id,
          name: course.name,
          lat: 0,
          lng: 0,
          holes: course.num_holes,
          distanceKm: null,
          inDatabase: true,
          source: "community",
          osmId: null,
        });
        setSelectedCourseId(course.id);
      }

      const { data: tees } = await supabase
        .from("tee_sets")
        .select("*")
        .eq("course_id", preselectedCourseId);

      setTeeSets(tees ?? []);
      if (tees && tees.length > 0) {
        setSelectedTeeSetId(tees[0].id);
      }
    }
    loadCourse();
  }, [preselectedCourseId, supabase]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

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
      setLoading(false);
    }
  }

  async function selectCourse(course: CourseSearchResult) {
    if (!course.id) return;
    setSelectedCourseId(course.id);
    setSelectedCourse(course);
    setResults([]);
    setSearched(false);
    setQuery("");

    const { data: tees } = await supabase
      .from("tee_sets")
      .select("*")
      .eq("course_id", course.id);

    setTeeSets(tees ?? []);
    if (tees && tees.length > 0) {
      setSelectedTeeSetId(tees[0].id);
    } else {
      setSelectedTeeSetId("");
    }
  }

  async function handleStartRound() {
    if (!selectedCourseId) return;
    setCreating(true);

    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          teeSetId: selectedTeeSetId || undefined,
          tournamentId: preselectedTournamentId || undefined,
          date: new Date().toISOString().slice(0, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create round");

      router.push(`/play/${data.roundId}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to start round",
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setCreating(false);
    }
  }

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Play</h1>
      </div>

      {/* Selected course view */}
      {selectedCourse ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedCourse.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedCourse.holes} holes
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCourse(null);
                    setSelectedCourseId(null);
                    setTeeSets([]);
                    setSelectedTeeSetId("");
                  }}
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tee set selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tee Set</label>
            {teeSets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tee sets available for this course.{" "}
                <Link href={`/courses/${selectedCourseId}`} className="text-primary hover:underline">
                  View course
                </Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teeSets.map((ts) => (
                  <Button
                    key={ts.id}
                    type="button"
                    size="sm"
                    variant={selectedTeeSetId === ts.id ? "default" : "outline"}
                    onClick={() => setSelectedTeeSetId(ts.id)}
                  >
                    <span
                      className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: ts.color ?? "#888" }}
                    />
                    {ts.name}
                    {ts.slope_rating && (
                      <span className="ml-1 text-[10px] opacity-70">
                        ({ts.slope_rating})
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleStartRound}
            disabled={creating || !selectedCourseId}
          >
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Flag className="mr-2 h-4 w-4" />
            )}
            Start Round
          </Button>

          {preselectedTournamentId && (
            <p className="text-center text-[10px] text-muted-foreground">
              This round will be linked to a tournament.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recent courses */}
          {recentCourses.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Recent Courses
              </h2>
              <div className="space-y-2">
                {recentCourses.map((course) => (
                  <Card
                    key={course.id}
                    className="cursor-pointer"
                    onClick={() =>
                      selectCourse({
                        id: course.id,
                        name: course.name,
                        lat: 0,
                        lng: 0,
                        holes: course.num_holes,
                        distanceKm: null,
                        inDatabase: true,
                        source: "community",
                        osmId: null,
                      })
                    }
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{course.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.city} • {course.num_holes} holes
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Find a Course
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses by name…"
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={loading}>
                Search
              </Button>
            </form>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">No courses found.</p>
              <Link href="/courses/new" className="text-primary hover:underline text-sm">
                Add a new course
              </Link>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((course, i) => (
                <Card
                  key={`${course.osmId ?? course.id ?? i}`}
                  className="cursor-pointer"
                  onClick={() => selectCourse(course)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{course.name}</p>
                        {course.inDatabase && (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            In DB
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        {course.holes && <span>{course.holes} holes</span>}
                        <span className="capitalize">{course.source}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
