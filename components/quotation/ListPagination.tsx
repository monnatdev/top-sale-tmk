import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/shared/LinkButton";
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
      {page > 1 ? (
        <LinkButton href={hrefFor(page - 1)} icon={<ChevronLeftIcon />} variant="outline" size="sm">
          ก่อนหน้า
        </LinkButton>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeftIcon /> ก่อนหน้า
        </Button>
      )}
      <span className="mono text-xs text-muted-foreground">
        {from}–{to} จาก {total} · หน้า {page}/{pages}
      </span>
      {page < pages ? (
        <LinkButton href={hrefFor(page + 1)} variant="outline" size="sm">
          ถัดไป <ChevronRightIcon />
        </LinkButton>
      ) : (
        <Button variant="outline" size="sm" disabled>
          ถัดไป <ChevronRightIcon />
        </Button>
      )}
    </nav>
  );
}
