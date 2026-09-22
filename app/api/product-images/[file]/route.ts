import { NextResponse } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { BUCKETS } from "@/lib/storage/buckets";
import { downloadImage } from "@/lib/storage/download";

export const dynamic = "force-dynamic";

// รูปย่อสำหรับหน้าเว็บ — ด้านยาวสุด 200px พอสำหรับ thumbnail ทุกขนาดที่ 2x (ProductThumbnail lg = 72×56)
const THUMB_MAX_PX = 200;
// URL คงที่ (ไม่หมดอายุแบบ signed URL) จึง cache ในเบราว์เซอร์ได้ — private เพราะต้องล็อกอิน
const CACHE_CONTROL = "private, max-age=3600";

// path ใน bucket = ชื่อไฟล์ชั้นเดียว (import ใช้ <product id>.jpg · อัปโหลดมือใช้ชื่ออะไรก็ได้แต่ห้ามมี /)
const fileSchema = z.object({ file: z.string().min(1).max(200).regex(/^[^/\\]+$/).refine((f) => f !== "." && f !== "..") });

// GET /api/product-images/:file — รูปสินค้าจาก bucket private (ทุก role ที่ล็อกอินดูได้ · สินค้าเป็นข้อมูลกลางของบริษัท)
export async function GET(_req: Request, ctx: RouteContext<"/api/product-images/[file]">) {
  const parsed = fileSchema.safeParse(await ctx.params);
  if (!parsed.success) return NextResponse.json({ message: "รูปไม่ถูกต้อง" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const image = await downloadImage(BUCKETS.productImages, parsed.data.file);
  if (!image) return NextResponse.json({ message: "ไม่พบรูป" }, { status: 404 });

  try {
    const thumb = await sharp(image.data)
      .resize({ width: THUMB_MAX_PX, height: THUMB_MAX_PX, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    return new NextResponse(new Uint8Array(thumb), { headers: { "Content-Type": "image/jpeg", "Cache-Control": CACHE_CONTROL } });
  } catch (e) {
    console.error("[product-image] resize failed", e);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
