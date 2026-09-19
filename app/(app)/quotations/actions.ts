"use server";

import { revalidatePath } from "next/cache";
import { action } from "@/lib/actionWrapper";
import * as quotationService from "@/lib/services/quotationService";
import { customerSearchSchema, quotationIdSchema, rejectQuotationSchema, saveDraftSchema } from "@/lib/validation/quotation";
import { searchCustomers as searchCustomersQuery } from "@/lib/db/queries/customers";

// บันทึกร่าง — ไม่มี id = สร้างใหม่ · มี id = แก้ร่างเดิม (client redirect เองด้วย id ที่คืน)
export const saveDraft = action(saveDraftSchema, async ({ id, ...draft }, user) => {
  const result = id ? await quotationService.updateDraft(id, draft, user) : await quotationService.createDraft(draft, user);
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${result.id}`);
  return { id: result.id };
});

export const submitQuotation = action(quotationIdSchema, async ({ id }, user) => {
  await quotationService.submitForApproval(id, user);
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
});

export const approveQuotation = action(quotationIdSchema, async ({ id }, user) => {
  await quotationService.approve(id, user);
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
});

export const rejectQuotation = action(rejectQuotationSchema, async ({ id, reason }, user) => {
  await quotationService.reject(id, reason, user);
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
});

export const closeSale = action(quotationIdSchema, async ({ id }, user) => {
  await quotationService.closeSale(id, user);
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
});

// ค้นหาลูกค้าเก่าใน sheet (read-only, ลูกค้าแชร์ทั้งบริษัท — ไม่ต้อง scope) · เรียกตอนเปิด sheet + พิมพ์ค้น
export const searchCustomers = action(customerSearchSchema, async ({ q }) => searchCustomersQuery(q));
