import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";

// Serves a private attachment from the `files` bucket via a short-lived signed
// URL, only to signed-in users. Usage: /api/files?path=att/123-modul.pdf
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasServiceRole) {
    return NextResponse.json({ error: "storage not configured" }, { status: 500 });
  }
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("files")
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });
  }
  return NextResponse.redirect(data.signedUrl);
}
