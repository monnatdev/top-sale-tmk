import "server-only";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, type DbClient } from "@/lib/db";
import { scopeToUser } from "@/lib/auth/guards";
import type { QuotationStatus } from "@/lib/constants/quotationStatus";
import type { SessionUser } from "@/lib/auth/types";
import {
  auditLog,
  quotationItems,
  quotationNotes,
  quotations,
  quoteNumberCounters,
  type NewAuditLogEntry,
  type NewQuotation,
  type NewQuotationItem,
  type NewQuotationNote,
  type Quotation,
} from "@/lib/db/schema";

// ดึงใบ + items + notes + ประวัติ ครั้งเดียว (กัน N+1) — scope สิทธิ์ในตัว: sale เห็นเฉพาะใบตัวเอง
export async function getQuotationById(id: string, user: SessionUser, dbx: DbClient = db) {
  return dbx.query.quotations.findFirst({
    where: and(eq(quotations.id, id), scopeToUser(user, quotations.ownerId)),
    with: {
      items: { orderBy: [asc(quotationItems.sortOrder)] },
      notes: { orderBy: [asc(quotationNotes.sortOrder)] },
      owner: { columns: { id: true, name: true } },
      signer: { columns: { id: true, name: true } },
      auditLog: { orderBy: [asc(auditLog.createdAt)], with: { actor: { columns: { name: true } } } },
    },
  });
}

export type QuotationDetail = NonNullable<Awaited<ReturnType<typeof getQuotationById>>>;

export const LIST_PAGE_SIZE = 20;

export type QuotationListFilter = {
  status?: QuotationStatus;
  /** ค้นหาชื่อลูกค้า หรือ เลขที่ใบ (ilike) */
  q?: string;
  page: number;
};

// escape % _ ของ ilike กัน pattern จาก user (Drizzle parameterize ค่าให้แล้ว แต่ wildcard ยังทำงาน)
const likePattern = (term: string) => `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

function listConditions(user: SessionUser, filter: Omit<QuotationListFilter, "page">) {
  const term = filter.q?.trim();
  return and(
    scopeToUser(user, quotations.ownerId),
    filter.status ? eq(quotations.status, filter.status) : undefined,
    term ? or(ilike(quotations.customerName, likePattern(term)), ilike(quotations.quoteNumber, likePattern(term))) : undefined,
  );
}

// หน้ารายการ — scope สิทธิ์ในตัว · เรียงล่าสุดก่อน · คืน items + total สำหรับ pagination
export async function listQuotations(user: SessionUser, filter: QuotationListFilter, dbx: DbClient = db) {
  const where = listConditions(user, filter);
  const offset = (Math.max(1, filter.page) - 1) * LIST_PAGE_SIZE;
  const [items, [{ total }]] = await Promise.all([
    dbx.query.quotations.findMany({
      where,
      orderBy: [desc(quotations.createdAt)],
      limit: LIST_PAGE_SIZE,
      offset,
      columns: { id: true, quoteNumber: true, customerName: true, quoteDate: true, status: true, createdAt: true },
      with: { owner: { columns: { name: true } } },
      // เขียนชื่อตารางตรงๆ: ใน extras Drizzle จะแทน alias ของ quotation_items ผิด
      extras: { itemCount: sql<number>`(select count(*)::int from quotation_items qi where qi.quotation_id = ${quotations.id})`.as("item_count") },
    }),
    dbx.select({ total: count() }).from(quotations).where(where),
  ]);
  return { items, total, page: Math.max(1, filter.page), pageSize: LIST_PAGE_SIZE };
}

export type QuotationListRow = Awaited<ReturnType<typeof listQuotations>>["items"][number];

// จำนวนใบต่อสถานะ (chips กรอง + หน้าภาพรวม) — scope สิทธิ์ · ไม่รวมคำค้น
export async function countQuotationsByStatus(user: SessionUser, dbx: DbClient = db): Promise<Record<QuotationStatus, number>> {
  const rows = await dbx
    .select({ status: quotations.status, n: count() })
    .from(quotations)
    .where(scopeToUser(user, quotations.ownerId))
    .groupBy(quotations.status);
  const counts = { draft: 0, pending_approval: 0, approved: 0, sent: 0, won: 0, returned: 0 } satisfies Record<QuotationStatus, number>;
  for (const r of rows) counts[r.status] = r.n;
  return counts;
}

// เลขรันรายปี — upsert แถวเดียว atomic (2 คนสร้างพร้อมกันได้เลขต่างกันแน่นอน) · เรียกใน transaction เดียวกับ insert ใบ
export async function nextQuoteSequence(yearBE: number, dbx: DbClient): Promise<number> {
  const [row] = await dbx
    .insert(quoteNumberCounters)
    .values({ year: yearBE, lastNo: 1 })
    .onConflictDoUpdate({ target: quoteNumberCounters.year, set: { lastNo: sql`${quoteNumberCounters.lastNo} + 1` } })
    .returning({ lastNo: quoteNumberCounters.lastNo });
  return row!.lastNo;
}

export async function insertQuotation(values: NewQuotation, dbx: DbClient) {
  const [row] = await dbx.insert(quotations).values(values).returning({ id: quotations.id, quoteNumber: quotations.quoteNumber });
  return row!;
}

// อัปเดตเนื้อหา — scope ที่ where ด้วย เพื่อกัน IDOR ซ้ำอีกชั้นแม้ service เช็กแล้ว
export async function updateQuotation(id: string, values: Partial<NewQuotation>, user: SessionUser, dbx: DbClient) {
  const rows = await dbx
    .update(quotations)
    .set(values)
    .where(and(eq(quotations.id, id), scopeToUser(user, quotations.ownerId)))
    .returning({ id: quotations.id });
  return rows.length;
}

export type QuotationStatusPatch = Pick<Quotation, "status"> &
  Partial<Pick<Quotation, "signedBy" | "signedAt" | "signaturePath" | "returnReason" | "sentAt" | "wonAt">>;

export async function updateQuotationStatus(id: string, patch: QuotationStatusPatch, user: SessionUser, dbx: DbClient) {
  return updateQuotation(id, patch, user, dbx);
}

// แทนที่รายการทั้งชุด (ฟอร์มส่งมาทั้งใบ) — ง่ายและกันของค้าง
export async function replaceItems(quotationId: string, items: Omit<NewQuotationItem, "quotationId">[], dbx: DbClient) {
  await dbx.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
  if (items.length > 0) {
    await dbx.insert(quotationItems).values(items.map((it, i) => ({ ...it, quotationId, sortOrder: i })));
  }
}

export async function replaceNotes(quotationId: string, notes: Omit<NewQuotationNote, "quotationId">[], dbx: DbClient) {
  await dbx.delete(quotationNotes).where(eq(quotationNotes.quotationId, quotationId));
  if (notes.length > 0) {
    await dbx.insert(quotationNotes).values(notes.map((n, i) => ({ ...n, quotationId, sortOrder: i })));
  }
}

export async function insertAuditLog(entry: NewAuditLogEntry, dbx: DbClient) {
  await dbx.insert(auditLog).values(entry);
}
