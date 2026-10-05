import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reportError } from "@/lib/observability";

// ใช้เช็กว่า env + การเชื่อม DB ถูกต้อง — ไม่ต้องล็อกอิน ไม่คืนข้อมูลภายใน
export const dynamic = "force-dynamic"; // ห้าม prerender ตอน build (ไม่งั้นจะต่อ DB ตอน build)

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (e) {
    reportError("health", e);
    return NextResponse.json({ ok: false, db: "unreachable" }, { status: 503 });
  }
}
