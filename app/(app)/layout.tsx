import { AppShell } from "@/components/layout/AppShell";
import { requireUser } from "@/lib/auth/session";
import { getInitials } from "@/lib/utils";

// layout ของหน้าหลังล็อกอิน — requireUser() เด้งไป /login ถ้าไม่มี session (proxy.ts กันชั้นแรก ตรงนี้กันชั้นจริง)
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return <AppShell user={{ name: user.name, initials: getInitials(user.name), role: user.role }}>{children}</AppShell>;
}
