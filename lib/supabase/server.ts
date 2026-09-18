import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Supabase client ฝั่ง server ด้วยสิทธิ์ของผู้ใช้ (anon key + cookie session)
// ใช้เฉพาะ auth flow — business data ทั้งหมดผ่าน Drizzle (@/lib/db)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // เรียกจาก Server Component จะ set cookie ไม่ได้ — proxy.ts เป็นคน refresh session ให้แทน
        }
      },
    },
  });
}
