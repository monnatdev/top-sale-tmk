// สถานะใบเสนอราคา — ที่เดียวสำหรับ key (ตรง DB) + ป้ายภาษาไทย + ลำดับแสดงผล
// สีของแต่ละสถานะอยู่ที่ components/quotation/statusStyles.ts (ผูกกับ token ใน globals.css)

export const QUOTATION_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "sent",
  "won",
  "returned",
] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const STATUS_LABEL: Record<QuotationStatus, string> = {
  draft: "ร่าง",
  pending_approval: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  sent: "ส่งลูกค้าแล้ว",
  won: "ปิดการขาย",
  returned: "ตีกลับแก้ไข",
};

// ลำดับตาม flow ปกติ (ใช้ใน StatusProgress) — returned เป็นทางแยก ไม่อยู่ในเส้นหลัก
export const STATUS_FLOW: readonly QuotationStatus[] = [
  "draft",
  "pending_approval",
  "approved",
  "sent",
  "won",
];

export function isQuotationStatus(value: string): value is QuotationStatus {
  return (QUOTATION_STATUSES as readonly string[]).includes(value);
}

// ป้ายภาษาไทยของ audit_log.action (แสดงใน Timeline)
export const AUDIT_ACTION_LABEL = {
  created: "สร้างใบเสนอราคา",
  edited: "แก้ไขใบเสนอราคา",
  submitted: "ส่งให้ผู้บริหารอนุมัติ",
  approved: "อนุมัติและเซ็นลายเซ็น",
  returned: "ตีกลับแก้ไข",
  exported: "Export PDF",
  closed: "ปิดการขาย",
} as const;
