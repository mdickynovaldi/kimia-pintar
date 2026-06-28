// Seed Supabase Auth users + enrollments for Kimia Pintar.
// Run AFTER the migrations + seed.sql are applied:
//   node --env-file=.env.local scripts/seed-users.mjs
//
// Creates the admin (Bu Maya) and a set of students (profiles are created by the
// handle_new_user trigger from user_metadata), enrolls students into Kimia Dasar,
// and seeds one graded attempt so the gradebook/results aren't empty.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with: node --env-file=.env.local scripts/seed-users.mjs",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADMIN = {
  email: "maya@kimiapintar.com",
  password: "admin12345",
  full_name: "Bu Maya",
  role: "admin",
};

const STUDENTS = [
  { email: "emmil@kampus.ac.id", full_name: "Emmil Saputra", student_no: "2023012045" },
  { email: "rara@kampus.ac.id", full_name: "Rara Fitri", student_no: "2023012088" },
  { email: "dian@kampus.ac.id", full_name: "Dian Pratama", student_no: "2023012061" },
  { email: "budi@kampus.ac.id", full_name: "Budi Santoso", student_no: "2023012013" },
  { email: "nadia@kampus.ac.id", full_name: "Nadia Putri", student_no: "2023012099" },
];
const STUDENT_PASSWORD = "rahasia123";

async function findUserByEmail(email) {
  // paginate listUsers (fine for a small project)
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

async function ensureUser({ email, password, full_name, student_no, role }) {
  let user = await findUserByEmail(email);
  if (user) {
    console.log(`• exists: ${email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: role ?? "student", student_no: student_no ?? null },
    });
    if (error) throw error;
    user = data.user;
    console.log(`✓ created: ${email}`);
  }
  // Ensure the profile reflects the intended role/name (in case the trigger ran
  // before metadata, or the user pre-existed).
  await supabase
    .from("profiles")
    .update({ full_name, role: role ?? "student", student_no: student_no ?? null })
    .eq("id", user.id);
  return user;
}

async function main() {
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "kimia-dasar")
    .maybeSingle();
  if (!course) {
    console.error("Course kimia-dasar not found. Apply migrations + seed.sql first.");
    process.exit(1);
  }

  await ensureUser({ ...ADMIN });

  const studentIds = [];
  for (const s of STUDENTS) {
    const u = await ensureUser({ ...s, password: STUDENT_PASSWORD, role: "student" });
    studentIds.push(u.id);
    await supabase
      .from("enrollments")
      .upsert(
        { course_id: course.id, student_id: u.id, status: "active" },
        { onConflict: "course_id,student_id" },
      );
  }
  console.log(`✓ enrolled ${studentIds.length} students into Kimia Dasar`);

  // Seed one graded attempt for Emmil on the Termokimia quiz so the gradebook
  // and results views show data immediately.
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, passing_score")
    .eq("title", "Kuis Pertemuan 4 — Termokimia")
    .maybeSingle();
  const emmil = studentIds[0];
  if (quiz && emmil) {
    const { data: existing } = await supabase
      .from("quiz_attempts")
      .select("id")
      .eq("quiz_id", quiz.id)
      .eq("student_id", emmil)
      .maybeSingle();
    if (!existing) {
      const { data: q } = await supabase
        .from("questions")
        .select("id, points")
        .eq("quiz_id", quiz.id);
      const maxScore = (q ?? []).reduce((s, x) => s + Number(x.points), 0) || 100;
      const score = Math.round(maxScore * 0.8 * 100) / 100;
      const pct = Math.round((score / maxScore) * 100 * 100) / 100;
      const { data: att } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quiz.id,
          student_id: emmil,
          attempt_number: 1,
          status: "graded",
          submitted_at: new Date().toISOString(),
          score,
          max_score: maxScore,
          percentage: pct,
          passed: pct >= Number(quiz.passing_score ?? 60),
          time_spent_seconds: 872,
        })
        .select("id")
        .single();
      console.log(`✓ seeded graded attempt for Emmil (${pct}%)`, att?.id ?? "");
    } else {
      console.log("• Emmil already has an attempt on the Termokimia quiz");
    }
  }

  console.log("\nDone. Login as:");
  console.log(`  admin   → ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`  student → emmil@kampus.ac.id / ${STUDENT_PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
