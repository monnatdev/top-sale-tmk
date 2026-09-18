import "server-only";
import { asc, eq } from "drizzle-orm";
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

export async function getCustomerById(id: string, dbx: DbClient = db) {
  return dbx.query.customers.findFirst({ where: eq(customers.id, id), columns: { id: true, companyName: true } });
}

export async function insertCustomer(values: NewCustomer, dbx: DbClient = db) {
  const [row] = await dbx.insert(customers).values(values).returning({ id: customers.id });
  return row!;
}
