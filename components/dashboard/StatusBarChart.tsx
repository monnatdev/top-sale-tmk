import Link from "next/link";
import { STATUS_LABEL, type QuotationStatus } from "@/lib/constants/quotationStatus";
import { STATUS_STYLE } from "@/components/quotation/statusStyles";
import { cn } from "@/lib/utils";

type StatusBarChartProps = {
  data: readonly { status: QuotationStatus; count: number }[];
  /** ถ้าให้ href แถวจะเป็นลิงก์ไปรายการที่กรองสถานะนั้น */
  hrefFor?: (status: QuotationStatus) => string;
  className?: string;
};

// สัดส่วนใบตามสถานะ — แถบยาวเทียบกับค่ามากสุด (ไม่มีกราฟเงิน เพราะใบไม่มียอดรวม)
export function StatusBarChart({ data, hrefFor = (s) => `/quotations?status=${s}`, className }: StatusBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className={cn("flex flex-col gap-3 md:gap-4", className)}>
      {data.map(({ status, count }) => (
        <Link key={status} href={hrefFor(status)} className="flex flex-col gap-1.5 text-foreground hover:opacity-80 md:grid md:grid-cols-[160px_1fr_60px] md:items-center md:gap-5">
          <div className="flex items-baseline justify-between md:block">
            <span className="text-xs md:text-body">{STATUS_LABEL[status]}</span>
            <span className="mono text-xs text-muted-foreground md:hidden">{count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted md:h-5 md:rounded-sm">
            <div
              className={cn("h-full rounded-full md:rounded-sm", STATUS_STYLE[status].bg)}
              style={{ width: `${Math.round((count / max) * 100)}%` }}
            />
          </div>
          <span className="numeric hidden text-base md:block">{count}</span>
        </Link>
      ))}
    </div>
  );
}
