"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-[11px] text-sm transition-colors",
              active
                ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
