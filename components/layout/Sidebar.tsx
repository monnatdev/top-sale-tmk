import { LogOutIcon } from "lucide-react";
import { logout } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./BrandLogo";
import { SidebarNav } from "./SidebarNav";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { Role } from "@/lib/auth/types";

export type ShellUser = {
  name: string;
  initials: string;
  role: Role;
};

const ROLE_HINT: Record<Role, string> = {
  sale: "เซลล์ · เห็นใบของตัวเอง",
  executive: "ผู้บริหาร · เห็นทุกใบ",
};

// sidebar เดสก์ท็อป 240px สี ink — ซ่อนบนมือถือ (ใช้ BottomNav แทน)
// sticky + สูงเท่าจอ: หน้ายาวแค่ไหน เมนู/โปรไฟล์/ออกจากระบบก็อยู่ในสายตาเสมอ (ไม่ยืดตามเนื้อหา)
export function Sidebar({ user }: { user: ShellUser }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 overflow-y-auto bg-sidebar px-4 py-5 text-sidebar-foreground md:flex">
      <div className="flex items-center gap-2.5">
        <BrandLogo size="sm" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">ข้าวตราแม่ครัว</span>
          <span className="text-2xs text-muted-foreground">ใบเสนอราคา</span>
        </div>
      </div>
      <SidebarNav />
      <div className="mt-auto flex items-center gap-2.5 border-t border-sidebar-border pt-3.5">
        <UserAvatar initials={user.initials} role={user.role} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body">{user.name}</span>
          <span className="text-2xs text-muted-foreground">{ROLE_HINT[user.role]}</span>
        </div>
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            aria-label="ออกจากระบบ"
            className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOutIcon />
          </Button>
        </form>
      </div>
    </aside>
  );
}
