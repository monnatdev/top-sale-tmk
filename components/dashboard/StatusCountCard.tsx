import Link from "next/link";
import { STATUS_LABEL, type QuotationStatus } from "@/lib/constants/quotationStatus";
import { STATUS_STYLE } from "@/components/quotation/statusStyles";
import { cn } from "@/lib/utils";

type StatusCountCardProps = {
  status: QuotationStatus;
  count: number;
  /** ลิงก์ไปหน้ารายการที่กรองสถานะนี้ */
  href: string;
  className?: string;
};

// การ์ดจำนวนใบต่อสถานะ — แถบสีซ้าย (มือถือ) / บน (เดสก์ท็อป) · กดแล้วไปรายการที่กรอง
export function StatusCountCard({ status, count, href, className }: StatusCountCardProps) {
  const s = STATUS_STYLE[status];
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3.5 text-foreground transition-colors hover:bg-background active:bg-muted md:gap-2.5 md:p-5",
        "border-l-4 md:border-t-4 md:border-l",
        s.stripe,
        className,
      )}
    >
      <span className="text-xs text-muted-foreground md:text-body">{STATUS_LABEL[status]}</span>
      <span className={cn("mono text-3xl font-medium", s.text)}>{count.toLocaleString("th-TH")}</span>
      <span className="text-2xs text-muted-foreground md:text-xs">ใบ · ดูรายการ ›</span>
    </Link>
  );
}
