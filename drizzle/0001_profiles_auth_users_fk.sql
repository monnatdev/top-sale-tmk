-- Custom migration (drizzle-kit ไม่รู้จัก schema auth ของ Supabase)
-- profiles.id ต้องเป็น auth.users.id เสมอ · ลบ auth user → ลบ profile ตาม
-- ห้ามใส่ auth.users ใน lib/db/schema.ts (drizzle จะพยายาม CREATE TABLE ให้)
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_id_auth_users_id_fk"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
