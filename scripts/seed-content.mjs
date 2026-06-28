// Seed course content into Supabase via the service-role client (bypasses RLS).
// Idempotent: safe to re-run. Run with:
//   node --env-file=.env scripts/seed-content.mjs
// (use --env-file=.env.local if that's where your keys live)

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env. Run: node --env-file=.env scripts/seed-content.mjs");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const COURSES = [
  ["KIMIA-DASAR", "kimia-dasar", "Kimia Dasar", "Fondasi ilmu kimia: dari stoikiometri dan struktur atom hingga reaksi redoks. Delapan pertemuan terstruktur dengan materi, video, dan kuis.", "oklch(55% 0.12 178)", 1, true],
  ["KIMIA-ORGANIK", "kimia-organik", "Kimia Organik", "Struktur, tata nama, dan reaksi senyawa karbon.", "oklch(60% 0.1 300)", 2, false],
  ["KIMIA-ANORGANIK", "kimia-anorganik", "Kimia Anorganik", "Senyawa logam, koordinasi, dan kimia unsur.", "oklch(58% 0.12 145)", 3, false],
  ["BIOKIMIA", "biokimia", "Biokimia", "Molekul kehidupan: protein, karbohidrat, lipid, dan metabolisme.", "oklch(62% 0.1 60)", 4, false],
  ["KIMIA-ANALITIK", "kimia-analitik", "Kimia Analitik", "Analisis kualitatif dan kuantitatif, titrasi, dan kesalahan pengukuran.", "oklch(60% 0.12 250)", 5, false],
  ["KIMIA-FISIKA", "kimia-fisika", "Kimia Fisika", "Termodinamika, kinetika, dan kesetimbangan dari sudut pandang fisika.", "oklch(60% 0.12 20)", 6, false],
  ["KIMIA-INSTRUMEN", "kimia-instrumen", "Kimia Instrumen", "Spektroskopi, kromatografi, dan teknik instrumentasi modern.", "oklch(58% 0.1 220)", 7, false],
];

const MEETINGS = [
  ["Stoikiometri", "stoikiometri", 1],
  ["Struktur Atom", "struktur-atom", 2],
  ["Ikatan Kimia", "ikatan-kimia", 3],
  ["Termokimia", "termokimia", 4],
  ["Laju Reaksi", "laju-reaksi", 5],
  ["Kesetimbangan Kimia", "kesetimbangan-kimia", 6],
  ["Asam-Basa", "asam-basa", 7],
  ["Reaksi Redoks", "reaksi-redoks", 8],
];

const TERMO_BODY = `
<h3 style="margin-bottom:10px">Entalpi dan kalor reaksi</h3>
<p>Termokimia mempelajari perubahan energi, khususnya kalor, yang menyertai reaksi kimia. Besaran utamanya adalah <b>entalpi</b> (H), yaitu kandungan energi sistem pada tekanan tetap. Yang dapat kita ukur bukan nilai H itu sendiri, melainkan perubahannya, yaitu <b>ΔH</b> (delta H), selisih entalpi produk dengan reaktan.</p>
<p>Berdasarkan arah aliran kalornya, reaksi dibagi menjadi dua. Pada reaksi <b>eksoterm</b>, sistem melepas kalor ke lingkungan sehingga ΔH bernilai negatif dan suhu sekitar naik. Sebaliknya, pada reaksi <b>endoterm</b>, sistem menyerap kalor dari lingkungan sehingga ΔH bernilai positif dan suhu sekitar turun.</p>
<div class="formula">CH<sub>4</sub> + 2O<sub>2</sub> &rarr; CO<sub>2</sub> + 2H<sub>2</sub>O&nbsp;&nbsp;&nbsp;&Delta;H = &minus;890 kJ/mol</div>
<ul>
  <li>ΔH &lt; 0 berarti reaksi eksoterm (melepas kalor).</li>
  <li>ΔH &gt; 0 berarti reaksi endoterm (menyerap kalor).</li>
  <li>Entalpi pembentukan standar (ΔH<sub>f</sub>°) diukur pada 298 K dan 1 atm.</li>
</ul>`.trim();

// Full 10-question Termokimia quiz (mirrors lib/data/mock.ts).
const TERMO_QUESTIONS = [
  { type: "single_choice", prompt: "Reaksi yang melepaskan kalor ke lingkungan disebut…", explanation: "Reaksi eksoterm melepaskan kalor ke lingkungan sehingga suhu lingkungan naik.", options: [["Eksoterm", true], ["Endoterm", false], ["Isotermal", false], ["Adiabatik", false]] },
  { type: "single_choice", prompt: "Nilai ΔH untuk reaksi eksoterm bernilai…", explanation: "Entalpi produk lebih rendah dari reaktan sehingga ΔH < 0 (negatif).", options: [["Negatif", true], ["Positif", false], ["Nol", false], ["Tak tentu", false]] },
  { type: "multiple_choice", prompt: "Manakah proses berikut yang tergolong endoterm?", explanation: "Endoterm menyerap kalor: mencairnya es, fotosintesis, dan penguapan air.", options: [["Mencairnya es batu", true], ["Fotosintesis pada daun", true], ["Pembakaran kertas", false], ["Penguapan air", true]] },
  { type: "true_false", prompt: "Pada reaksi endoterm, sistem menyerap kalor dari lingkungan.", explanation: "Benar — reaksi endoterm menyerap kalor, ΔH positif.", options: [["Benar", true], ["Salah", false]] },
  { type: "single_choice", prompt: "Pada reaksi CH4 + 2O2 → CO2 + 2H2O (ΔH = −890 kJ/mol), reaksi tergolong…", explanation: "ΔH negatif menandakan kalor dilepas — reaksi eksoterm (pembakaran metana).", options: [["Eksoterm", true], ["Endoterm", false], ["Isotermal", false], ["Tidak dapat ditentukan", false]] },
  { type: "single_choice", prompt: "Satuan SI untuk entalpi reaksi adalah…", explanation: "Entalpi adalah energi, satuannya joule/kilojoule.", options: [["kJ (kilojoule)", true], ["mol", false], ["atm", false], ["kelvin", false]] },
  { type: "true_false", prompt: "Pada reaksi eksoterm, suhu lingkungan di sekitar sistem akan turun.", explanation: "Salah. Reaksi eksoterm melepas kalor sehingga suhu lingkungan naik.", options: [["Benar", false], ["Salah", true]] },
  { type: "single_choice", prompt: "Kondisi standar entalpi pembentukan diukur pada…", explanation: "Keadaan standar termokimia: 298 K (25 °C) dan 1 atm.", options: [["298 K dan 1 atm", true], ["0 K dan 1 atm", false], ["373 K dan 2 atm", false], ["100 K dan 1 atm", false]] },
  { type: "multiple_choice", prompt: "Pernyataan yang benar tentang reaksi eksoterm adalah…", explanation: "Eksoterm: ΔH < 0, melepas kalor, entalpi produk lebih rendah.", options: [["ΔH bernilai negatif", true], ["Melepaskan kalor ke lingkungan", true], ["Menyerap kalor dari lingkungan", false], ["Entalpi produk lebih rendah dari reaktan", true]] },
  { type: "single_choice", prompt: "Jika suatu reaksi memiliki ΔH = +180 kJ/mol, maka reaksi tersebut…", explanation: "ΔH positif berarti menyerap kalor — endoterm.", options: [["Endoterm, menyerap kalor", true], ["Eksoterm, melepas kalor", false], ["Tidak melibatkan kalor", false], ["Selalu spontan", false]] },
];

async function main() {
  // 1) courses
  await sb.from("courses").upsert(
    COURSES.map(([code, slug, title, description, color, sort_order, is_published]) => ({
      code, slug, title, description, color, sort_order, is_published,
    })),
    { onConflict: "code" },
  );
  const { data: dasar } = await sb.from("courses").select("id").eq("slug", "kimia-dasar").single();
  console.log("✓ courses (7)");

  // 2) meetings
  await sb.from("meetings").upsert(
    MEETINGS.map(([title, slug, ord]) => ({
      // All published so students see the full syllabus; later meetings appear
      // "locked" via progress (the data layer derives that), not via publish.
      course_id: dasar.id, title, slug, sort_order: ord, is_published: true,
    })),
    { onConflict: "course_id,slug" },
  );
  const { data: mtgs } = await sb.from("meetings").select("id, slug, sort_order, title").eq("course_id", dasar.id);
  console.log("✓ meetings (8)");

  // 3) materials + videos (guard against duplicates)
  for (const m of mtgs) {
    const { count: matCount } = await sb.from("materials").select("*", { count: "exact", head: true }).eq("meeting_id", m.id);
    if (!matCount) {
      await sb.from("materials").insert({
        meeting_id: m.id,
        title: m.title,
        body: m.slug === "termokimia" ? TERMO_BODY : `<h3 style="margin-bottom:10px">${m.title}</h3><p>Materi pembelajaran untuk ${m.title}.</p>`,
      });
    }
    const { count: vidCount } = await sb.from("videos").select("*", { count: "exact", head: true }).eq("meeting_id", m.id);
    if (!vidCount) {
      await sb.from("videos").insert({
        meeting_id: m.id,
        title: `Video pembelajaran — ${m.title}`,
        provider: "google_drive",
        drive_file_id: "CONTOH_ID",
        source_url: "https://drive.google.com/file/d/CONTOH_ID/preview",
      });
    }
  }
  console.log("✓ materials + videos");

  // 4) quizzes for P1..P4 (shells), P4 fully populated
  for (let n = 1; n <= 4; n++) {
    const m = mtgs.find((x) => x.sort_order === n);
    const { data: existing } = await sb.from("quizzes").select("id").eq("meeting_id", m.id).maybeSingle();
    let quizId = existing?.id;
    if (!quizId) {
      const { data: qz } = await sb
        .from("quizzes")
        .insert({
          meeting_id: m.id,
          course_id: dasar.id,
          title: `Kuis Pertemuan ${n} — ${m.title}`,
          description: `Kuis objektif untuk pertemuan ${n}.`,
          time_limit_minutes: 20,
          max_attempts: 1,
          passing_score: 60,
          grading_method: "highest",
          shuffle_questions: n === 4,
          show_correct_answers: "after_submit",
          questions_per_page: 1,
          is_published: true,
        })
        .select("id")
        .single();
      quizId = qz.id;
    }
    // questions only for P4 (Termokimia)
    if (n === 4) {
      const { count: qCount } = await sb.from("questions").select("*", { count: "exact", head: true }).eq("quiz_id", quizId);
      if (!qCount) {
        for (let i = 0; i < TERMO_QUESTIONS.length; i++) {
          const q = TERMO_QUESTIONS[i];
          const { data: qrow } = await sb
            .from("questions")
            .insert({ quiz_id: quizId, type: q.type, prompt: q.prompt, points: 1, explanation: q.explanation, sort_order: i + 1 })
            .select("id")
            .single();
          await sb.from("question_options").insert(
            q.options.map(([content, is_correct], idx) => ({
              question_id: qrow.id, content, is_correct, sort_order: idx + 1,
            })),
          );
        }
        console.log("✓ Termokimia quiz: 10 questions + options");
      }
    }
  }
  console.log("✓ quizzes (P1–P4)\nContent seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
