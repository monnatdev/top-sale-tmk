import "server-only";
import * as Sentry from "@sentry/nextjs";
import { AppError } from "./errors";

// รายงาน error ฝั่ง server ที่เดียว — log เสมอ + ส่งไป Sentry เฉพาะที่ "ไม่คาด"
// error ที่คาดไว้ (AppError: ไม่พบ/ไม่มีสิทธิ์/ข้อมูลไม่ถูกต้อง) ไม่ใช่ระบบพัง ไม่ต้องปลุกใคร
// ถ้าไม่ได้ตั้ง SENTRY_DSN ฟังก์ชันของ Sentry จะไม่ทำอะไร (no-op) — ไม่ต้องเช็กเอง
export function reportError(where: string, e: unknown, extra?: Record<string, unknown>) {
  console.error(`[${where}]`, e);
  if (e instanceof AppError) return;
  Sentry.captureException(e, { tags: { where }, extra });
}

// เหตุการณ์ที่ระบบยังทำงานต่อได้ แต่ผิดปกติและควรรู้ (เช่น โหลดรูปจาก Storage ไม่ได้ → PDF ออกโดยไม่มีรูป)
export function reportWarning(where: string, message: string, extra?: Record<string, unknown>) {
  console.error(`[${where}] ${message}`, extra ?? "");
  Sentry.captureMessage(`[${where}] ${message}`, { level: "warning", tags: { where }, extra });
}
