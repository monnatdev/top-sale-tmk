import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// skeleton โครงหน้า: หัวขาว + การ์ด — ใช้ใน loading.tsx ของทุกหน้าให้ navigation รู้สึกทันที
export function HeaderSkeleton({ chips, search }: { chips?: boolean; search?: boolean }) {
  return (
    <div className="border-b border-border bg-card px-4 pt-3 pb-3.5 md:px-8 md:py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40 md:h-7 md:w-56" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="size-9 rounded-full md:hidden" />
        {search ? <Skeleton className="hidden h-10 w-70 md:block" /> : null}
      </div>
      {search ? <Skeleton className="mt-3 h-11 w-full md:hidden" /> : null}
      {chips ? (
        <div className="mt-3 flex gap-2 overflow-hidden">
          {[16, 14, 20, 20, 18, 20].map((w, i) => (
            <Skeleton key={i} className="h-9 shrink-0 rounded-full" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CardSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-lg border border-border bg-card p-3.5 md:p-5", className)}>
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 border-b border-dotted border-border pb-3 last:border-b-0 last:pb-0">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

// แถวรายการใบเสนอราคา (มือถือ = การ์ด · เดสก์ท็อป = แถวตาราง)
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5 md:gap-0 md:overflow-hidden md:rounded-lg md:border md:border-border md:bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5 rounded-lg border border-border border-l-4 border-l-border bg-card px-3.5 py-3.5 md:flex-row md:items-center md:gap-4 md:rounded-none md:border-x-0 md:border-t-0 md:border-b md:border-l-4 md:px-5 md:py-4">
          <Skeleton className="h-3 w-24 md:w-32" />
          <Skeleton className="h-4 w-2/3 md:flex-1" />
          <Skeleton className="h-3 w-20 md:w-24" />
          <Skeleton className="h-6 w-16 rounded-full md:w-24" />
        </div>
      ))}
    </div>
  );
}
