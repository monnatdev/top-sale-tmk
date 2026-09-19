"use client";

import Link, { useLinkStatus } from "next/link";
import { Spinner } from "@/components/shared/Spinner";
import { cn } from "@/lib/utils";

// ไอคอนเมนู: ระหว่างรอหน้าใหม่ (useLinkStatus) เปลี่ยนเป็น spinner ให้รู้ว่ากดติดแล้ว
function NavIcon({ icon: Icon, className }: { icon: React.ComponentType<{ className?: string }>; className?: string }) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className={className} /> : <Icon className={className} />;
}

type NavLinkProps = React.ComponentProps<typeof Link> & {
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  active?: boolean;
};

export function NavLink({ icon, iconClassName, active, className, children, ...props }: NavLinkProps) {
  return (
    <Link aria-current={active ? "page" : undefined} className={cn(className)} {...props}>
      <NavIcon icon={icon} className={iconClassName} />
      {children}
    </Link>
  );
}
