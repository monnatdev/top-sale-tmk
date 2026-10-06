import { describe, expect, it } from "vitest";
import { z } from "zod";

// ชุดเดียวกับ serverSchema ใน lib/env.ts เฉพาะส่วนที่มีกฎพิเศษ
const sentryDsn = z.preprocess((v) => (v === "" ? undefined : v), z.url().optional());

describe("SENTRY_DSN", () => {
  it("ไม่ตั้งค่า = ผ่าน", () => {
    expect(sentryDsn.parse(undefined)).toBeUndefined();
  });

  // paste ทั้งไฟล์ .env เข้า Vercel จะได้ค่าว่าง — ต้องไม่ทำให้แอป boot ไม่ขึ้น
  it("ค่าว่าง = ถือว่าไม่ตั้ง ไม่ใช่ error", () => {
    expect(sentryDsn.parse("")).toBeUndefined();
  });

  it("URL ถูกต้อง = ผ่าน", () => {
    expect(sentryDsn.parse("https://abc@o1.ingest.sentry.io/1")).toBe("https://abc@o1.ingest.sentry.io/1");
  });

  it("ค่าที่ไม่ใช่ URL = error", () => {
    expect(() => sentryDsn.parse("abc123")).toThrow();
  });
});
