import { describe, expect, it } from "vitest";
import { and, sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { quotations } from "@/lib/db/schema";
import { makeExecutive, makeUser } from "@/tests/factories";
import { assertCanAccess, assertIsOwner, canAccess, requireRole, scopeToUser } from "./guards";

const saleA = makeUser({ id: "00000000-0000-4000-8000-00000000000a" });
const saleB = makeUser({ id: "00000000-0000-4000-8000-00000000000b" });
const exec = makeExecutive({ id: "00000000-0000-4000-8000-0000000000ec" });

describe("scopeToUser", () => {
  it("sale → เงื่อนไข owner_id = user.id", () => {
    const cond = scopeToUser(saleA, quotations.ownerId);
    expect(cond).toBeDefined();
    // render เป็น SQL จริงเพื่อดูว่ากรองคอลัมน์ + ค่าถูก
    const q = new PgDialect().sqlToQuery(cond!);
    expect(q.sql).toBe('"quotations"."owner_id" = $1');
    expect(q.params).toEqual([saleA.id]);
  });

  it("executive → undefined (ไม่กรอง)", () => {
    expect(scopeToUser(exec, quotations.ownerId)).toBeUndefined();
  });

  it("and() ข้าม undefined ได้ — query ของ executive ยังมีเงื่อนไขอื่นครบ", () => {
    const cond = and(scopeToUser(exec, quotations.ownerId), sql`1 = 1`);
    expect(cond).toBeDefined();
  });
});

describe("canAccess / assertCanAccess", () => {
  it("sale A เข้าถึงของตัวเองได้", () => {
    expect(canAccess(saleA, saleA.id)).toBe(true);
    expect(() => assertCanAccess(saleA, saleA.id)).not.toThrow();
  });

  it("sale A เข้าถึงของ sale B ไม่ได้ → NotFound (ไม่ใช่ Forbidden)", () => {
    expect(canAccess(saleA, saleB.id)).toBe(false);
    expect(() => assertCanAccess(saleA, saleB.id)).toThrow(NotFoundError);
  });

  it("executive เข้าถึงของทุกคนได้", () => {
    expect(canAccess(exec, saleA.id)).toBe(true);
    expect(() => assertCanAccess(exec, saleB.id)).not.toThrow();
  });
});

describe("assertIsOwner", () => {
  it("เจ้าของผ่าน", () => {
    expect(() => assertIsOwner(saleA, saleA.id)).not.toThrow();
  });

  it("sale B → Forbidden", () => {
    expect(() => assertIsOwner(saleB, saleA.id)).toThrow(ForbiddenError);
  });

  it("executive ก็ทำแทนเจ้าของไม่ได้ → Forbidden", () => {
    expect(() => assertIsOwner(exec, saleA.id)).toThrow(ForbiddenError);
  });
});

describe("requireRole", () => {
  it("role ตรงผ่าน · ไม่ตรง → Forbidden", () => {
    expect(() => requireRole(exec, "executive")).not.toThrow();
    expect(() => requireRole(saleA, "sale", "executive")).not.toThrow();
    expect(() => requireRole(saleA, "executive")).toThrow(ForbiddenError);
  });
});
