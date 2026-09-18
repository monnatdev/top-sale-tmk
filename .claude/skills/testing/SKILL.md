---
name: testing
description: แนวทางเขียนเทสเบื้องต้นของโปรเจกต์ใบเสนอราคา (Vitest) — ใช้เมื่อสร้าง/แก้ service, query, validation, state machine หรือเมื่อผู้ใช้สั่ง "เขียนเทส" / "เทสสิทธิ์" / "รันเทส"
---

# Testing — แนวทางเขียนเทสเบื้องต้น

> เป้าหมายของเทสในโปรเจกต์นี้ไม่ใช่ coverage 100% แต่คือ **กันพังในจุดที่พังแล้วเจ็บ**:
> สิทธิ์ (เซลล์เห็นใบคนอื่น), state machine (อนุมัติผิดสถานะ), และเลขที่ใบซ้ำ

---

## 1. Stack

- **Vitest** — unit/integration test (เร็ว, รองรับ TS + path alias `@/` ของ Next.js)
- **Testing Library** (`@testing-library/react`) — เฉพาะ component ที่มี logic จริง (ฟอร์ม) — ไม่เทส component แสดงผลล้วน
- **Playwright** — E2E เฉพาะ flow หลัก ทำตอนท้าย (แผนข้อ 11-12) ไม่ทำก่อน
- ไม่ใช้ Jest

ติดตั้งครั้งแรก:
```bash
npm i -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
```

`vitest.config.ts` (root):
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",              // service/query test = node · component test ใส่ // @vitest-environment jsdom ที่หัวไฟล์
    include: ["**/*.test.ts", "**/*.test.tsx"],
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

## 2. วางไฟล์เทสตรงไหน

เทสอยู่ **ข้างไฟล์ที่เทส** ชื่อ `<file>.test.ts`:

```
/lib/services/quotationService.ts
/lib/services/quotationService.test.ts
/lib/validation/quotation.ts
/lib/validation/quotation.test.ts
/tests
  setup.ts            global setup (env, matchers)
  factories.ts        สร้าง test data (makeUser, makeQuotation, ...)
  e2e/                Playwright (ทีหลัง)
```

---

## 3. เทสอะไร / ไม่เทสอะไร

**ต้องเทส (บังคับ):**
| ชั้น | เทสอะไร |
|---|---|
| `/lib/services` | rule ทางธุรกิจทุกข้อ — state machine, สิทธิ์, running number, snapshot ข้อมูล, audit log ถูกเขียน |
| `/lib/validation` | Zod schema: input ถูกผ่าน / input ผิด reject พร้อม error ที่ถูกต้อง |
| `/lib/auth` | `scopeToUser` กรอง owner ถูก · executive ไม่ถูกกรอง |
| `/lib/db/queries` | เฉพาะ query ที่มีเงื่อนไขสิทธิ์ (`getQuotationById(id, user)`) — เทสกับ DB จริง (ดูข้อ 5) |

**ไม่ต้องเทส:**
- Component แสดงผลล้วน (Card, Badge, Table)
- shadcn/ui components
- API route / server action ที่บางจริงๆ (parse → auth → service) — ถ้าอยากเทส ให้เทสผ่าน E2E แทน
- Drizzle schema

---

## 4. Pattern การเขียน

### 4.1 โครง test case
ใช้ `describe` ตามฟังก์ชัน, ชื่อ `it` เป็นประโยคที่บอก rule ชัดๆ (ภาษาอังกฤษ):
```ts
describe("approveQuotation", () => {
  it("moves pending_approval → approved and stamps signature", ...);
  it("rejects when actor is a sale", ...);
  it("rejects when status is draft", ...);
  it("writes audit_log in the same transaction", ...);
});
```

### 4.2 Arrange / Act / Assert
```ts
it("rejects when actor is a sale", async () => {
  // arrange
  const sale = makeUser({ role: "sale" });
  const quotation = makeQuotation({ status: "pending_approval" });
  queries.getQuotationById.mockResolvedValue(quotation);

  // act + assert
  await expect(approveQuotation(quotation.id, sale)).rejects.toThrow(ForbiddenError);
  expect(queries.updateQuotationStatus).not.toHaveBeenCalled();
});
```

### 4.3 Service test: mock ชั้น query
Service เรียก query ไม่แตะ DB ตรง → เทส service โดย mock `/lib/db/queries` ทั้งโมดูล:
```ts
import { vi } from "vitest";
vi.mock("@/lib/db/queries/quotations");
import * as queries from "@/lib/db/queries/quotations";
const mocked = vi.mocked(queries);
```
- **ห้าม** mock Drizzle/`db` ตรงๆ ใน service test — ถ้าต้องทำแปลว่า service เขียน SQL เอง ซึ่งผิดกฎ CLAUDE.md ข้อ 2
- transaction: ถ้า service รับ `tx` มา ให้ mock `db.transaction` ให้เรียก callback ด้วย fake tx แล้ว assert ว่า audit log ถูกเขียนใน callback เดียวกัน

### 4.4 Factories — ไม่สร้าง object มือทุกเทส
`tests/factories.ts`:
```ts
export const makeUser = (o: Partial<User> = {}): User => ({
  id: "user-1", name: "เซลล์ A", role: "sale", isActive: true, ...o,
});
export const makeQuotation = (o: Partial<Quotation> = {}): Quotation => ({
  id: "q-1", quoteNumber: "QT-2569-0001", ownerId: "user-1", status: "draft", ...o,
});
```
ค่า default ต้องเป็นเคส "ปกติที่สุด" แล้ว override เฉพาะที่เทสสนใจ

---

## 5. เทสสิทธิ์ (บังคับ — ห้ามข้าม)

ทุก feature ที่แตะใบเสนอราคา/ลูกค้า ต้องมีเทสชุดนี้อย่างน้อย:

```ts
describe("authorization", () => {
  const saleA = makeUser({ id: "sale-a", role: "sale" });
  const saleB = makeUser({ id: "sale-b", role: "sale" });
  const exec  = makeUser({ id: "exec-1", role: "executive" });
  const quotationOfB = makeQuotation({ ownerId: "sale-b" });

  it("sale A cannot read sale B's quotation → not found", ...);   // ไม่ใช่ forbidden — ไม่บอกว่ามีอยู่
  it("sale A cannot update sale B's quotation", ...);
  it("sale A cannot submit sale B's quotation for approval", ...);
  it("executive can read any quotation", ...);
  it("sale cannot approve / reject", ...);
  it("executive cannot edit item prices", ...);
});
```

**Query ที่กรองสิทธิ์ต้องเทสกับ DB จริง** (mock แล้วไม่มีความหมาย):
- ใช้ Supabase local (`supabase start`) หรือ DB แยกสำหรับเทส ผ่าน `DATABASE_URL_TEST`
- แต่ละเทส: seed → run query → assert → cleanup ใน `afterEach` (หรือ wrap ใน transaction แล้ว rollback)
- ไฟล์ชื่อ `*.db.test.ts` และแยก script `test:db` เพื่อไม่ให้ unit test ช้า

---

## 6. เทส State machine

เขียนเป็น **ตาราง transition** แล้ว loop — ครอบคลุมทั้งที่ควรผ่านและควร reject:

```ts
const cases: Array<[from: Status, action: string, role: Role, ok: boolean]> = [
  ["draft",            "submit",  "sale",      true ],
  ["returned",         "submit",  "sale",      true ],
  ["pending_approval", "approve", "executive", true ],
  ["pending_approval", "reject",  "executive", true ],
  ["approved",         "export",  "sale",      true ],
  ["sent",             "close",   "sale",      true ],
  // ที่ต้องไม่ผ่าน
  ["draft",            "approve", "executive", false],
  ["approved",         "submit",  "sale",      false],
  ["pending_approval", "approve", "sale",      false],
  ["won",              "close",   "sale",      false],
];
it.each(cases)("%s + %s by %s → ok=%s", async (from, action, role, ok) => { ... });
```

---

## 7. Validation test (Zod)

ต่อ schema เทสอย่างน้อย: (1) input ถูกต้องผ่าน (2) แต่ละ field บังคับ ขาดแล้ว reject (3) ค่าขอบ เช่น ราคาติดลบ, ราคา 0, นน. ไม่ใช่ตัวเลข
```ts
it("rejects negative price_per_bag", () => {
  const r = quotationItemSchema.safeParse({ ...valid, pricePerBag: -1 });
  expect(r.success).toBe(false);
});
```

---

## 8. กฎทั่วไป

- เทสต้อง **deterministic** — ไม่พึ่งเวลาปัจจุบัน (ใช้ `vi.useFakeTimers()` / inject `now`) ไม่พึ่งลำดับ ไม่พึ่ง network
- 1 `it` = 1 พฤติกรรม · ถ้าต้อง assert 5 อย่างที่ไม่เกี่ยวกัน แยก `it`
- อย่าเทส implementation (เรียก function ภายในกี่ครั้ง) — เทสผลลัพธ์/side effect ที่มีความหมาย (status เปลี่ยน, audit log ถูกเขียน)
- ไม่ใช้ `any` ในเทส · ไม่ `skip` เทสทิ้งไว้โดยไม่มี comment เหตุผล
- เทสที่ fail = งานยังไม่เสร็จ — ห้ามแก้เทสให้ผ่านโดยไม่เข้าใจว่าทำไม fail
- ไม่มี secret จริงในไฟล์เทส · ใช้ `.env.test` (อยู่ใน `.gitignore`)

---

## 9. Workflow ตอนทำแต่ละงานใน BRIEF.md

1. เขียน service/validation
2. เขียนเทส rule หลัก + เทสสิทธิ์ (ข้อ 5)
3. `npm test` ต้องเขียวทั้งหมด
4. สรุปให้ผู้ใช้ว่าเทสครอบคลุมอะไร และอะไรที่ต้องเทสมือ (UI/มือถือ)
