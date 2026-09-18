import "server-only";
import { eq } from "drizzle-orm";
import { db, type DbClient } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

// profile ของผู้ใช้ตาม auth id — ใช้เฉพาะตอนสร้าง session (ไม่ต้อง scope เพราะ id มาจาก token ที่ verify แล้ว)
export async function getProfileById(id: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.id, id),
    columns: { id: true, name: true, role: true, isActive: true },
  });
}

// ลายเซ็นของผู้บริหาร (path ใน bucket) — ใช้ตอนอนุมัติ + หน้าตั้งค่า
export async function getProfileSignaturePath(id: string, dbx: DbClient = db) {
  const row = await dbx.query.profiles.findFirst({ where: eq(profiles.id, id), columns: { signaturePath: true } });
  return row?.signaturePath ?? null;
}
