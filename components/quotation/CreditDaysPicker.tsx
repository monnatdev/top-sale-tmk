"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [7, 15, 20, 30] as const;

type CreditDaysPickerProps = {
  value: number;
  onChange: (days: number) => void;
  min?: number;
  max?: number;
  className?: string;
};

// เลือกจำนวนวันเครดิต — preset 4 ปุ่ม + stepper ปรับเอง (7–30 วัน)
export function CreditDaysPicker({ value, onChange, min = 7, max = 30, className }: CreditDaysPickerProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className={cn("flex flex-col gap-2.5 rounded-md border border-border bg-card p-3", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">จำนวนวันเครดิต</span>
        <span className="mono text-2xs text-muted-foreground">
          {min}–{max} วัน
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((d) => {
          const active = d === value;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(d)}
              className={cn(
                "mono flex h-11 items-center justify-center rounded-md border text-sm",
                active ? "border-[1.5px] border-primary bg-primary-soft font-semibold text-primary-hover" : "border-border text-foreground hover:bg-muted",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="ลดจำนวนวัน"
          onClick={() => onChange(clamp(value - 1))}
          className="flex size-11 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
        >
          <MinusIcon className="size-4" />
        </button>
        <div className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md border border-border">
          <span className="mono text-lg">{value}</span>
          <span className="text-xs text-muted-foreground">วัน</span>
        </div>
        <button
          type="button"
          aria-label="เพิ่มจำนวนวัน"
          onClick={() => onChange(clamp(value + 1))}
          className="flex size-11 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
