import { describe, expect, it } from "vitest";
import { z } from "zod";
import { quotationDraftSchema, quotationItemSchema, saveDraftSchema } from "./quotation";

const P1 = "00000000-0000-4000-8000-000000000001";
const P2 = "00000000-0000-4000-8000-000000000002";

const valid = {
  customerId: null,
  companyName: "บจก. ทาโกฟู้ดส์อินดัสทรี",
  addressLine: "99/12 ม.4",
  subDistrict: "บางปลา",
  district: "บางพลี",
  province: "สมุทรปราการ",
  postalCode: "10540",
  phone: "023154477",
  taxId: "0105548012345",
  paymentType: "credit",
  creditDays: 30,
  quoteDate: "2026-07-20",
  items: [{ productId: P1, pricePerBag: 1260 }],
  notes: ["ยืนราคา 30 วัน"],
};

const errorsOf = (r: z.ZodSafeParseResult<unknown>): Record<string, string[] | undefined> =>
  r.success ? {} : (z.flattenError(r.error).fieldErrors as Record<string, string[] | undefined>);

describe("quotationDraftSchema", () => {
  it("input ถูกต้องผ่าน", () => {
    const r = quotationDraftSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("ร่างว่างๆ ผ่านได้ถ้ามีชื่อบริษัท (items/notes default [])", () => {
    const r = quotationDraftSchema.parse({ companyName: "หจก. ข้าวทอง", paymentType: "cash", quoteDate: "2026-07-20" });
    expect(r.items).toEqual([]);
    expect(r.notes).toEqual([]);
    expect(r.customerId).toBeNull();
    expect(r.creditDays).toBe(30);
  });

  it("ชื่อบริษัทว่าง → reject ข้อความไทย", () => {
    const fe = errorsOf(quotationDraftSchema.safeParse({ ...valid, companyName: "  " }));
    expect(fe.companyName?.[0]).toBe("กรุณากรอกชื่อบริษัทลูกค้า");
  });

  it("รหัสไปรษณีย์ / เลขภาษี ต้องเป็นตัวเลขตามหลัก (ว่างได้)", () => {
    expect(quotationDraftSchema.safeParse({ ...valid, postalCode: "1054" }).success).toBe(false);
    expect(quotationDraftSchema.safeParse({ ...valid, taxId: "abc" }).success).toBe(false);
    expect(quotationDraftSchema.safeParse({ ...valid, phone: "02-315-4477" }).success).toBe(false);
    expect(quotationDraftSchema.safeParse({ ...valid, phone: "0812345678" }).success).toBe(true);
    expect(quotationDraftSchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
    expect(quotationDraftSchema.safeParse({ ...valid, postalCode: "", taxId: "" }).success).toBe(true);
  });

  it("เครดิตนอกช่วง 7–30 → reject", () => {
    expect(quotationDraftSchema.safeParse({ ...valid, creditDays: 6 }).success).toBe(false);
    expect(quotationDraftSchema.safeParse({ ...valid, creditDays: 31 }).success).toBe(false);
    expect(quotationDraftSchema.safeParse({ ...valid, creditDays: 7.5 }).success).toBe(false);
  });

  it("วันที่ต้องเป็น YYYY-MM-DD", () => {
    expect(quotationDraftSchema.safeParse({ ...valid, quoteDate: "20/07/2569" }).success).toBe(false);
  });

  it("สินค้าซ้ำ → reject", () => {
    const r = quotationDraftSchema.safeParse({ ...valid, items: [{ productId: P1, pricePerBag: 1 }, { productId: P1, pricePerBag: 2 }] });
    expect(r.success).toBe(false);
  });

  it("สินค้าต่างกันผ่าน", () => {
    const r = quotationDraftSchema.safeParse({ ...valid, items: [{ productId: P1, pricePerBag: 1 }, { productId: P2, pricePerBag: 2 }] });
    expect(r.success).toBe(true);
  });

  it("customerId ต้องเป็น uuid หรือ null", () => {
    expect(quotationDraftSchema.safeParse({ ...valid, customerId: "abc" }).success).toBe(false);
    expect(quotationDraftSchema.safeParse({ ...valid, customerId: P2 }).success).toBe(true);
  });
});

describe("quotationItemSchema", () => {
  it("ราคา 0 / ติดลบ / ทศนิยม 3 ตำแหน่ง → reject", () => {
    expect(quotationItemSchema.safeParse({ productId: P1, pricePerBag: 0 }).success).toBe(false);
    expect(quotationItemSchema.safeParse({ productId: P1, pricePerBag: -1 }).success).toBe(false);
    expect(quotationItemSchema.safeParse({ productId: P1, pricePerBag: 1.234 }).success).toBe(false);
  });
  it("ราคาเป็น string ตัวเลข coerce ได้", () => {
    const r = quotationItemSchema.parse({ productId: P1, pricePerBag: "1260.50" });
    expect(r.pricePerBag).toBe(1260.5);
  });
});

describe("saveDraftSchema", () => {
  it("id optional", () => {
    expect(saveDraftSchema.safeParse(valid).success).toBe(true);
    expect(saveDraftSchema.safeParse({ ...valid, id: P1 }).success).toBe(true);
    expect(saveDraftSchema.safeParse({ ...valid, id: "x" }).success).toBe(false);
  });
  it("ยังกันสินค้าซ้ำหลัง extend", () => {
    const r = saveDraftSchema.safeParse({ ...valid, items: [{ productId: P1, pricePerBag: 1 }, { productId: P1, pricePerBag: 2 }] });
    expect(r.success).toBe(false);
  });
});
