import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";
import { AppError, ValidationError, type FieldErrors } from "@/lib/errors";
import { type ActionResult, fail, ok } from "./actionResult";

// ทำ 5 ขั้นตอนมาตรฐานของ Server Action ให้: parse → zod → session → handler → map error
export function action<S extends z.ZodTypeAny, T>(schema: S, handler: (input: z.infer<S>, user: SessionUser) => Promise<T>) {
  return async (raw: unknown): Promise<ActionResult<T>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return fail("กรุณาตรวจสอบข้อมูลที่กรอก", z.flattenError(parsed.error).fieldErrors as FieldErrors);
    }
    const user = await requireUser();
    try {
      return ok(await handler(parsed.data, user));
    } catch (e) {
      return toActionError(e);
    }
  };
}

// แบบไม่ต้องล็อกอิน (login เท่านั้น) — handler ไม่ได้ user
export function publicAction<S extends z.ZodTypeAny, T>(schema: S, handler: (input: z.infer<S>) => Promise<T>) {
  return async (raw: unknown): Promise<ActionResult<T>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return fail("กรุณาตรวจสอบข้อมูลที่กรอก", z.flattenError(parsed.error).fieldErrors as FieldErrors);
    }
    try {
      return ok(await handler(parsed.data));
    } catch (e) {
      return toActionError(e);
    }
  };
}

export function toActionError(e: unknown): ActionResult<never> {
  if (e instanceof AppError) {
    return fail(e.message, e instanceof ValidationError ? e.fieldErrors : undefined);
  }
  console.error("[action] unexpected", e); // ฝั่ง server เท่านั้น · Sentry ตอนข้อ 12
  return fail("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
}
