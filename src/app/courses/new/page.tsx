"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { courseCreateSchema, type CourseCreateInput } from "@/lib/validations/course";

const HOLE_OPTIONS = [9, 18, 27, 36] as const;

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [detectingGPS, setDetectingGPS] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [province, setProvince] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [numHoles, setNumHoles] = React.useState<9 | 18 | 27 | 36>(18);
  const [holes, setHoles] = React.useState<{ par: number; handicapIndex: string }[]>(
    generateHoles(18)
  );
  const [teeSetName, setTeeSetName] = React.useState("White");
  const [teeSetColor, setTeeSetColor] = React.useState("#ffffff");
  const [yardages, setYardages] = React.useState<string[]>(Array(18).fill(""));

  function generateHoles(n: number) {
    return Array.from({ length: n }, () => ({ par: 4, handicapIndex: "" }));
  }

  function handleNumHolesChange(n: 9 | 18 | 27 | 36) {
    setNumHoles(n);
    setHoles(generateHoles(n));
    setYardages(Array(n).fill(""));
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS not available" });
      return;
    }
    setDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setDetectingGPS(false);
      },
      () => {
        toast({ variant: "destructive", title: "Could not get location" });
        setDetectingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const input: CourseCreateInput = {
      name,
      address: address || undefined,
      city: city || undefined,
      province: province || undefined,
      country: "South Africa",
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      numHoles,
      holes: holes.map((h, i) => ({
        holeNumber: i + 1,
        par: h.par,
        handicapIndex: h.handicapIndex ? parseInt(h.handicapIndex, 10) : undefined,
      })),
      teeSets: teeSetName
        ? [
            {
              name: teeSetName,
              color: teeSetColor,
              yardages: yardages.map((y) => (y ? parseInt(y, 10) : 0)).filter((y) => y > 0).length > 0
                ? yardages.map((y) => (y ? parseInt(y, 10) : 0))
                : undefined,
            },
          ]
        : undefined,
    };

    const result = courseCreateSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      toast({ variant: "destructive", title: "Validation errors", description: "Check the form." });
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Insert course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        name: result.data.name,
        address: result.data.address,
        city: result.data.city,
        province: result.data.province,
        country: result.data.country,
        location: `POINT(${result.data.lng} ${result.data.lat})`,
        num_holes: result.data.numHoles,
        source: "community",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (courseError || !course) {
      toast({ variant: "destructive", title: "Failed to create course", description: courseError?.message });
      setSaving(false);
      return;
    }

    // Insert holes
    const holeRows = result.data.holes.map((h) => ({
      course_id: course.id,
      hole_number: h.holeNumber,
      par: h.par,
      handicap_index: h.handicapIndex ?? null,
    }));

    const { data: insertedHoles, error: holesError } = await supabase
      .from("holes")
      .insert(holeRows)
      .select("id, hole_number");

    if (holesError) {
      toast({ variant: "destructive", title: "Failed to add holes", description: holesError.message });
      setSaving(false);
      return;
    }

    // Insert tee set + yardages if provided
    if (result.data.teeSets && result.data.teeSets.length > 0) {
      const ts = result.data.teeSets[0];
      const { data: teeSet } = await supabase
        .from("tee_sets")
        .insert({ course_id: course.id, name: ts.name, color: ts.color })
        .select("id")
        .single();

      if (teeSet && ts.yardages && insertedHoles) {
        const holeTeeRows = insertedHoles
          .map((h) => {
            const yardage = ts.yardages![h.hole_number - 1];
            if (!yardage || yardage <= 0) return null;
            return { hole_id: h.id, tee_set_id: teeSet.id, yardage };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);

        if (holeTeeRows.length > 0) {
          await supabase.from("hole_tees").insert(holeTeeRows);
        }
      }
    }

    toast({ title: "Course created!", description: `${result.data.name} added successfully.` });
    router.push(`/courses/${course.id}`);
  }

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <div className="flex items-center gap-2">
        <Link href="/courses">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add New Course</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Course name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="province">Province</Label>
                <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            {/* GPS */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="lat">Latitude *</Label>
                <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} required placeholder="-33.9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lng">Longitude *</Label>
                <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} required placeholder="18.4" />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={detectLocation} disabled={detectingGPS}>
                {detectingGPS ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              </Button>
            </div>

            {/* Num holes */}
            <div className="space-y-1">
              <Label>Number of holes *</Label>
              <div className="flex gap-2">
                {HOLE_OPTIONS.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={numHoles === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleNumHolesChange(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Holes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hole Data</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-2 py-1 text-left w-12">#</th>
                  <th className="px-2 py-1 text-left w-20">Par *</th>
                  <th className="px-2 py-1 text-left w-20">HCP</th>
                  {teeSetName && <th className="px-2 py-1 text-left w-24">Yardage</th>}
                </tr>
              </thead>
              <tbody>
                {holes.map((hole, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-2 py-1 font-medium">{i + 1}</td>
                    <td className="px-2 py-1">
                      <select
                        value={hole.par}
                        onChange={(e) => {
                          const updated = [...holes];
                          updated[i] = { ...updated[i], par: parseInt(e.target.value) };
                          setHoles(updated);
                        }}
                        className="h-8 w-16 rounded border bg-background px-2 text-sm"
                      >
                        {[3, 4, 5, 6].map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        className="h-8 w-16"
                        type="number"
                        min={1}
                        max={18}
                        value={hole.handicapIndex}
                        onChange={(e) => {
                          const updated = [...holes];
                          updated[i] = { ...updated[i], handicapIndex: e.target.value };
                          setHoles(updated);
                        }}
                      />
                    </td>
                    {teeSetName && (
                      <td className="px-2 py-1">
                        <Input
                          className="h-8 w-20"
                          type="number"
                          min={1}
                          value={yardages[i]}
                          onChange={(e) => {
                            const updated = [...yardages];
                            updated[i] = e.target.value;
                            setYardages(updated);
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Tee set */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tee Set (optional)</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <div className="space-y-1 flex-1">
              <Label htmlFor="teeSetName">Name</Label>
              <Input id="teeSetName" value={teeSetName} onChange={(e) => setTeeSetName(e.target.value)} placeholder="White" />
            </div>
            <div className="space-y-1 w-20">
              <Label htmlFor="teeSetColor">Color</Label>
              <input
                type="color"
                id="teeSetColor"
                value={teeSetColor}
                onChange={(e) => setTeeSetColor(e.target.value)}
                className="h-9 w-full cursor-pointer rounded border"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Creating…" : "Create Course"}
        </Button>
      </form>
    </div>
  );
}
