import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: React.ReactNode;
  /** เลขลำดับ section บนเดสก์ท็อป เช่น "01" (mono muted) */
  step?: string;
  /** ข้อความ mono ขวาสุด เช่น "4 รายการ" */
  meta?: React.ReactNode;
  /** ปุ่ม/ลิงก์ขวาสุด เช่น <Button variant="link">แก้ไข</Button> */
  action?: React.ReactNode;
  /** flush = ไม่มี padding ซ้ายขวาในเนื้อหา (ใช้กับรายการ/ตารางที่มีเส้นคั่นเต็มความกว้าง) */
  flush?: boolean;
  /** divided = เส้นทึบคั่นระหว่างหัวกับเนื้อหา */
  divided?: boolean;
  className?: string;
  children: React.ReactNode;
};

// การ์ดขาวมีหัว — block พื้นฐานของทุกหน้า (ลูกค้า, รายการสินค้า, หมายเหตุ, ประวัติ)
export function SectionCard({ title, step, meta, action, flush, divided, className, children }: SectionCardProps) {
  const hasHeader = title || meta || action;
  return (
    <Card className={cn("gap-0", flush && "py-0", className)}>
      {hasHeader ? (
        <div
          className={cn(
            "flex items-center justify-between gap-3 px-(--card-spacing)",
            flush ? "py-3" : "pb-3",
            divided && "border-b border-border",
          )}
        >
          <div className="flex items-center gap-2.5">
            {step ? <span className="mono hidden text-xs text-muted-foreground md:inline">{step}</span> : null}
            {title ? <h2 className="text-body font-semibold md:text-base">{title}</h2> : null}
          </div>
          {meta ? <span className="mono text-xs text-muted-foreground">{meta}</span> : null}
          {action}
        </div>
      ) : null}
      <CardContent className={cn(flush && "px-0")}>{children}</CardContent>
    </Card>
  );
}
