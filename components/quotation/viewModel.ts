// แปลง QuotationDetail (จาก query) → props ของ component แสดงผล — pure, ไม่มี business logic
import { AUDIT_ACTION_LABEL } from "@/lib/constants/quotationStatus";
import type { QuotationDetail } from "@/lib/db/queries/quotations";
import { formatThaiDate, formatThaiDateTime } from "@/lib/utils/format";
import type { QuotationDraftInput } from "@/lib/validation/quotation";
import type { CustomerSummaryData } from "./CustomerSummary";
import type { LedgerItem } from "./LedgerRow";
import type { TimelineEntry } from "./Timeline";

export function toLedgerItems(items: QuotationDetail["items"]): LedgerItem[] {
  return items.map((it) => ({
    id: it.id,
    name: it.productName,
    spec: it.packagingSpec,
    weightKg: it.weightPerBag,
    price: it.pricePerBag,
    imageUrl: null, // signed URL ของรูปมาในข้อ 7 (PDF)
  }));
}

export function toCustomerSummary(q: QuotationDetail): CustomerSummaryData {
  return {
    name: q.customerName,
    addressLine: q.customerAddressLine,
    subDistrict: q.customerSubDistrict,
    district: q.customerDistrict,
    province: q.customerProvince,
    postalCode: q.customerPostalCode,
    phone: q.customerPhone ?? undefined,
    taxId: q.customerTaxId ?? undefined,
    paymentType: q.paymentType,
    creditDays: q.creditDays,
    quoteDate: formatThaiDate(q.quoteDate),
  };
}

export function toTimeline(log: QuotationDetail["auditLog"]): TimelineEntry[] {
  return log.map((e) => ({
    id: e.id,
    who: e.actor.name,
    what: e.detail ? `${AUDIT_ACTION_LABEL[e.action]}: ${e.detail}` : AUDIT_ACTION_LABEL[e.action],
    when: formatThaiDateTime(e.createdAt),
  }));
}

export function toFormInitial(q: QuotationDetail): QuotationDraftInput {
  return {
    customerId: q.customerId,
    companyName: q.customerName,
    addressLine: q.customerAddressLine,
    subDistrict: q.customerSubDistrict,
    district: q.customerDistrict,
    province: q.customerProvince,
    postalCode: q.customerPostalCode,
    phone: q.customerPhone ?? "",
    taxId: q.customerTaxId ?? "",
    paymentType: q.paymentType,
    creditDays: q.paymentType === "credit" ? q.creditDays : 30,
    quoteDate: q.quoteDate,
    items: q.items.flatMap((it) => (it.productId ? [{ productId: it.productId, pricePerBag: it.pricePerBag }] : [])),
    notes: q.notes.map((n) => n.text),
  };
}
