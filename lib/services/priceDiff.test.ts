import { describe, expect, it } from "vitest";
import { describeItemChanges } from "./priceDiff";

const a = { productId: "p1", productName: "ข้าวหอมมะลิ", pricePerBag: 1320 };
const b = { productId: "p2", productName: "ข้าวขาว", pricePerBag: 1145 };

describe("describeItemChanges", () => {
  it("ไม่เปลี่ยน → null", () => {
    expect(describeItemChanges([a, b], [a, b])).toBeNull();
  });
  it("แก้ราคา", () => {
    expect(describeItemChanges([a], [{ ...a, pricePerBag: 1260 }])).toBe("ราคา ข้าวหอมมะลิ: 1,320 → 1,260");
  });
  it("เพิ่ม/ลบรายการ", () => {
    expect(describeItemChanges([a], [a, b])).toBe("เพิ่ม ข้าวขาว 1,145");
    expect(describeItemChanges([a, b], [a])).toBe("ลบ ข้าวขาว");
  });
});
