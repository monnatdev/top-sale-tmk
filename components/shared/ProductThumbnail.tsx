import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductThumbnailProps = {
  src?: string | null;
  alt?: string;
  /** sm = 44px จัตุรัส (มือถือ) · md = 64×52 (ตารางฟอร์ม) · lg = 72×56 (หน้าดู) */
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE: Record<NonNullable<ProductThumbnailProps["size"]>, { w: number; h: number; cls: string }> = {
  sm: { w: 44, h: 44, cls: "size-11" },
  md: { w: 64, h: 52, cls: "h-13 w-16" },
  lg: { w: 72, h: 56, cls: "h-14 w-18" },
};

// รูปสินค้า — src มาจาก /api/product-images (ย่อไว้แล้ว 200px จึง unoptimized) · ไม่มีรูป = ลายทาง placeholder
export function ProductThumbnail({ src, alt = "", size = "sm", className }: ProductThumbnailProps) {
  const { w, h, cls } = SIZE[size];
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-sm border border-border",
        !src && "stripe-placeholder",
        cls,
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={alt} width={w} height={h} unoptimized className="size-full object-cover" />
      ) : null}
    </div>
  );
}
