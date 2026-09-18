// สร้างผู้ใช้แรกของระบบ (ไม่มีหน้าสมัคร) — รัน: SEED_PASSWORD=... npm run db:seed:users
// สร้าง auth user ผ่าน Supabase Admin API + แถว profiles · idempotent: มีแล้วข้าม (ไม่รีเซ็ตรหัส)
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { usernameToEmail } from "../lib/auth/username";
import type { Role } from "../lib/auth/types";

const { DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_PASSWORD } = process.env;
if (!DIRECT_URL || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("ต้องมี DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ใน .env.local");
}
if (!SEED_PASSWORD || SEED_PASSWORD.length < 8) {
  throw new Error("ตั้งรหัสผ่านตั้งต้น (≥ 8 ตัว): SEED_PASSWORD=xxxx npm run db:seed:users");
}

// ผู้ใช้ตั้งต้น 2 คน (ชื่อจากดีไซน์) — เพิ่ม/แก้รายชื่อที่นี่
const USERS: { username: string; name: string; role: Role }[] = [
  { username: "wirat", name: "วิรัช เจริญพร", role: "executive" },
  { username: "somchai.s", name: "สมชาย ส.", role: "sale" },
];

async function main() {
  const admin = createClient(NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const client = postgres(DIRECT_URL!, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  for (const u of USERS) {
    const email = usernameToEmail(u.username);

    // หา auth user เดิมจาก auth.users ตรงๆ (เร็วกว่า listUsers)
    const existing = await db.execute<{ id: string }>(sql`select id from auth.users where email = ${email} limit 1`);
    let id = existing[0]?.id;

    if (!id) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: SEED_PASSWORD!,
        email_confirm: true,
        user_metadata: { username: u.username, name: u.name },
      });
      if (error || !data.user) throw new Error(`สร้าง auth user ${u.username} ไม่สำเร็จ: ${error?.message}`);
      id = data.user.id;
      console.log(`auth: สร้าง ${u.username} (${u.role})`);
    } else {
      console.log(`auth: มี ${u.username} อยู่แล้ว — ข้าม (ไม่รีเซ็ตรหัส)`);
    }

    await db
      .insert(schema.profiles)
      .values({ id, name: u.name, role: u.role, isActive: true })
      .onConflictDoUpdate({ target: schema.profiles.id, set: { name: u.name, role: u.role } });
  }

  console.log(`\nล็อกอินได้ด้วย: ${USERS.map((u) => u.username).join(", ")} · รหัส = SEED_PASSWORD ที่ตั้ง`);
  await client.end();
}

main().catch((e) => {
  console.error("seed-users ล้มเหลว:", e);
  process.exit(1);
});
