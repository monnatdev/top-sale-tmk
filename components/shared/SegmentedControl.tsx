"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
  size?: "sm" | "md";
  className?: string;
};

// ตัวเลือก 2–3 ทาง (ลูกค้าเก่า/ใหม่, เครดิต/เงินสด) — เลือกอยู่ = พื้นส้มอ่อน ตัวส้มเข้ม
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  name,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "grid overflow-hidden rounded-md border border-border bg-card",
        size === "md" ? "h-11" : "h-9",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            name={name}
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center justify-center text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:ring-inset",
              size === "sm" && "text-body",
              active ? "bg-primary-soft font-semibold text-primary-hover" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
