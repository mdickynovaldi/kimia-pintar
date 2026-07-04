import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getGradingQueue } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Penilaian Esai" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

export default async function AdminGradingPage() {
  await requireAdmin();
  const queue = await getGradingQueue();

  return (
    <AppShell variant="admin" crumb={<b>Penilaian</b>}>
      <div className="page-head">
        <h1>Penilaian Esai</h1>
        <p>
          Jawaban esai / isian yang menunggu dinilai manual. Nilai akhir siswa
          terbit begitu kamu menyimpan penilaian.
        </p>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Siswa</th>
              <th>Kuis</th>
              <th>Dikirim</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: "center", padding: "26px" }}>
                  Tidak ada jawaban yang menunggu penilaian. 🎉
                </td>
              </tr>
            ) : (
              queue.map((item) => (
                <tr key={item.attemptId}>
                  <td style={{ fontWeight: 600, color: "var(--fg-strong)" }}>
                    {item.studentName}
                  </td>
                  <td>
                    {item.meetingLabel} — {item.quizTitle}
                  </td>
                  <td className="muted nowrap">
                    {item.submittedAt
                      ? dateFmt.format(new Date(item.submittedAt))
                      : "—"}
                  </td>
                  <td className="nowrap">
                    <Link
                      className="btn btn-sm btn-primary"
                      href={`/admin/grading/${item.attemptId}`}
                    >
                      Nilai
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
