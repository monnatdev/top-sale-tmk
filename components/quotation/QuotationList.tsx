import { QuotationCard, type QuotationListItem } from "./QuotationCard";
import { QuotationTable } from "./QuotationTable";

type QuotationListProps = {
  items: readonly QuotationListItem[];
  showOwner?: boolean;
  emptyText?: string;
};

// รายการใบเสนอราคา responsive: การ์ดบนมือถือ / ตารางบนเดสก์ท็อป
export function QuotationList({ items, showOwner, emptyText = "ยังไม่มีใบเสนอราคา" }: QuotationListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-body text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-col gap-2.5 md:hidden">
        {items.map((item) => (
          <QuotationCard key={item.id} item={item} showOwner={showOwner} />
        ))}
      </div>
      <QuotationTable items={items} showOwner={showOwner} className="hidden md:block" />
    </>
  );
}
