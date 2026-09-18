import { cn } from "@/lib/utils";

type WizardStepsProps = {
  steps: readonly string[];
  /** index ขั้นปัจจุบัน (0-based) */
  current: number;
  className?: string;
};

// แถบขั้นตอน 3 ขั้นบนมือถือ (ลูกค้า → สินค้า → ตรวจสอบ) — ขีดส้ม = ผ่าน/ปัจจุบัน
export function WizardSteps({ steps, current, className }: WizardStepsProps) {
  return (
    <ol className={cn("grid gap-2", className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((label, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className="flex flex-col gap-1.5">
            <div className={cn("h-[3px] rounded-full", done ? "bg-primary" : "bg-border")} />
            <span className={cn("text-2xs", active ? "font-semibold text-primary-hover" : "text-muted-foreground")}>
              {i + 1} · {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
