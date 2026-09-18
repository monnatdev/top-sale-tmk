import { NumericText } from "@/components/shared/NumericText";
import { ProductThumbnail } from "@/components/shared/ProductThumbnail";
import { cn } from "@/lib/utils";

export type LedgerItem = {
  id: string;
  name: string;
  /** สเปกบรรจุ เช่น "บรรจุถุง PP ขาวล้วน ติดแท็ก" */
  spec?: string;
  /** น้ำหนักต่อถุง (กก.) */
  weightKg: number;
  /** ราคาส่งต่อถุง format แล้ว เช่น "1,260" หรือ number */
  price: string | number;
  imageUrl?: string | null;
};

type LedgerRowProps = {
  item: LedgerItem;
  /** ลำดับที่ — แสดงเฉพาะเดสก์ท็อป (variant "table") */
  index?: number;
  /** compact = แถวมือถือ (รูป + ชื่อ + ราคาใหญ่) · table = grid บนเดสก์ท็อป */
  variant?: "compact" | "table";
  /** slot ท้ายแถว เช่น ปุ่มลบ × (ฟอร์ม) */
  trailing?: React.ReactNode;
  /** แทนที่ตัวเลขราคาด้วย input (ฟอร์มแก้ราคา) */
  priceSlot?: React.ReactNode;
  className?: string;
};

// บรรทัดสินค้าแบบสมุดชั่ง — signature element: เส้นประเต็มความกว้าง + ราคา/ถุง ตัวใหญ่สุดในหน้า
export function LedgerRow({ item, index, variant = "compact", trailing, priceSlot, className }: LedgerRowProps) {
  if (variant === "table") {
    return (
      <div className={cn("border-ledger grid grid-cols-[40px_96px_1fr_120px_160px] items-center gap-4 px-6 py-4 last:border-b-0", trailing && "grid-cols-[40px_96px_1fr_120px_180px_44px]", className)}>
        <div className="mono text-body text-muted-foreground">{index}</div>
        <ProductThumbnail src={item.imageUrl} alt={item.name} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{item.name}</div>
          {item.spec ? <div className="mt-0.5 text-xs text-muted-foreground">{item.spec}</div> : null}
        </div>
        <div className="text-right">
          <NumericText value={item.weightKg} unit="กก." />
        </div>
        <div className="text-right">
          {priceSlot ?? <NumericText value={item.price} size="2xl" />}
          <div className="text-2xs text-muted-foreground">บาท/ถุง</div>
        </div>
        {trailing ? <div className="flex justify-end">{trailing}</div> : null}
      </div>
    );
  }

  return (
    <div className={cn("border-ledger flex items-center gap-3 py-3 last:border-b-0", className)}>
      <ProductThumbnail src={item.imageUrl} alt={item.name} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="truncate text-body font-medium">{item.name}</div>
        {item.spec ? <div className="truncate text-2xs text-muted-foreground">{item.spec}</div> : null}
        <div className="mono text-2xs text-muted-foreground">{item.weightKg} กก./ถุง</div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        {priceSlot ?? <NumericText value={item.price} size="xl" className="font-medium" />}
        <span className="text-[10px] text-muted-foreground">บาท/ถุง</span>
      </div>
      {trailing}
    </div>
  );
}
