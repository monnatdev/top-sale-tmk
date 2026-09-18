// สร้าง bucket private สำหรับรูปสินค้า + ลายเซ็น — รัน: npm run storage:setup (idempotent)
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { BUCKETS } from "../lib/storage/buckets";

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("ต้องมี NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY ใน .env.local");

const admin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const { data: existing, error } = await admin.storage.listBuckets();
  if (error) throw error;
  const names = new Set(existing.map((b) => b.name));

  for (const name of Object.values(BUCKETS)) {
    if (names.has(name)) {
      console.log(`bucket ${name}: มีอยู่แล้ว`);
      continue;
    }
    const { error: e } = await admin.storage.createBucket(name, {
      public: false,
      fileSizeLimit: 2 * 1024 * 1024, // 2MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    });
    if (e) throw e;
    console.log(`bucket ${name}: สร้างแล้ว (private, ≤2MB, png/jpg/webp)`);
  }
  console.log("\nอัปโหลดลายเซ็นผู้บริหาร: Storage → signatures → upload เช่น wirat.png แล้วตั้ง profiles.signature_path = 'wirat.png'");
}

main().catch((e) => {
  console.error("setup-storage ล้มเหลว:", e);
  process.exit(1);
});
