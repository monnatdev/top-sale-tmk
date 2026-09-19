"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDownIcon } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";
import { QUOTATION_SORTS, SORT_LABEL, type QuotationSort } from "@/lib/validation/quotation";
import { cn } from "@/lib/utils";

type SortSelectProps = {
  value: QuotationSort;
  /** filter อื่นที่ต้องคงไว้ใน URL (client component รับ function ไม่ได้ → รับ object แทน) */
  params: { status?: string; q?: string };
  className?: string;
};

function hrefFor(params: SortSelectProps["params"], sort: QuotationSort) {
  const p = new URLSearchParams();
  if (params.status) p.set("status", params.status);
  if (params.q) p.set("q", params.q);
  if (sort !== "newest") p.set("sort", sort);
  const qs = p.toString();
  return qs ? `/quotations?${qs}` : "/quotations";
}

// เรียงลำดับหน้ารายการ — native select (เล็ก ใช้ keyboard/มือถือได้ดี) + spinner ระหว่างโหลด
export function SortSelect({ value, params, className }: SortSelectProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      {pending ? <Spinner className="size-3.5" /> : <ArrowUpDownIcon className="size-3.5" />}
      <span className="sr-only">เรียงตาม</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => startTransition(() => router.push(hrefFor(params, e.target.value as QuotationSort)))}
        className="h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
      >
        {QUOTATION_SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABEL[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
