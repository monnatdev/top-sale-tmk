import { LedgerRow, type LedgerItem } from "./LedgerRow";
import { cn } from "@/lib/utils";

type PriceTableProps = {
  items: readonly LedgerItem[];
  /** render slot ท้ายแถว (ปุ่มลบ/ช่องราคา) — ถ้ามี ตารางเดสก์ท็อปจะเพิ่มคอลัมน์สุดท้าย */
  renderTrailing?: (item: LedgerItem, index: number) => React.ReactNode;
  /** render input ราคาแทนตัวเลข (ฟอร์ม) */
  renderPrice?: (item: LedgerItem, index: number) => React.ReactNode;
  /** แถวท้ายตาราง เช่น ปุ่ม "+ เพิ่มสินค้า" */
  footer?: React.ReactNode;
  className?: string;
};

// ตารางราคาต่อถุง responsive — มือถือ = LedgerRow compact ใน padding · เดสก์ท็อป = grid + หัวตาราง
// ไม่มีช่องจำนวน ไม่มียอดรวม (ใบเสนอราคานี้เป็น "ตารางราคาต่อถุง")
export function PriceTable({ items, renderTrailing, renderPrice, footer, className }: PriceTableProps) {
  const hasTrailing = Boolean(renderTrailing);
  return (
    <div className={className}>
      {/* มือถือ */}
      <div className="px-3.5 md:hidden">
        {items.map((item, i) => (
          <LedgerRow key={item.id} item={item} trailing={renderTrailing?.(item, i)} priceSlot={renderPrice?.(item, i)} />
        ))}
        {footer ? <div className="flex justify-center py-3">{footer}</div> : null}
      </div>

      {/* เดสก์ท็อป */}
      <div className="hidden md:block">
        <div
          className={cn(
            "grid gap-4 border-b border-border bg-background px-6 py-2.5 text-xs text-muted-foreground",
            hasTrailing ? "grid-cols-[40px_96px_1fr_120px_180px_44px]" : "grid-cols-[40px_96px_1fr_120px_160px]",
          )}
        >
          <div>ที่</div>
          <div>ภาพสินค้า</div>
          <div>รายการ</div>
          <div className="text-right">นน./ถุง</div>
          <div className="text-right">ราคาส่ง/ถุง</div>
          {hasTrailing ? <div /> : null}
        </div>
        {items.map((item, i) => (
          <LedgerRow key={item.id} item={item} index={i + 1} variant="table" trailing={renderTrailing?.(item, i)} priceSlot={renderPrice?.(item, i)} />
        ))}
        {footer ? <div className="px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
