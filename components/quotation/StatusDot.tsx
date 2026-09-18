import type { QuotationStatus } from "@/lib/constants/quotationStatus";
import { STATUS_STYLE } from "./statusStyles";
import { cn } from "@/lib/utils";

// จุดสีสถานะ 7–9px — ใช้ใน chip กรอง / StatusProgress
export function StatusDot({ status, className }: { status: QuotationStatus; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", STATUS_STYLE[status].bg, className)} />;
}
