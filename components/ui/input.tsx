import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

// ช่องกรอก: สูง 48px มือถือ / 44px เดสก์ท็อป, พื้นขาว, focus = ขอบส้ม
// ใส่ className="numeric" หรือ "mono" สำหรับตัวเลข (ราคา, เบอร์โทร, เลขภาษี, รหัสไปรษณีย์)
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-md border border-input bg-card px-3.5 py-1 text-sm text-foreground transition-colors outline-none md:h-11 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-surface-muted aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
