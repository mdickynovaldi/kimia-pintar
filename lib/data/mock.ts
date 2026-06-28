// Mock dataset for the Kimia Pintar LMS UI.
// Kimia Dasar is fully populated per the PRD; the other six courses are shells
// ("Segera hadir"). All copy is in Bahasa Indonesia to match the design.

import type {
  ActivityItem,
  Course,
  Enrollment,
  GradebookRow,
  Meeting,
  Profile,
  Quiz,
  QuizAttempt,
  ResultRow,
} from "./types";

export const currentStudent: Profile = {
  id: "stu-emmil",
  role: "student",
  fullName: "Emmil Saputra",
  studentNo: "2023012045",
  email: "emmil@kampus.ac.id",
  avatarUrl: null,
  initials: "ES",
  isActive: true,
};

export const currentAdmin: Profile = {
  id: "adm-maya",
  role: "admin",
  fullName: "Bu Maya",
  studentNo: null,
  email: "maya@kimiapintar.com",
  avatarUrl: null,
  initials: "BM",
  isActive: true,
};

const G = {
  dasar: "linear-gradient(140deg,oklch(55% 0.12 178),oklch(45% 0.13 200))",
  organik: "linear-gradient(140deg,oklch(60% 0.1 300),oklch(50% 0.12 320))",
  anorganik: "linear-gradient(140deg,oklch(58% 0.12 145),oklch(48% 0.13 165))",
  biokimia: "linear-gradient(140deg,oklch(62% 0.1 60),oklch(52% 0.12 40))",
  analitik: "linear-gradient(140deg,oklch(60% 0.12 250),oklch(50% 0.13 275))",
  fisika: "linear-gradient(140deg,oklch(60% 0.12 20),oklch(50% 0.13 5))",
  instrumen: "linear-gradient(140deg,oklch(58% 0.1 220),oklch(48% 0.12 240))",
};

export const courses: Course[] = [
  {
    id: "crs-dasar",
    code: "KIMIA-DASAR",
    slug: "kimia-dasar",
    title: "Kimia Dasar",
    description:
      "Fondasi ilmu kimia: dari stoikiometri dan struktur atom hingga reaksi redoks. Delapan pertemuan terstruktur dengan materi, video, dan kuis.",
    coverGradient: G.dasar,
    color: "oklch(55% 0.12 178)",
    sortOrder: 1,
    isPublished: true,
    meetingCount: 8,
    quizCount: 4,
    instructor: "Bu Maya",
  },
  {
    id: "crs-organik",
    code: "KIMIA-ORGANIK",
    slug: "kimia-organik",
    title: "Kimia Organik",
    description: "Struktur, tata nama, dan reaksi senyawa karbon.",
    coverGradient: G.organik,
    color: "oklch(60% 0.1 300)",
    sortOrder: 2,
    isPublished: false,
    meetingCount: 0,
    quizCount: 0,
    instructor: "Bu Maya",
  },
  {
    id: "crs-anorganik",
    code: "KIMIA-ANORGANIK",
    slug: "kimia-anorganik",
    title: "Kimia Anorganik",
    description: "Senyawa logam, koordinasi, dan kimia unsur.",
    coverGradient: G.anorganik,
    color: "oklch(58% 0.12 145)",
    sortOrder: 3,
    isPublished: false,
    meetingCount: 0,
    quizCount: 0,
    instructor: "Bu Maya",
  },
  {
    id: "crs-biokimia",
    code: "BIOKIMIA",
    slug: "biokimia",
    title: "Biokimia",
    description: "Molekul kehidupan: protein, karbohidrat, lipid, dan metabolisme.",
    coverGradient: G.biokimia,
    color: "oklch(62% 0.1 60)",
    sortOrder: 4,
    isPublished: false,
    meetingCount: 0,
    quizCount: 0,
    instructor: "Bu Maya",
  },
  {
    id: "crs-analitik",
    code: "KIMIA-ANALITIK",
    slug: "kimia-analitik",
    title: "Kimia Analitik",
    description: "Analisis kualitatif dan kuantitatif, titrasi, dan kesalahan pengukuran.",
    coverGradient: G.analitik,
    color: "oklch(60% 0.12 250)",
    sortOrder: 5,
    isPublished: false,
    meetingCount: 0,
    quizCount: 0,
    instructor: "Bu Maya",
  },
  {
    id: "crs-fisika",
    code: "KIMIA-FISIKA",
    slug: "kimia-fisika",
    title: "Kimia Fisika",
    description: "Termodinamika, kinetika, dan kesetimbangan dari sudut pandang fisika.",
    coverGradient: G.fisika,
    color: "oklch(60% 0.12 20)",
    sortOrder: 6,
    isPublished: false,
    meetingCount: 0,
    quizCount: 0,
    instructor: "Bu Maya",
  },
  {
    id: "crs-instrumen",
    code: "KIMIA-INSTRUMEN",
    slug: "kimia-instrumen",
    title: "Kimia Instrumen",
    description: "Spektroskopi, kromatografi, dan teknik instrumentasi modern.",
    coverGradient: G.instrumen,
    color: "oklch(58% 0.1 220)",
    sortOrder: 7,
    isPublished: false,
    meetingCount: 0,
    quizCount: 0,
    instructor: "Bu Maya",
  },
];

// ---- Kimia Dasar meetings ---------------------------------------------------

const termokimiaBody = `
<h3 style="margin-bottom:10px">Entalpi dan kalor reaksi</h3>
<p>Termokimia mempelajari perubahan energi, khususnya kalor, yang menyertai reaksi kimia. Besaran utamanya adalah <b>entalpi</b> (H), yaitu kandungan energi sistem pada tekanan tetap. Yang dapat kita ukur bukan nilai H itu sendiri, melainkan perubahannya, yaitu <b>ΔH</b> (delta H), selisih entalpi produk dengan reaktan.</p>
<p>Berdasarkan arah aliran kalornya, reaksi dibagi menjadi dua. Pada reaksi <b>eksoterm</b>, sistem melepas kalor ke lingkungan sehingga ΔH bernilai negatif dan suhu sekitar naik. Sebaliknya, pada reaksi <b>endoterm</b>, sistem menyerap kalor dari lingkungan sehingga ΔH bernilai positif dan suhu sekitar turun.</p>
<p>Contoh klasik reaksi eksoterm adalah pembakaran metana. Reaksinya melepaskan kalor dalam jumlah besar, yang ditunjukkan oleh nilai ΔH yang negatif:</p>
<div class="formula">CH<sub>4</sub> + 2O<sub>2</sub> &rarr; CO<sub>2</sub> + 2H<sub>2</sub>O&nbsp;&nbsp;&nbsp;&Delta;H = &minus;890 kJ/mol</div>
<p>Beberapa poin penting yang perlu diingat:</p>
<ul>
  <li>ΔH &lt; 0 berarti reaksi eksoterm (melepas kalor).</li>
  <li>ΔH &gt; 0 berarti reaksi endoterm (menyerap kalor).</li>
  <li>Nilai ΔH bergantung pada jumlah mol zat dalam persamaan yang setara.</li>
  <li>Entalpi pembentukan standar (ΔH<sub>f</sub>°) diukur pada 298 K dan 1 atm.</li>
</ul>
`.trim();

const meetingSeed: Array<{
  slug: string;
  title: string;
  state: Meeting["state"];
}> = [
  { slug: "stoikiometri", title: "Stoikiometri", state: "completed" },
  { slug: "struktur-atom", title: "Struktur Atom", state: "completed" },
  { slug: "ikatan-kimia", title: "Ikatan Kimia", state: "completed" },
  { slug: "termokimia", title: "Termokimia", state: "available" },
  { slug: "laju-reaksi", title: "Laju Reaksi", state: "locked" },
  { slug: "kesetimbangan-kimia", title: "Kesetimbangan Kimia", state: "locked" },
  { slug: "asam-basa", title: "Asam-Basa", state: "locked" },
  { slug: "reaksi-redoks", title: "Reaksi Redoks", state: "locked" },
];

export const meetings: Meeting[] = meetingSeed.map((m, i) => {
  const order = i + 1;
  const isTermo = m.slug === "termokimia";
  return {
    id: `mtg-kd-${String(order).padStart(2, "0")}`,
    courseId: "crs-dasar",
    courseSlug: "kimia-dasar",
    slug: m.slug,
    order,
    title: m.title,
    label: `Pertemuan ${order}`,
    description: `Materi, video, dan kuis untuk pertemuan ${order} — ${m.title}.`,
    isPublished: order <= 5,
    state: m.state,
    readingMinutes: 25,
    materials: [
      {
        id: `mat-kd-${order}`,
        title: m.title,
        bodyHtml: isTermo
          ? termokimiaBody
          : `<h3 style="margin-bottom:10px">${m.title}</h3><p>Materi pembelajaran untuk ${m.title} sedang disusun lengkap oleh pengajar.</p>`,
        attachment: isTermo
          ? { name: "Modul Termokimia.pdf", meta: "PDF · 2,4 MB", url: "#" }
          : undefined,
        isPublished: true,
      },
    ],
    videos: [
      {
        id: `vid-kd-${order}`,
        title: `Video pembelajaran — ${m.title}`,
        provider: "google_drive",
        driveFileId: "CONTOH_ID",
        sourceUrl: "https://drive.google.com/file/d/CONTOH_ID/preview",
        caption: "Video pembelajaran · Google Drive",
        isPublished: true,
      },
    ],
    quizId: order <= 4 ? `quiz-kd-${String(order).padStart(2, "0")}` : null,
  };
});

// ---- Termokimia quiz (Pertemuan 4) -----------------------------------------

export const termokimiaQuiz: Quiz = {
  id: "quiz-kd-04",
  meetingId: "mtg-kd-04",
  courseId: "crs-dasar",
  courseSlug: "kimia-dasar",
  meetingSlug: "termokimia",
  title: "Kuis Pertemuan 4 — Termokimia",
  description:
    "Baca aturan di bawah sebelum memulai. Pastikan koneksi stabil — waktu pengerjaan dimulai begitu kamu menekan “Mulai Kuis”.",
  timeLimitMinutes: 20,
  maxAttempts: 1,
  passingScore: 60,
  gradingMethod: "highest",
  shuffleQuestions: true,
  shuffleOptions: false,
  showCorrectAnswers: "after_submit",
  showScoreImmediately: true,
  questionsPerPage: 1,
  allowBacktrack: true,
  isPublished: true,
  questions: [
    {
      id: "q1",
      type: "single_choice",
      prompt: "Reaksi yang melepaskan kalor ke lingkungan disebut…",
      points: 1,
      sortOrder: 1,
      explanation:
        "Reaksi eksoterm melepaskan kalor ke lingkungan sehingga suhu lingkungan naik. Kebalikannya adalah reaksi endoterm yang menyerap kalor.",
      options: [
        { id: "q1a", content: "Eksoterm", isCorrect: true },
        { id: "q1b", content: "Endoterm", isCorrect: false },
        { id: "q1c", content: "Isotermal", isCorrect: false },
        { id: "q1d", content: "Adiabatik", isCorrect: false },
      ],
    },
    {
      id: "q2",
      type: "single_choice",
      prompt: "Nilai ΔH untuk reaksi eksoterm bernilai…",
      promptHtml: "Nilai &Delta;H untuk reaksi eksoterm bernilai…",
      points: 1,
      sortOrder: 2,
      explanation:
        "Pada reaksi eksoterm, entalpi produk lebih rendah daripada reaktan sehingga ΔH = H(produk) − H(reaktan) < 0 (bernilai negatif).",
      options: [
        { id: "q2a", content: "Negatif", isCorrect: true },
        { id: "q2b", content: "Positif", isCorrect: false },
        { id: "q2c", content: "Nol", isCorrect: false },
        { id: "q2d", content: "Tak tentu", isCorrect: false },
      ],
    },
    {
      id: "q3",
      type: "multiple_choice",
      prompt: "Manakah proses berikut yang tergolong endoterm?",
      points: 1,
      sortOrder: 3,
      explanation:
        "Endoterm menyerap kalor: mencairnya es, fotosintesis, dan penguapan air semuanya membutuhkan energi. Pembakaran kertas justru melepas kalor (eksoterm).",
      options: [
        { id: "q3a", content: "Mencairnya es batu", isCorrect: true },
        { id: "q3b", content: "Fotosintesis pada daun", isCorrect: true },
        { id: "q3c", content: "Pembakaran kertas", isCorrect: false },
        { id: "q3d", content: "Penguapan air", isCorrect: true },
      ],
    },
    {
      id: "q4",
      type: "true_false",
      prompt: "Pada reaksi endoterm, sistem menyerap kalor dari lingkungan.",
      points: 1,
      sortOrder: 4,
      explanation:
        "Definisi reaksi endoterm: sistem menyerap kalor dari lingkungan, sehingga ΔH bernilai positif dan suhu lingkungan turun.",
      options: [
        { id: "q4t", content: "Benar", isCorrect: true },
        { id: "q4f", content: "Salah", isCorrect: false },
      ],
    },
    {
      id: "q5",
      type: "single_choice",
      prompt:
        "Pada reaksi CH4 + 2O2 → CO2 + 2H2O dengan ΔH = −890 kJ/mol, reaksi tersebut tergolong…",
      promptHtml:
        'Pada reaksi <span class="formula">CH<sub>4</sub> + 2O<sub>2</sub> &rarr; CO<sub>2</sub> + 2H<sub>2</sub>O</span> dengan &Delta;H = &minus;890 kJ/mol, reaksi tersebut tergolong…',
      points: 1,
      sortOrder: 5,
      explanation:
        "Nilai ΔH negatif (−890 kJ/mol) menandakan kalor dilepaskan ke lingkungan — ciri reaksi eksoterm. Ini adalah pembakaran metana.",
      options: [
        { id: "q5a", content: "Eksoterm", isCorrect: true },
        { id: "q5b", content: "Endoterm", isCorrect: false },
        { id: "q5c", content: "Isotermal", isCorrect: false },
        { id: "q5d", content: "Tidak dapat ditentukan", isCorrect: false },
      ],
    },
    {
      id: "q6",
      type: "single_choice",
      prompt: "Satuan SI untuk entalpi reaksi adalah…",
      points: 1,
      sortOrder: 6,
      explanation: "Entalpi adalah bentuk energi, sehingga satuannya joule (J) atau kilojoule (kJ).",
      options: [
        { id: "q6a", content: "kJ (kilojoule)", isCorrect: true },
        { id: "q6b", content: "mol", isCorrect: false },
        { id: "q6c", content: "atm", isCorrect: false },
        { id: "q6d", content: "kelvin", isCorrect: false },
      ],
    },
    {
      id: "q7",
      type: "true_false",
      prompt: "Pada reaksi eksoterm, suhu lingkungan di sekitar sistem akan turun.",
      points: 1,
      sortOrder: 7,
      explanation:
        "Salah. Reaksi eksoterm melepas kalor ke lingkungan sehingga suhu lingkungan justru naik.",
      options: [
        { id: "q7t", content: "Benar", isCorrect: false },
        { id: "q7f", content: "Salah", isCorrect: true },
      ],
    },
    {
      id: "q8",
      type: "single_choice",
      prompt: "Kondisi standar untuk entalpi pembentukan (ΔHf°) diukur pada…",
      promptHtml: "Kondisi standar untuk entalpi pembentukan (&Delta;H<sub>f</sub>°) diukur pada…",
      points: 1,
      sortOrder: 8,
      explanation: "Keadaan standar termokimia: suhu 298 K (25 °C) dan tekanan 1 atm.",
      options: [
        { id: "q8a", content: "298 K dan 1 atm", isCorrect: true },
        { id: "q8b", content: "0 K dan 1 atm", isCorrect: false },
        { id: "q8c", content: "373 K dan 2 atm", isCorrect: false },
        { id: "q8d", content: "100 K dan 1 atm", isCorrect: false },
      ],
    },
    {
      id: "q9",
      type: "multiple_choice",
      prompt: "Pernyataan yang benar tentang reaksi eksoterm adalah…",
      points: 1,
      sortOrder: 9,
      explanation:
        "Reaksi eksoterm melepas kalor (ΔH < 0) dan menaikkan suhu lingkungan. Entalpi produk lebih rendah dari reaktan.",
      options: [
        { id: "q9a", content: "ΔH bernilai negatif", isCorrect: true },
        { id: "q9b", content: "Melepaskan kalor ke lingkungan", isCorrect: true },
        { id: "q9c", content: "Menyerap kalor dari lingkungan", isCorrect: false },
        { id: "q9d", content: "Entalpi produk lebih rendah dari reaktan", isCorrect: true },
      ],
    },
    {
      id: "q10",
      type: "single_choice",
      prompt:
        "Jika suatu reaksi memiliki ΔH = +180 kJ/mol, maka reaksi tersebut…",
      promptHtml:
        "Jika suatu reaksi memiliki &Delta;H = +180 kJ/mol, maka reaksi tersebut…",
      points: 1,
      sortOrder: 10,
      explanation: "ΔH positif berarti sistem menyerap kalor — reaksi endoterm.",
      options: [
        { id: "q10a", content: "Endoterm, menyerap kalor", isCorrect: true },
        { id: "q10b", content: "Eksoterm, melepas kalor", isCorrect: false },
        { id: "q10c", content: "Tidak melibatkan kalor", isCorrect: false },
        { id: "q10d", content: "Selalu spontan", isCorrect: false },
      ],
    },
  ],
};

export const quizzes: Quiz[] = [termokimiaQuiz];

// ---- Emmil's graded attempt on the Termokimia quiz -------------------------

export const sampleAttempt: QuizAttempt = {
  id: "att-kd04-emmil-1",
  quizId: "quiz-kd-04",
  studentId: "stu-emmil",
  attemptNumber: 1,
  status: "graded",
  score: 80,
  maxScore: 100,
  percentage: 80,
  passed: true,
  correctCount: 8,
  questionCount: 10,
  timeSpentLabel: "14:32",
  startedAt: "2026-06-23T08:00:00Z",
  submittedAt: "2026-06-23T08:14:32Z",
  review: [
    {
      questionId: "q1",
      prompt: "Reaksi yang melepaskan kalor ke lingkungan disebut…",
      given: "Eksoterm",
      correct: "Eksoterm",
      isCorrect: true,
      explanation:
        "Reaksi eksoterm melepaskan kalor ke lingkungan sehingga suhu lingkungan naik. Kebalikannya adalah reaksi endoterm yang menyerap kalor.",
    },
    {
      questionId: "q2",
      prompt: "Nilai ΔH untuk reaksi eksoterm bernilai…",
      promptHtml: "Nilai &Delta;H untuk reaksi eksoterm bernilai…",
      given: "Negatif",
      correct: "Negatif",
      isCorrect: true,
      explanation:
        "Pada reaksi eksoterm, entalpi produk lebih rendah daripada reaktan sehingga ΔH = H(produk) − H(reaktan) < 0 (bernilai negatif).",
    },
    {
      questionId: "q3",
      prompt: "Manakah proses berikut yang tergolong endoterm? (pilih semua yang benar)",
      given: "Mencairnya es batu, Pembakaran kertas",
      correct: "Mencairnya es batu, Fotosintesis pada daun, Penguapan air",
      isCorrect: false,
      explanation:
        "Endoterm menyerap kalor: mencairnya es, fotosintesis, dan penguapan air semuanya membutuhkan energi. Pembakaran kertas justru melepas kalor (eksoterm), jadi pilihan itu keliru dan fotosintesis terlewat. Jawaban dihitung salah karena tidak seluruh kunci tepat.",
    },
    {
      questionId: "q4",
      prompt: "Pada reaksi endoterm, sistem menyerap kalor dari lingkungan.",
      given: "Benar",
      correct: "Benar",
      isCorrect: true,
      explanation:
        "Definisi reaksi endoterm: sistem menyerap kalor dari lingkungan, sehingga ΔH bernilai positif dan suhu lingkungan turun.",
    },
    {
      questionId: "q5",
      prompt: "Pada reaksi CH4 + 2O2 → CO2 + 2H2O (ΔH = −890 kJ/mol), reaksi tergolong…",
      promptHtml:
        'Pada reaksi <span class="formula">CH<sub>4</sub> + 2O<sub>2</sub> &rarr; CO<sub>2</sub> + 2H<sub>2</sub>O</span> (&Delta;H = &minus;890 kJ/mol), reaksi tergolong…',
      given: "Eksoterm",
      correct: "Eksoterm",
      isCorrect: true,
      explanation:
        "Nilai ΔH negatif (−890 kJ/mol) menandakan kalor dilepaskan ke lingkungan — ciri reaksi eksoterm. Ini adalah pembakaran metana.",
    },
  ],
};

// ---- Students, enrollments, gradebook, activity ----------------------------

export const totalStudents = 42;

export const students: Profile[] = [
  currentStudent,
  { id: "stu-rara", role: "student", fullName: "Rara Fitri", studentNo: "2023012088", email: "rara@kampus.ac.id", avatarUrl: null, initials: "RF", isActive: true },
  { id: "stu-dian", role: "student", fullName: "Dian Pratama", studentNo: "2023012061", email: "dian@kampus.ac.id", avatarUrl: null, initials: "DP", isActive: true },
  { id: "stu-budi", role: "student", fullName: "Budi Santoso", studentNo: "2023012013", email: "budi@kampus.ac.id", avatarUrl: null, initials: "BS", isActive: true },
  { id: "stu-nadia", role: "student", fullName: "Nadia Putri", studentNo: "2023012099", email: "nadia@kampus.ac.id", avatarUrl: null, initials: "NP", isActive: true },
  { id: "stu-arif", role: "student", fullName: "Arif Wibowo", studentNo: "2023012027", email: "arif@kampus.ac.id", avatarUrl: null, initials: "AW", isActive: true },
  { id: "stu-sari", role: "student", fullName: "Sari Melati", studentNo: "2023012074", email: "sari@kampus.ac.id", avatarUrl: null, initials: "SM", isActive: false },
  { id: "stu-yoga", role: "student", fullName: "Yoga Prasetyo", studentNo: "2023012052", email: "yoga@kampus.ac.id", avatarUrl: null, initials: "YP", isActive: true },
];

export const enrollments: Enrollment[] = students.map((s, i) => ({
  id: `enr-${i}`,
  courseId: "crs-dasar",
  studentId: s.id,
  status: s.isActive ? "active" : "dropped",
  enrolledAt: "2026-05-01T00:00:00Z",
}));

export const gradebook: GradebookRow[] = [
  { studentId: "stu-emmil", studentName: "Emmil Saputra", studentNo: "2023012045", quizScores: { P1: 72, P2: 85, P3: 90, P4: 80 }, average: 82 },
  { studentId: "stu-dian", studentName: "Dian Pratama", studentNo: "2023012061", quizScores: { P1: 80, P2: 78, P3: 88, P4: null }, average: 82 },
  { studentId: "stu-rara", studentName: "Rara Fitri", studentNo: "2023012088", quizScores: { P1: 68, P2: 74, P3: null, P4: null }, average: 71 },
  { studentId: "stu-budi", studentName: "Budi Santoso", studentNo: "2023012013", quizScores: { P1: 90, P2: 82, P3: 85, P4: null }, average: 86 },
  { studentId: "stu-nadia", studentName: "Nadia Putri", studentNo: "2023012099", quizScores: { P1: 88, P2: 91, P3: 86, P4: 92 }, average: 89 },
  { studentId: "stu-arif", studentName: "Arif Wibowo", studentNo: "2023012027", quizScores: { P1: 65, P2: 70, P3: 72, P4: null }, average: 69 },
  { studentId: "stu-yoga", studentName: "Yoga Prasetyo", studentNo: "2023012052", quizScores: { P1: 76, P2: 80, P3: null, P4: null }, average: 78 },
];

export const studentResults: ResultRow[] = [
  { courseTitle: "Kimia Dasar", meetingLabel: "Pertemuan 1", meetingTitle: "Stoikiometri", quizId: "quiz-kd-01", attemptId: "att-kd01-emmil-1", score: 72, status: "lulus" },
  { courseTitle: "Kimia Dasar", meetingLabel: "Pertemuan 2", meetingTitle: "Struktur Atom", quizId: "quiz-kd-02", attemptId: "att-kd02-emmil-1", score: 85, status: "lulus" },
  { courseTitle: "Kimia Dasar", meetingLabel: "Pertemuan 3", meetingTitle: "Ikatan Kimia", quizId: "quiz-kd-03", attemptId: "att-kd03-emmil-1", score: 90, status: "lulus" },
  { courseTitle: "Kimia Dasar", meetingLabel: "Pertemuan 4", meetingTitle: "Termokimia", quizId: "quiz-kd-04", attemptId: "att-kd04-emmil-1", score: 80, status: "lulus" },
];

export const recentActivity: ActivityItem[] = [
  { initials: "ES", text: "Emmil Saputra menyelesaikan kuis", meta: "Pertemuan 3 — Ikatan Kimia · skor 90", time: "12 mnt" },
  { initials: "RF", text: "Rara Fitri mendaftar sebagai siswa baru", meta: "Pendaftaran mandiri · Kimia Dasar", time: "1 jam" },
  { initials: "BM", text: "Materi diterbitkan oleh Bu Maya", meta: "Pertemuan 5 — Laju Reaksi", time: "3 jam" },
  { initials: "DP", text: "Dian Pratama menyelesaikan kuis", meta: "Pertemuan 2 — Struktur Atom · skor 78", time: "5 jam" },
];

export const meetingCompletion = [
  { label: "P1", pct: 95 },
  { label: "P2", pct: 88 },
  { label: "P3", pct: 74 },
  { label: "P4", pct: 52 },
  { label: "P5", pct: 31 },
  { label: "P6", pct: 18 },
  { label: "P7", pct: 9 },
  { label: "P8", pct: 4 },
];
