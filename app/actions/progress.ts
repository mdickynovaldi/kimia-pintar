"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/auth/dal";

/** Mark a material/video complete (or not) for the current student. */
export async function markComplete(
  meetingId: string,
  itemType: "material" | "video",
  itemId: string,
  completed: boolean,
): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured) return { ok: true }; // mock mode no-op
  const user = await getSessionUser();
  if (!user) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("content_progress").upsert(
    {
      student_id: user.id,
      meeting_id: meetingId,
      item_type: itemType,
      item_id: itemId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "student_id,item_type,item_id" },
  );
  if (error) return { ok: false };
  revalidatePath(`/courses`, "layout");
  return { ok: true };
}
