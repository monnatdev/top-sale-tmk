---
name: ui-consistency
description: บังคับ reuse component + design token จาก docs/UI-KIT.md ทุกครั้งที่สร้าง/แก้ UI (หน้า, component, ฟอร์ม, รายการ, ปุ่ม, สี, ขนาด) — ใช้เมื่อแตะไฟล์ใน app/**/*.tsx หรือ components/** หรือ globals.css หรือเมื่อผู้ใช้ขอหน้า/UI ใหม่
---

# UI Consistency — reuse ก่อน สร้างทีหลัง

> UI ทั้งหมดต้องมาจาก **catalog เดียว**: `docs/UI-KIT.md` (token + component) · ของจริงดูที่หน้า `/ui-kit`
> ถ้าสิ่งที่ต้องการมีใน catalog แล้ว → ใช้ของเดิม · ถ้าไม่มี → เพิ่มเข้า catalog ก่อน แล้วค่อยใช้ (ไม่มีทางลัด)

---

## 1. ก่อนเขียน UI ทุกครั้ง (บังคับ)

1. **อ่าน `docs/UI-KIT.md`** ข้อ 2 (catalog) + ข้อ 4 (ตาราง ต้องการ X → ใช้ Y)
2. ระบุว่าหน้า/ส่วนที่จะทำ ประกอบจาก component ไหนบ้าง — เทียบกับ "สูตรประกอบหน้า" ข้อ 3 ของ UI-KIT
3. ถ้ามีอะไรที่ catalog ไม่มี → ตัดสินใจ 1 ใน 3 ทาง **ก่อนเขียน**:
   - **ขยาย component เดิม** (เพิ่ม prop/variant) — ทางแรกที่ควรเลือกเสมอ
   - **สร้าง component ใหม่** ใน `components/<โดเมน>/` — เมื่อเป็น pattern ใหม่จริงที่จะใช้ซ้ำ ≥ 2 ที่ หรือเป็น block ที่มีใน Claude Design
   - **เขียน inline ในหน้า** — ได้เฉพาะ layout ประกอบ (grid/flex/gap) ไม่ใช่ visual pattern ใหม่
4. ถ้าต้องมีสี/ขนาด/มุมที่ token ไม่มี → เพิ่ม token ที่ `app/globals.css` ก่อน (ดูข้อ 4)

---

## 2. กฎที่ห้ามละเมิด (reviewer จะเช็กตามนี้)

| ห้าม | ทำแทน |
|---|---|
| hex/rgb ใน component หรือหน้า (`#E8842B`, `bg-[#...]`, `text-[#...]`, `style={{ color: "#..." }}`) | token class: `bg-primary`, `text-muted-foreground`, … |
| `text-[13px]`, `text-[11px]` | `text-body`, `text-2xs` |
| `font-mono text-right tabular-nums` เขียนเอง | class `numeric` / `mono` หรือ `<NumericText>` |
| ต่อ string class ตามสถานะ: `` `bg-status-${s}` `` | `STATUS_STYLE[status].bg` (string เต็ม) |
| พิมพ์ป้ายสถานะไทยซ้ำ ("รออนุมัติ") | `STATUS_LABEL[status]` จาก `lib/constants/quotationStatus.ts` |
| `<button>` / `<input>` เปล่า, `<img>` | `<Button>`, `<Input>`+`<FormField>`, `<ProductThumbnail>`/`next/image` |
| pill/การ์ด/หัวหน้า/แถบปุ่มล่าง เขียนใหม่ | `StatusBadge`/`Badge`, `SectionCard`, `PageHeader`, `StickyActionBar` |
| ปุ่มส้มทึบ (`variant="default"`) มากกว่า 1 ปุ่มต่อหน้า (ต่อ viewport) | ปุ่มรองใช้ `outline` / `outline-primary` / `link` |
| `text-primary` กับข้อความบนพื้นสว่าง | `text-primary-hover` (ส้มสว่างใช้กับพื้นทึบ/ตัวเลขบน ink เท่านั้น) |
| ปุ่ม/ช่องกรอกสูง < 44px บนมือถือ | ใช้ size default ของ `Button`/`Input` (ปรับให้แล้ว) |
| เขียน `md:` ก่อน base (desktop-first) | mobile-first: base = 390px แล้วค่อย `md:`/`lg:` |
| ข้อความไทยของ UI กระจายในหลายไฟล์ (label ปุ่มเดียวกันสะกดต่างกัน) | ใช้คำเดียวกับใน UI-KIT/ดีไซน์ · ป้ายที่ซ้ำหลายหน้าให้ยกไป `lib/constants/` |
| `"use client"` บน component ที่ไม่มี state/handler | Server Component เป็นค่าเริ่มต้น · แยกส่วน interactive เป็น client เล็กๆ |

---

## 3. ขั้นตอนเมื่อสร้าง component ใหม่

1. วางไฟล์ตามโดเมน: `components/shared/` (ใช้ได้ทุกที่) · `components/quotation/` · `components/dashboard/` · `components/layout/` · `components/auth/` — ชื่อ `PascalCase.tsx`
2. Props เป็น **ข้อมูลที่ format แล้ว** (string วันที่, ราคา) + slot (`ReactNode`) สำหรับปุ่ม/action — component ไม่ดึงข้อมูล ไม่มี business logic (CLAUDE.md §10)
3. ประกอบจาก primitive ใน `components/ui/` + token — ไม่ใช้ hex
4. **จดใน `docs/UI-KIT.md`** ตารางของโดเมนนั้น: ชื่อ · ใช้เมื่อ · props สำคัญ (1 แถว)
5. **วางตัวอย่างใน `app/(app)/ui-kit/page.tsx`** (ถ้าต้องมี state ให้ใส่ใน `InteractiveDemos.tsx`)
6. ถ้าแทนที่รายการใน UI-KIT ข้อ 5 ("ยังไม่มีใน kit") ให้ลบออกจากข้อ 5

ทั้ง 6 ข้อต้องอยู่ใน **คอมมิตเดียวกัน** — component ที่ไม่อยู่ใน catalog ถือว่ายังไม่เสร็จ

---

## 4. ขั้นตอนเมื่อเพิ่ม token ใหม่

1. ยืนยันว่ามีในดีไซน์ Claude Design จริง (หรือผู้ใช้สั่ง) — ไม่คิดสีเอง
2. `app/globals.css`: เพิ่มตัวแปรใน `:root` (hex) + map ใน `@theme inline` (`--color-*`) เพื่อให้เป็น class ได้
3. ตั้งชื่อตามความหมาย (`surface-muted`, `status-pending`) ไม่ตั้งตามสี (`brown-2`)
4. จดในตาราง `docs/UI-KIT.md` ข้อ 1 + วาง swatch ใน `/ui-kit` (array `COLOR_TOKENS`)

---

## 5. ตรวจก่อนส่งงาน (รันทุกครั้งที่แตะ UI)

```bash
# 1) ไม่มี hex / arbitrary color นอก globals.css
grep -rnE '#[0-9A-Fa-f]{3,8}\b|\b(bg|text|border|ring|from|to)-\[#' app components --include='*.tsx' \
  | grep -vE 'app/globals.css|themeColor'   # ต้องว่าง (themeColor ใน layout.tsx เป็น metadata ไม่ใช่ style)

# 2) ไม่มี arbitrary font-size ที่มี token แล้ว
grep -rnE 'text-\[(11|13)px\]' app components --include='*.tsx'   # ต้องว่าง

# 3) ไม่ต่อ string class สถานะ
grep -rnE 'status-\$\{' app components --include='*.tsx'   # ต้องว่าง

# 4) ไม่มี element ดิบที่มี component แทน
grep -rnE '<(button|input|img)[ >]' app components --include='*.tsx' \
  | grep -vE 'components/ui/|components/shared/SegmentedControl|components/quotation/CreditDaysPicker|components/auth/LoginForm'   # ควรว่าง — ถ้ามี ต้องมีเหตุผล

# 5) type + lint
npm run typecheck && npm run lint
```

จากนั้นเปิด `/ui-kit` + หน้าที่แก้ ที่ความกว้าง **390** และ **1440** — เทียบกับดีไซน์ (ปุ่มหลัก 1 ปุ่ม, ตัวเลขชิดขวาหลักตรง, แถบสีสถานะ, ปุ่ม ≥ 44px)

---

## 6. สรุปสำหรับ reviewer

PR ที่แตะ UI ต้องตอบได้ว่า:
- [ ] component ทุกตัวที่ใช้อยู่ใน `docs/UI-KIT.md` — ตัวใหม่ถูกจดแล้ว + มีใน `/ui-kit`
- [ ] ไม่มี hex / arbitrary color / arbitrary font-size (grep ข้อ 5 ว่าง)
- [ ] สถานะผ่าน `StatusBadge` / `STATUS_STYLE` / `STATUS_LABEL` เท่านั้น
- [ ] ปุ่มส้ม 1 ปุ่มต่อหน้า · มือถือมี `StickyActionBar` · เดสก์ท็อปปุ่มอยู่ใน `PageHeader.actions`
- [ ] mobile-first, ปุ่ม/ช่องกรอก ≥ 44px, ตัวเลข `numeric`
