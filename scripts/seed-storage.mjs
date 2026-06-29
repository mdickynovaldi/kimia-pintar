// Create Supabase Storage buckets (idempotent). Run:
//   node --env-file=.env scripts/seed-storage.mjs
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const buckets = [
  { id: "media", public: true, fileSizeLimit: "10MB" },      // images: covers, inline material images, avatars
  { id: "files", public: false, fileSizeLimit: "25MB" },     // attachments (PDF/slides) via signed URLs
];
for (const b of buckets) {
  const { error } = await sb.storage.createBucket(b.id, { public: b.public, fileSizeLimit: b.fileSizeLimit });
  if (error && !/already exists/i.test(error.message)) { console.log(`✗ ${b.id}: ${error.message}`); }
  else { console.log(`✓ bucket ${b.id} (${b.public ? "public" : "private"})`); }
}
const { data } = await sb.storage.listBuckets();
console.log("buckets now:", (data ?? []).map(x => `${x.name}:${x.public?"public":"private"}`).join(", "));
