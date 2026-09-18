import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  // transaction ปลอม: เรียก callback ด้วย tx sentinel — ให้ assert ได้ว่าทุก write อยู่ใน transaction เดียวกัน
  db: { transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(TX)) },
}));
vi.mock("@/lib/db/queries/quotations");
vi.mock("@/lib/db/queries/customers");
vi.mock("@/lib/db/queries/products");

import * as quotationQueries from "@/lib/db/queries/quotations";
import * as customerQueries from "@/lib/db/queries/customers";
import * as productQueries from "@/lib/db/queries/products";
import { ForbiddenError, InvalidTransitionError, NotFoundError, ValidationError } from "@/lib/errors";
import { makeExecutive, makeProduct, makeQuotation, makeUser } from "@/tests/factories";
import type { QuotationDraftInput } from "@/lib/validation/quotation";
import { createDraft, submitForApproval, updateDraft } from "./quotationService";

const TX = { __tx: true };
const q = vi.mocked(quotationQueries);
const c = vi.mocked(customerQueries);
const p = vi.mocked(productQueries);

const saleA = makeUser({ id: "00000000-0000-4000-8000-00000000000a", name: "เซลล์ A" });
const saleB = makeUser({ id: "00000000-0000-4000-8000-00000000000b", name: "เซลล์ B" });
const exec = makeExecutive({ id: "00000000-0000-4000-8000-0000000000ec" });
const product = makeProduct({ id: "00000000-0000-4000-8000-0000000000p1", name: "ข้าวหอมมะลิ", weightPerBag: 45 });

const input: QuotationDraftInput = {
  customerId: null,
  companyName: "หจก. ข้าวทอง",
  addressLine: "",
  subDistrict: "",
  district: "",
  province: "",
  postalCode: "",
  phone: "",
  taxId: "",
  paymentType: "credit",
  creditDays: 30,
  quoteDate: "2026-07-20",
  items: [{ productId: product.id, pricePerBag: 1260 }],
  notes: ["ยืนราคา 30 วัน"],
};

type Detail = NonNullable<Awaited<ReturnType<typeof quotationQueries.getQuotationById>>>;
const detailOf = (overrides: Partial<Detail> = {}): Detail =>
  ({
    ...makeQuotation({ ownerId: saleA.id }),
    items: [],
    notes: [],
    owner: { id: saleA.id, name: saleA.name },
    signer: null,
    auditLog: [],
    ...overrides,
  }) as Detail;

beforeEach(() => {
  vi.clearAllMocks();
  p.getProductsByIds.mockResolvedValue([{ ...product, isActive: true }]);
  c.insertCustomer.mockResolvedValue({ id: "00000000-0000-4000-8000-0000000000c1" });
  c.getCustomerById.mockResolvedValue({ id: "00000000-0000-4000-8000-0000000000c1", companyName: "หจก. ข้าวทอง" });
  q.nextQuoteSequence.mockResolvedValue(7);
  q.insertQuotation.mockResolvedValue({ id: "00000000-0000-4000-8000-0000000000q1", quoteNumber: "QT-2569-0007" });
  q.updateQuotation.mockResolvedValue(1);
  q.updateQuotationStatus.mockResolvedValue(1);
});

describe("createDraft", () => {
  it("sale creates draft: running number + snapshot product + audit 'created' in same tx", async () => {
    const r = await createDraft(input, saleA);

    expect(r.quoteNumber).toBe("QT-2569-0007");
    expect(q.nextQuoteSequence).toHaveBeenCalledWith(expect.any(Number), TX);
    const inserted = q.insertQuotation.mock.calls[0]![0];
    expect(inserted.ownerId).toBe(saleA.id);
    expect(inserted.status).toBe("draft");
    expect(inserted.quoteNumber).toMatch(/^QT-\d{4}-0007$/);
    expect(inserted.customerName).toBe("หจก. ข้าวทอง");

    // snapshot มาจาก master ไม่ใช่ client
    const items = q.replaceItems.mock.calls[0]![1];
    expect(items[0]).toMatchObject({ productId: product.id, productName: "ข้าวหอมมะลิ", weightPerBag: 45, pricePerBag: 1260 });

    expect(q.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "created", actorId: saleA.id }), TX);
    // ทุก write ใช้ tx เดียวกัน
    for (const call of [...q.insertQuotation.mock.calls, ...q.replaceItems.mock.calls, ...q.replaceNotes.mock.calls]) {
      expect(call.at(-1)).toBe(TX);
    }
  });

  it("customerId = null → creates customer with created_by = user", async () => {
    await createDraft(input, saleA);
    expect(c.insertCustomer).toHaveBeenCalledWith(expect.objectContaining({ companyName: "หจก. ข้าวทอง", createdBy: saleA.id }), TX);
  });

  it("customerId given → reuses it and does not create", async () => {
    await createDraft({ ...input, customerId: "00000000-0000-4000-8000-0000000000c1" }, saleA);
    expect(c.insertCustomer).not.toHaveBeenCalled();
    expect(q.insertQuotation.mock.calls[0]![0].customerId).toBe("00000000-0000-4000-8000-0000000000c1");
  });

  it("customerId not found → NotFound", async () => {
    c.getCustomerById.mockResolvedValue(undefined);
    await expect(createDraft({ ...input, customerId: "00000000-0000-4000-8000-0000000000c9" }, saleA)).rejects.toThrow(NotFoundError);
  });

  it("executive cannot create → Forbidden, nothing written", async () => {
    await expect(createDraft(input, exec)).rejects.toThrow(ForbiddenError);
    expect(q.insertQuotation).not.toHaveBeenCalled();
  });

  it("unknown/inactive product → ValidationError before tx", async () => {
    p.getProductsByIds.mockResolvedValue([]);
    await expect(createDraft(input, saleA)).rejects.toThrow(ValidationError);
    expect(q.insertQuotation).not.toHaveBeenCalled();
  });

  it("cash → creditDays stored as 0", async () => {
    await createDraft({ ...input, paymentType: "cash" }, saleA);
    expect(q.insertQuotation.mock.calls[0]![0].creditDays).toBe(0);
  });
});

describe("updateDraft — authorization", () => {
  it("sale A cannot update sale B's quotation → NotFound (query scoped returns undefined)", async () => {
    q.getQuotationById.mockResolvedValue(undefined);
    await expect(updateDraft("x", input, saleA)).rejects.toThrow(NotFoundError);
    expect(q.updateQuotation).not.toHaveBeenCalled();
  });

  it("executive can read but cannot edit → Forbidden", async () => {
    q.getQuotationById.mockResolvedValue(detailOf({ ownerId: saleB.id }));
    await expect(updateDraft("x", input, exec)).rejects.toThrow(ForbiddenError);
  });

  it.each(["pending_approval", "approved", "sent", "won"] as const)("owner cannot edit when status=%s", async (status) => {
    q.getQuotationById.mockResolvedValue(detailOf({ status }));
    await expect(updateDraft("x", input, saleA)).rejects.toThrow(InvalidTransitionError);
    expect(q.updateQuotation).not.toHaveBeenCalled();
  });

  it("owner edits returned draft: audit 'edited' with price diff", async () => {
    q.getQuotationById.mockResolvedValue(
      detailOf({
        status: "returned",
        items: [{ productId: product.id, productName: "ข้าวหอมมะลิ", pricePerBag: 1320 } as Detail["items"][number]],
      }),
    );
    await updateDraft("x", input, saleA);
    expect(q.updateQuotation).toHaveBeenCalledWith("x", expect.objectContaining({ customerName: "หจก. ข้าวทอง" }), saleA, TX);
    expect(q.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "edited", detail: "ราคา ข้าวหอมมะลิ: 1,320 → 1,260" }),
      TX,
    );
  });

  it("same customerId as before → does not re-resolve customer", async () => {
    const cid = "00000000-0000-4000-8000-0000000000c1";
    q.getQuotationById.mockResolvedValue(detailOf({ customerId: cid }));
    await updateDraft("x", { ...input, customerId: cid }, saleA);
    expect(c.getCustomerById).not.toHaveBeenCalled();
    expect(c.insertCustomer).not.toHaveBeenCalled();
  });
});

describe("submitForApproval", () => {
  const withItems = (status: Detail["status"]) =>
    detailOf({ status, items: [{ productId: product.id, productName: "x", pricePerBag: 1 } as Detail["items"][number]] });

  it.each(["draft", "returned"] as const)("owner submits from %s → pending_approval + audit", async (status) => {
    q.getQuotationById.mockResolvedValue(withItems(status));
    await submitForApproval("x", saleA);
    expect(q.updateQuotationStatus).toHaveBeenCalledWith("x", { status: "pending_approval", returnReason: null }, saleA, TX);
    expect(q.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "submitted" }), TX);
  });

  it.each(["pending_approval", "approved", "sent", "won"] as const)("cannot submit from %s", async (status) => {
    q.getQuotationById.mockResolvedValue(withItems(status));
    await expect(submitForApproval("x", saleA)).rejects.toThrow(InvalidTransitionError);
    expect(q.updateQuotationStatus).not.toHaveBeenCalled();
  });

  it("no items → ValidationError", async () => {
    q.getQuotationById.mockResolvedValue(detailOf({ status: "draft", items: [] }));
    await expect(submitForApproval("x", saleA)).rejects.toThrow(ValidationError);
  });

  it("sale A cannot submit sale B's → NotFound", async () => {
    q.getQuotationById.mockResolvedValue(undefined);
    await expect(submitForApproval("x", saleA)).rejects.toThrow(NotFoundError);
  });

  it("executive cannot submit on behalf → Forbidden", async () => {
    q.getQuotationById.mockResolvedValue(withItems("draft"));
    await expect(submitForApproval("x", exec)).rejects.toThrow(ForbiddenError);
  });
});

// ---------- วงจรอนุมัติ ----------
vi.mock("@/lib/db/queries/profiles");
import * as profileQueries from "@/lib/db/queries/profiles";
import { approve, reject } from "./quotationService";
const pr = vi.mocked(profileQueries);

describe("approve", () => {
  beforeEach(() => pr.getProfileSignaturePath.mockResolvedValue("wirat.png"));

  it("executive approves pending: status approved + signature snapshot + audit in same tx", async () => {
    q.getQuotationById.mockResolvedValue(detailOf({ status: "pending_approval", ownerId: saleA.id }));
    await approve("x", exec);
    expect(q.updateQuotationStatus).toHaveBeenCalledWith(
      "x",
      expect.objectContaining({ status: "approved", signedBy: exec.id, signaturePath: "wirat.png", signedAt: expect.any(Date), returnReason: null }),
      exec,
      TX,
    );
    expect(q.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "approved", actorId: exec.id }), TX);
  });

  it("sale cannot approve (even own) → Forbidden, nothing read", async () => {
    await expect(approve("x", saleA)).rejects.toThrow(ForbiddenError);
    expect(q.getQuotationById).not.toHaveBeenCalled();
  });

  it.each(["draft", "returned", "approved", "sent", "won"] as const)("cannot approve from %s", async (status) => {
    q.getQuotationById.mockResolvedValue(detailOf({ status }));
    await expect(approve("x", exec)).rejects.toThrow(InvalidTransitionError);
    expect(q.updateQuotationStatus).not.toHaveBeenCalled();
  });

  it("executive without signature → ValidationError, no status change", async () => {
    pr.getProfileSignaturePath.mockResolvedValue(null);
    q.getQuotationById.mockResolvedValue(detailOf({ status: "pending_approval" }));
    await expect(approve("x", exec)).rejects.toThrow(ValidationError);
    expect(q.updateQuotationStatus).not.toHaveBeenCalled();
  });

  it("unknown id → NotFound", async () => {
    q.getQuotationById.mockResolvedValue(undefined);
    await expect(approve("x", exec)).rejects.toThrow(NotFoundError);
  });
});

describe("reject", () => {
  it("executive returns pending with reason: status returned + reason stored + audit detail", async () => {
    q.getQuotationById.mockResolvedValue(detailOf({ status: "pending_approval" }));
    await reject("x", "ราคาข้อ 1 สูงไป", exec);
    expect(q.updateQuotationStatus).toHaveBeenCalledWith("x", { status: "returned", returnReason: "ราคาข้อ 1 สูงไป" }, exec, TX);
    expect(q.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "returned", detail: "ราคาข้อ 1 สูงไป" }), TX);
  });

  it("sale cannot reject → Forbidden", async () => {
    await expect(reject("x", "r", saleA)).rejects.toThrow(ForbiddenError);
  });

  it.each(["draft", "returned", "approved", "sent", "won"] as const)("cannot reject from %s", async (status) => {
    q.getQuotationById.mockResolvedValue(detailOf({ status }));
    await expect(reject("x", "r", exec)).rejects.toThrow(InvalidTransitionError);
  });
});

// ---------- Export PDF + ปิดการขาย ----------
vi.mock("@/lib/pdf/quotationPdf", () => ({ renderQuotationPdf: vi.fn(async () => Buffer.from("%PDF-fake")) }));
vi.mock("@/lib/storage/download", () => ({ downloadImage: vi.fn(async () => null) }));
import { renderQuotationPdf } from "@/lib/pdf/quotationPdf";
import { closeSale, exportPdf } from "./quotationService";

describe("exportPdf", () => {
  const withItems = (status: Detail["status"], ownerId = saleA.id) =>
    detailOf({ status, ownerId, quoteNumber: "QT-2569-0007", signer: { id: exec.id, name: exec.name }, signaturePath: "wirat.png", items: [{ productId: product.id, productName: "ข้าวขาว", packagingSpec: "", weightPerBag: 48, pricePerBag: 1145, imagePath: null } as Detail["items"][number]] });

  it("owner exports approved → PDF + status sent + audit exported (same tx)", async () => {
    q.getQuotationById.mockResolvedValue(withItems("approved"));
    const r = await exportPdf("x", saleA);
    expect(r.filename).toBe("QT-2569-0007.pdf");
    expect(r.transitioned).toBe(true);
    expect(r.buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(q.updateQuotationStatus).toHaveBeenCalledWith("x", expect.objectContaining({ status: "sent", sentAt: expect.any(Date) }), saleA, TX);
    expect(q.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "exported", detail: "สถานะเปลี่ยนเป็น ส่งลูกค้าแล้ว" }), TX);
    // ข้อมูลที่ส่งเข้า template มาจาก snapshot + format แล้ว
    const data = vi.mocked(renderQuotationPdf).mock.calls[0]![0];
    expect(data.items[0]).toMatchObject({ name: "ข้าวขาว", weightKg: "48", price: "1,145" });
    expect(data.signer?.name).toBe(exec.name);
  });

  it.each(["sent", "won"] as const)("owner re-exports from %s → no transition, audit 'export ซ้ำ'", async (status) => {
    q.getQuotationById.mockResolvedValue(withItems(status));
    const r = await exportPdf("x", saleA);
    expect(r.transitioned).toBe(false);
    expect(q.updateQuotationStatus).not.toHaveBeenCalled();
    expect(q.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "exported", detail: "export ซ้ำ" }), TX);
  });

  it("executive exports approved → PDF but NO transition (ไม่นับว่าส่งลูกค้า)", async () => {
    q.getQuotationById.mockResolvedValue(withItems("approved"));
    const r = await exportPdf("x", exec);
    expect(r.transitioned).toBe(false);
    expect(q.updateQuotationStatus).not.toHaveBeenCalled();
  });

  it.each(["draft", "pending_approval", "returned"] as const)("cannot export from %s", async (status) => {
    q.getQuotationById.mockResolvedValue(withItems(status));
    await expect(exportPdf("x", saleA)).rejects.toThrow(ValidationError);
    expect(renderQuotationPdf).not.toHaveBeenCalled();
  });

  it("sale A cannot export sale B's (scoped → NotFound)", async () => {
    q.getQuotationById.mockResolvedValue(undefined);
    await expect(exportPdf("x", saleA)).rejects.toThrow(NotFoundError);
  });
});

describe("closeSale", () => {
  it("owner closes sent → won + audit", async () => {
    q.getQuotationById.mockResolvedValue(detailOf({ status: "sent" }));
    await closeSale("x", saleA);
    expect(q.updateQuotationStatus).toHaveBeenCalledWith("x", expect.objectContaining({ status: "won", wonAt: expect.any(Date) }), saleA, TX);
    expect(q.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "closed" }), TX);
  });

  it("executive cannot close on behalf → Forbidden", async () => {
    q.getQuotationById.mockResolvedValue(detailOf({ status: "sent" }));
    await expect(closeSale("x", exec)).rejects.toThrow(ForbiddenError);
  });

  it.each(["draft", "pending_approval", "returned", "approved", "won"] as const)("cannot close from %s", async (status) => {
    q.getQuotationById.mockResolvedValue(detailOf({ status }));
    await expect(closeSale("x", saleA)).rejects.toThrow(InvalidTransitionError);
  });
});
