# UI-KIT.md — catalog ของ design token + component

> **ที่มา:** Claude Design "ระบบใบเสนอราคา MVP" (project `0c02ec02-b1f9-47e1-a467-4432c3399f93`, ไฟล์ `ระบบใบเสนอราคา MVP.dc.html`)
> ธีม "สมุดทะเบียนที่เป็นระเบียบ" — ครีม/ink/ส้ม · มือถือ 390 ก่อน แล้วขยาย 1440
>
> ไฟล์นี้คือ **แหล่งเดียว** ของสิ่งที่ใช้ได้ในการเขียน UI — ก่อนเขียนหน้าใหม่ให้เปิดไฟล์นี้ก่อน (skill `ui-consistency` บังคับ)
> ดูของจริงได้ที่หน้า `/ui-kit` (dev only, ไม่ลิงก์จากเมนู)
>
> **กฎ 3 ข้อ**
> 1. สี/ขนาด/มุม ใช้ผ่าน token class เท่านั้น — ห้าม hex, ห้าม `bg-[#...]`, ห้าม `text-[13px]` ถ้ามี token อยู่แล้ว
> 2. มี component ใน catalog แล้ว → ต้อง reuse ห้ามเขียนซ้ำ (ถ้าไม่พอดี → เพิ่ม prop/variant ที่ component เดิม)
> 3. ต้องการ token/component ใหม่ → เพิ่มที่ `app/globals.css` หรือ `components/**` **+ จดในไฟล์นี้ + วางตัวอย่างใน `/ui-kit`** ในคอมมิตเดียวกัน

---

## 1. Token (`app/globals.css`)

### 1.1 สี — ใช้ผ่าน `bg-*` / `text-*` / `border-*`

| token | ค่า | ใช้กับ |
|---|---|---|
| `background` | `#F7F4F0` paper | พื้นหลังแอป, กล่องหมายเหตุ, ช่องค้นหา |
| `canvas` | `#EDE8E2` | พื้นนอกสุด / พื้นหลัง PDF preview |
| `card` | `#FFFFFF` | การ์ด, แถบหัวหน้า, sidebar-footer มือถือ, ช่องกรอก |
| `surface-muted` | `#F1ECE6` | ช่องล็อกแก้ไม่ได้ (`readOnly`), track ของ bar, หัวตาราง PDF |
| `foreground` | `#3A2A1C` ink | ตัวอักษรหลัก |
| `muted-foreground` | `#8A7F73` | label, meta, placeholder, ข้อความรอง |
| `primary` | `#E8842B` | **ปุ่มหลัก (ปุ่มเดียวต่อหน้า)**, chip/เมนูที่เลือก, ขีด wizard, จุด timeline |
| `primary-hover` | `#CC6E1C` | hover ของ primary, **ลิงก์/ข้อความส้ม** ("แก้ไข", "แสดง", nav มือถือที่เลือก) |
| `primary-soft` | `#FBEAD8` | พื้นสิ่งที่เลือกใน SegmentedControl/preset, InfoNotice, avatar เซลล์ |
| `primary-soft-border` | `#F0D6B8` | ขอบของ InfoNotice แบบ `bordered` |
| `primary-soft-foreground` | `#6B4E2E` | ตัวอักษรบนพื้น primary-soft |
| `accent` | `#8A6D3B` | avatar ผู้บริหาร, hint พิเศษใน label |
| `destructive` | `#C0492F` | ตีกลับ, ปุ่มลบ × (ใช้เป็นขอบ/ตัวอักษร ไม่ใช้พื้นทึบ) |
| `success` | `#1F6B4A` | ปุ่ม "ปิดการขาย" เท่านั้น |
| `border` | `#E7E1DA` | ขอบการ์ด/ช่องกรอก, เส้นคั่นทั่วไป, เส้นประ ledger |
| `border-subtle` | `#F1ECE6` | เส้นคั่นแถวตารางเดสก์ท็อป |
| `border-strong` | `#D6CEC4` | เส้นตารางใน PDF |
| `ring` | = primary | focus ring |
| `sidebar` / `sidebar-foreground` | `#3A2A1C` / `#F7F4F0` | sidebar เดสก์ท็อป + แผงซ้ายหน้า login |
| `sidebar-muted` | `#C4B6A8` | เมนูที่ไม่ได้เลือก, ข้อความรองบน ink |
| `sidebar-border` / `sidebar-accent` | `#5A4635` | เส้นคั่น / hover ใน sidebar |
| `sidebar-primary` | `#E8842B` | เมนูที่เลือก |

**สถานะใบเสนอราคา** (6 สถานะ · key ตรงกับ DB · label ที่ `lib/constants/quotationStatus.ts`)

| status (DB) | token | เข้ม | soft | label |
|---|---|---|---|---|
| `draft` | `status-draft` | `#8A8178` | `#EEECE9` | ร่าง |
| `pending_approval` | `status-pending` | `#C68A1E` | `#FBEFD6` | รออนุมัติ |
| `approved` | `status-approved` | `#2E7D57` | `#E0F0E7` | อนุมัติแล้ว |
| `sent` | `status-sent` | `#2F6488` | `#E2EBF2` | ส่งลูกค้าแล้ว |
| `won` | `status-won` | `#1F6B4A` | `#DDEDE4` | ปิดการขาย |
| `returned` | `status-returned` | `#C0492F` | `#F8E4DF` | ตีกลับแก้ไข |

→ **ห้ามใช้ class `*-status-*` ตรงๆ ใน page/component ใหม่** — ใช้ผ่าน `STATUS_STYLE[status]` (`components/quotation/statusStyles.ts`) ซึ่งให้ `text` / `soft` / `bg` / `borderL` / `stripe` เป็น string เต็ม (Tailwind สแกน static — ห้ามต่อ string class)

### 1.2 ตัวอักษร

| ใช้กับ | class |
|---|---|
| หัวใหญ่ 30 (ตัวเลขภาพรวม, hero login) | `text-3xl font-semibold` |
| หัวหน้าเดสก์ท็อป 24 | `text-2xl font-semibold` |
| หัวหน้ามือถือ 20 | `text-xl font-semibold` |
| หัว section 16 | `text-base font-semibold` |
| เนื้อหา 14 | `text-sm` |
| เนื้อหาบนการ์ด 13 | `text-body` (token เพิ่ม) |
| label / meta 12 | `text-xs text-muted-foreground` |
| caption 11 | `text-2xs` (token เพิ่ม) |
| **ตัวเลข** ราคา/นน./จำนวน/วันที่ (ชิดขวา) | `numeric` (utility) — หรือใช้ `<NumericText>` |
| ตัวเลขไม่ชิดขวา (เลขที่ใบ, เบอร์โทร, เวลา) | `mono` (utility) |

- ฟอนต์: IBM Plex Sans Thai 400/500/600 (`font-sans`) · IBM Plex Mono (`font-mono`) — โหลดใน `app/layout.tsx`
- น้ำหนัก: หัวข้อ 600 · เน้น 500 · เนื้อหา 400 · ไม่ใช้ 700
- ไม่ใช้ตัวพิมพ์ใหญ่ทั้งหมดกับภาษาไทย

### 1.3 มุม / เงา / ขนาดสัมผัส

| สิ่ง | class |
|---|---|
| ปุ่ม, ช่องกรอก, กล่องหมายเหตุ (8px) | `rounded-md` |
| การ์ด (10px) | `rounded-lg` |
| รูปสินค้าย่อ (6px) | `rounded-sm` |
| pill / chip / avatar | `rounded-full` |
| เงาการ์ด/ปุ่มหลัก (บางมาก) | `shadow-card` |
| ปุ่มหลัก sticky มือถือ | สูง 52px = `Button size="lg"` |
| ปุ่ม/ช่องกรอกทั่วไปมือถือ | สูง ≥ 44px (Button default = 44 / Input = 48) · เดสก์ท็อป 40 / 44 |
| padding หน้า | มือถือ 16px · เดสก์ท็อป 32px (`PageBody`) |
| padding การ์ด | มือถือ 14px · เดสก์ท็อป 20px (`Card` จัดให้) |
| gap ระหว่างการ์ด | มือถือ 10–12px · เดสก์ท็อป 16–20px |

### 1.4 Utility เพิ่ม (นิยามใน globals.css)

| class | ใช้กับ |
|---|---|
| `numeric` | mono + tabular + ชิดขวา |
| `mono` | mono + tabular |
| `border-ledger` | เส้นประคั่นบรรทัดแบบสมุดชั่ง (signature) — ใช้กับแถวรายการสินค้า/ประวัติ |
| `stripe-placeholder` | ลายทางแทนรูปสินค้า/ลายเซ็นที่ยังไม่มี |
| `pb-safe` | เผื่อ home indicator |

---

## 2. Component catalog

### 2.1 `components/ui/` — shadcn base (ปรับให้ตรงดีไซน์แล้ว)

| component | หมายเหตุ |
|---|---|
| `Button` | **`loading`** = spinner + disabled (ใช้กับทุกปุ่มที่เรียก action) · variants: `default` (ส้ม — ปุ่มหลัก 1 ปุ่ม/หน้า), `outline` (ย้อนกลับ/บันทึกร่าง), `outline-primary` (+ เพิ่มสินค้า เดสก์ท็อป), `destructive` (ขอบแดง — ตีกลับ/ลบ), `success` (ปิดการขาย), `ghost`, `link` (แก้ไข) · sizes: `default` 44/40, `lg` 52 (sticky มือถือ), `sm` 36, `xs`, `icon*` |
| `Input` | 48/44px พื้นขาว focus ขอบส้ม · `readOnly` = พื้น surface-muted · ตัวเลขใส่ `className="numeric"`/`"mono"` |
| `Textarea` | เหมือน Input |
| `Label` | 12px muted (ใช้ผ่าน `FormField` เป็นหลัก) |
| `Badge` | pill ทั่วไป · variant `soft` = ส้มอ่อน · **สถานะเอกสารใช้ `StatusBadge` แทน** |
| `Card` + `CardHeader/Title/Content/Footer` | ขาว ขอบ 1px มุม 10px (ใช้ผ่าน `SectionCard` เป็นหลัก) |
| `Sheet` | base ของ `ProductPickerSheet`/`CustomerPickerSheet` — `side="bottom"` + class override ให้เป็น side ขวาบน md (ดูตัวอย่างในสองตัวนั้น) |
| `Dialog` | ยืนยัน/กรอกเหตุผล — ดู `ApprovalActions` · ใส่ `className="bg-card"` ที่ `DialogContent` · ปุ่มยืนยันอยู่ขวาใน `DialogFooter` |

### 2.2 `components/layout/` — โครงหน้า

| component | ใช้เมื่อ | props สำคัญ |
|---|---|---|
| `AppShell` | ครอบทุกหน้าหลังล็อกอิน (อยู่ใน `app/(app)/layout.tsx` แล้ว) | `user: { name, initials, role }` |
| `Sidebar` / `SidebarNav` | sidebar ink 240px เดสก์ท็อป — sticky สูงเท่าจอ โปรไฟล์/ออกจากระบบชิดล่างเสมอ (AppShell เรียกให้) | — |
| `BottomNav` | แถบเมนูล่าง 4 ช่อง มือถือ (AppShell เรียกให้) | — |
| `navItems.ts` | รายการเมนู (3 อันใน MVP — "ลูกค้า" ตัดออกจนกว่าจะมีหน้า) + `isNavActive` | แก้เมนูที่นี่ที่เดียว |
| `PageHeader` | แถบหัวขาวทุกหน้า (sticky มือถือ) | `title`, `subtitle`, `back`, `aside` (StatusBadge), `actions` (ปุ่ม/ค้นหา เดสก์ท็อป), `children` (แถวค้นหา/chips) |
| `PageBody` | พื้นที่เนื้อหาใต้หัว | `withActionBar` เมื่อหน้ามี StickyActionBar |
| `StickyActionBar` | ปุ่มหลัก sticky ล่างจอมือถือ (เหนือ BottomNav) — เดสก์ท็อปย้ายปุ่มไป `PageHeader.actions` | `split` = ย้อนกลับ \| ถัดไป |
| `BrandLogo` | โลโก้แบรนด์ (ไฟล์จริง `public/brand/logo.png`) | `size: sm/md/lg` = สูง 36/72/96px |
| `NavLink` (client) | ลิงก์เมนูที่ไอคอนเปลี่ยนเป็น spinner ระหว่างรอหน้า (Sidebar/BottomNav ใช้) | `href`, `icon`, `active` |
| `components/skeletons/PageSkeleton` | `HeaderSkeleton`, `CardSkeleton`, `ListSkeleton` — ใช้ใน `loading.tsx` ของทุก route | `chips`, `search`, `rows` |

### 2.3 `components/shared/` — ใช้ได้ทุกโดเมน

| component | ใช้เมื่อ | props สำคัญ |
|---|---|---|
| `SectionCard` | การ์ดขาวมีหัว — block พื้นฐานทุกหน้า | `title`, `step` ("01"), `meta` ("4 รายการ"), `action`, `flush` (รายการเต็มความกว้าง), `divided` |
| `FormField` | ครอบทุกช่องกรอกในฟอร์ม | `label`, `hint` (accent), `trailing` (mono ขวา), `error` |
| `SearchInput` | ช่องค้นหา (พื้นครีม) | เหมือน Input |
| `PriceInput` (client) | ช่องกรอกราคา — แสดง comma คั่นหลักพันขณะพิมพ์, ทศนิยม ≤ 2, แป้นตัวเลขบนมือถือ · ส่งค่าดิบไม่มี comma ผ่าน `onValueChange` | `value: number\|string`, `onValueChange(raw)`, ที่เหลือเหมือน Input |
| `Spinner` | spinner มาตรฐาน (Loader2 หมุน) — ใช้ใน Button loading / nav / sheet | `className`, `label` |
| `LinkButton` (client) | ปุ่มที่เป็นลิงก์ — แสดง spinner จนหน้าใหม่มา (`useLinkStatus`) **ใช้แทน `Button render={<Link/>}` เสมอ** | `href`, `icon`, + props ของ Button |
| `SegmentedControl` (client) | เลือก 2–3 ทาง: ลูกค้าเก่า/ใหม่, เครดิต/เงินสด | `options`, `value`, `onChange`, `size` |
| `NumericText` | ตัวเลข + หน่วยตัวเล็ก | `value`, `unit`, `size: sm…2xl`, `muted` |
| `ProductThumbnail` | รูปสินค้า (next/image) หรือ stripe placeholder | `src`, `size: sm 44 / md 64×52 / lg 72×56` |
| `UserAvatar` | อักษรย่อวงกลม | `initials`, `role: sale/executive` (type `Role` จาก `lib/auth/types`), `size` |
| `InfoNotice` | กล่องอธิบายกติกาพื้นส้มอ่อน (ไม่ใช่ error) | `bordered` |

### 2.4 `components/quotation/` — โดเมนใบเสนอราคา

| component | ใช้เมื่อ | props สำคัญ |
|---|---|---|
| `statusStyles.ts` → `STATUS_STYLE` | ทุกที่ที่ต้องแสดงสีตามสถานะ | `text`, `soft`, `bg`, `borderL`, `stripe` |
| `StatusBadge` | pill สถานะเอกสาร | `status` |
| `StatusDot` | จุดสีสถานะ | `status` |
| `StatusFilterChips` | แถว chip กรองสถานะ + จำนวน (เลื่อนแนวนอนบนมือถือ) | `items[{status\|'all', count, href}]`, `active` |
| `QuotationList` | รายการใบ responsive (การ์ด ↔ ตาราง) | `items: QuotationListItem[]`, `showOwner` (มุมผู้บริหาร), `emptyText` |
| `QuotationCard` / `QuotationTable` | ชิ้นส่วนของ QuotationList (ปกติไม่เรียกตรง) | — |
| `SortSelect` (client) | เรียงหน้ารายการ (native select + spinner) — รับ `params` object ไม่รับ function | `value`, `params: {status?, q?}` |
| `ListPagination` | ก่อนหน้า / n–m จาก total · หน้า x/y / ถัดไป — ซ่อนถ้าหน้าเดียว | `page`, `pageSize`, `total`, `hrefFor(page)` |
| `PriceTable` | **ตารางราคาต่อถุง** responsive — ไม่มีจำนวน ไม่มียอดรวม | `items: LedgerItem[]`, `renderTrailing` (ปุ่มลบ), `renderPrice` (input ราคาแทนตัวเลข), `footer` · ใส่ใน `SectionCard flush divided` |
| `LedgerRow` | บรรทัดสินค้าแบบสมุดชั่ง (signature element) | `item`, `variant: compact/table`, `index`, `trailing`, `priceSlot` |
| `QuotationForm` (client) | ฟอร์มสร้าง/แก้ใบทั้งหน้า — มือถือ wizard 3 ขั้น / เดสก์ท็อป 3 section · ใช้ที่ `/quotations/new` และ `/[id]/edit` | `initial`, `quotationId`, `products`, `customers`, `onSaveDraft`, `onSubmit` (server actions ส่งเข้ามา) |
| `ProductPickerSheet` (client) | bottom sheet (มือถือ) / side sheet (เดสก์ท็อป) เลือกสินค้า + กรอกราคา/ถุง | `products`, `excludeIds`, `onConfirm({productId, pricePerBag})` |
| `CustomerPickerSheet` (client) | sheet เลือกลูกค้าเก่า — โหลด on-demand ผ่าน server action (ล่าสุด 20 / ค้นหา debounce 250ms) | `onSearch`, `onSelect` |
| `SubmitButton` (client) | ปุ่ม "ส่งให้ผู้บริหารอนุมัติ" บนหน้าดูใบ | `id`, `disabled` |
| `ApprovalActions` (client) | ปุ่มผู้บริหารตอนรออนุมัติ: "อนุมัติ + เซ็น" (Dialog ยืนยัน + preview ลายเซ็น) และ "ตีกลับพร้อมเหตุผล" (Dialog + Textarea บังคับกรอก) · dialog ค้าง "กำลังอัปเดตหน้า…" จน refresh เสร็จ | `id`, `quoteNumber`, `signatureUrl`, `onApprove`, `onReject`, `layout: mobile/desktop` |
| `ExportPdfButton` (client) | เปิด `/api/quotations/:id/pdf` แท็บใหม่ แล้ว refresh · `primary` = ครั้งแรก (approved → sent) | `id`, `primary`, `label`, `size` |
| `CloseSaleButton` (client) | "ปิดการขาย" + Dialog ยืนยัน (sent → won) | `id`, `quoteNumber`, `onClose`, `size` |
| `SignatureCard` | การ์ด "ลายเซ็นอนุมัติ" — รูป (signed URL) เฉพาะผู้บริหาร · เซลล์เห็นชื่อ/วันที่ | `imageUrl`, `signedBy`, `signedAt`, `placeholder`, `hint` |
| `viewModel.ts` | แปลง `QuotationDetail` → props: `toLedgerItems`, `toCustomerSummary`, `toTimeline`, `toFormInitial` | pure — หน้า server เรียกก่อนส่งเข้า component |
| `CustomerSummary` | สรุปลูกค้า + หัวเอกสาร | `data: CustomerSummaryData`, `variant: compact (มือถือ) / grid (เดสก์ท็อป 3 คอลัมน์)` |
| `NoteList` | หมายเหตุ / เงื่อนไข | `notes`, `renderTrailing`, `footer` |
| `Timeline` | ประวัติ (audit log) | `entries: TimelineEntry[]` |
| `StatusProgress` | รายการสถานะเอกสารตาม flow (คอลัมน์ขวาหน้าดูใบ) | `current`, `currentHint` ("อยู่ที่คุณ") |
| `WizardSteps` | แถบ 3 ขั้นบนมือถือ (ลูกค้า → สินค้า → ตรวจสอบ) | `steps`, `current` |
| `CreditDaysPicker` (client) | เลือกวันเครดิต preset 7/15/20/30 + stepper | `value`, `onChange`, `min`, `max` |

### 2.5 `components/dashboard/` — ภาพรวม

| component | ใช้เมื่อ | props |
|---|---|---|
| `StatusCountCard` | การ์ดจำนวนใบต่อสถานะ (แถบซ้ายมือถือ / บนเดสก์ท็อป) กดไปรายการที่กรอง | `status`, `count`, `href` |
| `StatusBarChart` | แถบสัดส่วนตามสถานะ | `data[{status, count}]` |

### 2.6 `components/auth/`

| component | หมายเหตุ |
|---|---|
| `LoginForm` (client) | ช่องผู้ใช้/รหัสผ่าน + แสดง/ซ่อน + ปุ่มเข้าสู่ระบบ · `action: (prev, formData) => ActionResult` ใช้กับ `useActionState` — แสดง `fieldErrors` ใต้ช่อง / `message` เป็นกล่องแดง · ชื่อผู้ใช้ controlled (ไม่หายหลังรหัสผิด) |

---

## 3. สูตรประกอบหน้า (page recipes)

```
หน้าใดๆ (มือถือ)                        หน้าใดๆ (เดสก์ท็อป)
┌ PageHeader (sticky) ─────────┐        ┌ Sidebar ┬ PageHeader + actions ─────┐
│ title · subtitle · aside     │        │         │                            │
│ [SearchInput] [StatusChips]  │        │         ├ PageBody (p-8)             │
├ PageBody (p-4, pb เผื่อ bar) ┤        │         │  grid [1fr_340px] ถ้ามีคอลัมน์ขวา │
│ SectionCard / QuotationList  │        │         │  SectionCard...            │
├ StickyActionBar ─────────────┤        └─────────┴────────────────────────────┘
├ BottomNav ───────────────────┘
```

| หน้า | ประกอบจาก |
|---|---|
| รายการใบ (`/quotations`) | `PageHeader` (subtitle = ชื่อผู้ใช้, `actions` = `<form method="get">`+SearchInput+Button เดสก์ท็อป, children = form ค้นหามือถือ + `StatusFilterChips`) → `PageBody withActionBar` → `QuotationList showOwner={role==='executive'}` → `ListPagination` → `StickyActionBar` · filter อยู่ใน URL (`?status=&q=&page=`) parse ด้วย `quotationListFilterSchema` |
| สร้าง/แก้ใบ | **ใช้ `QuotationForm` ทั้งก้อน** (ภายในประกอบจาก `WizardSteps`, `SegmentedControl`, `CreditDaysPicker`, `PriceTable renderPrice/renderTrailing`, `NoteList`, `ProductPickerSheet`, `CustomerPickerSheet`, `StickyActionBar split`) — เดสก์ท็อป grid `[1fr_360px]` |
| ดู/อนุมัติใบ | `PageHeader back aside=<StatusBadge>` + ปุ่มตามบทบาท+สถานะใน `actions` (เดสก์ท็อป) / `StickyActionBar` (มือถือ) → grid `[1fr_340px]`: ซ้าย `CustomerSummary` · `SectionCard flush divided`+`PriceTable` · `Timeline` — ขวา `StatusProgress` · ลายเซ็น · `InfoNotice bordered` |
| ภาพรวม (`/dashboard`) | grid `StatusCountCard` ×6 (`grid-cols-2 md:grid-cols-6`) → `SectionCard` + `StatusBarChart` (แถวเป็นลิงก์) — ข้อมูลจาก `countQuotationsByStatus` |
| login | `app/(auth)/login/page.tsx` — แผง ink ซ้าย (lg+) + `LoginForm mobile` |

**ปุ่มตามบทบาท + สถานะ (หน้าดูใบ)**

| สถานะ | ผู้บริหาร | เซลล์เจ้าของ |
|---|---|---|
| รออนุมัติ | `ApprovalActions` (default "อนุมัติ + เซ็นลายเซ็น" + destructive "ตีกลับพร้อมเหตุผล") | — |
| อนุมัติแล้ว | `outline` "Export PDF ซ้ำ" (ไม่เปลี่ยนสถานะ) | `ExportPdfButton primary` "Export PDF" (→ sent อัตโนมัติ) |
| ส่งลูกค้าแล้ว | `outline` "Export PDF ซ้ำ" | `CloseSaleButton` + `outline` "Export PDF ซ้ำ" |
| ปิดการขาย | `outline` "Export PDF ซ้ำ" | `outline` "Export PDF ซ้ำ" |
| ร่าง/ตีกลับ | — | `default` "ส่งให้ผู้บริหารอนุมัติ" + `outline` "บันทึกร่าง" |

---

## 4. ต้องการ X → ใช้ Y (ตารางตัดสินใจ)

| ต้องการ | ใช้ | ห้าม |
|---|---|---|
| ปุ่ม | `<Button variant size>` | `<button className="bg-primary ...">` เอง |
| ปุ่มที่ไปหน้าอื่น | `<LinkButton href icon>` | `<Button render={<Link/>}>` (ไม่มี spinner) |
| ปุ่มเรียก action | `<Button loading={pending}>` | `disabled={pending}` + ข้อความเฉยๆ |
| หน้าใหม่ | ต้องมี `loading.tsx` (ใช้ skeleton จาก `PageSkeleton`) | ปล่อยหน้าขาวระหว่างโหลด |
| ส่ง prop จาก server → client component | ข้อมูล plain (string/object) | function (จะพังตอน render: "Functions cannot be passed to Client Components") |
| แสดงสถานะใบ | `<StatusBadge status>` | `<Badge className="bg-[#FBEFD6]">` / เขียน pill เอง |
| สีตามสถานะที่อื่น (จุด, แถบ, ตัวเลข) | `STATUS_STYLE[status].bg/.text/.borderL` | `bg-status-${x}` (ต่อ string) |
| ป้ายภาษาไทยของสถานะ | `STATUS_LABEL[status]` | พิมพ์ "รออนุมัติ" ซ้ำในหน้า |
| ตัวเลขราคา/นน. | `<NumericText>` หรือ class `numeric` | `font-mono text-right` เขียนเอง |
| การ์ดขาวมีหัว | `<SectionCard>` | `<div className="rounded-lg border bg-card p-4">` ซ้ำๆ |
| label + input | `<FormField label><Input/></FormField>` | `<label>` + `<input>` เปล่า |
| รายการสินค้า | `<PriceTable>` | ตาราง `<table>` เอง |
| รูปสินค้า | `<ProductThumbnail>` | `<img>` |
| หัวหน้า + ปุ่มขวา | `<PageHeader actions>` | header เขียนเอง |
| ปุ่มหลักมือถือ | `<StickyActionBar>` + `size="lg"` | `fixed bottom-0` เขียนเอง |
| กล่องอธิบาย | `<InfoNotice>` | `bg-primary-soft` เขียนเอง |
| ข้อความส้ม/ลิงก์ | `text-primary-hover` | `text-primary` (ส้มสว่างใช้กับพื้นทึบเท่านั้น) |
| สีจากดีไซน์ที่ยังไม่มี token | เพิ่มที่ `globals.css` + ตารางข้อ 1 ก่อน | `bg-[#...]` |
| หัวตาราง | `bg-card text-xs font-semibold text-foreground` + `border-b border-border` (เหมือน `QuotationTable`/`PriceTable`) | ตัวเทาบาง / พื้นเทา — กลืนกับพื้น |
| แถว/การ์ด/ตัวเลือกที่กดได้ (ไม่ใช่ Button) | `transition-colors hover:bg-background` (บนพื้น card) หรือ `hover:bg-muted` (บนพื้นแอป) **+ `active:bg-muted`** — มือถือไม่มี hover ต้องมี feedback ตอนแตะ | ไม่ใส่อะไรเลย / `hover:` อย่างเดียว |
| cursor ปุ่ม | ไม่ต้องใส่ — `globals.css` ให้ `button`, `[role=button]`, `[role=option]` เป็น pointer แล้ว (Tailwind v4 ไม่ใส่ให้) | `cursor-pointer` รายตัว |

---

## 5. ยังไม่มีใน kit (ทำเมื่อถึงงานนั้น — เพิ่มที่นี่เมื่อสร้าง)

- `Select` (จังหวัด), date picker (วันที่เสนอราคา) → shadcn `Select` / `Calendar` ปรับสูง 48/44
- `Toast` — แจ้งผลบันทึก/ส่งอนุมัติ
- โลโก้จริงใน PDF (`lib/pdf/quotationPdf.tsx` ตอนนี้เป็นกล่อง placeholder "ORGANIC"/"แม่ครัว") — ใส่ไฟล์ png แล้ว `<Image>` แทน
- โหมดมืด — ไม่อยู่ในดีไซน์ MVP

---

## 6. PDF (`lib/pdf/quotationPdf.tsx`) — กฎเฉพาะ

- ใช้ **@react-pdf/renderer** ฝั่ง server · ฟอนต์ฝังจาก `lib/pdf/fonts/` (IBM Plex Sans Thai 400/500/600 + Plex Mono 400/500, OFL)
- สี = hex ชุดเดียวกับ token (PDF ไม่มี CSS variable) — อยู่ใน `const C` ไฟล์เดียว
- **ทุกข้อความใช้ `<T>` ไม่ใช่ `<Text>`** — `<T>` decompose "ำ" ให้ (react-pdf บั๊กตัดตัวท้ายบรรทัดถ้ามี ำ: [issue #3295](https://github.com/diegomura/react-pdf/issues/3295))
- **ตัวเลข/ละตินเท่านั้นใช้ `<M>` (Plex Mono)** — Mono ไม่มี glyph ไทย ห้ามใส่ "กก." "โทร" ใน M
- ข้อความยาวภาษาไทยไม่มีช่องว่างจะไม่ตัดบรรทัด (react-pdf ไม่มี dictionary ไทย) — หมายเหตุควรเว้นวรรคตามปกติ
- ทดสอบดูผลจริง: `npx vitest run lib/pdf` แล้ว render ตัวอย่างดู (macOS: `qlmanage -t -s 1400 -o . file.pdf`)
