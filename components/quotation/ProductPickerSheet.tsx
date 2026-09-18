"use client";

import { useMemo, useState } from "react";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormField } from "@/components/shared/FormField";
import { ProductThumbnail } from "@/components/shared/ProductThumbnail";
import { SearchInput } from "@/components/shared/SearchInput";
import { cn } from "@/lib/utils";

export type ProductOption = {
  id: string;
  name: string;
  packagingSpec: string;
  weightPerBag: number;
  imageUrl?: string | null;
};

type ProductPickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: readonly ProductOption[];
  /** สินค้าที่อยู่ในใบแล้ว — ซ่อนจากรายการ */
  excludeIds?: readonly string[];
  onConfirm: (pick: { productId: string; pricePerBag: number }) => void;
};

// bottom sheet เลือกสินค้าจากรายการหลัก + กรอกราคาส่ง/ถุง (มือถือ = ล่าง · เดสก์ท็อป = ขวา)
export function ProductPickerSheet({ open, onOpenChange, products, excludeIds = [], onConfirm }: ProductPickerSheetProps) {
  const [term, setTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [price, setPrice] = useState("");

  const visible = useMemo(() => {
    const t = term.trim().toLowerCase();
    return products.filter((p) => !excludeIds.includes(p.id) && (!t || p.name.toLowerCase().includes(t)));
  }, [products, excludeIds, term]);

  const priceNumber = Number(price);
  const canConfirm = selectedId !== null && Number.isFinite(priceNumber) && priceNumber > 0;

  const reset = () => {
    setTerm("");
    setSelectedId(null);
    setPrice("");
  };

  const confirm = () => {
    if (!canConfirm || !selectedId) return;
    onConfirm({ productId: selectedId, pricePerBag: Math.round(priceNumber * 100) / 100 });
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl bg-card px-4 pt-3 pb-safe md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[420px] md:rounded-none md:border-l md:pt-5">
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-base font-semibold">เพิ่มสินค้า</SheetTitle>
          <SheetDescription className="sr-only">เลือกสินค้าจากรายการหลักแล้วกรอกราคาส่งต่อถุง</SheetDescription>
        </SheetHeader>
        <SearchInput placeholder="ค้นหาสินค้าจากรายการหลัก" value={term} onChange={(e) => setTerm(e.target.value)} />

        <div role="listbox" aria-label="สินค้า" className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1">
          {visible.length === 0 ? (
            <p className="py-6 text-center text-body text-muted-foreground">
              {products.length === excludeIds.length ? "เพิ่มสินค้าครบทุกรายการแล้ว" : "ไม่พบสินค้า"}
            </p>
          ) : null}
          {visible.map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left",
                  active ? "border-primary bg-primary-soft" : "border-border hover:bg-muted",
                )}
              >
                <ProductThumbnail src={p.imageUrl} alt={p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className={cn("text-body", active ? "font-semibold" : "font-medium")}>{p.name}</div>
                  <div className="truncate text-2xs text-muted-foreground">
                    {p.packagingSpec}
                    {p.packagingSpec ? " · " : ""}
                    {p.weightPerBag} กก.
                  </div>
                </div>
                {active ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-3" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3.5">
          <FormField label="ราคาส่ง/ถุง" htmlFor="pick-price" trailing="บาท">
            <Input
              id="pick-price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirm()}
              className="numeric h-14 text-2xl font-medium focus-visible:border-primary"
              placeholder="0"
            />
          </FormField>
          <Button type="button" size="lg" className="mt-1.5" disabled={!canConfirm} onClick={confirm}>
            ยืนยันเพิ่มรายการ
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
