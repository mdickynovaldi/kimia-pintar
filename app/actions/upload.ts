"use server";

import { requireAdmin, requireUser } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/supabase/env";

function ext(name: string): string {
  const e = name.split(".").pop();
  return e && e.length <= 5 ? e.toLowerCase() : "bin";
}
function rand(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Upload an image to the public `media` bucket; returns a public URL.
 * Any signed-in user may upload (students: avatar; admins: covers/material images). */
export async function uploadImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireUser();
  if (!hasServiceRole) return { error: "Storage belum dikonfigurasi (service role)." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Tidak ada berkas." };
  // Only raster images. SVG is script-capable and lives in a public bucket, so
  // it's rejected to avoid stored-XSS. Cap size to keep the public bucket sane.
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!allowed.includes(file.type) || /\.svg$/i.test(file.name)) {
    return { error: "Gambar harus PNG, JPG, WEBP, atau GIF." };
  }
  if (file.size > 5 * 1024 * 1024) return { error: "Ukuran gambar maksimal 5 MB." };

  const admin = createAdminClient();
  const path = `img/${Date.now()}-${rand()}.${ext(file.name)}`;
  const { error } = await admin.storage
    .from("media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: error.message };
  const { data } = admin.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl };
}

/** Upload a downloadable attachment to the private `files` bucket; returns its
 * storage path + display metadata (served later via a signed URL). */
export async function uploadAttachment(
  formData: FormData,
): Promise<{ path?: string; name?: string; meta?: string; error?: string }> {
  await requireAdmin();
  if (!hasServiceRole) return { error: "Storage belum dikonfigurasi (service role)." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Tidak ada berkas." };

  const admin = createAdminClient();
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 60) || `berkas.${ext(file.name)}`;
  const path = `att/${Date.now()}-${safe}`;
  const { error } = await admin.storage
    .from("files")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) return { error: error.message };

  const mb = (file.size / (1024 * 1024)).toFixed(1).replace(".", ",");
  return { path, name: file.name, meta: `${ext(file.name).toUpperCase()} · ${mb} MB` };
}
