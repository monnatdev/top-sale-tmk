import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** sm = 36px (sidebar) · md = 72px · lg = 96px (หน้า login มือถือ) */
  size?: "sm" | "md" | "lg";
  className?: string;
};

// สัดส่วนไฟล์จริง public/brand/logo.png (335×512) — กำหนดความสูงแล้วคำนวณกว้าง ไม่ให้ next/image เตือนเรื่อง aspect ratio
const RATIO = 335 / 512;
const HEIGHT = { sm: 36, md: 72, lg: 96 };

// โลโก้แบรนด์ (ไฟล์จริงจากลูกค้า) — พื้นโปร่ง ใช้ได้ทั้งบนพื้น ink และพื้นขาว
export function BrandLogo({ size = "sm", className }: BrandLogoProps) {
  const height = HEIGHT[size];
  return (
    <Image
      src="/brand/logo.png"
      alt="ข้าวตราแม่ครัว"
      width={Math.round(height * RATIO)}
      height={height}
      priority={size !== "sm"}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
