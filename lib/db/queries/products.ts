import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db, type DbClient } from "@/lib/db";
import { products } from "@/lib/db/schema";

// สินค้า master ที่เปิดใช้ (ให้ทั้งสอง role เลือกได้ — ไม่ต้อง scope)
export async function listActiveProducts(dbx: DbClient = db) {
  return dbx.query.products.findMany({
    where: eq(products.isActive, true),
    orderBy: [asc(products.sortOrder), asc(products.name)],
    columns: { id: true, name: true, packagingSpec: true, weightPerBag: true, imagePath: true },
  });
}

export async function getProductsByIds(ids: string[], dbx: DbClient = db) {
  if (ids.length === 0) return [];
  return dbx.query.products.findMany({
    where: inArray(products.id, ids),
    columns: { id: true, name: true, packagingSpec: true, weightPerBag: true, imagePath: true, isActive: true },
  });
}
