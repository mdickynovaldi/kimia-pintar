import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Atur Ulang Sandi" };

export default async function ResetPasswordPage() {
  let email: string | null = null;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }
  return (
    <AuthShell>
      <ResetForm email={email} />
    </AuthShell>
  );
}
