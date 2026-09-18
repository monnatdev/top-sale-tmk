import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BucketName } from "./buckets";

export type ImageBytes = { data: Buffer; format: "png" | "jpg" };

// ดาวน์โหลดรูปจาก bucket private มาเป็น bytes (ใช้ gen PDF ฝั่ง server) — ไม่พบ/พัง → null (PDF ยังออกได้ แค่ไม่มีรูป)
export async function downloadImage(bucket: BucketName, path: string | null | undefined): Promise<ImageBytes | null> {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
  if (error || !data) {
    console.error(`[storage] download failed bucket=${bucket} path=${path}`, error?.message);
    return null;
  }
  const buf = Buffer.from(await data.arrayBuffer());
  const isPng = buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return { data: buf, format: isPng ? "png" : "jpg" };
}
