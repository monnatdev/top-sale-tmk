import "server-only";
import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { db, type DbClient } from "@/lib/db";
import { customers, type NewCustomer } from "@/lib/db/schema";

// ลูกค้าแชร์ทั้งบริษัท (ตัดสินใจ 2026-09-17) — ไม่ scope ตาม created_by
export async function listCustomers(dbx: DbClient = db) {
  return dbx.query.customers.findMany({
    orderBy: [asc(customers.companyName)],
    columns: {
      id: true,
      companyName: true,
      addressLine: true,
      subDistrict: true,
      district: true,
      province: true,
      postalCode: true,
      phone: true,
      taxId: true,
      paymentType: true,
      creditDays: true,
    },
    limit: 500,
  });
}

export const CUSTOMER_SEARCH_LIMIT = 20;

// ค้นหาลูกค้าเก่าแบบ on-demand (sheet เลือกลูกค้า) — ว่าง = ล่าสุด 20 ราย · มีคำค้น = ชื่อ/เลขภาษี ilike
export async function searchCustomers(term: string, dbx: DbClient = db) {
  const t = term.trim();
  const pattern = `%${t.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return dbx.query.customers.findMany({
    where: t ? or(ilike(customers.companyName, pattern), ilike(customers.taxId, pattern)) : undefined,
    orderBy: t ? [asc(customers.companyName)] : [desc(customers.createdAt)],
    limit: CUSTOMER_SEARCH_LIMIT,
    columns: {
      id: true,
      companyName: true,
      addressLine: true,
      subDistrict: true,
      district: true,
      province: true,
      postalCode: true,
      phone: true,
      taxId: true,
      paymentType: true,
      creditDays: true,
    },
  });
}

export type CustomerSearchRow = Awaited<ReturnType<typeof searchCustomers>>[number];

export async function getCustomerById(id: string, dbx: DbClient = db) {
  return dbx.query.customers.findFirst({ where: eq(customers.id, id), columns: { id: true, companyName: true } });
}

export async function insertCustomer(values: NewCustomer, dbx: DbClient = db) {
  const [row] = await dbx.insert(customers).values(values).returning({ id: customers.id });
  return row!;
}
