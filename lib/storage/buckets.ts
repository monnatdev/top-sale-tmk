// ชื่อ bucket ใน Supabase Storage — private ทั้งคู่ เข้าถึงผ่าน signed URL จาก backend เท่านั้น
export const BUCKETS = {
  productImages: "product-images",
  signatures: "signatures",
} as const;
export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

// อายุ signed URL (วินาที) — สั้นพอไม่ให้ลิงก์หลุดไปใช้ต่อ
export const SIGNED_URL_TTL = 60 * 10;
