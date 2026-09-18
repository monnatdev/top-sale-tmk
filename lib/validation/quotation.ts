import { z } from "zod";
import { QUOTATION_STATUSES } from "@/lib/constants/quotationStatus";

// ข้อความ error ภาษาไทย — ส่งไปหน้าจอตรงๆ
const text = (max: number) => z.string().trim().max(max, `ยาวเกิน ${max} ตัวอักษร`);
const optionalText = (max: number) => text(max).default("");

export const CREDIT_DAYS_MIN = 7;
export const CREDIT_DAYS_MAX = 30;

export const quotationItemSchema = z.object({
  productId: z.uuid("สินค้าไม่ถูกต้อง"),
  pricePerBag: z.coerce
    .number({ error: "กรุณากรอกราคา" })
    .positive("ราคาต้องมากกว่า 0")
    .max(999999, "ราคาสูงเกินไป")
    .multipleOf(0.01, "ราคาใส่ทศนิยมได้ 2 ตำแหน่ง"),
});

// ฟอร์มสร้าง/แก้ใบ (บันทึกร่างได้แม้ยังไม่มีสินค้า — ตอน "ส่งอนุมัติ" service เช็กเพิ่มว่ามี ≥ 1 รายการ)
// แยก fields (ไม่มี refine) ออกมา เพราะ Zod 4 .extend() ทิ้ง refinement — saveDraftSchema ต้อง extend แล้ว refine ซ้ำ
const quotationDraftFields = z
  .object({
    // null = ลูกค้าใหม่ (สร้างแถว customers จากข้อมูลด้านล่าง) · uuid = ลูกค้าเก่า (ข้อมูลด้านล่าง = snapshot ในใบ ไม่แก้ master)
    customerId: z.uuid("ลูกค้าไม่ถูกต้อง").nullable().default(null),
    companyName: text(200).min(1, "กรุณากรอกชื่อบริษัทลูกค้า"),
    addressLine: optionalText(200),
    subDistrict: optionalText(100),
    district: optionalText(100),
    province: optionalText(100),
    postalCode: z
      .string()
      .trim()
      .regex(/^(\d{5})?$/, "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก")
      .default(""),
    phone: optionalText(30),
    taxId: z
      .string()
      .trim()
      .regex(/^(\d{13})?$/, "เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก")
      .default(""),
    paymentType: z.enum(["credit", "cash"], { error: "กรุณาเลือกประเภทการชำระ" }),
    creditDays: z.coerce
      .number({ error: "กรุณาระบุจำนวนวันเครดิต" })
      .int("จำนวนวันต้องเป็นจำนวนเต็ม")
      .min(CREDIT_DAYS_MIN, `เครดิตต้องอยู่ระหว่าง ${CREDIT_DAYS_MIN}–${CREDIT_DAYS_MAX} วัน`)
      .max(CREDIT_DAYS_MAX, `เครดิตต้องอยู่ระหว่าง ${CREDIT_DAYS_MIN}–${CREDIT_DAYS_MAX} วัน`)
      .default(30),
    quoteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ไม่ถูกต้อง"),
    items: z.array(quotationItemSchema).max(50, "สินค้าได้ไม่เกิน 50 รายการ").default([]),
    notes: z.array(text(500).min(1, "หมายเหตุว่าง")).max(20, "หมายเหตุได้ไม่เกิน 20 ข้อ").default([]),
  });

const noDuplicateProducts = (v: { items: { productId: string }[] }, ctx: z.RefinementCtx) => {
  const seen = new Set<string>();
  v.items.forEach((it, i) => {
    if (seen.has(it.productId)) {
      ctx.addIssue({ code: "custom", path: ["items", i, "productId"], message: "สินค้าซ้ำในใบเดียวกัน" });
    }
    seen.add(it.productId);
  });
};

export const quotationDraftSchema = quotationDraftFields.superRefine(noDuplicateProducts);
export type QuotationDraftInput = z.infer<typeof quotationDraftSchema>;
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;

// บันทึกร่าง: ไม่มี id = สร้างใหม่ · มี id = แก้ร่างเดิม (field แบน เพื่อให้ fieldErrors map เข้าฟอร์มตรงชื่อ)
export const saveDraftSchema = quotationDraftFields.extend({ id: z.uuid().optional() }).superRefine(noDuplicateProducts);
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;

export const quotationIdSchema = z.object({ id: z.uuid("ใบเสนอราคาไม่ถูกต้อง") });

// ตีกลับต้องมีเหตุผลเสมอ (เซลล์ต้องรู้ว่าแก้อะไร)
export const rejectQuotationSchema = quotationIdSchema.extend({
  reason: z.string().trim().min(1, "กรุณาระบุเหตุผลที่ตีกลับ").max(500, "เหตุผลยาวเกิน 500 ตัวอักษร"),
});

// กรองหน้ารายการ (ใช้ในข้อ 9 แต่นิยามไว้ที่เดียว)
export const quotationListFilterSchema = z.object({
  status: z.enum(QUOTATION_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
