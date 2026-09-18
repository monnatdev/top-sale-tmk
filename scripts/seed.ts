// Seed ข้อมูลตั้งต้นสำหรับ dev — รัน: npm run db:seed (ใช้ DIRECT_URL จาก .env.local)
// idempotent: รันซ้ำได้ ไม่สร้างซ้ำ · ผู้ใช้ (auth + profiles) seed ในแผนข้อ 3 เพราะต้องผ่าน Supabase Auth
import { config } from "dotenv";
config({ path: ".env.local" });
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";

const url = process.env.DIRECT_URL;
if (!url) throw new Error("ไม่พบ DIRECT_URL — ตั้งค่าใน .env.local ก่อน (ดู docs/SETUP.md)");

// สินค้าตั้งต้นจากดีไซน์ — ราคาไม่อยู่ใน master (กรอกต่อใบ)
const PRODUCTS: schema.NewProduct[] = [
  { name: "ข้าวหอมมะลิปทุม 100%", packagingSpec: "บรรจุถุง PP ขาวล้วน ติดแท็ก", weightPerBag: 45, sortOrder: 1 },
  { name: "ข้าวหอมมะลิ 70:30", packagingSpec: "บรรจุถุง PP ขาวล้วน ติดแท็ก", weightPerBag: 45, sortOrder: 2 },
  { name: "ข้าวขาว", packagingSpec: "บรรจุกระสอบ ติดแท็ก", weightPerBag: 48, sortOrder: 3 },
  { name: "ข้าวเสาไห้", packagingSpec: "บรรจุถุง PP ขาวล้วน ติดแท็ก", weightPerBag: 45, sortOrder: 4 },
];

async function main() {
  const client = postgres(url!, { max: 1 });
  const db = drizzle(client, { schema });

  let inserted = 0;
  for (const p of PRODUCTS) {
    const exists = await db.query.products.findFirst({ where: eq(schema.products.name, p.name), columns: { id: true } });
    if (exists) continue;
    await db.insert(schema.products).values(p);
    inserted++;
  }
  console.log(`products: เพิ่มใหม่ ${inserted} รายการ (มีอยู่แล้ว ${PRODUCTS.length - inserted})`);

  await client.end();
}

main().catch((e) => {
  console.error("seed ล้มเหลว:", e);
  process.exit(1);
});
