# DEPLOY — ขึ้น production + ส่งมอบให้ลูกค้า

> คู่มือนี้ใช้ตอนขึ้นใช้งานจริงครั้งแรก (BRIEF ข้อ 12) · การตั้งเครื่อง dev อยู่ที่ `docs/SETUP.md`
> ทำตามลำดับ ข้อ 1 → 9 · ข้อ 1–2 ลูกค้าต้องทำเอง (เป็นคนจ่ายเงิน/เจ้าของบัญชี) ที่เหลือผู้พัฒนาทำให้ได้

---

## 0. ก่อนเริ่ม — ต้องมีของพวกนี้ครบ

- [ ] **ข้อมูลบริษัทจริง** สำหรับหัว PDF: ชื่อไทย/อังกฤษ, ที่อยู่, เบอร์โทร, เลขผู้เสียภาษี, ตำแหน่งผู้เซ็น
- [ ] **รายชื่อผู้ใช้จริง**: ชื่อ-สกุล + username + role (เซลล์/ผู้บริหาร) ของทุกคน
- [ ] **ไฟล์ลายเซ็นผู้บริหาร** (มีแล้ว: `data/import/signature-peerawit.png`)
- [ ] **ไฟล์ master data + รูปสินค้า** ที่ `data/import/` (มีแล้ว)
- [ ] โค้ดล่าสุด **commit + push ขึ้น GitHub แล้ว** — Vercel deploy จากสิ่งที่อยู่บน GitHub เท่านั้น

## 1. บัญชีที่ลูกค้าต้องสมัคร

**ผูกบัตรเครดิต**

| บริการ | ใช้ทำอะไร | แพลน | ค่าใช้จ่าย (≈ ก.ย. 2026) |
|---|---|---|---|
| **Vercel** | รันเว็บแอป | **Pro** | ~$20/เดือน ต่อที่นั่ง |
| **Supabase** | Postgres + Auth + Storage | **Pro** (เฉพาะ prod) | ~$25/เดือน |
| **Cloudflare** | จดโดเมน + DNS | Registrar (DNS ฟรี) | ~$10–12/**ปี** (.com) |

- **Vercel Pro** — แพลน Hobby ฟรีแต่เงื่อนไขห้ามใช้เชิงพาณิชย์ ระบบของบริษัทเข้าข่าย · Pro คิดเงิน**ต่อที่นั่ง** เชิญคนเข้าทีมเท่าที่จำเป็น
- **Supabase Pro** — เหตุผลหลักคือ **backup รายวัน + ย้อนเวลา 7 วัน** (แพลนฟรีไม่มี backup อัตโนมัติเลย) · รองลงมาคือโปรเจกต์ฟรีจะถูก pause เมื่อไม่มีทราฟฟิก 7 วัน · โปรเจกต์ **dev ใช้ฟรีต่อได้** จ่ายเฉพาะ prod
- **Cloudflare** — ขายราคาต้นทุน ราคาต่ออายุไม่ขึ้น · `.co.th` ทั้ง Cloudflare และ Vercel ไม่มีขาย ต้องจดกับผู้ให้บริการที่ THNIC รับรอง (ใช้เอกสารบริษัท) แล้วชี้ DNS มาเหมือนกัน

**สมัครอย่างเดียว ไม่ต้องผูกบัตร**

| บริการ | ใช้ทำอะไร |
|---|---|
| **GitHub** | เก็บซอร์สโค้ด + ให้ Vercel ดึงไป deploy (private repo ฟรี) |
| **Sentry** | แจ้งเตือน error ในระบบ (แพลนฟรี 5k events/เดือน พอ) |

**ไม่ต้องสมัคร** — ระบบไม่ส่งอีเมลเลย (ล็อกอินด้วยชื่อผู้ใช้ แปลงเป็นอีเมลภายใน `.internal`) จึงไม่ต้องใช้ Resend/SendGrid/Google Workspace · จะใช้อีเมล `ชื่อ@โดเมน` เป็นเรื่องแยกของบริษัท

**กฎตอนสมัคร**
1. ใช้ **อีเมลกลางของบริษัท** (เช่น `it@`, `admin@`) ทุกบัญชี — ห้ามใช้อีเมลส่วนตัวพนักงาน พนักงานลาออกแล้วจะเข้าระบบไม่ได้
2. เปิด **2FA** ทุกบัญชี + เก็บ recovery code ไว้ที่ปลอดภัย
3. เชิญผู้พัฒนาเป็น **member** ไม่ใช่บอกรหัสผ่าน
4. บัตรเครดิตบริษัทใบเดียวผูกได้ทุกเจ้า

---

## 2. โอนของที่อยู่กับผู้พัฒนา

- [ ] **GitHub repo** → Settings → Transfer ownership ไปบัญชี/org ของลูกค้า (หรือ fork แล้วชี้ Vercel ใหม่)
- [ ] ถ้ามีโปรเจกต์ Vercel/Supabase ที่ผู้พัฒนาสร้างไว้ก่อน → โอนเข้า org ของลูกค้า หรือสร้างใหม่ในบัญชีลูกค้าแล้วทิ้งของเดิม (แนะนำแบบหลัง ง่ายกว่า)

---

## 3. Supabase production

- [ ] สร้างโปรเจกต์ **region Singapore** ชื่อ `top-sale-prod` → อัปเกรดเป็น Pro
- [ ] Authentication → Providers → Email → **ปิด "Allow new users to sign up"**
- [ ] เก็บค่า env 5 ตัว (วิธีหาอยู่ใน SETUP ข้อ 3) — `DATABASE_URL`/`DIRECT_URL` ใช้ **transaction pooler (6543)**
- [ ] จดรหัส database ไว้ที่ปลอดภัย (ใช้ตอนรัน migration/backup)

## 4. Vercel

- [ ] New Project → import repo จาก GitHub → framework Next.js (ค่า default ถูกอยู่แล้ว)
- [ ] ตั้ง Environment Variables (scope **Production**) ให้ครบ 5 ตัว — ขาดตัวใดตัวหนึ่งแอปจะพังตอน boot พร้อมบอกชื่อตัวแปร (`lib/env.ts`)

| ตัวแปร | ค่า | หมายเหตุ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | จาก Supabase prod | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | จาก Supabase prod | |
| `SUPABASE_SERVICE_ROLE_KEY` | จาก Supabase prod | **ห้าม**ขึ้นต้นด้วย `NEXT_PUBLIC_` · ห้ามใส่ใน repo |
| `DATABASE_URL` | transaction pooler 6543 | |
| `DIRECT_URL` | ค่าเดียวกับ `DATABASE_URL` | `lib/env.ts` บังคับให้มี |
| `SENTRY_DSN` | จาก Sentry (ข้อ 7) | ไม่บังคับ — ไม่ใส่ = ไม่มีแจ้งเตือน error |

- [ ] Deploy → ต้องขึ้นเขียว · `vercel.json` ตั้ง region `sin1` ไว้แล้ว (ให้ใกล้ Supabase สิงคโปร์)
- [ ] เปิด `https://<project>.vercel.app/api/health` ต้องได้ `{"ok":true,"db":"connected"}`

## 5. เตรียมข้อมูลใน production

รันจาก**เครื่องผู้พัฒนา** ทุกคำสั่ง — ไม่มีการรัน migration/seed อัตโนมัติตอน deploy (ตั้งใจ: จะได้ไม่มีใครเผลอรันทับข้อมูลจริง)

**สร้างไฟล์ env ของ prod แยกไว้ 1 ไฟล์** (ห้ามแก้ `.env.local` ที่ชี้ dev — เผลอรัน seed/test ทับข้อมูลจริงได้)

```bash
cp .env.example .env.prod.local    # แล้วกรอกค่าของ Supabase prod (อยู่ใน .gitignore แล้ว)
```

ทุกคำสั่งด้านล่างต้องนำหน้าด้วย `ENV_FILE=.env.prod.local` · สคริปต์จะพิมพ์ปลายทางให้ดูทุกครั้ง เช่น
`env: .env.prod.local → postgres.<project ref>@aws-0-ap-southeast-1.pooler.supabase.com:6543`
**อ่านบรรทัดนี้ก่อนตอบ y ทุกครั้ง** ว่า project ref ตรงกับ prod จริง

- [ ] `ENV_FILE=.env.prod.local npm run db:migrate` — สร้างตารางทั้งหมด
- [ ] `ENV_FILE=.env.prod.local npm run storage:setup` — สร้าง bucket `product-images`, `signatures` (private)
- [ ] แก้รายชื่อใน `scripts/seed-users.ts` ให้เป็นคนจริง (username/ชื่อ/role) แล้ว
      `ENV_FILE=.env.prod.local SEED_PASSWORD=<รหัสชั่วคราว> npm run db:seed:users` — จากนั้นแจ้งให้แต่ละคนเปลี่ยนรหัสผ่านผ่าน Supabase dashboard
- [ ] `ENV_FILE=.env.prod.local npm run db:import -- --dry-run` → อ่าน ⚠ ให้ครบ แล้วค่อย `ENV_FILE=.env.prod.local npm run db:import`
      · **ห้ามรัน `npm run db:seed`** บน prod (เป็นสินค้าตัวอย่างจากดีไซน์)
- [ ] อัปโหลดลายเซ็นผู้บริหาร + ตั้ง `profiles.signature_path` (SETUP ข้อ 6) — ไม่มีลายเซ็นจะกดอนุมัติไม่ได้
- [ ] ตรวจ `lib/constants/company.ts` เป็นข้อมูลบริษัทจริง (ชื่อ/ที่อยู่/โทร/เลขผู้เสียภาษี/ตำแหน่งผู้เซ็น) — ต้อง commit + deploy ใหม่หลังแก้

## 6. โดเมน

- [ ] จดโดเมนที่ Cloudflare (หรือผู้ให้บริการ `.co.th`)
- [ ] Vercel → Project → Settings → Domains → Add แล้วทำตาม record ที่หน้านั้นบอก (เพิ่มที่ Cloudflare DNS)
- [ ] **ตั้ง record เป็น "DNS only" (เมฆสีเทา)** ไม่ต้อง proxy ผ่าน Cloudflare — ไม่งั้น SSL/cache ซ้อน 2 ชั้น ดีบักยาก
- [ ] ตั้ง `www` → redirect ไปโดเมนหลัก (Vercel ทำให้ในหน้า Domains)
- [ ] รอ SSL ขึ้น (ปกติไม่กี่นาที) แล้วเปิดด้วย `https://` ตรวจว่าไม่มีคำเตือน

## 7. Sentry

ต่อไว้ในโค้ดแล้ว (`instrumentation.ts` + `lib/observability.ts`) — **ไม่ตั้ง `SENTRY_DSN` ก็รันได้ปกติ** แค่ไม่มีแจ้งเตือน

- [ ] สร้างโปรเจกต์ Next.js ใน Sentry → Client Keys → copy DSN
- [ ] ใส่เป็น env `SENTRY_DSN` ใน Vercel (scope Production) แล้ว redeploy
- [ ] ตั้งอีเมลรับแจ้งเตือนเป็นอีเมลกลางของบริษัท
- [ ] (ถ้าต้องการ stack trace ที่อ่านรู้เรื่อง) เพิ่ม `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` เพื่ออัปโหลด source map ตอน build — ไม่ใส่ก็ยังได้รายงาน แค่ trace เป็นโค้ดที่ถูกย่อ
- [ ] ทดสอบ: ทำให้เกิด error จริงสักครั้ง (เช่น ใส่ `DATABASE_URL` ผิดชั่วคราวใน preview) แล้วดูว่าเข้า Sentry

**ส่งอะไรไป Sentry บ้าง**
- ส่ง: error ที่ไม่คาด (DB ล่ม, gen PDF พัง, bug) · เตือน: โหลดรูป/ลายเซ็นจาก Storage ไม่ได้
- **ไม่ส่ง**: `AppError` ที่คาดไว้ (ไม่พบข้อมูล / ไม่มีสิทธิ์ / กรอกข้อมูลไม่ครบ) — ไม่ใช่ระบบพัง ถ้าส่งจะกลบ error จริง
- ปิด `sendDefaultPii` ไว้ → ไม่ส่ง cookie / IP / ตัวตนผู้ใช้ · ไม่เก็บ performance trace (ประหยัดโควตาแพลนฟรี)
- ยังไม่เปิดฝั่ง browser (เก็บเฉพาะ error ฝั่ง server) เพื่อไม่ให้ JS ที่เซลล์ต้องโหลดบนมือถือใหญ่ขึ้น — เปิดทีหลังได้ถ้าอยากได้ error หน้าจอด้วย

## 8. Backup

**ถ้าใช้ Supabase Pro** (แนะนำ)
- [ ] Database → Backups → ตรวจว่ามี daily backup ขึ้นแล้ว
- [ ] **ทดสอบกู้จริง 1 ครั้ง** ก่อนส่งมอบ: restore ลงโปรเจกต์ใหม่/dev แล้วเช็กว่าใบเสนอราคา + ผู้ใช้ + รูป กลับมาครบ — backup ที่ไม่เคยทดสอบกู้ = ไม่มี backup
- [ ] รู้ไว้: Storage (รูปสินค้า/ลายเซ็น) **ไม่รวม**อยู่ใน backup ของ DB — ต้องสำรองแยก (โหลด bucket เก็บไว้เป็นระยะ)

**ถ้าใช้แพลนฟรี** — ต้องมีคนรัน `pg_dump` เองตามรอบ + เก็บไฟล์ไว้นอก Supabase และยังต้องทดสอบ restore เหมือนกัน

## 9. ตรวจก่อนส่งมอบ (บนโดเมนจริง)

- [ ] ล็อกอินเซลล์ → สร้างใบ → ส่งอนุมัติ
- [ ] ล็อกอินผู้บริหาร → เห็นใบของทุกคน → อนุมัติ + เซ็น
- [ ] เซลล์ export PDF → เปิดดู: โลโก้/ที่อยู่บริษัท/รูปสินค้า/ลายเซ็น ครบ สถานะเปลี่ยนเป็น "ส่งลูกค้าแล้ว"
- [ ] ปิดการขาย
- [ ] **ทดสอบบนมือถือจริงของเซลล์** (ไม่ใช่แค่ย่อจอบนคอม) — ปุ่ม/ช่องกรอกกดง่าย รูปขึ้น
- [ ] เซลล์ A เปิด URL ใบของเซลล์ B ตรงๆ ต้องไม่เห็น (404)
- [ ] `npm audit` ไม่มี high/critical
- [ ] ส่งมอบ: บัญชีทั้งหมดอยู่ในชื่อบริษัท · เอกสาร `docs/` ครบ · แจ้งค่าใช้จ่ายรายเดือนที่ลูกค้าต้องจ่าย

---

## ข้อห้าม

- ห้าม commit `.env*` (มีใน `.gitignore` แล้ว) · ห้ามใส่ `SUPABASE_SERVICE_ROLE_KEY` ในตัวแปรที่ขึ้นต้น `NEXT_PUBLIC_`
- ห้ามชี้ `.env.local` ของเครื่อง dev ไป prod แล้วรัน test — `npm run test:db` และ e2e **สร้าง/ลบข้อมูลจริง**
- ห้ามรัน `npm run db:seed` บน prod
- ห้ามลบไฟล์ลายเซ็นเก่าออกจาก bucket (ใบที่อนุมัติแล้ว snapshot path ไว้)
