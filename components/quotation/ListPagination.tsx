import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ListPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  /** สร้าง href ของหน้าที่ต้องการ (คง filter อื่นไว้) */
  hrefFor: (page: number) => string;
  className?: string;
};

// pagination หน้ารายการ — ก่อนหน้า / หน้า x จาก y · แสดง n–m จาก total / ถัดไป
export function ListPagination({ page, pageSize, total, hrefFor, className }: ListPaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label="เปลี่ยนหน้า" className={cn("flex items-center justify-between gap-3", className)}>
      <Button variant="outline" size="sm" disabled={page <= 1} render={page > 1 ? <Link href={hrefFor(page - 1)} /> : undefined}>
        <ChevronLeftIcon /> ก่อนหน้า
      </Button>
      <span className="mono text-xs text-muted-foreground">
        {from}–{to} จาก {total} · หน้า {page}/{pages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= pages} render={page < pages ? <Link href={hrefFor(page + 1)} /> : undefined}>
        ถัดไป <ChevronRightIcon />
      </Button>
    </nav>
  );
}
