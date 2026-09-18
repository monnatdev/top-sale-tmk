// พนักงาน login ด้วย "ชื่อผู้ใช้" (เช่น somchai.s) แต่ Supabase Auth ใช้อีเมล
// → แปลงเป็นอีเมลภายในด้วยโดเมนที่ส่งเมลไม่ถึงจริง (ไม่มี flow ส่งเมลในระบบนี้อยู่แล้ว)
export const LOGIN_EMAIL_DOMAIN = "organicpower.internal";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string): string {
  return email.split("@")[0] ?? email;
}
