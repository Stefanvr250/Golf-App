"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, Plus, Search, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { CourseSearchResult } from "@/app/api/courses/search-osm/route";

export default function CoursesPage() {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

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

  async function handleNearMe() {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS not available" });
      return;
    }

    setLoading(true);
    setSearched(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `/api/courses/search-osm?lat=${latitude}&lng=${longitude}&radius=25000`
          );
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
      },
      (err) => {
        toast({ variant: "destructive", title: "Location error", description: err.message });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleImport(course: CourseSearchResult) {
    if (!course.osmId) return;
    setLoading(true);

    try {
      const res = await fetch("/api/courses/import-osm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ osmId: course.osmId, lat: course.lat, lng: course.lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");

      toast({ title: "Course imported", description: `${course.name} is now available.` });
      // Mark as imported in local state
      setResults((prev) =>
        prev.map((r) =>
          r.osmId === course.osmId ? { ...r, inDatabase: true, id: data.courseId } : r
        )
      );
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
        <Link href="/courses/new">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Course
          </Button>
        </Link>
      </div>

      {/* Search form */}
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
        <Button type="button" variant="outline" onClick={handleNearMe} disabled={loading}>
          <MapPin className="mr-1.5 h-4 w-4" />
          Near Me
        </Button>
      </form>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No courses found.{" "}
            <Link href="/courses/new" className="font-medium text-primary hover:underline">
              Add one manually
            </Link>
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((course, i) => (
            <CourseCard
              key={`${course.osmId ?? course.id ?? i}`}
              course={course}
              onImport={() => handleImport(course)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  onImport,
}: {
  course: CourseSearchResult;
  onImport: () => void;
}) {
  return (
    <Card>
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
            {course.distanceKm != null && (
              <span>{course.distanceKm.toFixed(1)} km away</span>
            )}
            <span className="capitalize">{course.source}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {course.inDatabase && course.id ? (
            <Link href={`/courses/${course.id}`}>
              <Button size="sm" variant="outline">
                View
              </Button>
            </Link>
          ) : course.osmId && !course.inDatabase ? (
            <Button size="sm" onClick={onImport}>
              Import
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
