import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // client router cache: กด back/แท็บซ้ำภายใน 30 วิ ไม่ต้องโหลดใหม่ (server action ที่ revalidatePath จะล้างให้เอง)
  experimental: { staleTimes: { dynamic: 30 } },
  // ฟอนต์ที่ react-pdf อ่านจากไฟล์ตอน runtime — ต้องบอก tracer ให้ใส่ใน serverless bundle ของ route PDF
  outputFileTracingIncludes: { "/api/quotations/[id]/pdf": ["./lib/pdf/fonts/**/*"] },
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    // signed URL ของ Supabase Storage (รูปสินค้า/ลายเซ็น) — host ต่างกันตาม project
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/sign/**" }],
  },
};

export default nextConfig;
