-- ============================================================================
-- Kimia Pintar LMS — seed data (PRD §20.1)
-- Seven course shells; Kimia Dasar populated with meetings + the Termokimia
-- quiz. Mirrors lib/data/mock.ts so the UI looks identical once wired live.
-- Run after the migrations. Idempotent on course/meeting slugs.
-- ============================================================================

-- ---- 7 courses -------------------------------------------------------------
insert into courses (code, slug, title, description, color, sort_order, is_published) values
  ('KIMIA-DASAR',    'kimia-dasar',    'Kimia Dasar',    'Fondasi ilmu kimia: stoikiometri, struktur atom, hingga reaksi redoks.', 'oklch(55% 0.12 178)', 1, true),
  ('KIMIA-ORGANIK',  'kimia-organik',  'Kimia Organik',  'Struktur, tata nama, dan reaksi senyawa karbon.',                        'oklch(60% 0.10 300)', 2, false),
  ('KIMIA-ANORGANIK','kimia-anorganik','Kimia Anorganik','Senyawa logam, koordinasi, dan kimia unsur.',                            'oklch(58% 0.12 145)', 3, false),
  ('BIOKIMIA',       'biokimia',       'Biokimia',       'Molekul kehidupan: protein, karbohidrat, lipid, dan metabolisme.',       'oklch(62% 0.10 60)',  4, false),
  ('KIMIA-ANALITIK', 'kimia-analitik', 'Kimia Analitik', 'Analisis kualitatif/kuantitatif, titrasi, dan kesalahan pengukuran.',     'oklch(60% 0.12 250)', 5, false),
  ('KIMIA-FISIKA',   'kimia-fisika',   'Kimia Fisika',   'Termodinamika, kinetika, dan kesetimbangan dari sudut pandang fisika.',   'oklch(60% 0.12 20)',  6, false),
  ('KIMIA-INSTRUMEN','kimia-instrumen','Kimia Instrumen','Spektroskopi, kromatografi, dan teknik instrumentasi modern.',           'oklch(58% 0.10 220)', 7, false)
on conflict (slug) do nothing;

-- ---- Kimia Dasar meetings (8 pertemuan) ------------------------------------
with c as (select id from courses where slug = 'kimia-dasar')
insert into meetings (course_id, title, slug, sort_order, is_published)
select c.id, m.title, m.slug, m.ord, m.ord <= 5
from c, (values
  ('Stoikiometri',        'stoikiometri',        1),
  ('Struktur Atom',       'struktur-atom',       2),
  ('Ikatan Kimia',        'ikatan-kimia',        3),
  ('Termokimia',          'termokimia',          4),
  ('Laju Reaksi',         'laju-reaksi',         5),
  ('Kesetimbangan Kimia', 'kesetimbangan-kimia', 6),
  ('Asam-Basa',           'asam-basa',           7),
  ('Reaksi Redoks',       'reaksi-redoks',       8)
) as m(title, slug, ord)
on conflict (course_id, slug) do nothing;

-- ---- Termokimia material + video -------------------------------------------
with mtg as (
  select m.id, m.course_id from meetings m
  join courses c on c.id = m.course_id
  where c.slug = 'kimia-dasar' and m.slug = 'termokimia'
)
insert into materials (meeting_id, title, body, attachment_url)
select mtg.id, 'Entalpi dan kalor reaksi',
  '<p>Termokimia mempelajari perubahan energi (kalor) yang menyertai reaksi kimia...</p>',
  null
from mtg;

with mtg as (
  select m.id from meetings m
  join courses c on c.id = m.course_id
  where c.slug = 'kimia-dasar' and m.slug = 'termokimia'
)
insert into videos (meeting_id, title, provider, drive_file_id, source_url)
select mtg.id, 'Video pembelajaran — Termokimia', 'google_drive', 'CONTOH_ID',
  'https://drive.google.com/file/d/CONTOH_ID/preview'
from mtg;

-- ---- Termokimia quiz -------------------------------------------------------
with mtg as (
  select m.id as meeting_id, m.course_id from meetings m
  join courses c on c.id = m.course_id
  where c.slug = 'kimia-dasar' and m.slug = 'termokimia'
)
insert into quizzes (meeting_id, course_id, title, description, time_limit_minutes,
  max_attempts, passing_score, grading_method, shuffle_questions, show_correct_answers,
  questions_per_page, is_published)
select meeting_id, course_id, 'Kuis Pertemuan 4 — Termokimia',
  'Kuis objektif tentang entalpi, reaksi eksoterm, dan endoterm.',
  20, 1, 60, 'highest', true, 'after_submit', 1, true
from mtg;

-- Questions + options (representative subset; see lib/data/mock.ts for all 10).
do $$
declare
  v_quiz uuid;
  v_q    uuid;
begin
  select id into v_quiz from quizzes where title = 'Kuis Pertemuan 4 — Termokimia' limit 1;
  if v_quiz is null then return; end if;

  -- Q1
  insert into questions (quiz_id, type, prompt, points, sort_order, explanation)
  values (v_quiz, 'single_choice', 'Reaksi yang melepaskan kalor ke lingkungan disebut…', 1, 1,
    'Reaksi eksoterm melepaskan kalor ke lingkungan sehingga suhu lingkungan naik.')
  returning id into v_q;
  insert into question_options (question_id, content, is_correct, sort_order) values
    (v_q, 'Eksoterm', true, 1), (v_q, 'Endoterm', false, 2),
    (v_q, 'Isotermal', false, 3), (v_q, 'Adiabatik', false, 4);

  -- Q2
  insert into questions (quiz_id, type, prompt, points, sort_order, explanation)
  values (v_quiz, 'single_choice', 'Nilai ΔH untuk reaksi eksoterm bernilai…', 1, 2,
    'Entalpi produk lebih rendah dari reaktan sehingga ΔH < 0 (negatif).')
  returning id into v_q;
  insert into question_options (question_id, content, is_correct, sort_order) values
    (v_q, 'Negatif', true, 1), (v_q, 'Positif', false, 2),
    (v_q, 'Nol', false, 3), (v_q, 'Tak tentu', false, 4);

  -- Q3 (multiple choice)
  insert into questions (quiz_id, type, prompt, points, sort_order, explanation)
  values (v_quiz, 'multiple_choice', 'Manakah proses berikut yang tergolong endoterm?', 1, 3,
    'Endoterm menyerap kalor: mencairnya es, fotosintesis, dan penguapan air.')
  returning id into v_q;
  insert into question_options (question_id, content, is_correct, sort_order) values
    (v_q, 'Mencairnya es batu', true, 1), (v_q, 'Fotosintesis pada daun', true, 2),
    (v_q, 'Pembakaran kertas', false, 3), (v_q, 'Penguapan air', true, 4);

  -- Q4 (true/false)
  insert into questions (quiz_id, type, prompt, points, sort_order, explanation)
  values (v_quiz, 'true_false', 'Pada reaksi endoterm, sistem menyerap kalor dari lingkungan.', 1, 4,
    'Benar — reaksi endoterm menyerap kalor, ΔH positif.')
  returning id into v_q;
  insert into question_options (question_id, content, is_correct, sort_order) values
    (v_q, 'Benar', true, 1), (v_q, 'Salah', false, 2);

  -- Q5
  insert into questions (quiz_id, type, prompt, points, sort_order, explanation)
  values (v_quiz, 'single_choice',
    'Pada reaksi CH4 + 2O2 → CO2 + 2H2O (ΔH = −890 kJ/mol), reaksi tergolong…', 1, 5,
    'ΔH negatif menandakan kalor dilepas — reaksi eksoterm (pembakaran metana).')
  returning id into v_q;
  insert into question_options (question_id, content, is_correct, sort_order) values
    (v_q, 'Eksoterm', true, 1), (v_q, 'Endoterm', false, 2),
    (v_q, 'Isotermal', false, 3), (v_q, 'Tidak dapat ditentukan', false, 4);
end $$;
