import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** sm = 36px (sidebar) · md = 72px · lg = 96px (หน้า login มือถือ) */
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASS = { sm: "size-9 text-[8px]", md: "size-18 text-[9px]", lg: "size-24 text-2xs" };

// โลโก้ placeholder ทรงหยดส้ม — จุดเดียวที่ส้มเต็มบล็อกในหน้า · แทนด้วยรูปจริงเมื่อได้ไฟล์
export function BrandLogo({ size = "sm", className }: BrandLogoProps) {
  return (
    <div
      aria-label="ข้าวตราแม่ครัว"
      className={cn(
        "mono flex shrink-0 items-center justify-center bg-primary text-center leading-tight text-primary-foreground",
        "rounded-[50%_50%_50%_50%/62%_62%_38%_38%]",
        SIZE_CLASS[size],
        className,
      )}
    >
      โลโก้
    </div>
  );
}
