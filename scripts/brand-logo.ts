// สร้างไฟล์โลโก้ที่แอปใช้ จากต้นฉบับ docs/brand/logo-original.png
// รัน: npm run brand:logo  (หลังวางไฟล์ต้นฉบับใหม่ทับ)
// ออกมา 3 ไฟล์: public/brand/logo.png (เว็บ + หัว PDF) · app/icon.png (favicon) · app/apple-icon.png (ไอคอนหน้าจอโฮม iOS)
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

const SRC = "docs/brand/logo-original.png";
// พื้นแอป (--color-canvas ใน globals.css) — apple-icon ต้องทึบ ไม่งั้น iOS เติมดำให้
const ICON_BG = "#f7f4f0";

async function main() {
  if (!existsSync(SRC)) throw new Error(`ไม่พบไฟล์ต้นฉบับ ${SRC}`);
  mkdirSync("public/brand", { recursive: true });

  // ตัดขอบโปร่งรอบๆ ออกก่อน (ไฟล์จาก designer มักมีขอบเยอะ) แล้วค่อยย่อ
  const trimmed = await sharp(SRC).trim({ threshold: 1 }).toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  console.log(`ต้นฉบับหลังตัดขอบ ${width}×${height}`);

  const out = async (file: string, pipeline: Sharp) => {
    await pipeline.png({ compressionLevel: 9 }).toFile(file);
    const m = await sharp(file).metadata();
    console.log(`  ${file} — ${m.width}×${m.height} · ${(statSync(file).size / 1024).toFixed(0)} KB`);
  };

  // โลโก้เว็บ/PDF: สูงสุด 512px คงสัดส่วน พื้นโปร่ง
  await out(path.join("public/brand/logo.png"), sharp(trimmed).resize({ width: 512, height: 512, fit: "inside" }));
  // favicon: จัตุรัส 512 พื้นโปร่ง เว้นขอบเล็กน้อย
  await out("app/icon.png", sharp(trimmed).resize({ width: 460, height: 460, fit: "inside" }).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }));
  // apple touch icon: 180 พื้นทึบ
  await out("app/apple-icon.png", sharp(trimmed).resize({ width: 150, height: 150, fit: "inside" }).flatten({ background: ICON_BG }).resize(180, 180, { fit: "contain", background: ICON_BG }));

  console.log("\n⚠ สัดส่วนโลโก้เปลี่ยน → แก้ RATIO ใน components/layout/BrandLogo.tsx ให้ตรงขนาด public/brand/logo.png");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
