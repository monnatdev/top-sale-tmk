// โหลดไฟล์ env ให้สคริปต์ที่รันนอก Next (drizzle-kit, seed, import) — ต้อง import บรรทัดแรกสุด
// ปกติใช้ .env.local (dev) · ชี้ไป production ต้องสั่งชัดๆ:  ENV_FILE=.env.prod.local npm run db:migrate
// พิมพ์ปลายทางทุกครั้งเพื่อกันรันใส่ฐานข้อมูลผิดตัว
import { config } from "dotenv";

const envFile = process.env.ENV_FILE ?? ".env.local";
config({ path: envFile });

const target = (() => {
  try {
    const u = new URL(process.env.DIRECT_URL ?? "");
    return `${u.username}@${u.host}`; // ไม่พิมพ์รหัสผ่าน
  } catch {
    return "ไม่พบ DIRECT_URL";
  }
})();

console.log(`env: ${envFile} → ${target}\n`);

export const ENV_FILE = envFile;
