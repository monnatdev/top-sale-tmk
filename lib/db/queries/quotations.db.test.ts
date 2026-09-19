// เทสสิทธิ์ของ query กับ DB จริง (skill testing ข้อ 5: mock แล้วไม่มีความหมาย)
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/types";
import { customers, quotations } from "@/lib/db/schema";
import { cleanupTestUsers, createTestUser } from "@/tests/db/testUsers";
import { countQuotationsByStatus, getQuotationById, listQuotations, nextQuoteSequence, replaceItems, updateQuotation } from "./quotations";

const YEAR = 9999; // ปีเทส — เลขที่ใบ QT-9999-xxxx ไม่ชนของจริง
let saleA: SessionUser, saleB: SessionUser, exec: SessionUser;
let customerId: string;
const ids: Record<string, string> = {};

async function insert(owner: SessionUser, status: (typeof quotations.$inferInsert)["status"], customerName: string, items = 0) {
  const seq = await nextQuoteSequence(YEAR, db);
  const [row] = await db
    .insert(quotations)
    .values({ quoteNumber: `QT-${YEAR}-${String(seq).padStart(4, "0")}`, customerId, ownerId: owner.id, status, quoteDate: "2026-01-01", customerName })
    .returning({ id: quotations.id });
  if (items > 0) {
    await replaceItems(row!.id, Array.from({ length: items }, (_, i) => ({ productName: `p${i}`, weightPerBag: 45, pricePerBag: 100 })), db);
  }
  return row!.id;
}

beforeAll(async () => {
  [saleA, saleB, exec] = await Promise.all([createTestUser("sale-a", "sale"), createTestUser("sale-b", "sale"), createTestUser("exec", "executive")]);
  const [c] = await db.insert(customers).values({ companyName: "ZZTEST ลูกค้า", createdBy: saleA.id }).returning({ id: customers.id });
  customerId = c!.id;
  ids.a1 = await insert(saleA, "draft", "ZZTEST บจก. เอ หนึ่ง", 2);
  ids.a2 = await insert(saleA, "pending_approval", "ZZTEST บจก. เอ สอง");
  ids.a3 = await insert(saleA, "won", "ZZTEST หจก. เอ สาม");
  ids.b1 = await insert(saleB, "draft", "ZZTEST บจก. บี หนึ่ง");
  ids.b2 = await insert(saleB, "pending_approval", "ZZTEST บจก. บี สอง");
});

afterAll(async () => {
  await cleanupTestUsers([saleA, saleB, exec], YEAR);
});

describe("getQuotationById (scoped)", () => {
  it("sale A reads own", async () => {
    const q = await getQuotationById(ids.a1, saleA);
    expect(q?.id).toBe(ids.a1);
    expect(q?.items).toHaveLength(2);
  });
  it("sale A cannot read sale B's → undefined (not found, not forbidden)", async () => {
    expect(await getQuotationById(ids.b1, saleA)).toBeUndefined();
  });
  it("executive reads any", async () => {
    expect((await getQuotationById(ids.b1, exec))?.id).toBe(ids.b1);
  });
});

describe("updateQuotation (scoped where)", () => {
  it("sale A updating sale B's → 0 rows", async () => {
    expect(await updateQuotation(ids.b1, { customerName: "HACKED" }, saleA, db)).toBe(0);
    expect((await getQuotationById(ids.b1, exec))?.customerName).toBe("ZZTEST บจก. บี หนึ่ง");
  });
  it("owner updating own → 1 row", async () => {
    expect(await updateQuotation(ids.a1, { customerPhone: "081" }, saleA, db)).toBe(1);
  });
});

describe("listQuotations", () => {
  const q = "ZZTEST";
  it("sale A sees only own (3), sale B only own (2)", async () => {
    const a = await listQuotations(saleA, { q, page: 1 });
    const b = await listQuotations(saleB, { q, page: 1 });
    expect(a.total).toBe(3);
    expect(a.items.every((r) => r.customerName.includes("เอ"))).toBe(true);
    expect(b.total).toBe(2);
  });
  it("executive sees all (5) with owner names", async () => {
    const r = await listQuotations(exec, { q, page: 1 });
    expect(r.total).toBe(5);
    expect(new Set(r.items.map((i) => i.owner.name))).toEqual(new Set([saleA.name, saleB.name]));
  });
  it("status filter + search combine", async () => {
    const r = await listQuotations(exec, { q, status: "pending_approval", page: 1 });
    expect(r.total).toBe(2);
  });
  it("search by quote number / partial name, wildcard escaped", async () => {
    const byNo = await listQuotations(saleA, { q: `QT-${YEAR}-0001`, page: 1 });
    expect(byNo.total).toBe(1);
    const byName = await listQuotations(saleA, { q: "หจก. เอ", page: 1 });
    expect(byName.total).toBe(1);
    const wildcard = await listQuotations(saleA, { q: "%", page: 1 }); // "%" ต้องไม่กลายเป็น match ทุกแถว
    expect(wildcard.total).toBe(0);
  });
  it("itemCount + newest first + pagination shape", async () => {
    const r = await listQuotations(saleA, { q, page: 1 });
    expect(r.items[0]!.customerName).toContain("สาม"); // insert ล่าสุด
    expect(r.items.find((i) => i.id === ids.a1)?.itemCount).toBe(2);
    expect(r.pageSize).toBe(20);
    const empty = await listQuotations(saleA, { q, page: 99 });
    expect(empty.items).toHaveLength(0);
    expect(empty.total).toBe(3);
  });
});

describe("listQuotations sort", () => {
  const q = "ZZTEST";
  it("oldest / customer / quote_date orderings", async () => {
    const oldest = await listQuotations(saleA, { q, sort: "oldest", page: 1 });
    expect(oldest.items[0]!.customerName).toContain("หนึ่ง");
    const byName = await listQuotations(exec, { q, sort: "customer", page: 1 });
    const names = byName.items.map((i) => i.customerName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "th")));
    const byDate = await listQuotations(exec, { q, sort: "quote_date", page: 1 });
    expect(byDate.items).toHaveLength(5);
  });
});

describe("countQuotationsByStatus", () => {
  it("scoped per role", async () => {
    const a = await countQuotationsByStatus(saleA);
    expect(a.draft).toBeGreaterThanOrEqual(1);
    expect(a.won).toBeGreaterThanOrEqual(1);
    const b = await countQuotationsByStatus(saleB);
    expect(b.won).toBe(0);
    const e = await countQuotationsByStatus(exec);
    expect(e.pending_approval).toBeGreaterThanOrEqual(a.pending_approval + b.pending_approval);
  });
});
