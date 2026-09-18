import { cn } from "@/lib/utils";

type NumericTextProps = {
  /** ค่าที่ format แล้ว เช่น "1,260" หรือ number (จะ format ด้วย toLocaleString th-TH) */
  value: string | number;
  /** หน่วยตัวเล็กต่อท้าย เช่น "กก." / "บาท/ถุง" */
  unit?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  muted?: boolean;
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<NumericTextProps["size"]>, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-xl",
  "2xl": "text-2xl font-medium md:text-3xl",
};

// ตัวเลขแบบสมุดบัญชี: mono + tabular + หน่วยตัวเล็กกำกับ — ใช้กับราคา/นน./จำนวน
export function NumericText({ value, unit, size = "md", muted, className }: NumericTextProps) {
  const text = typeof value === "number" ? value.toLocaleString("th-TH") : value;
  return (
    <span className={cn("mono", SIZE_CLASS[size], muted && "text-muted-foreground", className)}>
      {text}
      {unit ? <span className="ml-1 font-sans text-2xs font-normal text-muted-foreground">{unit}</span> : null}
    </span>
  );
}
