// Import master data (สินค้า + ลูกค้าเก่า) จากไฟล์ Excel ที่ลูกค้ากรอก (docs/templates/master-data-template.xlsx)
// รัน:  npm run db:import            → import จริง
//       npm run db:import -- --dry-run → แค่อ่าน/ตรวจ ไม่เขียน DB/Storage
// อ่านจาก data/import/master-data.xlsx + รูปใน data/import/images/ (โฟลเดอร์ data/ อยู่ใน .gitignore เพราะเป็นข้อมูลจริง)
// idempotent: สินค้า match ด้วย (ชื่อ, นน./ถุง) · ลูกค้า match ด้วย (ชื่อบริษัท, ที่อยู่) — มีแล้วอัปเดต ไม่สร้างซ้ำ
import { config } from "dotenv";
config({ path: ".env.local" });
import { existsSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import sharp from "sharp";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import * as schema from "../lib/db/schema";
import { BUCKETS } from "../lib/storage/buckets";
import { normalizeAddressParts } from "../lib/utils/address";

const DRY_RUN = process.argv.includes("--dry-run");
const IMPORT_DIR = path.resolve("data/import");
const XLSX_PATH = path.join(IMPORT_DIR, "master-data.xlsx");
const IMAGES_DIR = path.join(IMPORT_DIR, "images");
const SHEET_PRODUCTS = "สินค้า";
const SHEET_CUSTOMERS = "ลูกค้าเก่า";
// รูปสินค้า: ย่อให้ด้านยาวสุด 1200px + jpeg → เล็กกว่าลิมิต bucket 2MB แน่นอน และพอสำหรับ thumbnail/PDF
const IMAGE_MAX_PX = 1200;
const IMAGE_JPEG_QUALITY = 85;
const PAYMENT_TYPE: Record<string, schema.PaymentType> = { เครดิต: "credit", เงินสด: "cash" };
const CREDIT_DAYS_DEFAULT = 30;

const { DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!DIRECT_URL || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("ต้องมี DIRECT_URL + NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY ใน .env.local");
}

type ProductRow = { row: number; name: string; packagingSpec: string; weightPerBag: number; sortOrder: number; imageFile: string };
type CustomerRow = { row: number } & Omit<schema.NewCustomer, "createdBy" | "id" | "createdAt" | "updatedAt">;

const warnings: string[] = [];
const warn = (sheet: string, row: number, msg: string) => warnings.push(`[${sheet} แถว ${row}] ${msg}`);

// ค่าใน cell อาจเป็น number / rich text / formula — บีบเป็น string ที่ trim แล้ว
function cellText(ws: ExcelJS.Worksheet, row: number, col: number): string {
  const v = ws.getRow(row).getCell(col).value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("").trim();
    if ("result" in v) return String(v.result ?? "").trim();
    if ("text" in v) return String(v.text).trim();
  }
  return String(v).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function isExampleRow(text: string) {
  return text.startsWith("(ตัวอย่าง)");
}

function readProducts(ws: ExcelJS.Worksheet): ProductRow[] {
  const rows: ProductRow[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const name = cellText(ws, r, 1);
    if (!name || isExampleRow(name)) continue;
    const weight = Number(cellText(ws, r, 3));
    if (!Number.isFinite(weight) || weight <= 0) {
      warn(SHEET_PRODUCTS, r, `น้ำหนักต่อถุงไม่ถูกต้อง "${cellText(ws, r, 3)}" — ข้ามแถวนี้`);
      continue;
    }
    const sortRaw = cellText(ws, r, 4);
    const sortOrder = sortRaw ? Number(sortRaw) : rows.length + 1;
    const imageFile = cellText(ws, r, 5);
    if (imageFile && !existsSync(path.join(IMAGES_DIR, imageFile))) {
      warn(SHEET_PRODUCTS, r, `ไม่พบไฟล์รูป "${imageFile}" ใน data/import/images — จะ import โดยไม่มีรูป`);
    }
    rows.push({ row: r, name, packagingSpec: cellText(ws, r, 2), weightPerBag: weight, sortOrder: Number.isFinite(sortOrder) ? sortOrder : rows.length + 1, imageFile });
  }
  return rows;
}

function readCustomers(ws: ExcelJS.Worksheet): CustomerRow[] {
  const rows: CustomerRow[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const companyName = cellText(ws, r, 1);
    if (!companyName || isExampleRow(companyName)) continue;

    const addr = normalizeAddressParts({
      addressLine: cellText(ws, r, 2),
      subDistrict: cellText(ws, r, 3),
      district: cellText(ws, r, 4),
      province: cellText(ws, r, 5),
      postalCode: cellText(ws, r, 6),
    });
    if (addr.postalCode && !/^\d{5}$/.test(addr.postalCode)) {
      warn(SHEET_CUSTOMERS, r, `รหัสไปรษณีย์ "${addr.postalCode}" ไม่ใช่ 5 หลัก — เว้นว่างไว้`);
      addr.postalCode = "";
    }
    let taxId: string | null = cellText(ws, r, 8).replace(/[\s-]/g, "") || null;
    if (taxId && !/^\d{13}$/.test(taxId)) {
      warn(SHEET_CUSTOMERS, r, `เลขผู้เสียภาษี "${taxId}" ไม่ใช่ 13 หลัก — เว้นว่างไว้`);
      taxId = null;
    }
    const paymentText = cellText(ws, r, 9);
    const paymentType = PAYMENT_TYPE[paymentText];
    if (!paymentType) {
      warn(SHEET_CUSTOMERS, r, `ประเภทการชำระ "${paymentText}" ต้องเป็น เครดิต/เงินสด — ข้ามแถวนี้`);
      continue;
    }
    const creditRaw = cellText(ws, r, 10);
    let creditDays = creditRaw ? Number(creditRaw) : CREDIT_DAYS_DEFAULT;
    if (!Number.isInteger(creditDays) || creditDays < 7 || creditDays > 30) {
      if (paymentType === "credit") warn(SHEET_CUSTOMERS, r, `วันเครดิต "${creditRaw}" ต้องอยู่ระหว่าง 7–30 — ใช้ ${CREDIT_DAYS_DEFAULT}`);
      creditDays = CREDIT_DAYS_DEFAULT;
    }
    // เบอร์โทร: แอปรับเฉพาะตัวเลข 9–10 หลัก (ตรงกับ Zod ในฟอร์ม) — ตัดขีด/ช่องว่าง · มีเบอร์ต่อ ("ต่อ 225") ต้องตัดออก
    let phone: string | null = cellText(ws, r, 7).replace(/[\s-]/g, "") || null;
    if (phone && !/^\d{9,10}$/.test(phone)) {
      const digits = phone.match(/^\d{9,10}/)?.[0] ?? null;
      warn(SHEET_CUSTOMERS, r, `เบอร์โทร "${cellText(ws, r, 7)}" ไม่ใช่ตัวเลข 9–10 หลัก — ${digits ? `ใช้ "${digits}"` : "เว้นว่างไว้"}`);
      phone = digits;
    }
    rows.push({ row: r, companyName, ...addr, phone, taxId, paymentType, creditDays });
  }
  return rows;
}

async function prepareImage(file: string): Promise<Buffer> {
  return sharp(path.join(IMAGES_DIR, file))
    .rotate() // ตาม EXIF orientation ของรูปถ่ายจากมือถือ
    .resize({ width: IMAGE_MAX_PX, height: IMAGE_MAX_PX, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" }) // png โปร่งใส → พื้นขาว
    .jpeg({ quality: IMAGE_JPEG_QUALITY })
    .toBuffer();
}

async function main() {
  if (!existsSync(XLSX_PATH)) throw new Error(`ไม่พบ ${XLSX_PATH} — วางไฟล์ที่ลูกค้ากรอกไว้ที่นั่นก่อน`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);
  const wsProducts = wb.getWorksheet(SHEET_PRODUCTS);
  const wsCustomers = wb.getWorksheet(SHEET_CUSTOMERS);
  if (!wsProducts || !wsCustomers) throw new Error(`ไฟล์ต้องมีแท็บ "${SHEET_PRODUCTS}" และ "${SHEET_CUSTOMERS}" (ห้ามเปลี่ยนชื่อแท็บ)`);

  const productRows = readProducts(wsProducts);
  const customerRows = readCustomers(wsCustomers);
  console.log(`อ่านได้: สินค้า ${productRows.length} รายการ · ลูกค้า ${customerRows.length} ราย${DRY_RUN ? "  (dry-run — ไม่เขียนอะไร)" : ""}`);

  const client = postgres(DIRECT_URL!, { max: 1 });
  const db = drizzle(client, { schema });
  const admin = createClient(NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

  try {
    // ลูกค้าที่ import ผูก created_by กับผู้บริหารคนแรกที่ active (ลูกค้าเห็นได้ทั้งบริษัทอยู่แล้ว ค่านี้แค่บอกที่มา)
    const owner = await db.query.profiles.findFirst({
      where: and(eq(schema.profiles.role, "executive"), eq(schema.profiles.isActive, true)),
      columns: { id: true, name: true },
    });
    if (!owner) throw new Error("ไม่พบ profile role=executive ที่ active — seed user ก่อน (npm run db:seed:users)");
    console.log(`created_by ของลูกค้า = ${owner.name}`);

    // ---------- สินค้า ----------
    let pInserted = 0, pUpdated = 0, imgUploaded = 0;
    for (const p of productRows) {
      const values: schema.NewProduct = { name: p.name, packagingSpec: p.packagingSpec, weightPerBag: p.weightPerBag, sortOrder: p.sortOrder, isActive: true };
      const existing = await db.query.products.findFirst({
        where: and(eq(schema.products.name, p.name), eq(schema.products.weightPerBag, p.weightPerBag)),
        columns: { id: true },
      });
      const label = `${p.name} (${p.weightPerBag} กก.)`;
      if (DRY_RUN) {
        console.log(`  ${existing ? "อัปเดต" : "เพิ่ม"}  ${label}${p.imageFile ? `  รูป: ${p.imageFile}` : ""}`);
        continue;
      }
      let id: string;
      if (existing) {
        await db.update(schema.products).set({ ...values, updatedAt: new Date() }).where(eq(schema.products.id, existing.id));
        id = existing.id;
        pUpdated++;
      } else {
        [{ id }] = await db.insert(schema.products).values(values).returning({ id: schema.products.id });
        pInserted++;
      }
      if (p.imageFile && existsSync(path.join(IMAGES_DIR, p.imageFile))) {
        const imagePath = `${id}.jpg`;
        const buf = await prepareImage(p.imageFile);
        const { error } = await admin.storage.from(BUCKETS.productImages).upload(imagePath, buf, { contentType: "image/jpeg", upsert: true });
        if (error) throw new Error(`อัปโหลดรูป ${p.imageFile} ล้มเหลว: ${error.message}`);
        await db.update(schema.products).set({ imagePath }).where(eq(schema.products.id, id));
        imgUploaded++;
      }
      console.log(`  ${existing ? "อัปเดต" : "เพิ่ม"}  ${label}`);
    }

    // ---------- ลูกค้า ----------
    let cInserted = 0, cUpdated = 0;
    for (const { row, ...c } of customerRows) {
      void row; // ใช้เฉพาะตอนแจ้ง warning ตอนอ่านไฟล์
      const existing = await db.query.customers.findFirst({
        where: and(eq(schema.customers.companyName, c.companyName), eq(schema.customers.addressLine, c.addressLine ?? "")),
        columns: { id: true },
      });
      if (DRY_RUN) {
        console.log(`  ${existing ? "อัปเดต" : "เพิ่ม"}  ${c.companyName} — ${[c.subDistrict, c.district, c.province, c.postalCode].filter(Boolean).join(" ")}`);
        continue;
      }
      if (existing) {
        await db.update(schema.customers).set({ ...c, updatedAt: new Date() }).where(eq(schema.customers.id, existing.id));
        cUpdated++;
      } else {
        await db.insert(schema.customers).values({ ...c, createdBy: owner.id });
        cInserted++;
      }
    }

    if (!DRY_RUN) {
      console.log(`\nสินค้า: เพิ่ม ${pInserted} · อัปเดต ${pUpdated} · รูปอัปโหลด ${imgUploaded}`);
      console.log(`ลูกค้า: เพิ่ม ${cInserted} · อัปเดต ${cUpdated}`);
    }
  } finally {
    await client.end();
  }

  if (warnings.length) {
    console.log(`\n⚠ ข้อควรตรวจ ${warnings.length} รายการ:`);
    for (const w of warnings) console.log("  " + w);
  }
}

main().catch((e) => {
  console.error("import ล้มเหลว:", e);
  process.exit(1);
});
