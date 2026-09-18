"use client";

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SearchInput } from "@/components/shared/SearchInput";
import type { PaymentType } from "@/lib/db/schema";

export type CustomerOption = {
  id: string;
  companyName: string;
  addressLine: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string | null;
  taxId: string | null;
  paymentType: PaymentType;
  creditDays: number;
};

type CustomerPickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: readonly CustomerOption[];
  onSelect: (customer: CustomerOption) => void;
};

// เลือกลูกค้าเก่า (รายชื่อแชร์ทั้งบริษัท) — เลือกแล้วฟอร์มเติมที่อยู่/เบอร์/เครดิตให้
export function CustomerPickerSheet({ open, onOpenChange, customers, onSelect }: CustomerPickerSheetProps) {
  const [term, setTerm] = useState("");
  const visible = useMemo(() => {
    const t = term.trim().toLowerCase();
    return t ? customers.filter((c) => c.companyName.toLowerCase().includes(t) || c.taxId?.includes(t)) : customers;
  }, [customers, term]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl bg-card px-4 pt-3 pb-safe md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[420px] md:rounded-none md:border-l md:pt-5">
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-base font-semibold">เลือกลูกค้าเก่า</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">รายชื่อลูกค้าทั้งบริษัท · {customers.length} ราย</SheetDescription>
        </SheetHeader>
        <SearchInput placeholder="ค้นหาชื่อบริษัท หรือ เลขผู้เสียภาษี" value={term} onChange={(e) => setTerm(e.target.value)} autoFocus />
        <div role="listbox" aria-label="ลูกค้า" className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pb-2">
          {visible.length === 0 ? <p className="py-6 text-center text-body text-muted-foreground">ไม่พบลูกค้า — เลือก “ลูกค้าใหม่” เพื่อกรอกเอง</p> : null}
          {visible.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                onSelect(c);
                setTerm("");
                onOpenChange(false);
              }}
              className="flex flex-col gap-0.5 rounded-lg border border-border p-3 text-left hover:bg-muted"
            >
              <span className="text-body font-medium">{c.companyName}</span>
              <span className="truncate text-2xs text-muted-foreground">
                {[c.subDistrict && `ต.${c.subDistrict}`, c.district && `อ.${c.district}`, c.province && `จ.${c.province}`].filter(Boolean).join(" ") || "ยังไม่มีที่อยู่"}
              </span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
