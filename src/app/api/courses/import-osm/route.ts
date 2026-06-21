import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { courseImportOsmSchema } from "@/lib/validations/course";
import { getCourseDetail } from "@/lib/maps/overpass";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = courseImportOsmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { osmId, lat, lng } = parsed.data;

  const supabase = createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if already imported
  const { data: existing } = await supabase
    .from("courses")
    .select("id")
    .eq("osm_id", osmId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Course already imported", courseId: existing.id },
      { status: 409 }
    );
  }

  try {
    // Fetch full details from Overpass
    const detail = await getCourseDetail(osmId, lat, lng);

    // Insert course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        osm_id: osmId,
        name: detail.name,
        location: `POINT(${detail.lng} ${detail.lat})`,
        num_holes: detail.holes ?? 18,
        source: "osm",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: courseError?.message ?? "Failed to create course" },
        { status: 500 }
      );
    }

    // Insert holes if available
    if (detail.holeDetails.length > 0) {
      const holeRows = detail.holeDetails.map((h) => ({
        course_id: course.id,
        hole_number: h.holeNumber,
        par: h.par ?? 4, // default to par 4 if not available
        pin_location: `POINT(${h.lng} ${h.lat})`,
      }));

      const { error: holesError } = await supabase.from("holes").insert(holeRows);

      if (holesError) {
        // Course created but holes failed — log but don't fail the whole request
        console.error("Failed to insert holes:", holesError.message);
      }
    } else {
      // No hole data from OSM — create placeholder holes
      const numHoles = detail.holes ?? 18;
      const placeholderHoles = Array.from({ length: numHoles }, (_, i) => ({
        course_id: course.id,
        hole_number: i + 1,
        par: 4,
      }));

      await supabase.from("holes").insert(placeholderHoles);
    }

    return NextResponse.json({ courseId: course.id, name: detail.name });
  } catch (err) {
    console.error("Course import error:", err);
    return NextResponse.json({ error: "Failed to import course" }, { status: 502 });
  }
}
