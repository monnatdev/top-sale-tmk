import { z } from "zod";

// ชื่อผู้ใช้: a-z 0-9 . _ - ยาว 2–32 (แอดมินตั้งให้ เช่น somchai.s)
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,31}$/;

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "กรุณากรอกชื่อผู้ใช้")
    .regex(USERNAME_PATTERN, "ชื่อผู้ใช้ไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export type LoginInput = z.infer<typeof loginSchema>;
