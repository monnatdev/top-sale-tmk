import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { LinkButton } from "@/components/shared/LinkButton";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { StickyActionBar } from "@/components/layout/StickyActionBar";
import { SearchInput } from "@/components/shared/SearchInput";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ListPagination } from "@/components/quotation/ListPagination";
import { SortSelect } from "@/components/quotation/SortSelect";
import { QuotationList } from "@/components/quotation/QuotationList";
import type { QuotationListItem } from "@/components/quotation/QuotationCard";
import { StatusFilterChips, type StatusFilterItem } from "@/components/quotation/StatusFilterChips";
import { requireUser } from "@/lib/auth/session";
import { QUOTATION_STATUSES } from "@/lib/constants/quotationStatus";
import { countQuotationsByStatus, listQuotations } from "@/lib/db/queries/quotations";
import { formatThaiDate, getInitials } from "@/lib/utils";
import { quotationListFilterSchema, type QuotationListFilterInput } from "@/lib/validation/quotation";

export const metadata = { title: "ใบเสนอราคา" };

// สร้าง href ของหน้ารายการโดยคง filter ที่เหลือไว้ (ไม่ใส่ค่า default ลง URL)
function listHref(f: { status?: string; q?: string; sort?: string; page?: number }) {
  const p = new URLSearchParams();
  if (f.status) p.set("status", f.status);
  if (f.q) p.set("q", f.q);
  if (f.sort && f.sort !== "newest") p.set("sort", f.sort);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  const qs = p.toString();
  return qs ? `/quotations?${qs}` : "/quotations";
}

export default async function QuotationsPage({ searchParams }: PageProps<"/quotations">) {
  const user = await requireUser();
  // filter จาก URL — ค่าผิดรูปแบบถือว่าไม่กรอง (ไม่ error หน้า)
  const parsed = quotationListFilterSchema.safeParse(await searchParams);
  const filter: QuotationListFilterInput = parsed.success ? parsed.data : { page: 1, sort: "newest" };
  const isSale = user.role === "sale";

  const [result, counts] = await Promise.all([listQuotations(user, filter), countQuotationsByStatus(user)]);
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  const chips: StatusFilterItem[] = [
    { status: "all", count: totalAll, href: listHref({ q: filter.q, sort: filter.sort }) },
    ...QUOTATION_STATUSES.map((s) => ({ status: s, count: counts[s], href: listHref({ status: s, q: filter.q, sort: filter.sort }) })),
  ];
  const items: QuotationListItem[] = result.items.map((r) => ({
    id: r.id,
    quoteNumber: r.quoteNumber,
    customerName: r.customerName,
    ownerName: r.owner.name,
    date: formatThaiDate(r.quoteDate),
    itemCount: r.itemCount,
    status: r.status,
  }));

  const search = (className: string) => (
    <form method="get" action="/quotations" className={className}>
      {filter.status ? <input type="hidden" name="status" value={filter.status} /> : null}
      {filter.sort !== "newest" ? <input type="hidden" name="sort" value={filter.sort} /> : null}
      <SearchInput name="q" defaultValue={filter.q ?? ""} placeholder="ค้นหาชื่อลูกค้า หรือ เลขที่ใบ" />
    </form>
  );

  const subtitle = isSale
    ? `ใบเสนอราคาของฉัน · ${user.name}`
    : `ทุกเซลล์ · ${totalAll} ใบ${counts.pending_approval > 0 ? ` · รออนุมัติจากคุณ ${counts.pending_approval} ใบ` : ""}`;

  return (
    <>
      <PageHeader
        title={isSale ? "ใบเสนอราคา" : "ใบเสนอราคาทั้งหมด"}
        subtitle={subtitle}
        aside={<UserAvatar initials={getInitials(user.name)} role={user.role} className="ml-auto md:hidden" />}
        actions={
          <>
            {search("hidden w-70 md:block")}
            {isSale ? (
              <LinkButton href="/quotations/new" icon={<PlusIcon />} className="hidden md:inline-flex">
                สร้างใบเสนอราคา
              </LinkButton>
            ) : null}
          </>
        }
      >
        {search("md:hidden")}
        <StatusFilterChips items={chips} active={filter.status ?? "all"} />
      </PageHeader>
      <PageBody withActionBar={isSale}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {filter.q ? (
              <>
                ผลค้นหา “{filter.q}” · {result.total} ใบ ·{" "}
                <Link href={listHref({ status: filter.status, sort: filter.sort })} className="text-primary-hover">
                  ล้างคำค้น
                </Link>
              </>
            ) : (
              <>{result.total} ใบ</>
            )}
          </p>
          <SortSelect value={filter.sort} params={{ status: filter.status, q: filter.q }} />
        </div>
        <QuotationList
          items={items}
          showOwner={!isSale}
          emptyText={filter.q || filter.status ? "ไม่พบใบเสนอราคาตามเงื่อนไข" : isSale ? "ยังไม่มีใบเสนอราคา — กด “สร้างใบเสนอราคา” เพื่อเริ่ม" : "ยังไม่มีใบเสนอราคาในระบบ"}
        />
        <ListPagination page={result.page} pageSize={result.pageSize} total={result.total} hrefFor={(p) => listHref({ ...filter, page: p })} />
      </PageBody>
      {isSale ? (
        <StickyActionBar>
          <LinkButton href="/quotations/new" icon={<PlusIcon />} size="lg">
            สร้างใบเสนอราคา
          </LinkButton>
        </StickyActionBar>
      ) : null}
    </>
  );
}
