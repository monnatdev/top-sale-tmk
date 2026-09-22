import { describe, expect, it } from "vitest";
import { formatPriceInput, sanitizePrice } from "./PriceInput";

describe("sanitizePrice", () => {
  it("เอาเฉพาะตัวเลข/จุด · จุดเดียว · ทศนิยม ≤ 2", () => {
    expect(sanitizePrice("1,260")).toBe("1260");
    expect(sanitizePrice("12a60.5")).toBe("1260.5");
    expect(sanitizePrice("1.2.3")).toBe("1.23");
    expect(sanitizePrice("1260.")).toBe("1260.");
    expect(sanitizePrice("0.999")).toBe("0.99");
    expect(sanitizePrice("")).toBe("");
  });
});

describe("formatPriceInput", () => {
  it("คั่นหลักพันด้วย comma คงทศนิยมที่กำลังพิมพ์", () => {
    expect(formatPriceInput("1260")).toBe("1,260");
    expect(formatPriceInput("1234567.5")).toBe("1,234,567.5");
    expect(formatPriceInput("1260.")).toBe("1,260.");
    expect(formatPriceInput("999")).toBe("999");
    expect(formatPriceInput("")).toBe("");
  });
});
