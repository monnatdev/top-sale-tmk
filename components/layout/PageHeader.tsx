import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** ลิงก์ย้อนกลับ (หน้าดูใบ) — แสดง "‹ กลับ" เหนือหัวข้อ */
  back?: { href: string; label?: string };
  /** สิ่งที่วางข้างหัวข้อ เช่น StatusBadge */
  aside?: React.ReactNode;
  /** ปุ่ม/ช่องค้นหาฝั่งขวาบนเดสก์ท็อป — บนมือถือจะไปอยู่บรรทัดถัดไป */
  actions?: React.ReactNode;
  /** แถวเพิ่มใต้หัวข้อ (ช่องค้นหา, chips) — อยู่ในแถบขาวเดียวกัน */
  children?: React.ReactNode;
  className?: string;
};

// แถบหัวหน้าพื้นขาว มีเส้นใต้ — sticky บนมือถือ
export function PageHeader({ title, subtitle, back, aside, actions, children, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-border bg-card px-4 pt-3 pb-3.5 md:static md:px-8 md:py-5",
        className,
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          {back ? (
            <Link href={back.href} className="flex items-center gap-1 text-body text-muted-foreground">
              <ChevronLeftIcon className="size-3.5" />
              {back.label ?? "กลับ"}
            </Link>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-xl font-semibold md:text-2xl">{title}</h1>
            {aside}
          </div>
          {subtitle ? <p className="text-2xs text-muted-foreground md:text-xs">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
      {children ? <div className="mt-3 flex flex-col gap-3">{children}</div> : null}
    </header>
  );
}
