import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BUCKETS, SIGNED_URL_TTL, type BucketName } from "./buckets";

// สร้าง signed URL อ่านไฟล์จาก bucket private — ผู้เรียกต้องเช็กสิทธิ์ก่อน (ฟังก์ชันนี้ไม่รู้จัก user)
export async function getSignedUrl(bucket: BucketName, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) {
    console.error(`[storage] signed url failed bucket=${bucket}`, error.message);
    return null;
  }
  return data.signedUrl;
}

// ลายเซ็น: ส่งได้เฉพาะ (ก) ผู้บริหารดูของตัวเอง (ข) ตอน gen PDF ฝั่ง server — ห้ามส่งไปหน้าเซลล์ (auth-guard ข้อ 8)
export function getSignatureUrl(path: string | null | undefined) {
  return getSignedUrl(BUCKETS.signatures, path);
}


// รูปสินค้าบนหน้าเว็บไม่ใช้ signed URL (หมดอายุ 10 นาที → next/image ดึงซ้ำแล้วได้ 400 เมื่อฟอร์มเปิดค้าง)
// ใช้ route ของเราเองที่เช็ก session + ย่อรูป → URL คงที่ cache ได้
export function productImageUrl(path: string | null | undefined): string | null {
  return path ? `/api/product-images/${encodeURIComponent(path)}` : null;
}

// เติม imageUrl ให้แถวที่มี imagePath (สินค้า master / รายการในใบ)
export function withProductImageUrls<T extends { imagePath: string | null }>(rows: readonly T[]): (T & { imageUrl: string | null })[] {
  return rows.map((r) => ({ ...r, imageUrl: productImageUrl(r.imagePath) }));
}
