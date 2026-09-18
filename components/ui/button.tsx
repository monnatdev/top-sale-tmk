import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// ปรับจาก shadcn base-nova ให้ตรงดีไซน์: ปุ่มสูง ≥ 44px บนมือถือ, 40px บนเดสก์ท็อป, มุม 8px
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // ปุ่มหลักของหน้า — ส้ม (มีได้ปุ่มเดียวต่อหน้า)
        default: "bg-primary font-semibold text-primary-foreground shadow-card hover:bg-primary-hover",
        // ปุ่มรอง — ขอบ, พื้นขาว (ย้อนกลับ, บันทึกร่าง, Export PDF ซ้ำ)
        outline: "border-border bg-card text-foreground hover:bg-muted aria-expanded:bg-muted",
        // ปุ่มรองโทนส้ม — ขอบส้ม ตัวส้ม (+ เพิ่มสินค้า บนเดสก์ท็อป)
        "outline-primary": "border-primary font-semibold text-primary-hover hover:bg-primary-soft",
        secondary: "bg-secondary text-secondary-foreground hover:bg-border",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        // ตีกลับ / ลบ — ขอบแดง ไม่ใช้พื้นแดงทึบ
        destructive:
          "border-destructive bg-transparent text-destructive hover:bg-destructive/10 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        // ปิดการขาย — เขียวทึบ
        success: "bg-success font-semibold text-success-foreground shadow-card hover:bg-success/90",
        // ลิงก์ในบรรทัด (แก้ไข, บันทึกร่าง บน header มือถือ)
        link: "h-auto rounded-none px-0 text-primary-hover underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-1.5 px-4 md:h-10 md:px-[18px]",
        sm: "h-9 gap-1 px-3 text-body",
        xs: "h-7 gap-1 rounded-sm px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        // ปุ่มหลัก sticky ล่างจอมือถือ
        lg: "h-13 gap-2 px-5 text-[15px] md:h-11",
        icon: "size-11 md:size-10",
        "icon-sm": "size-8 rounded-sm",
        "icon-xs": "size-7 rounded-sm [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      // render={<Link/>} = ไม่ใช่ <button> จริง — บอก Base UI ให้ไม่คาดหวัง native semantics
      nativeButton={nativeButton ?? !props.render}
      {...props}
    />
  )
}

export { Button, buttonVariants }
