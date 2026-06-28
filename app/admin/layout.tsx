import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/dal";

// Gate the whole /admin/* subtree: anon → /login, students → /dashboard.
// RLS is the real defense; this is the UX redirect. In mock mode it's a no-op.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
