import { describe, expect, it } from "vitest";
import { formatQuoteNumber } from "./quoteNumber";

describe("formatQuoteNumber", () => {
  it("pad 4 หลัก", () => {
    expect(formatQuoteNumber(2569, 1)).toBe("QT-2569-0001");
    expect(formatQuoteNumber(2569, 43)).toBe("QT-2569-0043");
  });
  it("เกิน 9999 ไม่ตัดหลัก", () => {
    expect(formatQuoteNumber(2570, 12345)).toBe("QT-2570-12345");
  });
});
