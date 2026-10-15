# CODEBASE — โค้ดทั้งหมดมีอะไรบ้าง ไฟล์ไหนทำอะไร

> เอกสารนี้สำหรับ **คนที่เพิ่งเข้ามาดูโปรเจกต์นี้ครั้งแรก** — อ่านจบแล้วควรรู้ว่าไฟล์ไหนอยู่ตรงไหน แก้ที่ไหน และห้ามทำอะไร
>
> | อยากรู้เรื่อง | อ่านที่ |
> |---|---|
> | ระบบทำอะไร ใครใช้ กติกาธุรกิจ | `docs/BRIEF.md` |
> | **โค้ดมีอะไรบ้าง ไฟล์ไหนทำอะไร** | **ไฟล์นี้** |
> | กฎการเขียนโค้ดของโปรเจกต์ | `CLAUDE.md` |
> | ตั้งเครื่อง dev ให้รันได้ | `docs/SETUP.md` |
> | ขึ้น production / ส่งมอบ | `docs/DEPLOY.md` |
> | สี ขนาด component ที่มีให้ใช้ | `docs/UI-KIT.md` (ของจริงเปิดดูที่หน้า `/ui-kit`) |

---

## 1. ระบบนี้คืออะไร (ย่อ 5 บรรทัด)

ระบบออกใบเสนอราคาข้าวสารของบริษัทเดียว ใช้กันภายใน ไม่เปิดให้คนนอกสมัคร

- **เซลล์** สร้างใบเสนอราคา เลือกลูกค้า เลือกสินค้า ใส่ราคาต่อถุง แล้วส่งให้ผู้บริหารอนุมัติ
- **ผู้บริหาร** เห็นใบของทุกคน กดอนุมัติ (แปะลายเซ็นจริง) หรือตีกลับพร้อมเหตุผล
- อนุมัติแล้วเซลล์กด Export PDF → ไฟล์ตามฟอร์มบริษัท → สถานะเปลี่ยนเป็น "ส่งลูกค้าแล้ว" อัตโนมัติ → ปิดการขายได้
- **เซลล์เห็นเฉพาะใบของตัวเอง** เป็นกฎที่สำคัญที่สุดของระบบ
- มือถือเป็นหลัก (เซลล์ใช้นอกออฟฟิศ) เว็บเป็นรอง

---

## 2. Stack

| ส่วน | ใช้อะไร | หมายเหตุ |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | Next 16 มี breaking change เช่น `middleware.ts` → `proxy.ts`, `params` เป็น Promise — ดู `AGENTS.md` |
| ฐานข้อมูล | **Postgres (Supabase)** ผ่าน **Drizzle ORM** | ไม่เรียก Supabase client เพื่อ query ข้อมูลธุรกิจ |
| Auth | **Supabase Auth** (อีเมล+รหัสผ่าน) | พนักงานล็อกอินด้วย *ชื่อผู้ใช้* ระบบแปลงเป็นอีเมลภายในให้ |
| ไฟล์ | **Supabase Storage** 2 bucket (private) | รูปสินค้า + ลายเซ็น |
| UI | **Tailwind v4 + shadcn/ui (base-nova)** | ฟอนต์ IBM Plex Sans Thai / Plex Mono |
| Validation | **Zod 4** | ทุก input ฝั่ง server |
| PDF | **@react-pdf/renderer** | ฝังฟอนต์ไทยจากไฟล์ในโปรเจกต์ |
| Error tracking | **Sentry** (ฝั่ง server เท่านั้น) | ไม่ตั้ง `SENTRY_DSN` ก็รันได้ปกติ |
| เทส | **Vitest** (unit + db) + **Playwright** (e2e) | |
| Deploy | **Vercel** + **Supabase** region สิงคโปร์ | |

---

## 3. สถาปัตยกรรม — 4 ชั้น ห้ามข้ามชั้น

```
┌─ app/          หน้าเว็บ + server action + API route
│                "รับ input → เช็ก auth → เรียก service → แสดงผล"  ไม่มี business logic
│
├─ lib/services/ กติกาธุรกิจทั้งหมด (ใครทำอะไรได้ สถานะเปลี่ยนยังไง เลขที่ใบรันยังไง)
│                ไม่ import อะไรจาก next/* → ยกไปใช้ที่อื่นได้ถ้าวันหลังแยก API
│
├─ lib/db/queries/  โค้ดที่แตะฐานข้อมูลเท่านั้น (Drizzle)
│                   ห้ามเขียน Drizzle/SQL ใน service โดยตรง
│
└─ lib/db/schema.ts  นิยามตาราง (เปลี่ยนต้องผ่าน migration เสมอ)
```

**ทำไมต้องแยก:** วันหลังถ้าต้องแยก backend ออกไปเป็น service จริง ยก `lib/services` + `lib/db` ออกไปได้เลย ไม่ต้องรื้อ

### เส้นทางของ 1 request — ตัวอย่างจริง "เซลล์กดบันทึกร่าง"

```
1. components/quotation/QuotationForm.tsx     ผู้ใช้กรอกฟอร์ม กดบันทึก
2. app/(app)/quotations/actions.ts  saveDraft เป็น server action (บาง 5 บรรทัด)
3. lib/actionWrapper.ts             action()   parse → Zod → requireUser() → เรียก handler → แปลง error เป็นข้อความไทย
4. lib/validation/quotation.ts      saveDraftSchema ตรวจรูปแบบ (เบอร์โทร ราคา ห้ามสินค้าซ้ำ ฯลฯ)
5. lib/services/quotationService.ts createDraft/updateDraft  ← กติกาธุรกิจอยู่ตรงนี้
6. lib/db/queries/quotations.ts     insertQuotation / replaceItems / เขียน audit_log  (ใน transaction เดียว)
7. lib/db/schema.ts                 ตารางจริงใน Postgres
```

ทุก mutation จบด้วย `ActionResult<T>` = `{ ok: true, data } | { ok: false, message, fieldErrors? }` — **ไม่เคย throw ไปหน้าเว็บ**

---

## 4. โครงไฟล์ทีละโฟลเดอร์

### `/app` — หน้าเว็บและ API

```
app/
├── layout.tsx              layout ราก: ฟอนต์, metadata, noindex
├── page.tsx                redirect ไป /quotations
├── robots.ts               บอก search engine ว่าห้าม index ทุกหน้า
├── globals.css             design token (สี ขนาด เงา) + base style ทั้งหมด
├── icon.png, apple-icon.png   ไอคอนแท็บ/หน้าจอโฮม (สร้างจาก npm run brand:logo)
│
├── (auth)/login/
│   ├── page.tsx            หน้าล็อกอิน (เดสก์ท็อปแบ่งซ้าย-ขวา · มือถือจัดกลาง)
│   └── actions.ts          server action: login (Supabase Auth)
│
├── (app)/                  ทุกหน้าหลังล็อกอิน
│   ├── layout.tsx          ครอบด้วย AppShell (sidebar เดสก์ท็อป / BottomNav มือถือ) + เช็ก session
│   ├── actions.ts          logout
│   ├── error.tsx           หน้า error ของกลุ่มนี้ (แสดง "รหัสอ้างอิง" = digest ไว้ค้นใน Sentry)
│   ├── not-found.tsx       404
│   ├── quotations/
│   │   ├── page.tsx        รายการใบ: กรองสถานะ ค้นหา เรียงลำดับ แบ่งหน้า
│   │   ├── actions.ts      saveDraft, submitQuotation, approveQuotation, rejectQuotation, closeSale, searchCustomers
│   │   ├── new/page.tsx    สร้างใบใหม่
│   │   ├── [id]/page.tsx   ดูใบ (อ่านอย่างเดียว) + ปุ่มตามสถานะและ role
│   │   └── [id]/edit/page.tsx  แก้ใบ (เฉพาะ draft/returned)
│   ├── dashboard/page.tsx  ภาพรวม: นับใบตามสถานะ กดแล้วไปหน้ารายการที่กรองไว้
│   ├── settings/page.tsx   โปรไฟล์ + ลายเซ็น (ผู้บริหารเห็นลายเซ็นตัวเอง)
│   ├── ui-kit/page.tsx     แคตตาล็อก component ทั้งหมด (ไว้ดูของที่มีก่อนสร้างใหม่)
│   └── */loading.tsx       skeleton ระหว่างโหลดของแต่ละหน้า
│
└── api/
    ├── health/route.ts               เช็กว่า env + DB ต่อติด — ใช้ตอน deploy
    ├── product-images/[file]/route.ts  รูปสินค้า: เช็ก session → ดึงจาก bucket → ย่อ 200px → ส่ง
    └── quotations/[id]/pdf/route.ts    สร้าง PDF: เช็ก session → service → ส่งไฟล์ (inline เปิดดูในเครื่องได้)
```

**เรื่อง route group:** `(auth)` และ `(app)` วงเล็บแปลว่าไม่มีผลกับ URL ใช้แค่แบ่งกลุ่มเพื่อให้ layout ต่างกัน

### `/lib` — ตรรกะทั้งหมด

```
lib/
├── env.ts                  อ่าน env ผ่าน Zod — ขาดตัวไหนแอปพังทันทีตอน boot พร้อมบอกชื่อ
│                           **ห้ามอ่าน process.env ตรงๆ ที่อื่น**
├── errors.ts               AppError → NotFoundError / ForbiddenError / ValidationError / InvalidTransitionError
│                           service โยนได้เฉพาะ 4 ตัวนี้สำหรับ error ที่คาดไว้
├── actionResult.ts         รูปแบบผลลัพธ์ของ server action ทุกตัว
├── actionWrapper.ts        action() / publicAction() — ทำ parse→zod→auth→service→map error ให้ครบในที่เดียว
├── observability.ts        reportError() / reportWarning() — log + ส่ง Sentry (ข้าม AppError ไม่ให้รบกวน)
│
├── auth/
│   ├── types.ts            Role = "sale" | "executive", SessionUser
│   ├── session.ts          getSessionUser() (cache ต่อ request) / requireUser()
│   ├── guards.ts           requireRole, scopeToUser, assertCanAccess — ★ หัวใจเรื่องสิทธิ์
│   └── username.ts         somchai.s ⇄ somchai.s@organicpower.internal
│
├── db/
│   ├── schema.ts           8 ตาราง + enum + index + relations (ที่เดียว)
│   ├── index.ts            db client (postgres-js + Drizzle, prepare:false เพราะใช้ pooler)
│   └── queries/
│       ├── quotations.ts   ดึง/เขียนใบ — ทุกฟังก์ชันรับ user แล้วกรองสิทธิ์ในตัว query
│       ├── customers.ts    ค้นหาลูกค้า (แชร์ทั้งบริษัท ไม่กรองตามเจ้าของ)
│       ├── products.ts     สินค้าที่ยังขายอยู่
│       └── profiles.ts     โปรไฟล์ + path ลายเซ็น
│
├── services/
│   ├── quotationService.ts     ★ ไฟล์ใหญ่สุด: createDraft, updateDraft, submitForApproval,
│   │                             approve, reject, exportPdf, closeSale
│   ├── quotationStateMachine.ts กติกาว่าสถานะไหนไปสถานะไหนได้ + ใบไหนแก้ได้
│   ├── quoteNumber.ts          รูปแบบเลขที่ใบ QT-2569-0001 (ปี พ.ศ.)
│   └── priceDiff.ts            สรุปว่าราคาเปลี่ยนจากเท่าไหร่เป็นเท่าไหร่ ไว้เขียนลง audit_log
│
├── validation/
│   ├── quotation.ts        Zod schema ของฟอร์มใบเสนอราคา (ใช้ร่วมหน้าเว็บ+server)
│   └── auth.ts             schema ของฟอร์มล็อกอิน
│
├── pdf/
│   ├── quotationPdf.tsx    template PDF A4 + โลโก้ + ลายเซ็น (มี workaround เรื่องสระไทย)
│   └── fonts/              ไฟล์ฟอนต์ที่ฝังลง PDF
│
├── storage/
│   ├── buckets.ts          ชื่อ bucket + อายุ signed URL
│   ├── download.ts         โหลดไฟล์จาก bucket มาเป็น bytes (ใช้ตอนทำ PDF)
│   └── signedUrl.ts        signed URL (ใช้กับลายเซ็นเท่านั้น) + ช่วยทำ URL รูปสินค้า
│
├── supabase/
│   ├── server.ts           client สิทธิ์ผู้ใช้ (อ่าน session จาก cookie)
│   ├── admin.ts            client service_role — ฝั่ง server เท่านั้น
│   └── proxy.ts            client สำหรับ proxy.ts (refresh session)
│
├── constants/
│   ├── company.ts          ★ ข้อมูลบริษัทบนหัว PDF — **ยังเป็นค่าตัวอย่าง ต้องแก้ก่อนใช้จริง**
│   └── quotationStatus.ts  key สถานะ + ป้ายภาษาไทย + ลำดับใน flow
│
└── utils/
    ├── format.ts           วันที่ไทย (พ.ศ.), ราคาใส่ comma, น้ำหนัก
    ├── address.ts          ประกอบที่อยู่ไทย — เติม ต./อ./จ. หรือ แขวง/เขต ให้กรุงเทพฯ
    ├── initials.ts         ตัวย่อชื่อสำหรับ avatar
    ├── cn.ts               รวม class ของ Tailwind
    └── index.ts            re-export ทุกตัวข้างบน (import จาก "@/lib/utils" ได้เลย)
```

### `/components` — UI

```
components/
├── ui/              shadcn base: button, input, card, dialog, sheet, badge, textarea, label, skeleton
│                    **แก้ไฟล์พวกนี้เท่าที่จำเป็น** เพราะ shadcn อาจ generate ทับ
│
├── layout/          AppShell (ตัวครอบ), Sidebar (เดสก์ท็อป sticky), BottomNav (มือถือ),
│                    PageHeader / PageBody / StickyActionBar, BrandLogo, navItems
│
├── quotation/       หัวใจของแอป
│   ├── QuotationForm.tsx       ★ ฟอร์มสร้าง/แก้ใบ — มือถือเป็น wizard 3 ขั้น เว็บเป็น section เรียงลง
│   ├── CustomerPickerSheet.tsx เลือกลูกค้าเก่า (ค้นหาแบบ on-demand)
│   ├── ProductPickerSheet.tsx  เลือกสินค้า + ใส่ราคา
│   ├── PriceTable.tsx          ตาราง "ราคาต่อถุง" ในหน้าดูใบ
│   ├── ApprovalActions.tsx     ปุ่มอนุมัติ/ตีกลับของผู้บริหาร
│   ├── ExportPdfButton.tsx     เปิด PDF แท็บใหม่ แล้ว refresh สถานะ
│   ├── Timeline.tsx            ประวัติจาก audit_log
│   ├── StatusBadge/Dot/Progress/FilterChips  แสดงสถานะในรูปแบบต่างๆ
│   ├── statusStyles.ts         สีของแต่ละสถานะ (ผูกกับ token ใน globals.css)
│   └── viewModel.ts            แปลงข้อมูลจาก DB ให้อยู่ในรูปที่ component ใช้ง่าย
│
├── shared/          ชิ้นส่วนใช้ซ้ำ: FormField, PriceInput (ใส่ comma ขณะพิมพ์), SearchInput,
│                    SegmentedControl, ProductThumbnail, UserAvatar, Spinner, SectionCard, InfoNotice
├── dashboard/       StatusCountCard, StatusBarChart
├── auth/            LoginForm
└── skeletons/       PageSkeleton (ใช้ใน loading.tsx ทุกหน้า)
```

### `/scripts` — เครื่องมือ (รันด้วย `npm run ...` ไม่ได้ถูก deploy)

| ไฟล์ | คำสั่ง | ทำอะไร |
|---|---|---|
| `loadEnv.ts` | — | โหลดไฟล์ env ให้สคริปต์อื่น · `ENV_FILE=.env.prod.local` เพื่อชี้ production · พิมพ์ปลายทางให้ดูทุกครั้งกันรันผิดฐาน |
| `user.ts` | `npm run user` | สร้าง/แก้ผู้ใช้ทีละคน เปลี่ยนรหัส ปิดบัญชี อัปโหลดลายเซ็น |
| `import-master.ts` | `npm run db:import` | นำเข้าสินค้า+ลูกค้า+รูป จากไฟล์ Excel ที่ลูกค้ากรอก (รันซ้ำได้ไม่ซ้ำข้อมูล) |
| `make-templates.ts` | `npm run templates:make` | สร้างไฟล์ Excel ที่ส่งให้ลูกค้ากรอก |
| `brand-logo.ts` | `npm run brand:logo` | สร้างโลโก้/ไอคอนทุกขนาดจากต้นฉบับ |
| `setup-storage.ts` | `npm run storage:setup` | สร้าง bucket private 2 อัน |
| `seed.ts` | `npm run db:seed` | สินค้าตัวอย่างจากดีไซน์ — **dev เท่านั้น ห้ามรันบน prod** |
| `seed-users.ts` | `npm run db:seed:users` | สร้างผู้ใช้ชุดแรก (ปกติใช้ `npm run user` แทน) |

### `/tests`

```
tests/
├── setup.ts          env ปลอมสำหรับ unit test (ไม่แตะ DB จริง)
├── serverOnlyStub.ts ให้ import "server-only" ทำงานใน vitest ได้
├── factories.ts      ตัวช่วยสร้างข้อมูลตัวอย่าง
├── db/               ตัวช่วยของเทสที่ต่อ DB จริง (สร้าง user ชั่วคราวแล้วลบเอง)
└── e2e/              Playwright — auth, รายการ+dashboard, flow สร้างใบจนส่งอนุมัติ
```

เทส unit อยู่ข้างไฟล์ที่มันเทส (เช่น `lib/services/quotationService.test.ts`) · เทสที่ต่อ DB จริงลงท้าย `.db.test.ts` และแยกคำสั่งรัน

### ไฟล์ตั้งค่าที่ราก

| ไฟล์ | ทำอะไร |
|---|---|
| `proxy.ts` | ทำงานทุก request: refresh session + เด้งคนไม่ล็อกอินไป `/login` · **ไม่ใช่ที่เช็กสิทธิ์** (Next 16 ใช้ชื่อนี้แทน `middleware.ts`) |
| `instrumentation.ts` | เปิด Sentry ตอน server boot + ดัก error ที่หลุดจาก server component/route |
| `next.config.ts` | รวมฟอนต์/โลโก้เข้า bundle ของ route PDF, ตั้ง remote image, ห่อ Sentry |
| `drizzle.config.ts` | ตั้งค่า migration |
| `vercel.json` | รัน function ที่ภูมิภาคสิงคโปร์ |
| `vitest.config.ts` / `vitest.db.config.ts` | เทสแบบไม่แตะ DB / แตะ DB |
| `playwright.config.ts` | e2e 2 โปรไฟล์: มือถือ + เดสก์ท็อป |
| `components.json` | ตั้งค่า shadcn |

---

## 5. ฐานข้อมูล — 8 ตาราง

```
profiles ──┬─< quotations ──┬─< quotation_items
(ผู้ใช้)    │   (ใบเสนอราคา)  ├─< quotation_notes
           │                └─< audit_log
           └─< customers (ลูกค้า — แชร์ทั้งบริษัท ไม่ได้เป็นของใครคนเดียว)

products (สินค้า)  ──> อ้างถึงใน quotation_items
quote_number_counters (ตัวนับเลขที่ใบต่อปี พ.ศ.)
```

| ตาราง | เก็บอะไร | จุดที่ต้องรู้ |
|---|---|---|
| `profiles` | ชื่อ, role, path ลายเซ็น, เปิด/ปิดใช้งาน | `id` ตรงกับ `auth.users.id` ของ Supabase |
| `customers` | ลูกค้า + ที่อยู่แยกช่อง + ประเภทชำระ | **ที่อยู่เก็บชื่อล้วน ไม่มี ต./อ./จ.** แอปเติมให้ตอนแสดง |
| `products` | สินค้า + น้ำหนักต่อถุง + path รูป | ปิดการขายด้วย `is_active = false` ไม่ลบ |
| `quotations` | ใบเสนอราคา + สถานะ + เจ้าของ + ลายเซ็นที่ snapshot ไว้ | `owner_id` คือกุญแจของเรื่องสิทธิ์ |
| `quotation_items` | รายการสินค้าในใบ + ราคาต่อถุง | ตอนแก้ใบจะลบทั้งชุดแล้วใส่ใหม่ |
| `quotation_notes` | หมายเหตุ/เงื่อนไขท้ายใบ | เหมือนกัน |
| `audit_log` | ใครทำอะไรกับใบไหนเมื่อไหร่ | เป็น**ข้อความบรรยาย** ไม่ใช่สำเนาข้อมูล — ใช้กู้ข้อมูลไม่ได้ |
| `quote_number_counters` | เลขรันต่อปี | เพิ่มเลขด้วย `INSERT … ON CONFLICT DO UPDATE` ครั้งเดียวจบ — สร้างใบพร้อมกันหลายคนก็ไม่ได้เลขซ้ำ |

**ทุกตารางเปิด RLS แต่ไม่มี policy เลย** = ไม่มีใครเข้าถึงผ่าน API ของ Supabase ได้ · แอปต่อ DB ด้วย connection ที่เป็นเจ้าของตารางซึ่งข้าม RLS · **สิทธิ์จริงคุมที่ `lib/auth/guards.ts` เท่านั้น**

---

## 6. 6 กฎที่ต้องรู้ก่อนแก้โค้ด

1. **สิทธิ์เช็กที่ backend เสมอ** — ทุก query ที่ดึงใบต้องรับ `user` แล้วกรอง `owner_id` ในตัว query (`scopeToUser`) · ซ่อนปุ่มใน UI ไม่นับว่าเช็ก · เปิดใบของคนอื่นตรงๆ ต้องได้ 404 ไม่ใช่ 403 (ไม่บอกใบ้ว่ามีใบนั้นอยู่)
2. **เปลี่ยนสถานะผ่าน service เท่านั้น** — `quotationStateMachine.ts` เป็นคนตัดสินว่าทำได้ไหม · ทุกการเปลี่ยนสถานะและการแก้ราคาต้องเขียน `audit_log` ใน transaction เดียวกัน
3. **ใบที่อนุมัติแล้วห้ามแก้** — แก้ได้เฉพาะ `draft` กับ `returned`
4. **ไม่อ่าน `process.env` ตรงๆ** — ใช้ `lib/env.ts` เสมอ
5. **error ที่ไม่คาดต้องผ่าน `reportError()`** ไม่ใช่ `console.error` ลอยๆ · และห้ามส่งรายละเอียดภายในกลับไป client
6. **เปลี่ยนโครงตารางต้องทำ migration** (`npm run db:generate` → `db:migrate`) ห้ามแก้ใน dashboard ของ Supabase ตรงๆ

---

## 7. คำสั่งที่ใช้บ่อย

```bash
npm run dev           # รันเครื่องตัวเอง (http://localhost:3000)
npm run typecheck     # ตรวจ TypeScript
npm run lint          # eslint
npm test              # unit test (ไม่แตะ DB) — ปัจจุบัน 135 เทส
npm run test:db       # เทสที่ต่อ DB dev จริง
npm run test:e2e      # Playwright (ต้องมี dev server + ข้อมูลใน dev)
npm run db:generate   # สร้าง migration จาก schema.ts
npm run db:migrate    # รัน migration
npm run db:studio     # เปิดดูข้อมูลแบบตาราง
```

ชี้ production ให้ใส่ `ENV_FILE=.env.prod.local` นำหน้า เช่น `ENV_FILE=.env.prod.local npm run db:migrate`

---

## 8. คนใหม่ควรอ่านตามลำดับนี้ (~1 ชั่วโมง)

1. `docs/BRIEF.md` ข้อ 1–6 — เข้าใจว่าระบบทำอะไร สถานะมีอะไรบ้าง
2. `lib/db/schema.ts` — เห็นโครงข้อมูลทั้งหมดในไฟล์เดียว
3. `lib/auth/guards.ts` + `lib/db/queries/quotations.ts` — เข้าใจว่าสิทธิ์ถูกบังคับยังไง
4. `lib/services/quotationService.ts` — กติกาธุรกิจทั้งหมดอยู่ที่นี่
5. `app/(app)/quotations/actions.ts` + `lib/actionWrapper.ts` — เห็นว่าหน้าเว็บคุยกับ service ยังไง
6. `components/quotation/QuotationForm.tsx` — ฟอร์มที่ซับซ้อนที่สุดของแอป
7. เปิดหน้า `/ui-kit` ในเบราว์เซอร์ — เห็น component ทั้งหมดที่มีให้ใช้

**ถ้าจะแก้ UI** อ่าน `docs/UI-KIT.md` ก่อน แล้วหยิบของที่มีอยู่มาใช้ อย่าเพิ่งสร้างใหม่

---

## 9. จุดที่ยังไม่เสร็จ / ต้องระวัง

| เรื่อง | สถานะ |
|---|---|
| `lib/constants/company.ts` | **ยังเป็นข้อมูลตัวอย่างจากดีไซน์** ต้องแก้เป็นข้อมูลบริษัทจริงก่อนส่งใบให้ลูกค้า |
| หน้าจัดการสินค้า/ลูกค้า (CRUD) | ไม่มีใน MVP — นำเข้าด้วย Excel แล้วแก้ผ่าน Supabase Table Editor |
| Sentry ฝั่ง browser | ยังไม่เปิด (เก็บเฉพาะ error ฝั่ง server เพื่อไม่ให้ JS บนมือถือใหญ่ขึ้น) |
| ลืมรหัสผ่าน / เปลี่ยนรหัสในแอป | ไม่มี — ใช้ `npm run user -- --username x --password '...'` · **ปุ่ม "Send password recovery" ใน Supabase ใช้ไม่ได้** เพราะอีเมลภายในส่งไม่ถึงจริง |
| บัญชีทดสอบบน production | `test.sale`, `test.sale2`, `test.exec` — **ต้องปิดก่อนเปิดใช้จริง** |
