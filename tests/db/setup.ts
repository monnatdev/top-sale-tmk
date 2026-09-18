// โหลด env จริงสำหรับเทส DB — ต้องเป็น top-sale-dev เท่านั้น
import { config } from "dotenv";
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) throw new Error("test:db ต้องมี .env.local ที่ชี้ไป DB dev");
if (/prod/i.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") || process.env.NODE_ENV === "production") {
  throw new Error("ห้ามรัน test:db กับ production");
}
