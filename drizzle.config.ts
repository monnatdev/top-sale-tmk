import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit ไม่ได้รันผ่าน Next.js จึงต้องโหลด .env.local เอง (.env.test สำหรับเทส DB — ใส่ทีหลัง)
config({ path: ".env.local" });

// migration ใช้ DIRECT_URL (session mode) ไม่ผ่าน pooler
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DIRECT_URL! },
  strict: true,
  verbose: true,
});
