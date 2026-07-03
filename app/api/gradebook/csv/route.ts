import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/dal";
import { getGradebook } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Downloads the gradebook as CSV (admin only). Wired to the "Ekspor CSV"
// button on /admin/gradebook.
export async function GET() {
  if (isSupabaseConfigured) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (user.role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const rows = await getGradebook();

  // Collect every quiz column present (P1..Pn), sorted by number.
  const quizKeys = [...new Set(rows.flatMap((r) => Object.keys(r.quizScores)))].sort(
    (a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")),
  );

  const esc = (v: string | number | null) => {
    let s = v == null ? "" : String(v);
    // Neutralize CSV formula injection: a cell starting with = + - @ (or a
    // leading tab/CR) is treated as a formula by Excel/Sheets. Prefix with '.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = ["Nama", "NIM", ...quizKeys.map((k) => `Kuis ${k}`), "Rata-rata"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        esc(r.studentName),
        esc(r.studentNo),
        ...quizKeys.map((k) => esc(r.quizScores[k] ?? "")),
        esc(r.average),
      ].join(","),
    );
  }

  // BOM so Excel opens it as UTF-8.
  const csv = "\ufeff" + lines.join("\r\n") + "\r\n";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="buku-nilai-kimia-pintar.csv"',
      "Cache-Control": "no-store",
    },
  });
}
