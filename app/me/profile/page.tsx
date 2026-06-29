import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/data";
import { ProfileTabs } from "./profile-tabs";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  return (
    <AppShell
      variant="student"
      contentClassName="narrow"
      crumb={
        <>
          <b>Profil</b>
        </>
      }
    >
      <div className="page-head">
        <h1>Profil Saya</h1>
        <p>Kelola informasi akun dan keamanan kamu.</p>
      </div>

      <ProfileTabs
        fullName={user.fullName}
        email={user.email}
        studentNo={user.studentNo ?? ""}
        initials={user.initials}
        avatarUrl={user.avatarUrl}
      />
    </AppShell>
  );
}
