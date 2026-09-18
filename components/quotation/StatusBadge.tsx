import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type QuotationStatus } from "@/lib/constants/quotationStatus";
import { STATUS_STYLE } from "./statusStyles";
import { cn } from "@/lib/utils";

type StatusBadgeProps = { status: QuotationStatus; className?: string };

// pill สถานะใบเสนอราคา — พื้น soft + ตัวเข้มตามสถานะ (ที่เดียวที่ map สถานะ → สี)
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = STATUS_STYLE[status];
  return (
    <Badge variant="secondary" className={cn(s.soft, s.text, className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
