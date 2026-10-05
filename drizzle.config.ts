// drizzle-kit ไม่ได้รันผ่าน Next.js จึงต้องโหลด env เอง (ชี้ไฟล์อื่นด้วย ENV_FILE=... — ดู scripts/loadEnv.ts)
import "./scripts/loadEnv";
import { defineConfig } from "drizzle-kit";

// migration ใช้ DIRECT_URL (session mode) ไม่ผ่าน pooler
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DIRECT_URL! },
  strict: true,
  verbose: true,
});
