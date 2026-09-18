import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// client สำหรับ proxy.ts — refresh token แล้วเขียน cookie กลับทั้ง request และ response
// ไม่ใช้ @/lib/env เพราะ proxy ไม่ได้อยู่ใน RSC (server-only จะ throw)
export function createProxyClient(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  return {
    supabase,
    // getter เพราะ response ถูกสร้างใหม่ตอน setAll
    get response() {
      return response;
    },
  };
}
