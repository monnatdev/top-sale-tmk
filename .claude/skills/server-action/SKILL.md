---
name: server-action
description: template ของ Server Action และ Route Handler ที่บางตามกฎ (parse → Zod → auth → service → ActionResult) + error class มาตรฐาน + วิธีต่อกับฟอร์มฝั่ง client — ใช้เมื่อสร้าง/แก้ action, API route, error handling หรือฟอร์ม mutation
---

# Server Action / Route Handler — pattern

> Endpoint ต้อง**บาง**: parse → validate → auth → เรียก service → return
> ถ้าเห็น `if (status === ...)` หรือ `db.` ใน action แปลว่าผิดชั้น ย้ายไป service/query

---

## 1. Error classes (`lib/errors.ts`)

```ts
export class AppError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class NotFoundError extends AppError {
  constructor(message = "ไม่พบข้อมูล") { super(message, 404, "NOT_FOUND"); }
}
export class ForbiddenError extends AppError {
  constructor(message = "คุณไม่มีสิทธิ์ทำรายการนี้") { super(message, 403, "FORBIDDEN"); }
}
export class ValidationError extends AppError {
  constructor(message = "ข้อมูลไม่ถูกต้อง", readonly fieldErrors?: FieldErrors) { super(message, 400, "VALIDATION"); }
}
export class InvalidTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`ไม่สามารถเปลี่ยนสถานะจาก ${STATUS_LABEL[from]} เป็น ${STATUS_LABEL[to]} ได้`, 409, "INVALID_TRANSITION");
  }
}

export type FieldErrors = Record<string, string[]>;
```

- Service throw **เฉพาะ class เหล่านี้** สำหรับ error ที่คาดไว้ · error อื่น = bug/ระบบพัง ปล่อยให้หลุดขึ้นมาให้ action จัดการ
- ข้อความเป็นภาษาไทยที่ผู้ใช้อ่านได้ทันที (จะถูกส่งไปหน้าจอตรงๆ)

---

## 2. ActionResult (`lib/actionResult.ts`)

```ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (message: string, fieldErrors?: FieldErrors): ActionResult<never> =>
  ({ ok: false, message, fieldErrors });
```

---

## 3. Wrapper กลาง — เขียนครั้งเดียวใช้ทุก action (`lib/actionWrapper.ts`)

```ts
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { type ActionResult, ok, fail } from "./actionResult";
import type { SessionUser } from "@/lib/auth/types";

// ทำ 5 ขั้นตอนมาตรฐานให้: parse → zod → session → handler → map error
export function action<S extends z.ZodTypeAny, T>(
  schema: S,
  handler: (input: z.infer<S>, user: SessionUser) => Promise<T>,
) {
  return async (raw: unknown): Promise<ActionResult<T>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return fail("กรุณาตรวจสอบข้อมูลที่กรอก", z.flattenError(parsed.error).fieldErrors as FieldErrors); // zod 4: ใช้ z.flattenError ไม่ใช่ .flatten()
    }
    const user = await requireUser();
    try {
      return ok(await handler(parsed.data, user));
    } catch (e) {
      return toActionError(e);
    }
  };
}

export function toActionError(e: unknown): ActionResult<never> {
  if (e instanceof AppError) {
    return fail(e.message, e instanceof ValidationError ? e.fieldErrors : undefined);
  }
  console.error("[action] unexpected", e);          // ฝั่ง server เท่านั้น · Sentry.captureException(e) ตอนข้อ 12
  return fail("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"); // ไม่หลุดรายละเอียดไป client
}
```

---

## 4. Server Action — template

```ts
// app/(app)/quotations/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { action } from "@/lib/actionWrapper";
import { submitForApprovalSchema, createQuotationSchema } from "@/lib/validation/quotation";
import * as quotationService from "@/lib/services/quotationService";

export const createQuotation = action(createQuotationSchema, async (input, user) => {
  const q = await quotationService.createQuotation(input, user);
  revalidatePath("/quotations");
  return { id: q.id };
});

export const submitForApproval = action(submitForApprovalSchema, async ({ id }, user) => {
  await quotationService.submitForApproval(id, user);
  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
});
```

กฎ:
- ไฟล์ `actions.ts` อยู่ข้างหน้าที่ใช้ (`app/(app)/<feature>/actions.ts`) · `"use server"` บรรทัดแรก
- **input เป็น `unknown` เสมอ** — client ส่งอะไรมาก็ได้ ห้ามเชื่อ type จาก client
- `id` ของ resource มาจาก input ที่ผ่าน Zod (`z.string().uuid()`) ไม่ใช่ closure
- action ไม่รับ `user` จาก client — ได้จาก `requireUser()` ใน wrapper เท่านั้น
- `revalidatePath` หลัง mutation สำเร็จ · `redirect()` ถ้าต้องย้ายหน้า (เรียก**นอก** try/catch เพราะ redirect ทำงานด้วยการ throw)
- ต้องการ FormData? แปลงเป็น object ก่อนส่งเข้า `action()`: `Object.fromEntries(formData)` แล้วให้ Zod `coerce` ตัวเลข

---

## 5. Route Handler — ใช้เมื่อต้อง stream/ไฟล์ (เช่น PDF)

```ts
// app/api/quotations/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { exportQuotationPdf } from "@/lib/services/quotationService";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) return NextResponse.json({ message: "รหัสไม่ถูกต้อง" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  try {
    const { buffer, filename } = await exportQuotationPdf(parsed.data.id, user);   // service เปลี่ยนสถานะ → sent + audit ด้วย
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (e) {
    return toHttpError(e);
  }
}

// lib/httpError.ts
export function toHttpError(e: unknown) {
  if (e instanceof AppError) return NextResponse.json({ message: e.message, code: e.code }, { status: e.status });
  console.error("[route] unexpected", e);
  return NextResponse.json({ message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
}
```

- Route handler ใช้เมื่อ: download ไฟล์, webhook, health check — **mutation ของฟอร์มใช้ Server Action**
- `params` เป็น Promise ต้อง `await` · ใช้ type `RouteContext<'/api/quotations/[id]/pdf'>` (global, gen จาก `next typegen`)

---

## 6. ฝั่ง client — เรียก action จากฟอร์ม

```tsx
"use client";
import { useActionState } from "react";
import { createQuotation } from "./actions";

const initial: ActionResult<{ id: string }> | null = null;

export function QuotationForm() {
  const [result, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => createQuotation(Object.fromEntries(formData)),
    initial,
  );

  return (
    <form action={formAction}>
      <Input name="customerName" aria-invalid={!!result?.ok === false && !!result.fieldErrors?.customerName} />
      {!result?.ok && result?.fieldErrors?.customerName && <FieldError>{result.fieldErrors.customerName[0]}</FieldError>}
      {result && !result.ok && !result.fieldErrors && <Alert variant="destructive">{result.message}</Alert>}
      <Button type="submit" disabled={pending} className="sticky bottom-0 h-11 md:static">
        {pending ? "กำลังบันทึก..." : "บันทึกร่าง"}
      </Button>
    </form>
  );
}
```

- ปุ่มกดครั้งเดียว: `disabled={pending}` เสมอ (กันกดซ้ำบนมือถือ)
- ปุ่ม action เดี่ยว (อนุมัติ/ตีกลับ/ปิดการขาย) ใช้ `useTransition` + `toast` แทนฟอร์มเต็ม
- error ระดับ field ขึ้นใต้ช่อง · error ระดับ action ขึ้น Alert/toast — ไม่ `alert()`

---

## 7. Zod schema (`lib/validation/<domain>.ts`)

```ts
export const quotationItemSchema = z.object({
  productId: z.string().uuid(),
  pricePerBag: z.coerce.number().positive("ราคาต้องมากกว่า 0").max(1_000_000),
});
export const createQuotationSchema = z.object({
  customer: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("existing"), customerId: z.string().uuid() }),
    z.object({ mode: z.literal("new"), companyName: z.string().trim().min(1, "กรุณากรอกชื่อบริษัท"), ... }),
  ]),
  items: z.array(quotationItemSchema).min(1, "ต้องมีสินค้าอย่างน้อย 1 รายการ"),
  notes: z.array(z.string().trim().max(500)).default([]),
});
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
```

- schema เดียวใช้ทั้ง client (react-hook-form resolver ถ้าใช้) และ server — แต่ **server ต้อง validate เองเสมอ** ไม่เชื่อ client
- ข้อความ error ภาษาไทยใน schema เลย · `z.coerce` สำหรับค่าจาก FormData · `.trim()` ทุก string

---

## 8. Checklist

- [ ] action ไม่มี `db.` / เงื่อนไข business — เรียก service เท่านั้น
- [ ] input type `unknown` + Zod ทุกตัว รวม `id`
- [ ] ผ่าน `action()` wrapper (หรือ route มี auth + `toHttpError`)
- [ ] ไม่มี `throw` หลุดไป client · ไม่มี stack trace ใน response
- [ ] `revalidatePath` หลัง mutation · ปุ่ม `disabled={pending}`
