import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// service_role client — ข้ามทุก policy ใช้เฉพาะ: signed URL ของ Storage, สร้าง user (seed)
// ห้าม import จากไฟล์ที่มี "use client" เด็ดขาด
export const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
