// type กลางเรื่องผู้ใช้/บทบาท — pure (ไม่ import next/* หรือ drizzle) ใช้ได้ทั้ง schema, service, component
export const ROLES = ["sale", "executive"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  sale: "เซลล์",
  executive: "ผู้บริหาร",
};

// ผู้ใช้ที่ล็อกอินอยู่ — service รับเป็น parameter เสมอ (ไม่ดึง session เอง)
export interface SessionUser {
  id: string; // = auth.users.id = profiles.id
  name: string;
  role: Role;
}
