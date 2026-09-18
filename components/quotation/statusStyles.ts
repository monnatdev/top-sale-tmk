import type { QuotationStatus } from "@/lib/constants/quotationStatus";

// class ต่อสถานะ — ต้องเป็น string เต็ม (Tailwind สแกน class แบบ static, ห้ามต่อ string)
// สีจริงอยู่ที่ token --status-* ใน app/globals.css
export type StatusStyle = {
  /** สีตัวอักษร/ตัวเลข */
  text: string;
  /** พื้น soft สำหรับ pill */
  soft: string;
  /** สีทึบ — จุด/แถบ bar */
  bg: string;
  /** แถบสีขอบซ้าย 4px (การ์ด/แถวตาราง) */
  borderL: string;
  /** แถบสี responsive: ซ้ายบนมือถือ → บนบนเดสก์ท็อป (StatusCountCard) */
  stripe: string;
};

export const STATUS_STYLE: Record<QuotationStatus, StatusStyle> = {
  draft: {
    text: "text-status-draft",
    soft: "bg-status-draft-soft",
    bg: "bg-status-draft",
    borderL: "border-l-status-draft",
    stripe: "border-l-status-draft md:border-l-border md:border-t-status-draft",
  },
  pending_approval: {
    text: "text-status-pending",
    soft: "bg-status-pending-soft",
    bg: "bg-status-pending",
    borderL: "border-l-status-pending",
    stripe: "border-l-status-pending md:border-l-border md:border-t-status-pending",
  },
  approved: {
    text: "text-status-approved",
    soft: "bg-status-approved-soft",
    bg: "bg-status-approved",
    borderL: "border-l-status-approved",
    stripe: "border-l-status-approved md:border-l-border md:border-t-status-approved",
  },
  sent: {
    text: "text-status-sent",
    soft: "bg-status-sent-soft",
    bg: "bg-status-sent",
    borderL: "border-l-status-sent",
    stripe: "border-l-status-sent md:border-l-border md:border-t-status-sent",
  },
  won: {
    text: "text-status-won",
    soft: "bg-status-won-soft",
    bg: "bg-status-won",
    borderL: "border-l-status-won",
    stripe: "border-l-status-won md:border-l-border md:border-t-status-won",
  },
  returned: {
    text: "text-status-returned",
    soft: "bg-status-returned-soft",
    bg: "bg-status-returned",
    borderL: "border-l-status-returned",
    stripe: "border-l-status-returned md:border-l-border md:border-t-status-returned",
  },
};
