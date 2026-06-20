import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface HoleData {
  holeNumber: number;
  par: number;
  yardage?: number;
}

interface ScoreData {
  hole_number: number;
  strokes: number;
  putts: number;
  penalties: number;
  fairway_hit: string | null;
  green_in_regulation: boolean | null;
}

interface RoundInfo {
  date: string;
  totalStrokes: number | null;
  courseName: string;
  teeSetName?: string;
  playerName?: string;
}

/**
 * Generate a PDF blob for a completed round scorecard.
 */
export function generateRoundPDF(
  round: RoundInfo,
  holes: HoleData[],
  scores: ScoreData[]
): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const scoreMap = new Map<number, ScoreData>();
  for (const s of scores) {
    scoreMap.set(s.hole_number, s);
  }

  const front9 = holes.filter((h) => h.holeNumber <= 9);
  const back9 = holes.filter((h) => h.holeNumber > 9);

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("GolfApp — Round Scorecard", 14, 20);

  // Round info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let y = 28;
  doc.text(`Course: ${round.courseName}`, 14, y);
  y += 5;
  doc.text(`Date: ${round.date}`, 14, y);
  if (round.playerName) {
    y += 5;
    doc.text(`Player: ${round.playerName}`, 14, y);
  }
  if (round.teeSetName) {
    y += 5;
    doc.text(`Tee Set: ${round.teeSetName}`, 14, y);
  }
  if (round.totalStrokes != null) {
    y += 5;
    doc.text(`Total Score: ${round.totalStrokes}`, 14, y);
  }

  y += 10;

  // Build table data
  function buildRows(holeList: HoleData[]) {
    return holeList.map((hole) => {
      const score = scoreMap.get(hole.holeNumber);
      const strokes = score?.strokes ?? 0;
      const vsPar = strokes > 0 ? strokes - hole.par : 0;
      return [
        String(hole.holeNumber),
        String(hole.par),
        hole.yardage != null ? String(hole.yardage) : "—",
        strokes > 0 ? String(strokes) : "—",
        score?.putts != null ? String(score.putts) : "—",
        score?.penalties != null ? String(score.penalties) : "—",
        score?.fairway_hit ?? "—",
        score?.green_in_regulation != null
          ? score.green_in_regulation
            ? "Y"
            : "N"
          : "—",
        strokes > 0
          ? vsPar > 0
            ? `+${vsPar}`
            : vsPar === 0
            ? "E"
            : String(vsPar)
          : "—",
      ];
    });
  }

  function calcTotals(holeList: HoleData[]) {
    let par = 0,
      yards = 0,
      strokes = 0,
      putts = 0,
      penalties = 0;
    for (const h of holeList) {
      par += h.par;
      yards += h.yardage ?? 0;
      const s = scoreMap.get(h.holeNumber);
      strokes += s?.strokes ?? 0;
      putts += s?.putts ?? 0;
      penalties += s?.penalties ?? 0;
    }
    const vsPar = strokes > 0 ? strokes - par : 0;
    return {
      par,
      yards,
      strokes,
      putts,
      penalties,
      vsParStr: strokes > 0
        ? vsPar > 0
          ? `+${vsPar}`
          : vsPar === 0
          ? "E"
          : String(vsPar)
        : "—",
    };
  }

  const columns = ["Hole", "Par", "Yds", "Score", "Putts", "Pen", "FIR", "GIR", "+/-"];

  // Front 9
  const front9Rows = buildRows(front9);
  const frontTotals = calcTotals(front9);
  front9Rows.push([
    "Out",
    String(frontTotals.par),
    String(frontTotals.yards || "—"),
    String(frontTotals.strokes || "—"),
    String(frontTotals.putts || "—"),
    String(frontTotals.penalties || "—"),
    "",
    "",
    frontTotals.vsParStr,
  ]);

  // Back 9
  if (back9.length > 0) {
    const back9Rows = buildRows(back9);
    const backTotals = calcTotals(back9);
    back9Rows.push([
      "In",
      String(backTotals.par),
      String(backTotals.yards || "—"),
      String(backTotals.strokes || "—"),
      String(backTotals.putts || "—"),
      String(backTotals.penalties || "—"),
      "",
      "",
      backTotals.vsParStr,
    ]);

    // Grand total
    const grandTotals = calcTotals(holes);
    const allRows = [
      ...front9Rows,
      ...back9Rows,
      [
        "Total",
        String(grandTotals.par),
        String(grandTotals.yards || "—"),
        String(grandTotals.strokes || "—"),
        String(grandTotals.putts || "—"),
        String(grandTotals.penalties || "—"),
        "",
        "",
        grandTotals.vsParStr,
      ],
    ];

    autoTable(doc, {
      head: [columns],
      body: allRows,
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 128, 60], textColor: 255, fontStyle: "bold" },
    });
  } else {
    // 9-hole course
    const grandTotals = calcTotals(holes);
    front9Rows.push([
      "Total",
      String(grandTotals.par),
      String(grandTotals.yards || "—"),
      String(grandTotals.strokes || "—"),
      String(grandTotals.putts || "—"),
      String(grandTotals.penalties || "—"),
      "",
      "",
      grandTotals.vsParStr,
    ]);

    autoTable(doc, {
      head: [columns],
      body: front9Rows,
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 128, 60], textColor: 255, fontStyle: "bold" },
    });
  }

  // Stats summary
  const finalY = (doc as any).lastAutoTable?.finalY ?? y + 80;
  const statsY = finalY + 10;

  const totalStrokes = scores.reduce((s, sc) => s + sc.strokes, 0);
  const totalPutts = scores.reduce((s, sc) => s + sc.putts, 0);
  const totalPenalties = scores.reduce((s, sc) => s + sc.penalties, 0);
  const firCount = scores.filter((s) => s.fairway_hit === "yes").length;
  const firTotal = scores.filter((s) => s.fairway_hit && s.fairway_hit !== "na").length;
  const girCount = scores.filter((s) => s.green_in_regulation === true).length;
  const totalPar = holes.reduce((s, h) => s + h.par, 0);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Statistics", 14, statsY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const stats = [
    `Total Strokes: ${totalStrokes}`,
    `Total Par: ${totalPar}`,
    `vs Par: ${totalStrokes - totalPar > 0 ? "+" : ""}${totalStrokes - totalPar}`,
    `Putts: ${totalPutts}`,
    `Penalties: ${totalPenalties}`,
    `FIR: ${firCount}/${firTotal} (${firTotal > 0 ? Math.round((firCount / firTotal) * 100) : 0}%)`,
    `GIR: ${girCount}/${holes.length} (${Math.round((girCount / holes.length) * 100)}%)`,
  ];

  stats.forEach((stat, i) => {
    doc.text(stat, 14, statsY + 6 + i * 5);
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text("Generated by GolfApp", 14, 285);

  return doc.output("blob");
}
