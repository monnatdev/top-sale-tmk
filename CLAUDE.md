# CLAUDE.md — คู่มือการเขียนโค้ดของโปรเจกต์ (ระบบใบเสนอราคา ข้าวตราแม่ครัว)

@AGENTS.md

> ไฟล์นี้คือ "กฎการเขียนโค้ด" ที่ต้องยึดทุกครั้งที่ generate/แก้โค้ดในโปรเจกต์นี้
> คู่กับ `docs/BRIEF.md` (อธิบายว่า *ระบบทำอะไร*) — ไฟล์นี้อธิบายว่า *เขียนโค้ดยังไง*
> ถ้ากฎในไฟล์นี้ขัดกับสิ่งที่ผู้ใช้สั่งเฉพาะกิจ ให้ถามยืนยันก่อน อย่าเงียบๆ ทำผิดกฎ

---

## 1. Stack (ห้ามเปลี่ยนโดยไม่ถาม)

- **Next.js 16 (App Router) + TypeScript** — fullstack, strict mode เปิด · **Next 16 มี breaking change** (เช่น `middleware.ts` → `proxy.ts`, `params` เป็น Promise) — อ่าน `node_modules/next/dist/docs/` ก่อนเขียนของที่ไม่แน่ใจ (ดู AGENTS.md)
- **Drizzle ORM** — data layer ทั้งหมด (ไม่ใช้ Prisma, ไม่เรียก Supabase client ดิบเพื่อ query business data)
- **Supabase** — Postgres (ผ่าน Drizzle) + Auth + Storage (รูปสินค้า/ลายเซ็น)
- **Tailwind CSS + shadcn/ui** — styling ทั้งหมด (ไม่เขียน CSS file แยกนอกจากจำเป็น)
- **Zod** — validate ทุก input ที่เข้ามาฝั่ง server
- **Deploy:** Vercel (แอป) + Supabase (data) · region สิงคโปร์

---

## 2. โครงโฟลเดอร์ (ยึดตามนี้เสมอ)

```
/app
  /(auth)/login            หน้า login
  /(app)/...               หน้าหลังล็อกอิน (quotations, customers, dashboard, settings)
  /api/...                 API routes — บางๆ: parse → auth → เรียก service → ตอบ
/lib
  /db
    schema.ts              Drizzle schema (ตารางทั้งหมด)
    index.ts               db client (Drizzle + connection)
    queries/               query functions แยกตามโดเมน (quotations.ts, customers.ts, products.ts)
  /services                business logic ทั้งหมด (createQuotation, approveQuotation, ...)
  /auth                    session + role guards
  /pdf                     generate PDF
  /validation              Zod schemas
  /utils                   helper ทั่วไป
/components
  /ui                      shadcn components
  /...                     component ของแอป (จาก Claude Design)
  /supabase                supabase client (server.ts = สิทธิ์ user · admin.ts = service_role)
  env.ts                   env ผ่าน Zod — import จากที่นี่ ไม่อ่าน process.env ตรง
  errors.ts                AppError + subclass
  actionResult.ts          ActionResult<T>
/tests                     setup, factories, stub
/docs
  BRIEF.md                 สเปกระบบ
  SETUP.md                 ตั้งค่า env dev/prod
CLAUDE.md                  ไฟล์นี้ (root)
proxy.ts                   (ข้อ 3) refresh session + redirect — Next 16 ใช้ชื่อนี้แทน middleware.ts
```

**กฎเหล็กเรื่องชั้น (layer):**
- **Component / หน้า** ไม่เรียก DB ตรง — เรียกผ่าน service หรือ server action/route
- **API route / server action** บางที่สุด — แค่ parse input → เช็ก auth → เรียก service → return ไม่มี business logic
- **Service** (`/lib/services`) = business logic ทั้งหมด (rule การเปลี่ยนสถานะ, การอนุมัติ, การคิดกิโล) — ไม่ผูกกับ Next.js (ไม่ import อะไรจาก `next/*`)
- **Query** (`/lib/db/queries`) = โค้ดแตะ database เท่านั้น service เรียก query ไม่เขียน SQL/Drizzle ใน service โดยตรง
- **Frontend ห้ามเรียก Supabase เพื่อดึง business data** — ทุก query ผ่าน backend เสมอ (Supabase client ใช้ได้เฉพาะฝั่ง server หรือเฉพาะ auth flow ที่จำเป็น)

เหตุผล: วันหลังถ้าต้องแยก API ออกเป็น service จริง แค่ยก `/lib/services` + `/lib/db` ออกไป ไม่ต้องรื้อ

---

## 3. Naming

- ไฟล์ component: `PascalCase.tsx` (เช่น `QuotationCard.tsx`)
- ไฟล์ non-component: `camelCase.ts` (เช่น `quotationService.ts`)
- `lib/utils/` เป็นโฟลเดอร์ — `cn` อยู่ที่ `lib/utils/cn.ts` (re-export จาก `lib/utils/index.ts` เพื่อให้ shadcn alias `@/lib/utils` ใช้ได้)
- ตาราง DB + คอลัมน์: `snake_case` (เช่น `quotation_items`, `owner_id`)
- ตัวแปร/ฟังก์ชัน: `camelCase` · Type/Interface: `PascalCase`
- ค่าคงที่: `UPPER_SNAKE_CASE`
- ชื่อสื่อความหมาย เป็นภาษาอังกฤษในโค้ด (ข้อความ UI เป็นภาษาไทย)

---

## 4. Data layer (Drizzle) — pattern

- Schema อยู่ที่ `/lib/db/schema.ts` ที่เดียว — เปลี่ยน schema ต้องทำผ่าน Drizzle migration เสมอ (ไม่แก้ DB มือ)
- Query อยู่ใน `/lib/db/queries/<domain>.ts` — export เป็นฟังก์ชันที่ชื่อสื่อความหมาย เช่น `getQuotationsByOwner(ownerId)`, `getQuotationById(id, user)`
- **ทุก query ที่ดึงใบเสนอราคา/ลูกค้า ต้องรับ user/role แล้วกรองสิทธิ์ในตัว query** — ดูข้อ 6
- ใช้ transaction เมื่อมีหลายการเขียนที่ต้องสำเร็จพร้อมกัน (เช่น เปลี่ยนสถานะ + เขียน audit log)
- อย่า `select *` เกินจำเป็น เลือกเฉพาะคอลัมน์ที่ใช้
- **กัน N+1**: ดึงใบ + items + notes ด้วย join/relational query ครั้งเดียว ไม่ loop query

---

## 5. API / Server Action — pattern

ทุก endpoint ทำตามลำดับนี้เสมอ:
1. Parse input
2. **Validate ด้วย Zod** (reject ถ้าไม่ผ่าน)
3. **ตรวจ session + สิทธิ์** (ดูข้อ 6)
4. เรียก service function
5. return ผลลัพธ์ / error ที่ปลอดภัย (ไม่หลุด stack trace/รายละเอียดภายในไป client)

- ใช้ Server Actions สำหรับ mutation ของฟอร์มในแอป · ใช้ Route Handlers เมื่อจำเป็น (เช่น download PDF)
- ไม่มี business logic ใน endpoint — เรียก service เท่านั้น

---

## 6. Auth & Authorization (หัวใจ — ห้ามพลาด)

- ตรวจ session ทุก request ที่เข้าถึงข้อมูล — ผ่าน helper กลางใน `/lib/auth`
- **เช็กสิทธิ์ที่ backend ทุกครั้ง ไม่ใช่แค่ซ่อน UI**
- **เซลล์เห็นเฉพาะใบของตัวเอง:** ทุก query ต้องมีเงื่อนไข `owner_id = user.id` (ยกเว้น role = executive)
  - เขียนเป็น helper เดียว เช่น `scopeToUser(query, user)` แล้วใช้ทุกที่ ป้องกันลืม
- **กัน IDOR:** `getQuotationById(id, user)` ต้องเช็กว่า user มีสิทธิ์เห็นใบนั้นจริง ถ้าไม่มี → คืน not found (ไม่ใช่ดึงมาแล้วค่อยเช็กที่ frontend)
- **การเปลี่ยนสถานะ/อนุมัติ** เช็ก role + สถานะปัจจุบันก่อนทุกครั้ง (ดู state machine ข้อ 8) — ผู้บริหารเท่านั้นอนุมัติ/ตีกลับได้
- ทดสอบเสมอ: ล็อกอินเป็นเซลล์ A แล้วพยายามเข้าถึง/แก้ใบของเซลล์ B ทุกช่องทาง ต้องทำไม่ได้

**การตัดสินใจ (ยืนยันแล้ว):**
- **Auth:** ใช้ Supabase Auth (ไม่ใช้ Better Auth)
- **ไม่เปิด RLS** — Drizzle ต่อ DB ด้วย service_role ซึ่งข้าม RLS อยู่แล้ว การเปิดจะหลอกตัวเอง สิทธิ์ทั้งหมดคุมที่ backend (service/query) เท่านั้น
- ชั้นกันพลาดคือ `scopeToUser` ที่บังคับใช้ทุก query + เทสสิทธิ์ (ดู `.claude/skills/testing/SKILL.md`)
- **Storage (รูปสินค้า/ลายเซ็น):** bucket เป็น private ทั้งหมด → เข้าถึงผ่าน signed URL ที่ gen จาก backend หลังเช็กสิทธิ์แล้วเท่านั้น

---

## 7. Validation & Error handling

- ทุก input ฝั่ง server ผ่าน **Zod** — นิยาม schema ไว้ที่ `/lib/validation` ใช้ร่วม front/back ได้
- Error แบ่ง 2 แบบ: **คาดไว้** (validation ไม่ผ่าน, ไม่มีสิทธิ์, ไม่พบ) → คืนข้อความไทยที่ผู้ใช้เข้าใจ · **ไม่คาด** (ระบบพัง) → log ฝั่ง server + คืนข้อความกลางๆ ไม่หลุดรายละเอียด
- ไม่ throw error ดิบไป client · ไม่ log ข้อมูลอ่อนไหว (รหัสผ่าน/token/service key)
- ทุกหน้ามี loading state และ error state ที่ผู้ใช้เข้าใจ

**มาตรฐาน error (ยึดทุกชั้น):**
- Error class อยู่ที่ `/lib/errors.ts` — `AppError` (base) → `NotFoundError`, `ForbiddenError`, `ValidationError`, `InvalidTransitionError` · service throw class เหล่านี้เท่านั้นสำหรับ error ที่คาดไว้
- Server action คืน `ActionResult<T>` เสมอ ไม่ throw ไป client:
  `{ ok: true, data } | { ok: false, message, fieldErrors? }`
- Route handler คืน HTTP status ตาม `AppError.status` (404/403/400/409) · error ไม่คาด → 500 + ข้อความกลาง
- รายละเอียด pattern อยู่ที่ skill `server-action` และ `auth-guard`

---

## 8. State machine ของสถานะใบเสนอราคา (บังคับที่ service)

สถานะ: `draft` → `pending_approval` → `approved` → `sent` → `won` · และ `returned` (ตีกลับ)

- การเปลี่ยนสถานะทำผ่าน service เท่านั้น (เช่น `submitForApproval`, `approve`, `reject`, `markAsSent`, `closeSale`)
- แต่ละ transition เช็ก: (1) role ผู้กดถูกต้องไหม (2) สถานะปัจจุบันอนุญาตให้เปลี่ยนไหม
- transition ที่ถูกต้อง:
  - `draft`/`returned` → `pending_approval` (เซลล์เจ้าของ)
  - `pending_approval` → `approved` หรือ `returned` (ผู้บริหาร; approved ต้องแปะลายเซ็น + ล็อกแก้)
  - `approved` → `sent` (เซลล์กด export PDF — เปลี่ยนอัตโนมัติ)
  - `sent` → `won` (เซลล์)
- ทุก transition + การแก้ไขราคา → เขียน `audit_log` ภายใน transaction เดียวกัน
- ใบที่ `approved` ขึ้นไป ห้ามแก้เนื้อหา (ต้องตีกลับเป็น draft ก่อน — แต่ MVP นี้แก้ได้เฉพาะตอน draft/returned)

---

## 9. Styling (Tailwind + shadcn)

- ใช้ **design token/สีจาก Claude Design** (ธีมส้ม) — นิยามเป็น CSS variables/Tailwind theme ไม่ hardcode hex ซ้ำๆ ในหลายที่
- **catalog ของ token + component อยู่ที่ `docs/UI-KIT.md`** (ของจริงดูที่ `/ui-kit`) — ก่อนเขียน UI ให้ใช้ skill `ui-consistency`: reuse จาก catalog ก่อน ไม่มีค่อยเพิ่มเข้า catalog แล้วใช้
- ใช้ **shadcn/ui** เป็น base component ก่อนเขียนเอง
- **ฟอนต์ไทย:** IBM Plex Sans Thai (เนื้อหา) · **ตัวเลข:** IBM Plex Mono / tabular numerals (ราคา/นน./วันที่/เลขที่) — ตัวเลขชิดขวา หลักตรงกัน
- **Mobile-first** — เขียน responsive จากจอเล็กขึ้นไป (base = มือถือ, `md:`/`lg:` สำหรับจอใหญ่)
- ปุ่ม/ช่องกรอกสูง ≥ 44px บนมือถือ · ปุ่มหลักของหน้า sticky ล่างจอบนมือถือ
- ไม่ hardcode ข้อความไทยกระจัดกระจาย — ถ้าเป็นไปได้รวมไว้ที่เดียว (constants/i18n-ready)

---

## 10. Components

- Component เล็ก ทำหน้าที่เดียว · แยก presentational (แสดงผล) ออกจาก logic ที่ดึงข้อมูล
- ใช้ **Server Components** เป็นค่าเริ่มต้น · ใช้ `"use client"` เฉพาะเมื่อต้องมี interactivity จริง (ฟอร์ม, ปุ่ม, state)
- รูปทั้งหมดผ่าน **next/image** (โดยเฉพาะรูปสินค้า — resize + lazy load สำคัญเพราะเซลล์ใช้มือถือ)
- ไม่ยัด business logic ใน component — เรียก service/action

---

## 11. Security (ยึดตาม docs/security-performance-checklist.md)

จุดที่ต้องไม่พลาดในทุกโค้ดที่เขียน:
- `service_role key` / secrets อยู่ฝั่ง server เท่านั้น · ไม่ commit `.env` (เช็ก `.gitignore`)
- parameterized query ผ่าน Drizzle เสมอ (ไม่ต่อ string SQL)
- escape ข้อมูล user ตอนแสดง + ตอน gen PDF
- ลายเซ็นผู้บริหาร/รูปสินค้าใน Storage: เข้าถึงต้องมีสิทธิ์ ไม่ใช่ public URL เดาได้
- อัปโหลดไฟล์: จำกัดชนิด/ขนาด

---

## 12. Performance

- สร้าง index บน `owner_id`, `status`, `customer_id`, `created_at` (ใน schema)
- กัน N+1 (ข้อ 4) · pagination หน้ารายการ
- Server Components สำหรับหน้าที่แสดงข้อมูล · next/image สำหรับรูป
- เป้า: Lighthouse mobile > 85, LCP < 2.5s

---

## 13. Git & workflow

- คอมมิตเล็ก สื่อความหมาย (เช่น `feat: quotation approval flow`)
- ห้าม commit secrets/`.env`/ไฟล์ build
- แยก branch ตาม feature ถ้าเหมาะ

---

## 14. วิธีทำงานกับผู้ใช้ (สำคัญ)

- **ทำทีละงานตามแผนใน BRIEF.md ข้อ 10** — ไม่สร้างทั้งระบบรวดเดียว
- ก่อนแก้อะไรที่กระทบหลายไฟล์/สถาปัตยกรรม — อธิบายสั้นๆ แล้วถามก่อน
- UI: ต่อยอดจากโค้ดที่ได้จาก Claude Design — ไม่สร้าง UI ใหม่จากศูนย์
- เขียนโค้ดให้อ่านง่าย มี comment เฉพาะจุดที่ซับซ้อน (ไม่ comment สิ่งที่โค้ดบอกอยู่แล้ว)
- ถ้าไม่แน่ใจ requirement — ถาม ไม่เดาแล้วเขียนยาว
- หลังทำแต่ละงาน สรุปสั้นๆ ว่าทำอะไรไป + ต้องเทสอะไร

---

## 15. Testing

- แนวทางเขียนเทสอยู่ที่ `.claude/skills/testing/SKILL.md` — ยึดตามนั้น
- ทุก service ที่มี rule สำคัญ (สิทธิ์, state machine, running number) ต้องมี unit test ก่อนถือว่างานเสร็จ
- เทสสิทธิ์ (เซลล์ A เข้าถึงใบของเซลล์ B ไม่ได้) เป็นเทสบังคับ ห้ามข้าม
