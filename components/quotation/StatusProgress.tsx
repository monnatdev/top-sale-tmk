import { STATUS_FLOW, STATUS_LABEL, type QuotationStatus } from "@/lib/constants/quotationStatus";
import { STATUS_STYLE } from "./statusStyles";
import { cn } from "@/lib/utils";

type StatusProgressProps = {
  current: QuotationStatus;
  /** ข้อความต่อท้ายสถานะปัจจุบัน เช่น "อยู่ที่คุณ" */
  currentHint?: string;
  className?: string;
};

// รายการสถานะเอกสารตามลำดับ flow — ผ่านแล้ว = จุดสีสถานะ · ปัจจุบัน = ตัวหนา · ยังไม่ถึง = จุดเทา
// ถ้าปัจจุบัน = ตีกลับ จะแทรกไว้หลัง "รออนุมัติ"
export function StatusProgress({ current, currentHint, className }: StatusProgressProps) {
  const flow: QuotationStatus[] = [...STATUS_FLOW];
  if (current === "returned") flow.splice(2, 0, "returned");
  const currentIdx = flow.indexOf(current);

  return (
    <ol className={cn("flex flex-col gap-2.5", className)}>
      {flow.map((status, i) => {
        const reached = i <= currentIdx;
        const active = status === current;
        return (
          <li key={status} className="flex items-center gap-2.5">
            <span aria-hidden className={cn("size-[9px] shrink-0 rounded-full", reached ? STATUS_STYLE[status].bg : "bg-border")} />
            <span className={cn("text-body", active ? "font-semibold text-foreground" : "text-muted-foreground")}>
              {STATUS_LABEL[status]}
              {active && currentHint ? ` · ${currentHint}` : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
