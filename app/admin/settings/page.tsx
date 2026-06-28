import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { saveSettings } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth/dal";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Pengaturan · Admin Kimia Pintar" };

const pageStyles = `
  .set-row { display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid var(--border); }
  .set-row:last-child { border-bottom:0; }
  .set-row .copy { flex:1; min-width:0; }
  .set-row .copy .t { font-weight:600; }
  .set-row .copy .h { font-size:12.5px; color:var(--faint); margin-top:2px; }
  .save-bar { position:sticky; bottom:0; background:color-mix(in oklch, var(--bg) 86%, transparent); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-top:1px solid var(--border); padding:14px clamp(18px,3vw,34px); margin:24px -34px -34px; display:flex; justify-content:flex-end; gap:10px; }
`;

function Switch({ name, defaultChecked }: { name: string; defaultChecked?: boolean }) {
  return (
    <label className="switch">
      <input type="checkbox" name={name} value="true" defaultChecked={defaultChecked} />
      <span className="track" />
    </label>
  );
}

export default async function AdminSettingsPage() {
  await requireAdmin();
  const s = await getSettings();

  return (
    <AppShell variant="admin" crumb={<>Admin · <b>Pengaturan</b></>} contentClassName="narrow">
      <style>{pageStyles}</style>

      <div className="page-head">
        <h1>Pengaturan Platform</h1>
        <p>Konfigurasi global untuk Kimia Pintar — identitas situs, registrasi, dan kebijakan kuis default.</p>
      </div>

      <form action={saveSettings}>
        <div className="stack" style={{ gap: "18px" }}>
          <div className="card">
            <div className="card-head"><h3>Umum</h3></div>
            <div className="card-pad">
              <div className="field">
                <label htmlFor="site-name">Nama situs</label>
                <input className="input" id="site-name" name="site_name" type="text" defaultValue={s.siteName} />
              </div>
              <div className="field">
                <label htmlFor="domain">Domain</label>
                <input className="input" id="domain" name="domain" type="text" defaultValue={s.domain} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="lang">Bahasa</label>
                <select className="select" id="lang" name="locale" defaultValue={s.locale}>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Registrasi</h3></div>
            <div className="card-pad" style={{ paddingTop: "6px" }}>
              <div className="set-row">
                <div className="copy">
                  <div className="t">Izinkan registrasi mandiri siswa</div>
                  <div className="h">Siswa dapat membuat akun sendiri tanpa diundang admin.</div>
                </div>
                <Switch name="allow_registration" defaultChecked={s.allowRegistration} />
              </div>
              <div className="set-row">
                <div className="copy">
                  <div className="t">Wajib persetujuan admin untuk akun baru</div>
                  <div className="h">Per PRD Open Question §18 — bila aktif, akun baru tertahan hingga disetujui Bu Maya sebelum dapat masuk.</div>
                </div>
                <Switch name="require_admin_approval" defaultChecked={s.requireAdminApproval} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Kebijakan kuis default</h3></div>
            <div className="card-pad">
              <div className="field">
                <label htmlFor="passing">Skor lulus (passing_score)</label>
                <input className="input" id="passing" name="default_passing_score" type="number" defaultValue={s.defaultPassingScore} min={0} max={100} />
                <span className="hint">Nilai minimum agar percobaan dianggap lulus.</span>
              </div>
              <div className="field">
                <label htmlFor="grade-method">Metode nilai default</label>
                <select className="select" id="grade-method" name="default_grading_method" defaultValue={s.defaultGradingMethod}>
                  <option value="highest">Skor tertinggi (highest)</option>
                  <option value="latest">Percobaan terakhir (latest)</option>
                  <option value="average">Rata-rata (average)</option>
                  <option value="first">Percobaan pertama (first)</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="show-answers">Tampilkan jawaban benar</label>
                <select className="select" id="show-answers" name="default_show_answers" defaultValue={s.defaultShowAnswers}>
                  <option value="never">Tidak pernah (never)</option>
                  <option value="after_submit">Setelah submit (after_submit)</option>
                  <option value="after_close">Setelah kuis ditutup (after_close)</option>
                </select>
              </div>
              <div className="set-row" style={{ borderTop: "1px solid var(--border)", borderBottom: 0, paddingBottom: 0 }}>
                <div className="copy">
                  <div className="t">Tampilkan skor langsung</div>
                  <div className="h">Siswa melihat skor segera setelah menyelesaikan percobaan.</div>
                </div>
                <Switch name="show_score_immediately" defaultChecked={s.showScoreImmediately} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Tentang</h3></div>
            <div className="card-pad" style={{ paddingTop: "6px" }}>
              <div className="set-row">
                <div className="copy"><div className="t">Versi</div></div>
                <span className="mono muted">2.0</span>
              </div>
              <div className="set-row">
                <div className="copy"><div className="t">Stack</div></div>
                <span className="muted">Next.js + Supabase</span>
              </div>
              <div className="set-row">
                <div className="copy"><div className="t">Admin</div></div>
                <span className="muted">Bu Maya</span>
              </div>
            </div>
          </div>
        </div>

        <div className="save-bar">
          <button className="btn btn-ghost" type="reset">Batal</button>
          <button className="btn btn-primary" type="submit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
            Simpan pengaturan
          </button>
        </div>
      </form>
    </AppShell>
  );
}
