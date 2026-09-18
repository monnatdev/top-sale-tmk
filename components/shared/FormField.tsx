import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  /** ข้อความเสริมท้าย label เช่น "· ล็อกเมื่อเลือกลูกค้าเก่า" (สี accent) */
  hint?: string;
  /** ข้อความขวาสุดของ label เช่น "7–30 วัน" (mono) */
  trailing?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

// label 12px muted + ช่องกรอก + error — ใช้ครอบ Input/Textarea/Select ทุกตัวในฟอร์ม
export function FormField({ label, htmlFor, hint, trailing, error, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor}>
          {label}
          {hint ? <span className="text-accent">{hint}</span> : null}
        </Label>
        {trailing ? <span className="mono text-2xs text-muted-foreground">{trailing}</span> : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
