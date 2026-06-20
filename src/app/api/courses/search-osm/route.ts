import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { courseSearchOsmSchema } from "@/lib/validations/course";

export interface CourseSearchResult {
  osmId: number | null;
  id: string | null;
  name: string;
  lat: number;
  lng: number;
  holes: number | null;
  distanceKm: number | null;
  inDatabase: boolean;
  source: "osm" | "community";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const raw: Record<string, string> = {};
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const radiusParam = searchParams.get("radius");
  const qParam = searchParams.get("q");
  if (latParam) raw.lat = latParam;
  if (lngParam) raw.lng = lngParam;
  if (radiusParam) raw.radius = radiusParam;
  if (qParam) raw.q = qParam;

  const parsed = courseSearchOsmSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { lat, lng, radius, q } = parsed.data;

  try {
    const supabase = createClient();
    const results: CourseSearchResult[] = [];

    if (q) {
      // Name search via RPC
      const { data: dbCourses } = await supabase.rpc("search_courses_by_name", {
        search_term: q,
      });

      for (const c of dbCourses ?? []) {
        results.push({
          osmId: c.osm_id ?? null,
          id: c.id,
          name: c.name,
          lat: c.lat,
          lng: c.lng,
          holes: c.num_holes,
          distanceKm: null,
          inDatabase: true,
          source: c.source as "osm" | "community",
        });
      }
    } else if (lat != null && lng != null) {
      // Nearby search via RPC — default 50 km radius
      const { data: dbCourses } = await supabase.rpc("nearby_courses", {
        user_lat: lat,
        user_lng: lng,
        max_distance_meters: (radius ?? 25000),
      });

      for (const c of dbCourses ?? []) {
        results.push({
          osmId: c.osm_id ?? null,
          id: c.id,
          name: c.name,
          lat: c.lat,
          lng: c.lng,
          holes: c.num_holes,
          distanceKm: (c.distance_meters ?? 0) / 1000,
          inDatabase: true,
          source: c.source as "osm" | "community",
        });
      }
    } else {
      return NextResponse.json(
        { error: "Provide either 'q' (name search) or 'lat'+'lng' (nearby search)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
