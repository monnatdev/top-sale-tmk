import { describe, expect, it } from "vitest";
import { formatPrice, formatThaiDate, formatThaiDateTime, formatWeight, getThaiYear, todayDateString } from "./format";

describe("format", () => {
  it("formatThaiDate: string → dd/mm/พ.ศ.", () => {
    expect(formatThaiDate("2026-07-20")).toBe("20/07/2569");
    expect(formatThaiDate(null)).toBe("—");
  });
  it("formatThaiDate: Date ใช้เวลาไทย (UTC 17:30 = วันถัดไปในไทย)", () => {
    expect(formatThaiDate(new Date("2026-07-20T17:30:00Z"))).toBe("21/07/2569");
  });
  it("formatThaiDateTime", () => {
    expect(formatThaiDateTime(new Date("2026-07-20T02:12:00Z"))).toBe("20/07/2569 09:12");
  });
  it("getThaiYear ตามเวลาไทย (31 ธ.ค. 17:00 UTC = 1 ม.ค. ไทย)", () => {
    expect(getThaiYear(new Date("2026-06-01T00:00:00Z"))).toBe(2569);
    expect(getThaiYear(new Date("2026-12-31T17:30:00Z"))).toBe(2570);
  });
  it("todayDateString", () => {
    expect(todayDateString(new Date("2026-12-31T17:30:00Z"))).toBe("2027-01-01");
  });
  it("formatPrice / formatWeight", () => {
    expect(formatPrice(1260)).toBe("1,260");
    expect(formatPrice("1260.50")).toBe("1,260.50");
    expect(formatPrice(Number.NaN)).toBe("—");
    expect(formatWeight(45)).toBe("45");
    expect(formatWeight(45.5)).toBe("45.5");
  });
});
