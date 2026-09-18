---
name: auth-guard
description: pattern ตรวจ session + สิทธิ์ของโปรเจกต์ (Supabase Auth + Drizzle, ไม่ใช้ RLS) — getSessionUser, requireUser, requireRole, scopeToUser, กัน IDOR, middleware, signed URL — ใช้เมื่อเขียน/แก้อะไรที่แตะ session, role, owner_id, การเข้าถึงข้อมูล หรือ Storage
---

# Auth Guard — ตรวจ session และสิทธิ์

> สิทธิ์ทั้งหมดคุมที่ backend เท่านั้น (ไม่เปิด RLS — Drizzle ใช้ service_role ข้าม RLS อยู่แล้ว)
> ดังนั้น **ทุกจุดที่แตะข้อมูลต้องผ่าน helper ในไฟล์นี้** — ห้ามเขียนเงื่อนไขสิทธิ์เองกระจัดกระจาย

---

## 1. โครงไฟล์

```
/lib/auth
  session.ts       getSessionUser / requireUser        (ผูก Next.js ได้ — cookies, redirect)
  guards.ts        requireRole / scopeToUser / assertCanAccess   (pure — ไม่ import next/*)
  types.ts         SessionUser, Role
/lib/supabase
  server.ts        createServerClient (@supabase/ssr) — ใช้เฉพาะ auth + storage
  admin.ts         service_role client — server only, ใช้เฉพาะ storage signed URL / admin ops
proxy.ts           refresh session + redirect ไป /login  (Next 16: ชื่อ proxy ไม่ใช่ middleware)
```

- `/lib/services` **ห้าม** import `session.ts` — service รับ `user: SessionUser` เป็น parameter เสมอ (จะได้เทสได้ + ไม่ผูก Next)
- `guards.ts` ต้อง pure เพราะ service เรียกใช้

---

## 2. Types

```ts
// lib/auth/types.ts
export type Role = "sale" | "executive";

export interface SessionUser {
  id: string;        // = auth.users.id = profiles.id
  name: string;
  role: Role;
}
```

---

## 3. Session (`lib/auth/session.ts`)

```ts
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/db/queries/profiles";
import type { SessionUser } from "./types";

// cache() = เรียกกี่ครั้งใน request เดียวก็ query ครั้งเดียว
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();   // verify ลายเซ็น JWT ในเครื่อง (ไม่ใช่ getSession ที่อ่าน cookie เฉยๆ)
  const sub = data?.claims.sub;
  if (!sub) return null;

  const profile = await getProfileById(sub);
  if (!profile || !profile.isActive) return null;             // ปิด account = เตะออกทันทีทุก request

  return { id: profile.id, name: profile.name, role: profile.role };
});

// ใช้ในหน้า/layout: ไม่มี session → ไป login
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
```

กฎ:
- ใช้ `supabase.auth.getClaims()` (verify JWT ด้วย JWKS ในเครื่อง — proxy จาก 1.8s เหลือ ~5ms) — `getSession()` อ่านจาก cookie โดยไม่ verify ห้ามใช้ตัดสินสิทธิ์ · การเพิกถอนจริงอยู่ที่ `profiles.is_active` ซึ่งอ่านทุก request
- โหลด `profiles` ทุกครั้ง (ไม่เก็บ role ใน JWT/cookie) → เปลี่ยน role / ปิด user มีผลทันที
- **ไม่มีหน้าสมัคร/ลืมรหัส** — สร้าง user ผ่าน seed script / Supabase dashboard เท่านั้น

---

## 4. Guards (`lib/auth/guards.ts`) — pure

```ts
import { eq, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { SessionUser, Role } from "./types";

export function requireRole(user: SessionUser, ...roles: Role[]): void {
  if (!roles.includes(user.role)) throw new ForbiddenError();
}

// ใส่ใน where() ของทุก query ที่ดึงใบ/ลูกค้า
// executive → undefined (and() จะข้ามให้) · sale → owner_id = user.id
export function scopeToUser(user: SessionUser, ownerColumn: PgColumn): SQL | undefined {
  return user.role === "executive" ? undefined : eq(ownerColumn, user.id);
}

// ใช้หลังดึง record มาแล้ว (กรณี query ไม่ได้ scope ได้ เช่น join ซับซ้อน)
export function assertCanAccess(user: SessionUser, ownerId: string): void {
  if (user.role !== "executive" && ownerId !== user.id) throw new NotFoundError(); // not found ไม่ใช่ forbidden — ไม่บอกว่ามี
}

export function assertIsOwner(user: SessionUser, ownerId: string): void {
  if (ownerId !== user.id) throw new ForbiddenError();  // ใช้กับ action ที่ executive ก็ทำแทนไม่ได้ เช่น แก้ราคา, ส่งอนุมัติ
}
```

---

## 5. ใช้ใน query (กัน IDOR ที่ชั้น DB)

```ts
// lib/db/queries/quotations.ts
export async function getQuotationById(id: string, user: SessionUser) {
  return db.query.quotations.findFirst({
    where: and(eq(quotations.id, id), scopeToUser(user, quotations.ownerId)),
    with: { items: true, notes: true },   // ดึงครั้งเดียว กัน N+1
  });
  // sale A ขอใบของ B → undefined → service throw NotFoundError
}

export async function listQuotations(user: SessionUser, filter: QuotationFilter) {
  return db.select(...).from(quotations)
    .where(and(scopeToUser(user, quotations.ownerId), statusFilter(filter)))
    .orderBy(desc(quotations.createdAt))
    .limit(filter.pageSize).offset(...);
}
```

กฎ:
- **ทุก query ของ `quotations` และ `customers` รับ `user` และเรียก `scopeToUser`** — ไม่มีข้อยกเว้น แม้จะ "รู้ว่าเรียกจาก executive"
- ไม่มี `getQuotationById(id)` แบบไม่รับ user — ถ้า internal job ต้องใช้ ให้ตั้งชื่อชัด `getQuotationByIdUnscoped` และมี comment ว่าใครเรียก
- update/delete ก็ต้อง scope: `.where(and(eq(id), scopeToUser(...)))` แล้วเช็ก `rowCount === 0` → NotFoundError

---

## 6. ใช้ใน service — ตารางว่าใครทำอะไรได้

| Action | Role | เช็กเพิ่ม |
|---|---|---|
| สร้าง/แก้ใบ, แก้ราคา, หมายเหตุ | sale | `assertIsOwner` + status ∈ {draft, returned} |
| ส่งอนุมัติ | sale | `assertIsOwner` + status ∈ {draft, returned} |
| อนุมัติ+เซ็น / ตีกลับ | executive | status = pending_approval |
| Export PDF (→ sent) | sale (owner) | status = approved |
| ปิดการขาย | sale (owner) | status = sent |
| ดูใบ | owner หรือ executive | ผ่าน `scopeToUser` ใน query |
| CRUD สินค้า | ทั้งสอง role (ยืนยันตอนข้อ 4) | — |
| ลูกค้า | ยืนยันตอนข้อ 4 ว่า scope ตาม `created_by` หรือแชร์ทั้งบริษัท | — |

```ts
// lib/services/quotationService.ts
export async function submitForApproval(id: string, user: SessionUser) {
  const q = await getQuotationById(id, user);        // scope แล้ว
  if (!q) throw new NotFoundError();
  assertIsOwner(user, q.ownerId);
  assertTransition(q.status, "pending_approval");    // state machine
  return db.transaction(async (tx) => { ... + audit_log });
}
```

---

## 7. Proxy (`proxy.ts` ที่ root — Next 16 เปลี่ยนชื่อจาก middleware)

หน้าที่ **แค่ 2 อย่าง**: refresh token ของ Supabase ทุก request + redirect คนไม่ล็อกอินออกจาก `/(app)`
ไฟล์ชื่อ `proxy.ts` export ฟังก์ชัน `proxy` (ไม่ใช่ `middleware` — deprecated ใน Next 16)
**ไม่ใช่ที่เช็กสิทธิ์** — สิทธิ์จริงเช็กที่ query/service เสมอ (middleware bypass ได้)

```ts
export async function proxy(req: NextRequest) {
  const { supabase, response } = createProxyClient(req);   // lib/supabase/proxy.ts ตาม @supabase/ssr docs
  const { data } = await supabase.auth.getClaims();      // ไม่ยิง network ทุก request
  const user = data?.claims ?? null;
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  if (!user && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (user && isLogin) return NextResponse.redirect(new URL("/quotations", req.url));
  return response;
}
export const config = { matcher: ["/((?!_next|api/health|.*\\..*).*)"] };
```

---

## 8. Storage — signed URL เท่านั้น

- Bucket `product-images`, `signatures` = **private** ทั้งคู่
- DB เก็บ **path** (`products/abc.jpg`) ไม่เก็บ URL
- แสดงรูป: server component / route เรียก `getSignedUrl(path, user)` → `admin.storage.from(bucket).createSignedUrl(path, 60 * 10)` → ส่ง URL ไป `next/image`
- **ลายเซ็น**: gen signed URL ได้เฉพาะตอน (ก) gen PDF ฝั่ง server (ข) executive ดูของตัวเอง — ห้ามส่ง signed URL ลายเซ็นไปหน้า sale
- Upload: ผ่าน server action เท่านั้น — จำกัด `image/jpeg|png|webp`, ≤ 2MB, ตั้งชื่อไฟล์ใหม่ด้วย uuid (ไม่ใช้ชื่อจาก user)
- `admin.ts` (service_role) ห้ามถูก import จากไฟล์ที่มี `"use client"` — เพิ่ม `import "server-only"` บรรทัดแรก

---

## 9. Checklist ก่อนถือว่า feature เสร็จ

- [ ] ทุก query ใบ/ลูกค้ารับ `user` และใช้ `scopeToUser`
- [ ] ทุก service ที่เปลี่ยนสถานะเช็ก role + status ก่อน
- [ ] มีเทสสิทธิ์ตาม skill `testing` ข้อ 5 (sale A ↔ sale B ↔ executive)
- [ ] ไม่มี `getSession()` · ไม่มี `admin.ts` ใน client bundle (`grep -r "supabase/admin" app components`)
- [ ] ปุ่มที่ซ่อนตาม role ใน UI มี guard ที่ backend คู่กันเสมอ
