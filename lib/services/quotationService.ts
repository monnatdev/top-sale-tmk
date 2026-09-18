// business logic ของใบเสนอราคา — ไม่ import next/* · รับ user เป็น parameter เสมอ · ไม่เขียน SQL เอง
import { assertIsOwner, requireRole } from "@/lib/auth/guards";
import type { SessionUser } from "@/lib/auth/types";
import { db } from "@/lib/db";
import * as customerQueries from "@/lib/db/queries/customers";
import * as profileQueries from "@/lib/db/queries/profiles";
import * as productQueries from "@/lib/db/queries/products";
import * as quotationQueries from "@/lib/db/queries/quotations";
import type { NewQuotation, NewQuotationItem } from "@/lib/db/schema";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { QuotationDraftInput } from "@/lib/validation/quotation";
import { formatPrice, formatThaiDate, formatWeight, getThaiYear } from "@/lib/utils/format";
import { COMPANY } from "@/lib/constants/company";
import { renderQuotationPdf, type QuotationPdfData } from "@/lib/pdf/quotationPdf";
import { BUCKETS } from "@/lib/storage/buckets";
import { downloadImage } from "@/lib/storage/download";
import { describeItemChanges } from "./priceDiff";
import { assertEditable, assertTransition } from "./quotationStateMachine";
import type { QuotationStatus } from "@/lib/constants/quotationStatus";
import { formatQuoteNumber } from "./quoteNumber";

type ProductSnapshot = Pick<NewQuotationItem, "productName" | "packagingSpec" | "weightPerBag" | "imagePath" | "pricePerBag"> & { productId: string };

// snapshot สินค้าจาก master ณ ตอนบันทึก — ไม่เชื่อชื่อ/สเปกจาก client
async function buildItemSnapshots(items: QuotationDraftInput["items"]): Promise<ProductSnapshot[]> {
  if (items.length === 0) return [];
  const found = await productQueries.getProductsByIds(items.map((it) => it.productId));
  const byId = new Map(found.map((p) => [p.id, p]));
  return items.map((it, i) => {
    const p = byId.get(it.productId);
    if (!p || !p.isActive) {
      throw new ValidationError("มีสินค้าที่ไม่พบหรือถูกปิดใช้งาน", { [`items.${i}.productId`]: ["ไม่พบสินค้านี้"] });
    }
    return {
      productId: p.id,
      productName: p.name,
      packagingSpec: p.packagingSpec,
      weightPerBag: p.weightPerBag,
      imagePath: p.imagePath,
      pricePerBag: it.pricePerBag,
    };
  });
}

// ข้อมูลลูกค้าที่ snapshot ลงใบ (แก้ในใบไม่กระทบ master — ตัดสินใจ 2026-09-17)
function customerSnapshot(input: QuotationDraftInput) {
  return {
    customerName: input.companyName,
    customerAddressLine: input.addressLine,
    customerSubDistrict: input.subDistrict,
    customerDistrict: input.district,
    customerProvince: input.province,
    customerPostalCode: input.postalCode,
    customerPhone: input.phone || null,
    customerTaxId: input.taxId || null,
    paymentType: input.paymentType,
    creditDays: input.paymentType === "credit" ? input.creditDays : 0,
    quoteDate: input.quoteDate,
  } satisfies Partial<NewQuotation>;
}

// หา/สร้าง customer_id: null = ลูกค้าใหม่ → สร้างจากข้อมูลในฟอร์ม · uuid = ต้องมีอยู่จริง
async function resolveCustomerId(input: QuotationDraftInput, user: SessionUser, tx: Parameters<typeof customerQueries.insertCustomer>[1]) {
  if (input.customerId) {
    const c = await customerQueries.getCustomerById(input.customerId, tx);
    if (!c) throw new NotFoundError("ไม่พบลูกค้าที่เลือก");
    return c.id;
  }
  const created = await customerQueries.insertCustomer(
    {
      companyName: input.companyName,
      addressLine: input.addressLine,
      subDistrict: input.subDistrict,
      district: input.district,
      province: input.province,
      postalCode: input.postalCode,
      phone: input.phone || null,
      taxId: input.taxId || null,
      paymentType: input.paymentType,
      creditDays: input.paymentType === "credit" ? input.creditDays : 0,
      createdBy: user.id,
    },
    tx,
  );
  return created.id;
}

export async function createDraft(input: QuotationDraftInput, user: SessionUser): Promise<{ id: string; quoteNumber: string }> {
  requireRole(user, "sale");
  const items = await buildItemSnapshots(input.items);

  return db.transaction(async (tx) => {
    const customerId = await resolveCustomerId(input, user, tx);
    const year = getThaiYear();
    const seq = await quotationQueries.nextQuoteSequence(year, tx);
    const created = await quotationQueries.insertQuotation(
      { quoteNumber: formatQuoteNumber(year, seq), customerId, ownerId: user.id, status: "draft", ...customerSnapshot(input) },
      tx,
    );
    await quotationQueries.replaceItems(created.id, items, tx);
    await quotationQueries.replaceNotes(created.id, input.notes.map((text) => ({ text })), tx);
    await quotationQueries.insertAuditLog({ quotationId: created.id, actorId: user.id, action: "created" }, tx);
    return created;
  });
}

export async function updateDraft(id: string, input: QuotationDraftInput, user: SessionUser): Promise<{ id: string }> {
  const q = await quotationQueries.getQuotationById(id, user);
  if (!q) throw new NotFoundError("ไม่พบใบเสนอราคา");
  assertIsOwner(user, q.ownerId);
  assertEditable(q.status);
  const items = await buildItemSnapshots(input.items);

  await db.transaction(async (tx) => {
    // เลือกลูกค้าเก่าคนเดิม/คนใหม่ หรือสร้างใหม่ — ถ้าไม่ได้เปลี่ยนก็ใช้ id เดิม
    const customerId = input.customerId === q.customerId ? q.customerId : await resolveCustomerId(input, user, tx);
    await quotationQueries.updateQuotation(id, { customerId, ...customerSnapshot(input) }, user, tx);
    await quotationQueries.replaceItems(id, items, tx);
    await quotationQueries.replaceNotes(id, input.notes.map((text) => ({ text })), tx);
    await quotationQueries.insertAuditLog(
      { quotationId: id, actorId: user.id, action: "edited", detail: describeItemChanges(q.items, items) },
      tx,
    );
  });
  return { id };
}

export async function submitForApproval(id: string, user: SessionUser): Promise<void> {
  const q = await quotationQueries.getQuotationById(id, user);
  if (!q) throw new NotFoundError("ไม่พบใบเสนอราคา");
  assertIsOwner(user, q.ownerId);
  assertTransition(q.status, "pending_approval");
  if (q.items.length === 0) throw new ValidationError("ต้องมีสินค้าอย่างน้อย 1 รายการก่อนส่งอนุมัติ");
  if (!q.customerName.trim()) throw new ValidationError("กรุณากรอกชื่อบริษัทลูกค้าก่อนส่งอนุมัติ");

  await db.transaction(async (tx) => {
    await quotationQueries.updateQuotationStatus(id, { status: "pending_approval", returnReason: null }, user, tx);
    await quotationQueries.insertAuditLog({ quotationId: id, actorId: user.id, action: "submitted" }, tx);
  });
}

// ---------- วงจรอนุมัติ (ผู้บริหารเท่านั้น) ----------

// อนุมัติ + แปะลายเซ็น: snapshot path ลายเซ็น ณ ตอนเซ็น (ผู้บริหารเปลี่ยนลายเซ็นทีหลัง ใบเก่าไม่เปลี่ยน) → ใบล็อกแก้ไม่ได้
export async function approve(id: string, user: SessionUser): Promise<void> {
  requireRole(user, "executive");
  const q = await quotationQueries.getQuotationById(id, user);
  if (!q) throw new NotFoundError("ไม่พบใบเสนอราคา");
  assertTransition(q.status, "approved");

  const signaturePath = await profileQueries.getProfileSignaturePath(user.id);
  if (!signaturePath) throw new ValidationError("ยังไม่ได้ตั้งค่าลายเซ็นในโปรไฟล์ — ติดต่อผู้ดูแลเพื่ออัปโหลดลายเซ็นก่อนอนุมัติ");

  await db.transaction(async (tx) => {
    await quotationQueries.updateQuotationStatus(
      id,
      { status: "approved", signedBy: user.id, signedAt: new Date(), signaturePath, returnReason: null },
      user,
      tx,
    );
    await quotationQueries.insertAuditLog({ quotationId: id, actorId: user.id, action: "approved" }, tx);
  });
}

// ตีกลับพร้อมเหตุผล → เซลล์แก้แล้วส่งใหม่ได้
export async function reject(id: string, reason: string, user: SessionUser): Promise<void> {
  requireRole(user, "executive");
  const q = await quotationQueries.getQuotationById(id, user);
  if (!q) throw new NotFoundError("ไม่พบใบเสนอราคา");
  assertTransition(q.status, "returned");

  await db.transaction(async (tx) => {
    await quotationQueries.updateQuotationStatus(id, { status: "returned", returnReason: reason }, user, tx);
    await quotationQueries.insertAuditLog({ quotationId: id, actorId: user.id, action: "returned", detail: reason }, tx);
  });
}

// ---------- Export PDF (ข้อ 7) + ปิดการขาย (ข้อ 8) ----------

const EXPORTABLE: readonly QuotationStatus[] = ["approved", "sent", "won"];

export type PdfExport = { buffer: Buffer; filename: string; transitioned: boolean };

// export ได้เมื่ออนุมัติแล้วขึ้นไป · เจ้าของ export ครั้งแรก (approved) → sent อัตโนมัติ · ผู้บริหาร/export ซ้ำ = ดาวน์โหลดเฉยๆ
export async function exportPdf(id: string, user: SessionUser): Promise<PdfExport> {
  const q = await quotationQueries.getQuotationById(id, user);
  if (!q) throw new NotFoundError("ไม่พบใบเสนอราคา");
  if (!EXPORTABLE.includes(q.status)) throw new ValidationError("ต้องได้รับอนุมัติก่อนจึงจะ export PDF ได้");

  // รูปสินค้า + ลายเซ็น snapshot จาก bucket private (ไม่พบ = เว้นว่าง ไม่ทำให้ export ล้ม)
  const [signature, ...images] = await Promise.all([
    downloadImage(BUCKETS.signatures, q.signaturePath),
    ...q.items.map((it) => downloadImage(BUCKETS.productImages, it.imagePath)),
  ]);

  const data: QuotationPdfData = {
    quoteNumber: q.quoteNumber,
    quoteDate: formatThaiDate(q.quoteDate),
    paymentType: q.paymentType,
    creditDays: q.creditDays,
    customer: {
      name: q.customerName,
      addressLine: q.customerAddressLine,
      subDistrict: q.customerSubDistrict,
      district: q.customerDistrict,
      province: q.customerProvince,
      postalCode: q.customerPostalCode,
    },
    items: q.items.map((it, i) => ({
      name: it.productName,
      spec: it.packagingSpec,
      weightKg: formatWeight(it.weightPerBag),
      price: formatPrice(it.pricePerBag),
      image: images[i] ?? null,
    })),
    notes: q.notes.map((n) => n.text),
    signer: q.signer ? { name: q.signer.name, title: COMPANY.signerTitle } : null,
    signature,
    company: COMPANY,
  };
  const buffer = await renderQuotationPdf(data);

  // เปลี่ยนสถานะเฉพาะครั้งแรกที่เจ้าของ export (approved → sent) — ผู้บริหาร export ไม่นับว่า "ส่งลูกค้า"
  const shouldTransition = q.status === "approved" && q.ownerId === user.id;
  await db.transaction(async (tx) => {
    if (shouldTransition) {
      assertTransition(q.status, "sent");
      await quotationQueries.updateQuotationStatus(id, { status: "sent", sentAt: new Date() }, user, tx);
    }
    await quotationQueries.insertAuditLog(
      { quotationId: id, actorId: user.id, action: "exported", detail: shouldTransition ? "สถานะเปลี่ยนเป็น ส่งลูกค้าแล้ว" : "export ซ้ำ" },
      tx,
    );
  });

  return { buffer, filename: `${q.quoteNumber}.pdf`, transitioned: shouldTransition };
}

// ปิดการขาย: เจ้าของ (เซลล์) เท่านั้น · sent → won
export async function closeSale(id: string, user: SessionUser): Promise<void> {
  const q = await quotationQueries.getQuotationById(id, user);
  if (!q) throw new NotFoundError("ไม่พบใบเสนอราคา");
  assertIsOwner(user, q.ownerId);
  assertTransition(q.status, "won");

  await db.transaction(async (tx) => {
    await quotationQueries.updateQuotationStatus(id, { status: "won", wonAt: new Date() }, user, tx);
    await quotationQueries.insertAuditLog({ quotationId: id, actorId: user.id, action: "closed" }, tx);
  });
}
