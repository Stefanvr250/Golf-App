import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { courseSearchOsmSchema } from "@/lib/validations/course";
import { searchCoursesByName, searchCoursesNearby } from "@/lib/maps/overpass";

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

function approximateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (results.length === 0) {
      if (q) {
        const osmResults = await searchCoursesByName(q);
        for (const c of osmResults) {
          results.push({
            osmId: c.osmId,
            id: null,
            name: c.name,
            lat: c.lat,
            lng: c.lng,
            holes: c.holes,
            distanceKm: null,
            inDatabase: false,
            source: "osm",
          });
        }
      } else if (lat != null && lng != null) {
        const osmResults = await searchCoursesNearby(lat, lng, radius ?? 25000);
        for (const c of osmResults) {
          results.push({
            osmId: c.osmId,
            id: null,
            name: c.name,
            lat: c.lat,
            lng: c.lng,
            holes: c.holes,
            distanceKm: approximateDistanceKm(lat, lng, c.lat, c.lng),
            inDatabase: false,
            source: "osm",
          });
        }
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
