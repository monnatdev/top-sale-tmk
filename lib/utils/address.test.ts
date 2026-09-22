import { describe, expect, it } from "vitest";
import { formatThaiAddress, normalizeAddressParts } from "./address";

describe("formatThaiAddress", () => {
  it("ต่างจังหวัดใช้ ต./อ./จ.", () => {
    expect(
      formatThaiAddress({ addressLine: "45 หมู่ 2", subDistrict: "สำโรงเหนือ", district: "เมืองสมุทรปราการ", province: "สมุทรปราการ", postalCode: "10270" }),
    ).toBe("45 หมู่ 2 ต.สำโรงเหนือ อ.เมืองสมุทรปราการ จ.สมุทรปราการ 10270");
  });
  it("กรุงเทพฯ ใช้ แขวง/เขต และไม่ใส่ จ.", () => {
    expect(
      formatThaiAddress({ addressLine: "99/1 ถนนสุขุมวิท", subDistrict: "คลองเตย", district: "คลองเตย", province: "กรุงเทพมหานคร", postalCode: "10110" }),
    ).toBe("99/1 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110");
  });
  it("ข้ามช่องว่าง ไม่เหลือคำนำหน้าลอย", () => {
    expect(formatThaiAddress({ addressLine: "", subDistrict: "", district: "", province: "", postalCode: "" })).toBe("");
    expect(formatThaiAddress({ addressLine: "12 ถนนเพชรเกษม", subDistrict: "", district: "", province: "ราชบุรี", postalCode: "" })).toBe("12 ถนนเพชรเกษม จ.ราชบุรี");
  });
});

describe("normalizeAddressParts", () => {
  it("ตัดคำนำหน้า + ช่องว่างส่วนเกิน + nbsp", () => {
    expect(
      normalizeAddressParts({ addressLine: " 45  หมู่ที่2 ", subDistrict: " ตำบลสำโรงเหนือ ", district: "อ.เมืองสมุทรปราการ", province: "จังหวัดสมุทรปราการ", postalCode: "10270\u00a0" }),
    ).toEqual({ addressLine: "45 หมู่ที่2", subDistrict: "สำโรงเหนือ", district: "เมืองสมุทรปราการ", province: "สมุทรปราการ", postalCode: "10270" });
  });
  it("แขวง/เขต + กรุงเทพฯ → ชื่อเต็ม", () => {
    expect(
      normalizeAddressParts({ addressLine: "506 ซอยลาดพร้าว", subDistrict: "แขวงคลองจั่น", district: " เขตบางกะปิ ", province: "กรุงเทพฯ", postalCode: "10240" }),
    ).toEqual({ addressLine: "506 ซอยลาดพร้าว", subDistrict: "คลองจั่น", district: "บางกะปิ", province: "กรุงเทพมหานคร", postalCode: "10240" });
  });
});
