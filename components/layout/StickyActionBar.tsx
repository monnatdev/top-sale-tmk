import { cn } from "@/lib/utils";

type StickyActionBarProps = {
  children: React.ReactNode;
  /** grid 2 คอลัมน์ (ย้อนกลับ | ถัดไป) แทนการเรียงแนวตั้ง */
  split?: boolean;
  className?: string;
};

// ปุ่มหลักของหน้า sticky ล่างจอมือถือ (เหนือ BottomNav) — บนเดสก์ท็อปย้ายไปวางใน PageHeader.actions แทน
// หน้าที่ใช้ต้องมี padding-bottom เผื่อความสูงแถบนี้ (pb-40 บนมือถือ)
export function StickyActionBar({ children, split, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-18 z-20 border-t border-border bg-card px-4 pt-3 pb-3 md:hidden",
        split ? "grid grid-cols-[112px_1fr] gap-3" : "flex flex-col gap-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
