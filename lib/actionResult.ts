import type { FieldErrors } from "./errors";

// รูปแบบผลลัพธ์ของ Server Action ทุกตัว — ไม่ throw ไป client
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

export const fail = (message: string, fieldErrors?: FieldErrors): ActionResult<never> => ({
  ok: false,
  message,
  fieldErrors,
});
