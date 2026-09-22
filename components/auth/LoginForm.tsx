"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/FormField";
import type { ActionResult } from "@/lib/actionResult";

type LoginFormProps = {
  /** server action แบบ useActionState: (prevState, formData) → ActionResult */
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  /** ขนาดปุ่มแบบมือถือ (52px) */
  mobile?: boolean;
};

// ฟอร์ม login — ไม่มีสมัคร ไม่มีลืมรหัสผ่าน (แอดมินสร้างบัญชีให้)
export function LoginForm({ action, mobile }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [showPassword, setShowPassword] = useState(false);
  // controlled เพราะ React รีเซ็ต uncontrolled input หลัง action จบ — รหัสผิดแล้วชื่อผู้ใช้ต้องไม่หาย
  const [username, setUsername] = useState("");
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const formError = state && !state.ok && !state.fieldErrors ? state.message : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField label="ชื่อผู้ใช้" htmlFor="username" error={fieldErrors?.username?.[0]}>
        <Input
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          aria-invalid={Boolean(fieldErrors?.username) || undefined}
        />
      </FormField>
      <FormField label="รหัสผ่าน" htmlFor="password" error={fieldErrors?.password?.[0]}>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-14"
            aria-invalid={Boolean(fieldErrors?.password) || undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-2xs text-primary-hover hover:underline"
          >
            {showPassword ? "ซ่อน" : "แสดง"}
          </button>
        </div>
      </FormField>
      {formError ? (
        <p role="alert" className="rounded-md bg-status-returned-soft px-3.5 py-2.5 text-body text-destructive">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size={mobile ? "lg" : "default"} className="mt-1 w-full" loading={pending}>
        {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </Button>
    </form>
  );
}
