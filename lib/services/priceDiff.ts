// สรุปการเปลี่ยนแปลงราคา/รายการสำหรับ audit_log.detail — pure
import { formatPrice } from "@/lib/utils/format";

export type PricedItem = { productId: string | null; productName: string; pricePerBag: number };

export function describeItemChanges(before: PricedItem[], after: PricedItem[]): string | null {
  const lines: string[] = [];
  const key = (it: PricedItem) => it.productId ?? it.productName;
  const beforeMap = new Map(before.map((it) => [key(it), it]));
  const afterMap = new Map(after.map((it) => [key(it), it]));

  for (const [k, b] of beforeMap) {
    const a = afterMap.get(k);
    if (!a) lines.push(`ลบ ${b.productName}`);
    else if (a.pricePerBag !== b.pricePerBag) lines.push(`ราคา ${b.productName}: ${formatPrice(b.pricePerBag)} → ${formatPrice(a.pricePerBag)}`);
  }
  for (const [k, a] of afterMap) {
    if (!beforeMap.has(k)) lines.push(`เพิ่ม ${a.productName} ${formatPrice(a.pricePerBag)}`);
  }
  return lines.length > 0 ? lines.join(" · ") : null;
}
