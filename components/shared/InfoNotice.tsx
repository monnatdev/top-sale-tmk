import { cn } from "@/lib/utils";

type InfoNoticeProps = {
  children: React.ReactNode;
  /** bordered = มีขอบส้มอ่อน (ใช้เป็นกล่องแยกในคอลัมน์ขวา) */
  bordered?: boolean;
  className?: string;
};

// กล่องแจ้งเตือนพื้นส้มอ่อน — ข้อความอธิบายกติกา ไม่ใช่ error
export function InfoNotice({ children, bordered, className }: InfoNoticeProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-primary-soft px-3.5 py-3 text-xs leading-relaxed text-primary-soft-foreground",
        bordered && "border border-primary-soft-border",
        className,
      )}
    >
      {children}
    </div>
  );
}
