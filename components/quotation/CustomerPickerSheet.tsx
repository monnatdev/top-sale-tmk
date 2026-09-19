"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SearchInput } from "@/components/shared/SearchInput";
import { Spinner } from "@/components/shared/Spinner";
import type { ActionResult } from "@/lib/actionResult";
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
  /** server action ค้นหา — ว่าง = ล่าสุด 20 ราย */
  onSearch: (input: { q: string }) => Promise<ActionResult<CustomerOption[]>>;
  onSelect: (customer: CustomerOption) => void;
};

const DEBOUNCE_MS = 250;

// เลือกลูกค้าเก่า — โหลดตอนเปิด + ค้นหาแบบ on-demand (ไม่โหลดรายชื่อทั้งบริษัทมากับหน้า)
export function CustomerPickerSheet({ open, onOpenChange, onSearch, onSelect }: CustomerPickerSheetProps) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CustomerOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) return;
    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await onSearch({ q: term });
      if (id !== requestId.current) return; // มีคำค้นใหม่กว่าแล้ว ทิ้งผลนี้
      setLoading(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setError(null);
      setResults(res.data);
    }, term ? DEBOUNCE_MS : 0);
    return () => clearTimeout(timer);
  }, [open, term, onSearch]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl bg-card px-4 pt-3 pb-safe md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[420px] md:rounded-none md:border-l md:pt-5">
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-base font-semibold">เลือกลูกค้าเก่า</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">{term ? "ผลค้นหา" : "ลูกค้าล่าสุด"} · พิมพ์ชื่อบริษัทหรือเลขผู้เสียภาษีเพื่อค้นหา</SheetDescription>
        </SheetHeader>
        <div className="relative">
          <SearchInput placeholder="ค้นหาชื่อบริษัท หรือ เลขผู้เสียภาษี" value={term} onChange={(e) => setTerm(e.target.value)} autoFocus />
          {loading ? <Spinner className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" /> : null}
        </div>
        <div role="listbox" aria-label="ลูกค้า" aria-busy={loading} className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pb-2">
          {error ? <p className="py-6 text-center text-body text-destructive">{error}</p> : null}
          {results === null && !error ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : null}
          {results?.length === 0 ? <p className="py-6 text-center text-body text-muted-foreground">ไม่พบลูกค้า — เลือก “ลูกค้าใหม่” เพื่อกรอกเอง</p> : null}
          {results?.map((c) => (
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
                {c.taxId ? ` · ${c.taxId}` : ""}
              </span>
            </button>
          ))}
          {results && results.length >= 20 ? <p className="py-2 text-center text-2xs text-muted-foreground">แสดง 20 รายการแรก — พิมพ์ค้นหาเพื่อกรองเพิ่ม</p> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
