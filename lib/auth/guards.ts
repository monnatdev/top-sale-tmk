// guard สิทธิ์ — pure (ไม่ import next/*) เพื่อให้ service เรียกและเทสได้
import { eq, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { Role, SessionUser } from "./types";

export function requireRole(user: SessionUser, ...roles: Role[]): void {
  if (!roles.includes(user.role)) throw new ForbiddenError();
}

// ใส่ใน where() ของทุก query ที่ดึงใบเสนอราคา/ลูกค้า — ไม่มีข้อยกเว้น
// executive → undefined (and() จะข้ามให้) · sale → owner_id = user.id
export function scopeToUser(user: SessionUser, ownerColumn: PgColumn): SQL | undefined {
  return user.role === "executive" ? undefined : eq(ownerColumn, user.id);
}

export function canAccess(user: SessionUser, ownerId: string): boolean {
  return user.role === "executive" || ownerId === user.id;
}

// ใช้หลังดึง record มาแล้ว (กรณี query scope ไม่ได้ เช่น join ซับซ้อน)
// throw NotFound ไม่ใช่ Forbidden — ไม่บอกว่ามี record อยู่
export function assertCanAccess(user: SessionUser, ownerId: string): void {
  if (!canAccess(user, ownerId)) throw new NotFoundError();
}

// action ที่ executive ก็ทำแทนไม่ได้ (แก้ราคา, ส่งอนุมัติ, export, ปิดการขาย)
export function assertIsOwner(user: SessionUser, ownerId: string): void {
  if (ownerId !== user.id) throw new ForbiddenError();
}
