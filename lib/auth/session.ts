import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/db/queries/profiles";
import type { SessionUser } from "./types";

// cache() = เรียกกี่ครั้งใน request เดียวก็ query ครั้งเดียว
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  // getClaims verify ลายเซ็น JWT (ไม่ใช่ getSession ที่อ่าน cookie เฉยๆ) — ถ้าโปรเจกต์ใช้ HS256 จะ fallback ไปถาม server ให้เอง
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims.sub;
  if (!sub) return null;

  // โหลด profiles ทุก request (ไม่เก็บ role ใน cookie) → เปลี่ยน role / ปิด user มีผลทันที
  const profile = await getProfileById(sub);
  if (!profile || !profile.isActive) return null;

  return { id: profile.id, name: profile.name, role: profile.role };
});

// ใช้ในหน้า/layout/action: ไม่มี session → ไป login
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

