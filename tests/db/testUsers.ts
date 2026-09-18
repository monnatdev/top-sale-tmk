// สร้าง/ลบผู้ใช้ชั่วคราวสำหรับเทส DB (auth user + profile) — ชื่อขึ้นต้น zztest- ให้ลบทิ้งง่าย
import { createClient } from "@supabase/supabase-js";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, profiles, quotations, quoteNumberCounters } from "@/lib/db/schema";
import type { Role, SessionUser } from "@/lib/auth/types";
import { usernameToEmail } from "@/lib/auth/username";

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export async function createTestUser(username: string, role: Role): Promise<SessionUser> {
  const email = usernameToEmail(`zztest-${username}`);
  const existing = await db.execute<{ id: string }>(sql`select id from auth.users where email = ${email} limit 1`);
  let id = existing[0]?.id;
  if (!id) {
    const { data, error } = await admin().auth.admin.createUser({ email, password: "ZzTest-12345678", email_confirm: true });
    if (error || !data.user) throw new Error(`createTestUser failed: ${error?.message}`);
    id = data.user.id;
  }
  const name = `เทส ${username}`;
  await db.insert(profiles).values({ id, name, role }).onConflictDoUpdate({ target: profiles.id, set: { name, role, isActive: true } });
  return { id, name, role };
}

// ลบข้อมูลที่ผู้ใช้เทสสร้าง + ตัวผู้ใช้ (cascade → profiles) · counter ปีเทส
export async function cleanupTestUsers(users: SessionUser[], testYear: number) {
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  await db.delete(quotations).where(inArray(quotations.ownerId, ids)); // cascade items/notes/audit
  await db.delete(customers).where(inArray(customers.createdBy, ids));
  await db.delete(quoteNumberCounters).where(eq(quoteNumberCounters.year, testYear));
  const a = admin();
  for (const id of ids) await a.auth.admin.deleteUser(id);
}
