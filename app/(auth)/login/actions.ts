"use server";

import { redirect } from "next/navigation";
import { publicAction } from "@/lib/actionWrapper";
import { getProfileById } from "@/lib/db/queries/profiles";
import { AppError } from "@/lib/errors";
import { usernameToEmail } from "@/lib/auth/username";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";
import type { ActionResult } from "@/lib/actionResult";

class LoginError extends AppError {
  constructor(message: string) {
    super(message, 401, "LOGIN_FAILED");
  }
}

const signIn = publicAction(loginSchema, async ({ username, password }) => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
  if (error || !data.user) throw new LoginError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");

  // มี auth user แต่ profile ถูกปิด → ออกทันที ไม่ให้ค้าง session
  const profile = await getProfileById(data.user.id);
  if (!profile || !profile.isActive) {
    await supabase.auth.signOut();
    throw new LoginError("บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแล");
  }
});

// ใช้กับ useActionState ใน LoginForm — redirect ต้องอยู่นอก try/catch ของ wrapper
export async function login(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const result = await signIn(Object.fromEntries(formData));
  if (!result.ok) return result;
  redirect("/quotations");
}
