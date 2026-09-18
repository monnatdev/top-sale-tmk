// state machine ของสถานะใบเสนอราคา (BRIEF ข้อ 6 / CLAUDE.md ข้อ 8) — pure, ทุก transition ผ่านที่นี่
import { QUOTATION_STATUSES, STATUS_LABEL, type QuotationStatus } from "@/lib/constants/quotationStatus";
import { InvalidTransitionError } from "@/lib/errors";

export const TRANSITIONS: Record<QuotationStatus, readonly QuotationStatus[]> = {
  draft: ["pending_approval"],
  returned: ["pending_approval"],
  pending_approval: ["approved", "returned"],
  approved: ["sent"],
  sent: ["won"],
  won: [],
};

// แก้เนื้อหาได้เฉพาะ 2 สถานะนี้ (approved ขึ้นไปล็อก)
export const EDITABLE_STATUSES: readonly QuotationStatus[] = ["draft", "returned"];

export function canTransition(from: QuotationStatus, to: QuotationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: QuotationStatus, to: QuotationStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(`ไม่สามารถเปลี่ยนสถานะจาก "${STATUS_LABEL[from]}" เป็น "${STATUS_LABEL[to]}" ได้`);
  }
}

export function isEditable(status: QuotationStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

export function assertEditable(status: QuotationStatus): void {
  if (!isEditable(status)) {
    throw new InvalidTransitionError(`ใบเสนอราคาสถานะ "${STATUS_LABEL[status]}" แก้ไขไม่ได้`);
  }
}

// ให้เทสยืนยันว่าทุกสถานะอยู่ในตาราง
export const ALL_STATUSES = QUOTATION_STATUSES;
