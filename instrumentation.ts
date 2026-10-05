// Sentry — ตั้งค่าตอน server boot (Next เรียก register() ครั้งเดียวต่อ instance)
// ไม่มี SENTRY_DSN = ข้ามทั้งหมด แอปรันปกติ · ฝั่ง browser ยังไม่เปิดใช้ (ดู docs/DEPLOY.md ข้อ 7)
import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

export function register() {
  if (!env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    // แยก production / preview / development ในหน้า Sentry (VERCEL_ENV มีเฉพาะบน Vercel)
    environment: process.env.VERCEL_ENV ?? env.NODE_ENV,
    // MVP เก็บแค่ error ไม่เก็บ performance trace — โควตาแพลนฟรีพอใช้ยาวๆ
    tracesSampleRate: 0,
    // ไม่ส่ง cookie / IP / ตัวตนผู้ใช้ (ข้อมูลลูกค้าเป็นความลับบริษัท)
    sendDefaultPii: false,
  });
}

// error ที่หลุดออกมาจาก server component / route handler / server action
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  if (err instanceof AppError) return; // คาดไว้ (404/403/409) ไม่ใช่ระบบพัง
  return Sentry.captureRequestError(err, request, context);
};
