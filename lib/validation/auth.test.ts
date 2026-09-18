import { describe, expect, it } from "vitest";
import { z } from "zod";
import { loginSchema } from "./auth";

describe("loginSchema", () => {
  it("normalize ชื่อผู้ใช้: trim + lowercase", () => {
    const r = loginSchema.parse({ username: "  Somchai.S ", password: "x" });
    expect(r.username).toBe("somchai.s");
  });

  it("reject ช่องว่าง / อักขระแปลก / ว่าง พร้อมข้อความไทย", () => {
    const r = loginSchema.safeParse({ username: "som chai", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const fe = z.flattenError(r.error).fieldErrors;
      expect(fe.username?.[0]).toBe("ชื่อผู้ใช้ไม่ถูกต้อง");
      expect(fe.password?.[0]).toBe("กรุณากรอกรหัสผ่าน");
    }
  });

  it("reject input ที่ไม่ใช่ object/string", () => {
    expect(loginSchema.safeParse({ username: 123, password: null }).success).toBe(false);
  });
});
