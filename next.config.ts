import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // client router cache: กด back/แท็บซ้ำภายใน 30 วิ ไม่ต้องโหลดใหม่ (server action ที่ revalidatePath จะล้างให้เอง)
  experimental: { staleTimes: { dynamic: 30 } },
  // ฟอนต์ + โลโก้ ที่ react-pdf อ่านจากไฟล์ตอน runtime — ต้องบอก tracer ให้ใส่ใน serverless bundle ของ route PDF
  outputFileTracingIncludes: { "/api/quotations/[id]/pdf": ["./lib/pdf/fonts/**/*", "./public/brand/**"] },
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    // signed URL ของ Supabase Storage (รูปสินค้า/ลายเซ็น) — host ต่างกันตาม project
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/sign/**" }],
  },
};

// ห่อด้วย Sentry เฉพาะตอนตั้ง SENTRY_DSN — เครื่อง dev ที่ไม่ได้ตั้ง build เหมือนเดิมทุกอย่าง
// อัปโหลด source map (ให้ stack trace อ่านรู้เรื่อง) ต้องมี SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT ด้วย — ไม่มีก็ข้ามเงียบๆ
export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      telemetry: false,
      widenClientFileUpload: false,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
    })
  : nextConfig;
