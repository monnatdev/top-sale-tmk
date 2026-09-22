import Link from "next/link";
import type { QuotationStatus } from "@/lib/constants/quotationStatus";
import { StatusBadge } from "./StatusBadge";
import { STATUS_STYLE } from "./statusStyles";
import { cn } from "@/lib/utils";

export type QuotationListItem = {
  id: string;
  quoteNumber: string;
  customerName: string;
  /** ชื่อเซลล์ผู้สร้าง — แสดงเฉพาะมุมผู้บริหาร */
  ownerName?: string;
  /** วันที่ format แล้ว เช่น "20/07/2569" */
  date: string;
  itemCount: number;
  status: QuotationStatus;
};

// การ์ดใบเสนอราคาบนมือถือ — แถบสีสถานะ 4px ขอบซ้าย ให้กวาดตาหาสถานะได้ก่อนอ่าน pill
type QuotationCardProps = { item: QuotationListItem; showOwner?: boolean; className?: string };

export function QuotationCard({ item, showOwner, className }: QuotationCardProps) {
  return (
    <Link
      href={`/quotations/${item.id}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border border-l-4 bg-card px-3.5 pt-3.5 pb-3 text-foreground transition-colors hover:bg-background active:bg-muted",
        STATUS_STYLE[item.status].borderL,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="mono text-xs text-muted-foreground">{item.quoteNumber}</span>
          <span className="truncate text-sm font-semibold">{item.customerName}</span>
        </div>
        <StatusBadge status={item.status} className="shrink-0" />
      </div>
      <div className="mono flex items-center gap-3.5 border-t border-dotted border-border pt-2 text-xs text-muted-foreground">
        <span>{item.date}</span>
        <span>{item.itemCount} รายการ</span>
        {showOwner && item.ownerName ? <span className="ml-auto font-sans">{item.ownerName}</span> : null}
      </div>
    </Link>
  );
}
