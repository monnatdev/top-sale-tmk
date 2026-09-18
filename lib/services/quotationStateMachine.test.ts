import { describe, expect, it } from "vitest";
import { InvalidTransitionError } from "@/lib/errors";
import type { QuotationStatus } from "@/lib/constants/quotationStatus";
import { ALL_STATUSES, TRANSITIONS, assertEditable, assertTransition, canTransition, isEditable } from "./quotationStateMachine";

const cases: Array<[from: QuotationStatus, to: QuotationStatus, ok: boolean]> = [
  ["draft", "pending_approval", true],
  ["returned", "pending_approval", true],
  ["pending_approval", "approved", true],
  ["pending_approval", "returned", true],
  ["approved", "sent", true],
  ["sent", "won", true],
  // ต้องไม่ผ่าน
  ["draft", "approved", false],
  ["draft", "sent", false],
  ["approved", "pending_approval", false],
  ["approved", "returned", false],
  ["sent", "approved", false],
  ["won", "sent", false],
  ["won", "won", false],
  ["pending_approval", "pending_approval", false],
];

describe("quotation state machine", () => {
  it.each(cases)("%s → %s ok=%s", (from, to, ok) => {
    expect(canTransition(from, to)).toBe(ok);
    if (ok) expect(() => assertTransition(from, to)).not.toThrow();
    else expect(() => assertTransition(from, to)).toThrow(InvalidTransitionError);
  });

  it("ทุกสถานะอยู่ในตาราง TRANSITIONS", () => {
    for (const s of ALL_STATUSES) expect(TRANSITIONS[s]).toBeDefined();
  });

  it("แก้ได้เฉพาะ draft/returned", () => {
    expect(isEditable("draft")).toBe(true);
    expect(isEditable("returned")).toBe(true);
    for (const s of ["pending_approval", "approved", "sent", "won"] as const) {
      expect(isEditable(s)).toBe(false);
      expect(() => assertEditable(s)).toThrow(InvalidTransitionError);
    }
  });

  it("ข้อความ error เป็นภาษาไทยมีชื่อสถานะ", () => {
    expect(() => assertTransition("approved", "pending_approval")).toThrow('จาก "อนุมัติแล้ว" เป็น "รออนุมัติ"');
  });
});
