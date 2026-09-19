import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/types";
import { customers } from "@/lib/db/schema";
import { cleanupTestUsers, createTestUser } from "@/tests/db/testUsers";
import { searchCustomers } from "./customers";

let owner: SessionUser;

beforeAll(async () => {
  owner = await createTestUser("cust", "sale");
  await db.insert(customers).values([
    { companyName: "ZZTEST บจก. แอปเปิ้ล", taxId: "1111111111111", createdBy: owner.id },
    { companyName: "ZZTEST หจก. กล้วยหอม", taxId: "2222222222222", createdBy: owner.id },
    { companyName: "ZZTEST บมจ. ส้ม_โอ", taxId: null, createdBy: owner.id },
  ]);
});
afterAll(async () => cleanupTestUsers([owner], 9998));

describe("searchCustomers", () => {
  it("empty term → latest first, capped", async () => {
    const r = await searchCustomers("");
    expect(r.length).toBeGreaterThanOrEqual(3);
    expect(r.length).toBeLessThanOrEqual(20);
    expect(r[0]!.companyName).toContain("ส้ม"); // insert ล่าสุด
  });
  it("matches name (partial) and tax id, sorted by name", async () => {
    expect((await searchCustomers("กล้วย")).map((c) => c.companyName)).toEqual(["ZZTEST หจก. กล้วยหอม"]);
    expect((await searchCustomers("2222222222222"))[0]!.companyName).toContain("กล้วย");
    const all = await searchCustomers("ZZTEST");
    expect(all).toHaveLength(3);
  });
  it("escapes wildcard: '_' matches literal underscore only", async () => {
    const r = await searchCustomers("ส้ม_โอ");
    expect(r).toHaveLength(1);
    expect((await searchCustomers("ส้ม%โอ"))).toHaveLength(0);
  });
});
