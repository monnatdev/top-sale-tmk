import Link from "next/link";
import { STATUS_LABEL, type QuotationStatus } from "@/lib/constants/quotationStatus";
import { StatusDot } from "./StatusDot";
import { cn } from "@/lib/utils";

export type StatusFilterItem = {
  status: QuotationStatus | "all";
  count: number;
  href: string;
};

type StatusFilterChipsProps = {
  items: readonly StatusFilterItem[];
  active: QuotationStatus | "all";
  className?: string;
};

// แถว chip กรองสถานะ + จำนวน — เลือกอยู่ = ส้มทึบ · เลื่อนแนวนอนได้บนมือถือ
export function StatusFilterChips({ items, active, className }: StatusFilterChipsProps) {
  return (
    <div className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0", className)}>
      {items.map(({ status, count, href }) => {
        const isActive = status === active;
        return (
          <Link
            key={status}
            href={href}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs md:text-body",
              isActive
                ? "border-primary bg-primary font-medium text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {status !== "all" && !isActive ? <StatusDot status={status} className="size-[7px]" /> : null}
            {status === "all" ? "ทั้งหมด" : STATUS_LABEL[status]}
            <span className={cn("mono", isActive ? "opacity-80" : "text-muted-foreground")}>{count}</span>
          </Link>
        );
      })}
    </div>
  );
}
