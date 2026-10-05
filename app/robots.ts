import type { MetadataRoute } from "next";

// ระบบภายในบริษัท — ห้าม search engine เก็บทุกหน้า (คู่กับ meta robots ใน layout.tsx)
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
