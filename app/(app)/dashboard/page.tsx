import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StatusBarChart } from "@/components/dashboard/StatusBarChart";
import { StatusCountCard } from "@/components/dashboard/StatusCountCard";
import { requireUser } from "@/lib/auth/session";
import { QUOTATION_STATUSES } from "@/lib/constants/quotationStatus";
import { countQuotationsByStatus } from "@/lib/db/queries/quotations";
import { getInitials } from "@/lib/utils";

export const metadata = { title: "ภาพรวม" };

// ภาพรวม MVP = จำนวนใบตามสถานะ (scope ตาม role) · กดการ์ดไปหน้ารายการที่กรอง — ไม่มีตัวเลขเงินเพราะใบไม่มียอดรวม
export default async function DashboardPage() {
  const user = await requireUser();
  const counts = await countQuotationsByStatus(user);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const data = QUOTATION_STATUSES.map((status) => ({ status, count: counts[status] }));

  return (
    <>
      <PageHeader
        title={user.role === "sale" ? "ภาพรวม" : "ภาพรวมใบเสนอราคา"}
        subtitle={user.role === "sale" ? `ของฉัน · ${user.name} · รวม ${total} ใบ` : `ทุกเซลล์ · รวม ${total} ใบ`}
        aside={<UserAvatar initials={getInitials(user.name)} role={user.role} className="ml-auto md:hidden" />}
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6 md:gap-4">
          {data.map((d) => (
            <StatusCountCard key={d.status} status={d.status} count={d.count} href={`/quotations?status=${d.status}`} />
          ))}
        </div>
        <SectionCard title="ใบเสนอราคาแยกตามสถานะ" meta={<span className="hidden md:inline">กดแถบเพื่อไปหน้ารายการที่กรองสถานะนั้น</span>}>
          {total === 0 ? (
            <p className="py-4 text-center text-body text-muted-foreground">ยังไม่มีใบเสนอราคา</p>
          ) : (
            <StatusBarChart data={data} />
          )}
          <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            MVP นี้ไม่มีกราฟยอดขาย ไม่มีอันดับสินค้า/ลูกค้า/เซลล์ และไม่มีตัวเลขเงิน เพราะใบเสนอราคาไม่มียอดรวม
          </p>
        </SectionCard>
      </PageBody>
    </>
  );
}
