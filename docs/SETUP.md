# SETUP — ตั้งค่าเครื่องและ environment

## 1. ต้องมี
- Node ≥ 20.9 (โปรเจกต์นี้ทดสอบกับ 21.7) · npm
- โปรเจกต์ Supabase **2 อัน** region Singapore: `top-sale-dev` และ `top-sale-prod`

## 2. Environment แยก dev / prod

| | dev (เครื่องตัวเอง) | prod (Vercel) |
|---|---|---|
| ไฟล์ | `.env.local` (ไม่ commit) | ตั้งใน Vercel → Project → Settings → Environment Variables |
| Supabase | `top-sale-dev` | `top-sale-prod` |
| migration | `npm run db:migrate` จากเครื่อง โดยชี้ `DIRECT_URL` ไป dev | รันจากเครื่องโดยชี้ `DIRECT_URL` ไป prod (ทำมือ ก่อน deploy) |

**ห้าม**ชี้ `.env.local` ไป prod ตอนพัฒนา

## 3. หาค่า env (Supabase dashboard)
1. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → Project Settings → API
2. `DATABASE_URL` → ปุ่ม **Connect** → Connection String → URI → **Transaction pooler** (port 6543) — copy ทั้งบรรทัด (user = `postgres.<project ref>`)
3. `DIRECT_URL` → ใช้ค่าเดียวกับข้อ 2 (session pooler port 5432 ของโปรเจกต์นี้ต่อไม่ได้ — drizzle-kit รันผ่าน transaction pooler ได้)
4. แทน `[YOUR-PASSWORD]` ด้วยรหัส database — ไม่มีวงเล็บ · ถ้ารหัสมี `@ # % / ?` ต้อง URL-encode หรือ reset เป็นตัวอักษร+ตัวเลขล้วน

```bash
cp .env.example .env.local   # แล้วกรอกค่า
npm install
npm run db:migrate           # สร้างตารางใน top-sale-dev (ครั้งแรก + ทุกครั้งที่มี migration ใหม่)
npm run db:seed              # สินค้าตั้งต้น
SEED_PASSWORD=<รหัส≥8ตัว> npm run db:seed:users   # ผู้ใช้แรก: wirat (ผู้บริหาร), somchai.s (เซลล์)
npm run dev                  # http://localhost:3000
curl localhost:3000/api/health   # ต้องได้ {"ok":true,"db":"connected"}
```

## 4. คำสั่งที่ใช้บ่อย
| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | dev server |
| `npm run typecheck` | ตรวจ TypeScript |
| `npm test` | unit test (ไม่แตะ DB) |
| `npm run test:e2e` | Playwright e2e ต่อ dev server (`tests/e2e/`) — ใช้ผู้ใช้ seed + DB dev · สร้างใบ "(e2e …)" จริงใน DB · ต้องมีลายเซ็นผู้บริหาร · ครั้งแรก `npx playwright install chromium` |
| `npm run test:db` | test ที่ต่อ DB จริง (`*.db.test.ts`) — ใช้ `.env.local` (dev) · สร้างผู้ใช้ชั่วคราว `zztest-*` + ใบ `QT-9999-xxxx` แล้วลบทิ้งเอง · ห้ามชี้ prod |
| `npm run db:generate` | สร้าง migration จาก `lib/db/schema.ts` → `drizzle/` |
| `npm run db:migrate` | รัน migration ไปที่ `DIRECT_URL` |
| `npm run db:seed` | ใส่ข้อมูลตั้งต้น (สินค้า 4 ตัว) — รันซ้ำได้ |
| `npm run storage:setup` | สร้าง bucket private `product-images`, `signatures` (≤2MB png/jpg/webp) — รันซ้ำได้ |
| `SEED_PASSWORD=… npm run db:seed:users` | สร้าง auth user + profile ตั้งต้น (แก้รายชื่อใน `scripts/seed-users.ts`) — มีแล้วข้าม ไม่รีเซ็ตรหัส |
| `npm run db:studio` | เปิด Drizzle Studio ดูข้อมูล |

## 5. Supabase Auth — ปิดสมัครสมาชิก
Authentication → Providers → Email → **ปิด "Allow new users to sign up"** (ระบบไม่มีหน้าสมัคร สร้าง user ผ่าน seed เท่านั้น — ทำในข้อ 3)

## 6. Storage
สร้าง bucket `product-images` และ `signatures` เป็น **Private** ทั้งคู่ (ทำในข้อ 4)

## 5. ผู้ใช้และการล็อกอิน

- ไม่มีหน้าสมัคร/ลืมรหัส — เพิ่มผู้ใช้ด้วย `scripts/seed-users.ts` (แก้ array `USERS` แล้วรันใหม่) หรือ Supabase dashboard → Authentication → Add user แล้วเพิ่มแถว `profiles` ให้ตรง id
- พนักงานล็อกอินด้วย **ชื่อผู้ใช้** (เช่น `somchai.s`) — ระบบแปลงเป็นอีเมลภายใน `<username>@organicpower.internal` ให้เอง (`lib/auth/username.ts`)
- ปิดบัญชี: ตั้ง `profiles.is_active = false` → เตะออกทันทีทุก request (ไม่ต้องลบ auth user)
- เปลี่ยนรหัสผ่าน: Supabase dashboard → Authentication → user → Reset password (MVP ไม่มีหน้าเปลี่ยนรหัสในแอป)

## 6. ลายเซ็นผู้บริหาร + รูปสินค้า (Storage — ทำมือใน MVP)

> รูปสินค้าใน bucket จะปรากฏในคอลัมน์ "ภาพสินค้า" ของ PDF อัตโนมัติ (ตัดเป็น 62×46 pt) — ยังไม่แสดงในหน้าเว็บ

1. `npm run storage:setup` (ครั้งเดียวต่อโปรเจกต์)
2. **ลายเซ็น**: Supabase → Storage → bucket `signatures` → Upload ไฟล์ png พื้นโปร่ง/ขาว (แนะนำกว้าง ~600px) เช่น `wirat.png`
   → Table Editor → `profiles` → แถวผู้บริหาร → `signature_path` = `wirat.png` (path ใน bucket ไม่ใช่ URL)
   → ผู้บริหารเปิด `/settings` ต้องเห็นรูปลายเซ็น · ถ้ายังไม่ตั้ง จะกด "อนุมัติ + เซ็น" ไม่ได้
3. **รูปสินค้า**: bucket `product-images` → upload → `products.image_path` = ชื่อไฟล์ (แสดงใน PDF/ตารางตั้งแต่ข้อ 7)
4. bucket เป็น private ทั้งคู่ — แอปสร้าง signed URL อายุ 10 นาทีฝั่ง server เท่านั้น · ลายเซ็นไม่ถูกส่งไปหน้าเซลล์ (เห็นแค่ชื่อ/วันที่)

ผู้บริหารเปลี่ยนลายเซ็นทีหลัง → ใบที่อนุมัติไปแล้วยังใช้ path เดิมที่ snapshot ไว้ (`quotations.signature_path`) — อย่าลบไฟล์เก่าออกจาก bucket

## 7. ข้อมูลบริษัทบนหัว PDF

แก้ที่ `lib/constants/company.ts` — ชื่อไทย/อังกฤษ, ที่อยู่, โทร, เลขผู้เสียภาษี, ตำแหน่งผู้เซ็น, ย่อหน้าเปิด
**ค่าปัจจุบันเป็นตัวอย่างจากดีไซน์ ต้องแก้ก่อนส่งลูกค้าจริง** · โลโก้ยังเป็นกล่อง placeholder (ดู UI-KIT ข้อ 5)
