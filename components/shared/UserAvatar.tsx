import type { Role } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  /** อักษรย่อ 1–2 ตัว เช่น "สช" */
  initials: string;
  /** เซลล์ = พื้นส้มอ่อน · ผู้บริหาร = พื้นน้ำตาลทอง */
  role?: Role;
  size?: "sm" | "md";
  className?: string;
};

export function UserAvatar({ initials, role = "sale", size = "md", className }: UserAvatarProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" ? "size-8 text-xs" : "size-9 text-body",
        role === "executive" ? "bg-accent text-accent-foreground" : "bg-primary-soft text-primary-hover",
        className,
      )}
    >
      {initials}
    </div>
  );
}
