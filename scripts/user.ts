// เพิ่ม/แก้ผู้ใช้ทีละคน — ใช้แทนการแก้ array ใน seed-users.ts เวลามีพนักงานเข้าใหม่/เปลี่ยนรหัส
//
//   npm run user -- --username peerawit --name "พีรวิชญ์ วิชัยดิษฐ" --role executive
//   npm run user -- --username somchai.s --name "สมชาย สุขใจ" --role sale --password 'xxxxxxxx'
//   npm run user -- --username somchai.s --password 'รหัสใหม่'      # เปลี่ยนรหัสผ่านอย่างเดียว
//   npm run user -- --username somchai.s --inactive                 # ปิดบัญชี (ไม่ลบ)
//   npm run user -- --list
//
// ชี้ production:  ENV_FILE=.env.prod.local npm run user -- ...
// ไม่ใส่ --password ตอนสร้างใหม่ = สุ่มรหัสให้แล้วพิมพ์ออกมาครั้งเดียว
import "./loadEnv";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import { asc, eq, sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { usernameToEmail } from "../lib/auth/username";
import { ROLES, ROLE_LABEL, type Role } from "../lib/auth/types";

const { DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!DIRECT_URL || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("ต้องมี DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ในไฟล์ env");
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const has = (name: string) => process.argv.includes(`--${name}`);

const USERNAME_RE = /^[a-z0-9][a-z0-9.]{2,31}$/; // a-z 0-9 จุด · 3–32 ตัว · ตรงกับกฎในไฟล์ Excel ที่ส่งลูกค้า

const admin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const client = postgres(DIRECT_URL, { max: 1, prepare: false });
const db = drizzle(client, { schema });

async function list() {
  const rows = await db
    .select({ id: schema.profiles.id, name: schema.profiles.name, role: schema.profiles.role, isActive: schema.profiles.isActive, signaturePath: schema.profiles.signaturePath })
    .from(schema.profiles)
    .orderBy(asc(schema.profiles.name));
  if (rows.length === 0) {
    console.log("ยังไม่มีผู้ใช้ในระบบ");
    return;
  }
  const emails = await db.execute<{ id: string; email: string }>(sql`select id::text, email from auth.users`);
  const byId = new Map(emails.map((r) => [r.id, r.email]));
  console.log(`ผู้ใช้ทั้งหมด ${rows.length} คน\n`);
  for (const r of rows) {
    const username = (byId.get(r.id) ?? "?").split("@")[0];
    console.log(`  ${username.padEnd(16)} ${ROLE_LABEL[r.role].padEnd(10)} ${r.name}${r.isActive ? "" : "  [ปิดใช้งาน]"}${r.signaturePath ? "  [มีลายเซ็น]" : ""}`);
  }
}

async function upsert() {
  const username = arg("username")?.trim().toLowerCase();
  if (!username || !USERNAME_RE.test(username)) {
    throw new Error("--username ต้องเป็น a-z, 0-9 หรือจุด ยาว 3–32 ตัว และขึ้นต้นด้วยตัวอักษร/ตัวเลข เช่น somchai.s");
  }
  const role = arg("role") as Role | undefined;
  if (role && !ROLES.includes(role)) throw new Error(`--role ต้องเป็น ${ROLES.join(" หรือ ")}`);
  const name = arg("name");
  let password = arg("password");
  if (password && password.length < 8) throw new Error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัว");

  const email = usernameToEmail(username);
  const existing = await db.execute<{ id: string }>(sql`select id::text from auth.users where email = ${email} limit 1`);
  let id = existing[0]?.id;
  let generated = false;

  if (!id) {
    if (!name) throw new Error("ผู้ใช้ใหม่ต้องมี --name (ชื่อที่แสดงในระบบ/บนใบเสนอราคา)");
    if (!password) {
      password = randomBytes(9).toString("base64url"); // 12 ตัว อ่านออก พิมพ์ได้
      generated = true;
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, name },
    });
    if (error || !data.user) throw new Error(`สร้างผู้ใช้ไม่สำเร็จ: ${error?.message}`);
    id = data.user.id;
    await db.insert(schema.profiles).values({ id, name, role: role ?? "sale", isActive: true });
    console.log(`\n✓ สร้างผู้ใช้ใหม่  ${username}  (${ROLE_LABEL[role ?? "sale"]})  ${name}`);
    if (generated) console.log(`  รหัสผ่าน: ${password}   ← แสดงครั้งเดียว บันทึกไว้แล้วส่งให้เจ้าตัว`);
    return;
  }

  // มีอยู่แล้ว — อัปเดตเท่าที่สั่ง
  const changes: string[] = [];
  if (password) {
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) throw new Error(`เปลี่ยนรหัสผ่านไม่สำเร็จ: ${error.message}`);
    changes.push("รหัสผ่าน");
  }
  const set: Partial<typeof schema.profiles.$inferInsert> = {};
  if (name) set.name = name;
  if (role) set.role = role;
  if (has("inactive")) set.isActive = false;
  if (has("active")) set.isActive = true;
  if (Object.keys(set).length > 0) {
    await db.update(schema.profiles).set(set).where(eq(schema.profiles.id, id));
    changes.push(...Object.keys(set).map((k) => ({ name: "ชื่อ", role: "สิทธิ์", isActive: "สถานะใช้งาน" })[k] ?? k));
  }
  console.log(changes.length > 0 ? `\n✓ อัปเดต ${username}: ${changes.join(", ")}` : `\nไม่มีอะไรเปลี่ยน (${username} มีอยู่แล้ว)`);
}

async function main() {
  if (has("list")) await list();
  else await upsert();
  await client.end();
}

main().catch(async (e) => {
  console.error("\n✗", e instanceof Error ? e.message : e);
  await client.end().catch(() => {});
  process.exit(1);
});
