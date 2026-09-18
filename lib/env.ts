import "server-only";
import { z } from "zod";

// ตรวจ env ตอน boot — ถ้าขาดตัวไหนจะพังทันทีพร้อมบอกชื่อตัวแปร ไม่ใช่พังเงียบๆ ตอน query
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsed = serverSchema.safeParse(process.env);
if (!parsed.success) {
  const missing = Object.keys(z.flattenError(parsed.error).fieldErrors).join(", ");
  throw new Error(`Environment variables ไม่ถูกต้อง/ขาดหาย: ${missing} — ดู docs/SETUP.md`);
}

export const env = parsed.data;
