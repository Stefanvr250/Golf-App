import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRoundCSV } from "@/lib/export/csv";
import { generateRoundPDF } from "@/lib/export/pdf";

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "csv";

    if (format !== "csv" && format !== "pdf") {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'pdf'." },
        { status: 400 }
      );
    }

    // Fetch round
    const { data: round } = await supabase
      .from("rounds")
      .select("*, course:courses(*), tee_set:tee_sets(*), profiles:profiles(display_name)")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    const course = round.course as any;
    const teeSet = round.tee_set as any;
    const profile = Array.isArray(round.profiles) ? round.profiles[0] : round.profiles;

    // Fetch holes
    const { data: holes } = await supabase
      .from("holes")
      .select("id, hole_number, par")
      .eq("course_id", course.id)
      .order("hole_number");

    // Fetch yardages for tee set
    let yardageMap: Record<string, number> = {};
    if (teeSet) {
      const holeIds = (holes ?? []).map((h: any) => h.id);
      if (holeIds.length > 0) {
        const { data: holeTees } = await supabase
          .from("hole_tees")
          .select("hole_id, yardage")
          .eq("tee_set_id", teeSet.id)
          .in("hole_id", holeIds);

        for (const ht of holeTees ?? []) {
          yardageMap[ht.hole_id] = ht.yardage;
        }
      }
    }

    // Fetch scores
    const { data: scores } = await supabase
      .from("hole_scores")
      .select("*")
      .eq("round_id", params.id);

    const holeData = (holes ?? []).map((h: any) => ({
      holeNumber: h.hole_number,
      par: h.par,
      yardage: yardageMap[h.id],
    }));

    const roundInfo = {
      date: round.date,
      totalStrokes: round.total_strokes,
      courseName: course.name,
      teeSetName: teeSet?.name,
      playerName: profile?.display_name,
    };

    if (format === "csv") {
      const csv = generateRoundCSV(roundInfo, holeData, scores ?? []);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="round-${params.id}.csv"`,
        },
      });
    }

    // PDF
    const pdfBlob = generateRoundPDF(roundInfo, holeData, scores ?? []);
    const buffer = await pdfBlob.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="round-${params.id}.pdf"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
