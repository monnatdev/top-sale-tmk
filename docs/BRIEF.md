# Brief สำหรับ Claude Code — สร้าง MVP ระบบใบเสนอราคา

> วิธีใช้: วางไฟล์นี้ไว้ในโปรเจกต์ (เช่น `docs/BRIEF.md`) แล้วให้ Claude Code อ่านเป็น context หลัก
> **อย่าสั่ง "สร้างทั้งระบบให้ที"** — ให้สั่งทีละงานตามลำดับใน "แผนการ build" ด้านล่าง จะได้ของที่คุมได้และคุณภาพดี
> เรื่อง UI: เอาโค้ดที่ export จาก Claude Design มาวางเป็นจุดตั้งต้นก่อน แล้วให้ Claude Code ต่อ logic/backend เข้าไป — อย่าให้มันสร้าง UI ใหม่จากศูนย์

---

## 1. ภาพรวมระบบ

ระบบออกใบเสนอราคา (MVP) ของบริษัทจำหน่ายข้าวสาร ใช้แทนการทำใบเสนอราคาใน Excel/Word
ผู้ใช้ 2 บทบาท: **เซลล์ (sale)** สร้าง/ส่ง/export/ปิดการขาย · **ผู้บริหาร (executive)** อนุมัติ+เซ็น/ตีกลับ
UI ภาษาไทยทั้งหมด, mobile-first (พนักงานใช้มือถือเป็นหลัก)

**ขอบเขต MVP:** ออกใบเสนอราคา + วงจรอนุมัติ เท่านั้น — ยังไม่มี PO/จัดส่ง/สต็อก/คนขับ/แผนที่

---

## 2. Tech Stack (ตัดสินใจแล้ว)

- **Framework:** Next.js (App Router) + TypeScript — fullstack (ไม่แยก backend)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (หรือ Better Auth บน Postgres เดียวกัน — ยืนยันตอน setup)
- **Storage:** Supabase Storage (รูปสินค้า + ลายเซ็นผู้บริหาร)
- **PDF:** generate ฝั่ง server
- **Deploy:** Vercel (frontend/serverless) + Supabase (data) — region สิงคโปร์
- **Styling:** ตาม design system จาก Claude Design (ธีมส้ม, IBM Plex Sans Thai, ตัวเลข tabular)

---

## 3. กฎสถาปัตยกรรม (สำคัญ — วางโครงให้ถูกตั้งแต่แรก)

**แยกชั้น logic ชัดเจน แม้จะไม่แยก deploy** เพื่อให้อนาคตแยก API ออกได้ง่ายถ้าจำเป็น:

```
/app              หน้าเว็บ (Server Components เป็นหลัก)
/app/api          API routes — บางๆ แค่รับ request → เรียก service → ตอบ
/lib/services     business logic ทั้งหมด (ไม่ผูกกับ Next.js) — สร้างใบ, เปลี่ยนสถานะ, อนุมัติ ฯลฯ
/lib/db           database access layer (query ทั้งหมดอยู่ที่นี่)
/lib/auth         ตรวจ session + สิทธิ์
/lib/pdf          generate PDF
/components        UI components (จาก Claude Design)
```

**กฎเหล็ก:**
- **ทุก query database ผ่าน backend (server) เท่านั้น** — frontend ไม่เรียก Supabase ตรง (คุมสิทธิ์ง่ายกว่า พลาดยากกว่า)
- business logic ไม่อยู่ใน API route หรือ component — อยู่ใน `/lib/services`
- `service_role key` อยู่ฝั่ง server เท่านั้น

---

## 4. Data Model (ตารางหลัก)

**profiles** (ผู้ใช้ — ต่อจาก auth user)
- id, name, role (`sale` | `executive`), signature_url (เฉพาะผู้บริหาร), is_active

**customers** (ลูกค้า)
- id, company_name, address, phone, tax_id, payment_type (`credit` | `cash`), created_by

**products** (สินค้า master)
- id, name, packaging_spec (ข้อความ เช่น "บรรจุถุง PP ขาวล้วน ติดแท็ก"), weight_per_bag (นน./ถุง เช่น 45), image_url, is_active

**quotations** (ใบเสนอราคา)
- id, quote_number (QT-2569-xxxx, รันรายปี), customer_id, owner_id (เซลล์เจ้าของ), status, quote_date, valid_until, created_at
- **snapshot ข้อมูลลูกค้าในใบ** (customer_name/address/phone/tax_id/payment_type) — เพราะแก้ในใบได้โดยไม่กระทบ master
- signed_by, signed_at (ตอนอนุมัติ)

**quotation_items** (รายการสินค้าในใบ — 4 คอลัมน์ตามใบจริง)
- id, quotation_id, product_id, product_name (snapshot), packaging_spec (snapshot), weight_per_bag (snapshot), image_url (snapshot), price_per_bag
- **ไม่มี** quantity, ไม่มี line_total, ไม่มี tax

**quotation_notes** (หมายเหตุหลายอัน)
- id, quotation_id, text, order

**audit_log** (ประวัติแบบง่าย)
- id, quotation_id, actor_id, action (สร้าง/ส่งอนุมัติ/อนุมัติ/ตีกลับ/แก้ไข/export/ปิดการขาย), detail (เช่น "ราคาข้อ 1: 1,150 → 1,100"), created_at

> หมายเหตุ snapshot: เก็บชื่อ/สเปก/ราคาสินค้า และข้อมูลลูกค้า ไว้ในใบ ณ ตอนสร้าง เพราะถ้า master เปลี่ยนทีหลัง ใบเก่าต้องไม่เปลี่ยนตาม

---

## 5. สิทธิ์ (Authorization) — หัวใจของระบบ

- **เซลล์เห็นเฉพาะใบของตัวเอง** — ทุก query ใบเสนอราคาต้อง `WHERE owner_id = current_user_id` (ยกเว้นผู้บริหาร)
- **ผู้บริหารเห็นทุกใบ**
- **ผู้บริหารเท่านั้นอนุมัติ/ตีกลับได้** — บังคับที่ backend
- **กัน IDOR:** เปิดใบด้วย id ต้องเช็ก owner เสมอ ไม่ใช่ดึงตาม id ตรงๆ
- **ตัดสินใจแล้ว (2026-09-16): คุมสิทธิ์ที่ backend ล้วน** — เช็กในทุก service/query ผ่าน `scopeToUser` · ไม่เขียน RLS policy
- แต่ทุกตาราง `ENABLE ROW LEVEL SECURITY` โดยไม่มี policy = ปิดทาง PostgREST/anon key ทั้งหมด (แอปต่อ DB ตรงด้วย role `postgres` ซึ่งเป็นเจ้าของตาราง จึงข้าม RLS)

---

## 6. State Machine ของสถานะใบเสนอราคา

```
ร่าง (draft)
  └─ เซลล์กด "ส่งอนุมัติ" → รออนุมัติ (pending_approval)
รออนุมัติ
  ├─ ผู้บริหารกด "อนุมัติ+เซ็น" → อนุมัติแล้ว (approved)  [ล็อกแก้ไม่ได้ + แปะลายเซ็น]
  └─ ผู้บริหารกด "ตีกลับ" (พร้อมเหตุผล) → ตีกลับแก้ไข (returned)
ตีกลับแก้ไข
  └─ เซลล์แก้แล้วกด "ส่งอนุมัติ" → รออนุมัติ (วนใหม่)
อนุมัติแล้ว
  └─ เซลล์กด "Export PDF" → ส่งลูกค้าแล้ว (sent)  [export = เปลี่ยนสถานะอัตโนมัติ]
ส่งลูกค้าแล้ว
  └─ เซลล์กด "ปิดการขาย" → ปิดการขาย (won)
```

- ทุกการเปลี่ยนสถานะ + การแก้ไขราคา → เขียน audit_log
- ตรวจสิทธิ์ทุก transition ที่ backend (ใครกดได้ตอนไหน)

---

## 7. ใบเสนอราคา & PDF

- ใบเสนอราคา = ตารางราคาต่อถุง 4 คอลัมน์: **รายการสินค้า (ชื่อ+สเปกบรรจุ) · นน./ถุง · ภาพสินค้า · ราคาส่ง/ถุง** — ไม่มีจำนวน/ยอดรวม/ภาษี
- **Export PDF** ตาม template จริงของบริษัท (Organic Power): หัวบริษัท+โลโก้ 2 อัน + ที่อยู่/เลขภาษี · "ใบเสนอราคา/Quotation" + วันที่ · "เรียน [ลูกค้า]" · ย่อหน้าแนะนำบริษัท · ตาราง 4 คอลัมน์ · หมายเหตุเงื่อนไข · ลายเซ็นผู้จัดการฝ่ายขาย + ช่องลูกค้าเซ็น
- **ลายเซ็น**: ดึงจาก profile ผู้บริหารที่อนุมัติ แปะอัตโนมัติ · เก็บใน storage ที่เข้าถึงต้องมีสิทธิ์ (ห้าม public URL เดาได้)
- gen PDF ฝั่ง server, ทำ async ถ้าช้า

---

## 8. Security (ทำตาม security-performance-checklist.md)

จุดที่ห้ามพลาด:
- กัน IDOR + เช็กสิทธิ์ทุก endpoint ที่ backend
- service_role key / .env ไม่หลุด (ไม่ commit git)
- token ใน httpOnly cookie · parameterized query · validate input ที่ backend
- ลายเซ็นผู้บริหารเข้าถึงต้องมีสิทธิ์
- audit log ทุก action สำคัญ

---

## 9. Performance

- **Database index:** owner_id, status, customer_id, created_at
- **กัน N+1:** ดึงใบ + items + notes ในครั้งเดียว (join/batch)
- หน้ารายการใบ: pagination
- ใช้ Server Components สำหรับหน้าที่แสดงข้อมูล
- รูปสินค้า: next/image (resize/lazy load) — สำคัญเพราะเซลล์ใช้มือถือ + เน็ตอาจช้า
- เป้า Lighthouse Performance > 85 บนมือถือ, LCP < 2.5s

---

## 10. แผนการ build (สั่ง Claude Code ทีละงาน ตามลำดับนี้)

1. **Setup** — Next.js + TS + โครงโฟลเดอร์ตามข้อ 3 + เชื่อม Supabase + ตั้ง env (dev/prod แยก) ✅
2. **Database schema** — สร้างตารางตามข้อ 4 + index ตามข้อ 9 + enable RLS (ไม่มี policy) ตามข้อ 5 ✅
3. **Auth + สิทธิ์** — login (ไม่มีสมัคร/ลืมรหัส), middleware ตรวจ session, helper เช็ก role, seed user แรก (admin) ✅
4. **Master data** — ~~CRUD สินค้า (+ อัปโหลดรูป) และลูกค้า~~ → **ข้าม (2026-09-17): MVP เพิ่มสินค้า/ลูกค้าผ่าน Supabase Table Editor เอง** · รูปสินค้าอัปโหลดเข้า bucket `product-images` แล้วใส่ path ใน `products.image_path` · ลูกค้าใหม่สร้างได้จากใน flow สร้างใบ (ข้อ 5)
5. **สร้างใบเสนอราคา** — หน้าสร้าง (wizard มือถือ / sections เว็บ) + เลือกลูกค้าเก่า/ใหม่ + เพิ่มสินค้า (4 คอลัมน์ ไม่มีจำนวน/ยอด) + หมายเหตุ + บันทึกร่าง/ส่งอนุมัติ ✅ (รวมหน้าดูใบแบบอ่านอย่างเดียว `/quotations/[id]`)
6. **วงจรอนุมัติ** — state machine ข้อ 6 + อนุมัติ+เซ็น + ตีกลับ+เหตุผล + ล็อกหลังอนุมัติ + audit log ✅ (ลายเซ็นอัปโหลดมือใน Storage — ดู SETUP.md ข้อ 6)
7. **Export PDF** — template Organic Power + แปะลายเซ็น + auto เปลี่ยนสถานะเป็น "ส่งลูกค้าแล้ว" ✅ (@react-pdf/renderer · ข้อมูลบริษัทใน `lib/constants/company.ts` **ยังเป็นค่าตัวอย่าง ต้องแก้**)
8. **ปิดการขาย** — ปุ่มเปลี่ยนสถานะ ✅
9. **รายการใบเสนอราคา** — list + กรองสถานะ + ค้นหา + สิทธิ์ (เซลล์เห็นเฉพาะตัวเอง) + pagination ✅
10. **ภาพรวม** — ใบเสนอราคาแยกตามสถานะ (นับจำนวน กดไปหน้ารายการที่กรอง) ✅
11. **Responsive + ขัดเกลา** — ทุกหน้าใช้มือถือได้จริง + loading state ✅ (loading.tsx/skeleton ทุกหน้า, spinner ปุ่ม/เมนู, error/not-found, sort+search+on-demand customer, Playwright e2e ใน repo — เหลือ: ทดสอบมือถือจริง/ปรับตาม feedback)
12. **ก่อน deploy** — error tracking (Sentry), npm audit, backup ทดสอบกู้, โอน ownership account ให้ลูกค้า

**วิธีสั่งแต่ละงาน:** "ทำข้อ X ตาม BRIEF.md" แล้วรีวิว/เทสก่อนไปข้อถัดไป อย่าข้ามไปหลายข้อพร้อมกัน
