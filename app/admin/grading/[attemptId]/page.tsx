import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getGradingDetail } from "@/lib/data";
import { requireAdmin } from "@/lib/auth/dal";
import { GradingForm } from "./grading-form";

export const metadata: Metadata = { title: "Nilai Jawaban" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

export default async function GradingDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  await requireAdmin();
  const { attemptId } = await params;
  const detail = await getGradingDetail(attemptId);
  if (!detail) notFound();

  return (
    <AppShell
      variant="admin"
      crumb={
        <>
          <Link href="/admin/grading">Penilaian</Link> /{" "}
          <b>{detail.studentName}</b>
        </>
      }
    >
      <div className="page-head">
        <div className="row between wrap">
          <div>
            <h1>{detail.quizTitle}</h1>
            <p>
              Jawaban {detail.studentName}
              {detail.submittedAt
                ? ` · dikirim ${dateFmt.format(new Date(detail.submittedAt))}`
                : ""}{" "}
              · ambang lulus {detail.passingScore}%
            </p>
          </div>
          <Link className="btn" href="/admin/grading">
            ← Kembali ke antrean
          </Link>
        </div>
      </div>

      <GradingForm detail={detail} />
    </AppShell>
  );
}
