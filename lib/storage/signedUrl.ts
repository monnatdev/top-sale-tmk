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

export function getProductImageUrl(path: string | null | undefined) {
  return getSignedUrl(BUCKETS.productImages, path);
}
