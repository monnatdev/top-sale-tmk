import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy";

// หน้าที่แค่ 2 อย่าง: refresh session ของ Supabase ทุก request + เด้งคนไม่ล็อกอินไป /login
// ไม่ใช่ที่เช็กสิทธิ์ — สิทธิ์จริงเช็กที่ query/service เสมอ (proxy bypass ได้)
export async function proxy(req: NextRequest) {
  const { supabase, response } = createProxyClient(req);
  // getClaims = verify ลายเซ็น JWT ในเครื่อง (JWKS cache) ไม่ยิง Supabase ทุก request · หมดอายุ → refresh ให้เอง
  // การตัดสิทธิ์จริง (profile ปิด/เปลี่ยน role) อยู่ที่ requireUser() ในหน้า ซึ่งอ่าน profiles ทุกครั้ง
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const isLogin = req.nextUrl.pathname.startsWith("/login");
  // API route: ตอบ 401 JSON ไม่ redirect (client ที่เรียก fetch จะได้ไม่ได้ HTML หน้า login กลับไป)
  if (!user && req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (!user && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (user && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/quotations";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // ทุกหน้า ยกเว้น asset ของ Next, ไฟล์ static, และ health check
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
