import { BottomNav } from "./BottomNav";
import { Sidebar, type ShellUser } from "./Sidebar";

type AppShellProps = {
  user: ShellUser;
  children: React.ReactNode;
};

// โครงหน้าหลังล็อกอิน: sidebar (md+) / bottom nav (มือถือ) + พื้นที่เนื้อหาพื้นครีม
// เนื้อหาบนมือถือเผื่อที่ให้ BottomNav (pb-18) — หน้าที่มี StickyActionBar ต้องเผื่อเพิ่มเอง
export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col pb-18 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
