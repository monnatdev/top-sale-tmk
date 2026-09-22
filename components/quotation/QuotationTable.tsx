import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { STATUS_STYLE } from "./statusStyles";
import type { QuotationListItem } from "./QuotationCard";
import { cn } from "@/lib/utils";

type QuotationTableProps = {
  items: readonly QuotationListItem[];
  /** แสดงคอลัมน์เซลล์ผู้สร้าง (มุมผู้บริหาร) */
  showOwner?: boolean;
  className?: string;
};

const GRID = "grid items-center gap-4";
const COLS_OWNER = "grid-cols-[150px_1fr_150px_120px_110px_150px]";
const COLS_SALES = "grid-cols-[150px_1fr_120px_110px_150px]";

// ตารางใบเสนอราคาบนเดสก์ท็อป — แถวเป็นลิงก์ มีแถบสีสถานะซ้าย
export function QuotationTable({ items, showOwner, className }: QuotationTableProps) {
  const cols = showOwner ? COLS_OWNER : COLS_SALES;
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      <div className={cn(GRID, cols, "border-b border-border bg-card px-5 py-3 text-xs font-semibold tracking-wide text-foreground")}>
        <div>เลขที่</div>
        <div>ลูกค้า</div>
        {showOwner ? <div>เซลล์ผู้สร้าง</div> : null}
        <div className="text-right">วันที่</div>
        <div className="text-right">รายการ</div>
        <div>สถานะ</div>
      </div>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/quotations/${item.id}`}
          className={cn(
            GRID,
            cols,
            "border-b border-l-4 border-border-subtle px-5 py-4 text-foreground last:border-b-0 transition-colors hover:bg-background active:bg-muted",
            STATUS_STYLE[item.status].borderL,
          )}
        >
          <div className="mono text-body">{item.quoteNumber}</div>
          <div className="truncate text-sm font-medium">{item.customerName}</div>
          {showOwner ? <div className="text-body text-muted-foreground">{item.ownerName}</div> : null}
          <div className="numeric text-body text-muted-foreground">{item.date}</div>
          <div className="numeric text-body text-muted-foreground">{item.itemCount}</div>
          <div>
            <StatusBadge status={item.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
