/**
 * Overpass QL query builder for golf course data from OpenStreetMap.
 * Queries the public Overpass API endpoint.
 */

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export interface OverpassCourse {
  osmId: number;
  name: string;
  lat: number;
  lng: number;
  holes: number | null;
}

export interface OverpassHoleDetail {
  holeNumber: number;
  lat: number;
  lng: number;
  par: number | null;
}

export interface OverpassCourseDetail extends OverpassCourse {
  holeDetails: OverpassHoleDetail[];
}

/**
 * Build Overpass QL to find golf courses near a lat/lng within a radius (meters).
 */
function buildNearbyQuery(lat: number, lng: number, radius: number): string {
  return `
    [out:json][timeout:25];
    (
      way["leisure"="golf_course"](around:${radius},${lat},${lng});
      relation["leisure"="golf_course"](around:${radius},${lat},${lng});
    );
    out center tags;
  `;
}

/**
 * Build Overpass QL to search golf courses by name (fuzzy via regex).
 */
function buildNameQuery(name: string): string {
  // Escape regex special characters
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `
    [out:json][timeout:25];
    (
      way["leisure"="golf_course"]["name"~"${escaped}",i];
      relation["leisure"="golf_course"]["name"~"${escaped}",i];
    );
    out center tags;
  `;
}

/**
 * Build Overpass QL to get hole details for a specific golf course by OSM ID.
 */
function buildCourseDetailQuery(osmId: number): string {
  return `
    [out:json][timeout:25];
    (
      way(${osmId});
      relation(${osmId});
    );
    out body;
    >>;
    out body;
    (
      node["golf"="hole"](around.w:500);
      way["golf"="hole"](around.w:500);
    );
    out center tags;
  `;
}

/**
 * Execute an Overpass QL query and return raw JSON response.
 */
async function executeQuery(query: string): Promise<unknown> {
  // Collapse whitespace — some Overpass mirrors reject multiline POST bodies
  const trimmed = query.replace(/\s+/g, " ").trim();

  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "User-Agent": "GolfApp/1.0",
          "Accept": "*/*",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(trimmed)}`,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        return res.json();
      }

      const text = await res.text().catch(() => res.statusText);
      lastError = new Error(`Overpass API error: ${res.status} — ${text.slice(0, 200)}`);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        lastError = new Error(`Overpass endpoint timed out: ${endpoint}`);
      } else {
        lastError = err instanceof Error ? err : new Error("Network error");
      }
    }
  }

  throw lastError ?? new Error("All Overpass endpoints failed");
}

/**
 * Parse raw Overpass elements into OverpassCourse array.
 */
function parseCourses(data: unknown): OverpassCourse[] {
  const elements = (data as { elements?: unknown[] }).elements ?? [];
  const courses: OverpassCourse[] = [];

  for (const el of elements) {
    const element = el as {
      id: number;
      tags?: Record<string, string>;
      center?: { lat: number; lon: number };
      lat?: number;
      lon?: number;
    };

    if (!element.tags?.["leisure"] || element.tags["leisure"] !== "golf_course") continue;

    const lat = element.center?.lat ?? element.lat;
    const lng = element.center?.lon ?? element.lon;
    if (lat == null || lng == null) continue;

    const holesTag = element.tags["golf:holes"] ?? element.tags["holes"];
    courses.push({
      osmId: element.id,
      name: element.tags["name"] ?? "Unnamed Course",
      lat,
      lng,
      holes: holesTag ? parseInt(holesTag, 10) || null : null,
    });
  }

  return courses;
}

/**
 * Search golf courses near a lat/lng within radius (meters).
 */
export async function searchCoursesNearby(
  lat: number,
  lng: number,
  radius: number = 25000
): Promise<OverpassCourse[]> {
  const query = buildNearbyQuery(lat, lng, radius);
  const data = await executeQuery(query);
  return parseCourses(data);
}

/**
 * Search golf courses by name.
 */
export async function searchCoursesByName(name: string): Promise<OverpassCourse[]> {
  const query = buildNameQuery(name);
  const data = await executeQuery(query);
  return parseCourses(data);
}

/**
 * Get detailed course info including hole nodes from OSM.
 */
export async function getCourseDetail(
  osmId: number,
  fallbackLat: number,
  fallbackLng: number
): Promise<OverpassCourseDetail> {
  const query = buildCourseDetailQuery(osmId);
  const data = await executeQuery(query);
  const elements = (data as { elements?: unknown[] }).elements ?? [];

  // Find the course element
  let courseName = "Unnamed Course";
  let courseLat = fallbackLat;
  let courseLng = fallbackLng;
  let courseHoles: number | null = null;

  for (const el of elements) {
    const element = el as {
      id: number;
      tags?: Record<string, string>;
      center?: { lat: number; lon: number };
      lat?: number;
      lon?: number;
    };

    if (element.id === osmId && element.tags) {
      courseName = element.tags["name"] ?? courseName;
      courseLat = element.center?.lat ?? element.lat ?? courseLat;
      courseLng = element.center?.lon ?? element.lon ?? courseLng;
      const holesTag = element.tags["golf:holes"] ?? element.tags["holes"];
      courseHoles = holesTag ? parseInt(holesTag, 10) || null : null;
    }
  }

  // Parse hole elements
  const holeDetails: OverpassHoleDetail[] = [];
  for (const el of elements) {
    const element = el as {
      tags?: Record<string, string>;
      center?: { lat: number; lon: number };
      lat?: number;
      lon?: number;
    };

    if (element.tags?.["golf"] !== "hole") continue;

    const lat = element.center?.lat ?? element.lat;
    const lng = element.center?.lon ?? element.lon;
    if (lat == null || lng == null) continue;

    const ref = element.tags["ref"];
    const holeNumber = ref ? parseInt(ref, 10) : holeDetails.length + 1;
    const parTag = element.tags["par"];

    holeDetails.push({
      holeNumber: isNaN(holeNumber) ? holeDetails.length + 1 : holeNumber,
      lat,
      lng,
      par: parTag ? parseInt(parTag, 10) || null : null,
    });
  }

  // Sort by hole number
  holeDetails.sort((a, b) => a.holeNumber - b.holeNumber);

  return {
    osmId,
    name: courseName,
    lat: courseLat,
    lng: courseLng,
    holes: courseHoles ?? (holeDetails.length || null),
    holeDetails,
  };
}
