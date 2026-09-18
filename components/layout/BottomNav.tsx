"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "./navItems";
import { cn } from "@/lib/utils";

// แถบเมนูล่างจอมือถือ 4 ช่อง — ซ่อนบนเดสก์ท็อป
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-30 grid h-18 auto-cols-fr grid-flow-col items-center border-t border-border bg-card pb-2 md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1.5 py-2 text-2xs",
              active ? "font-medium text-primary-hover" : "text-muted-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
