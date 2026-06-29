"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/auth/dal";

export type ProfileState = { error?: string; message?: string } | undefined;

function str(fd: FormData, k: string): string {
  return (fd.get(k) ?? "").toString().trim();
}

/** Update the signed-in user's display name / avatar. */
export async function updateProfile(
  _prev: ProfileState,
  fd: FormData,
): Promise<ProfileState> {
  if (!isSupabaseConfigured) return { message: "Tersimpan." };
  const user = await getSessionUser();
  if (!user) return { error: "Sesi berakhir, masuk lagi." };
  const fullName = str(fd, "full_name");
  if (!fullName) return { error: "Nama tidak boleh kosong." };
  const supabase = await createClient();
  const patch: Record<string, unknown> = { full_name: fullName };
  const avatar = str(fd, "avatar_url");
  if (fd.has("avatar_url")) patch.avatar_url = avatar || null;
  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/me/profile");
  revalidatePath("/", "layout");
  return { message: "Profil diperbarui." };
}

/** Change the signed-in user's password. */
export async function changePassword(
  _prev: ProfileState,
  fd: FormData,
): Promise<ProfileState> {
  const password = str(fd, "password");
  const confirm = str(fd, "confirm");
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };
  if (password !== confirm) return { error: "Konfirmasi tidak cocok." };
  if (!isSupabaseConfigured) return { message: "Kata sandi diperbarui." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "Kata sandi berhasil diperbarui." };
}
