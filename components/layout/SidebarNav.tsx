"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "./NavLink";
import { NAV_ITEMS, isNavActive } from "./navItems";
import { cn } from "@/lib/utils";

// เมนูใน sidebar เดสก์ท็อป — รายการที่เลือก = พื้นส้ม ตัวขาว
export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="เมนูหลัก" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isNavActive(pathname, href);
        return (
          <NavLink
            key={href}
            href={href}
            active={active}
            icon={Icon}
            iconClassName="size-4"
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-[11px] text-sm transition-colors",
              active
                ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                : "text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}
