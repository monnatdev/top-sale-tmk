import { notFound } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { LinkButton } from "@/components/shared/LinkButton";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { StickyActionBar } from "@/components/layout/StickyActionBar";
import { InfoNotice } from "@/components/shared/InfoNotice";
import { SectionCard } from "@/components/shared/SectionCard";
import { CustomerSummary } from "@/components/quotation/CustomerSummary";
import { NoteList } from "@/components/quotation/NoteList";
import { PriceTable } from "@/components/quotation/PriceTable";
import { StatusBadge } from "@/components/quotation/StatusBadge";
import { StatusProgress } from "@/components/quotation/StatusProgress";
import { Timeline } from "@/components/quotation/Timeline";
import { toCustomerSummary, toLedgerItems, toTimeline } from "@/components/quotation/viewModel";
import { SubmitButton } from "@/components/quotation/SubmitButton";
import { ApprovalActions } from "@/components/quotation/ApprovalActions";
import { CloseSaleButton } from "@/components/quotation/CloseSaleButton";
import { ExportPdfButton } from "@/components/quotation/ExportPdfButton";
import { SignatureCard } from "@/components/quotation/SignatureCard";
import { requireUser } from "@/lib/auth/session";
import { getProfileSignaturePath } from "@/lib/db/queries/profiles";
import { getQuotationById } from "@/lib/db/queries/quotations";
import { isEditable } from "@/lib/services/quotationStateMachine";
import { getSignatureUrl, withProductImageUrls } from "@/lib/storage/signedUrl";
import { formatThaiDate, formatThaiDateTime } from "@/lib/utils/format";
import { approveQuotation, closeSale, rejectQuotation } from "../actions";

export default async function QuotationDetailPage({ params }: PageProps<"/quotations/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const q = await getQuotationById(id, user); // sale เห็นเฉพาะใบตัวเอง — ของคนอื่น = 404
  if (!q) notFound();

  const isOwner = q.ownerId === user.id;
  const isExecutive = user.role === "executive";
  const canEdit = isOwner && isEditable(q.status);
  const canApprove = isExecutive && q.status === "pending_approval";
  const canExport = q.status === "approved" || q.status === "sent" || q.status === "won";
  // ปุ่มตามตาราง UI-KIT ข้อ 3: approved+owner = Export (→ sent) · sent+owner = ปิดการขาย + Export ซ้ำ · อื่นๆ = Export ซ้ำ
  const exportIsFirst = q.status === "approved" && isOwner;
  const canCloseSale = isOwner && q.status === "sent";
  const items = toLedgerItems(withProductImageUrls(q.items));

  // ลายเซ็น: signed URL ส่งให้ผู้บริหารเท่านั้น (auth-guard ข้อ 8) — เซลล์เห็นแค่ชื่อ/วันที่
  // ตอนรออนุมัติ = ลายเซ็นปัจจุบันของผู้บริหารที่ล็อกอิน · อนุมัติแล้ว = snapshot ในใบ
  const signaturePath = isExecutive ? (canApprove ? await getProfileSignaturePath(user.id) : q.signaturePath) : null;
  const signatureUrl = await getSignatureUrl(signaturePath);
  const isSigned = q.signedBy !== null && q.signedAt !== null;

  // ปุ่มตามบทบาท + สถานะ
  const renderActions = (layout: "mobile" | "desktop") => {
    const size = layout === "mobile" ? "lg" : "default";
    if (canEdit) {
      return (
        <>
          <LinkButton href={`/quotations/${q.id}/edit`} icon={<PencilIcon />} variant="outline" size={layout === "mobile" ? "lg" : "default"}>
            แก้ไข
          </LinkButton>
          <SubmitButton id={q.id} disabled={q.items.length === 0} />
        </>
      );
    }
    if (canApprove) {
      return <ApprovalActions id={q.id} quoteNumber={q.quoteNumber} signatureUrl={signatureUrl} onApprove={approveQuotation} onReject={rejectQuotation} layout={layout} />;
    }
    if (canCloseSale) {
      return (
        <>
          <ExportPdfButton id={q.id} label="Export PDF ซ้ำ" size={layout === "mobile" ? "default" : "default"} className={layout === "mobile" ? "order-2" : "-order-1"} />
          <CloseSaleButton id={q.id} quoteNumber={q.quoteNumber} onClose={closeSale} size={size} />
        </>
      );
    }
    if (canExport) {
      return <ExportPdfButton id={q.id} primary={exportIsFirst} label={exportIsFirst ? "Export PDF" : "Export PDF ซ้ำ"} size={size} />;
    }
    return null;
  };
  const hasActions = canEdit || canApprove || canExport;

  return (
    <>
      <PageHeader
        back={{ href: "/quotations", label: "กลับไปรายการ" }}
        title={<span className="mono font-medium">{q.quoteNumber}</span>}
        aside={<StatusBadge status={q.status} />}
        subtitle={
          <>
            สร้าง <span className="mono">{formatThaiDate(q.createdAt)}</span> · โดย {q.owner.name}
          </>
        }
        actions={hasActions ? <div className="hidden gap-3 md:flex">{renderActions("desktop")}</div> : undefined}
      />

      <PageBody withActionBar={hasActions} className="md:grid md:grid-cols-[1fr_340px] md:items-start">
        <div className="flex flex-col gap-3 md:gap-5">
          {exportIsFirst ? <InfoNotice>กด Export PDF แล้วสถานะจะเปลี่ยนเป็น “ส่งลูกค้าแล้ว” อัตโนมัติ · ไม่มี Export Excel</InfoNotice> : null}
          {q.status === "returned" && q.returnReason ? (
            <InfoNotice bordered>
              <b className="font-semibold">ตีกลับแก้ไข:</b> {q.returnReason}
            </InfoNotice>
          ) : null}

          <SectionCard title="ข้อมูลลูกค้า">
            <CustomerSummary data={toCustomerSummary(q)} variant="compact" className="md:hidden" />
            <CustomerSummary data={toCustomerSummary(q)} variant="grid" className="hidden md:grid" />
          </SectionCard>

          <SectionCard title="ตารางราคาต่อถุง" meta={`${items.length} รายการ · ไม่มียอดรวม`} flush divided>
            {items.length === 0 ? <p className="px-3.5 py-5 text-body text-muted-foreground">ยังไม่มีสินค้า</p> : <PriceTable items={items} />}
          </SectionCard>

          {q.notes.length > 0 ? (
            <SectionCard title="หมายเหตุ / เงื่อนไข">
              <NoteList notes={q.notes.map((n) => ({ id: n.id, text: n.text }))} />
            </SectionCard>
          ) : null}

          <SectionCard title="ประวัติ">
            <Timeline entries={toTimeline(q.auditLog)} />
          </SectionCard>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          <SectionCard title="สถานะเอกสาร">
            <StatusProgress current={q.status} currentHint={canApprove ? "อยู่ที่คุณ" : undefined} />
          </SectionCard>
          <SignatureCard
            imageUrl={signatureUrl}
            signedBy={isSigned ? q.signer?.name : null}
            signedAt={isSigned ? formatThaiDateTime(q.signedAt) : null}
            placeholder={isSigned ? "เซ็นแล้ว" : canApprove ? "ลายเซ็นจากโปรไฟล์ผู้บริหาร" : "รอผู้บริหารอนุมัติ"}
            hint={
              canApprove
                ? "กด “อนุมัติ + เซ็นลายเซ็น” แล้วระบบดึงลายเซ็นมาวางให้อัตโนมัติ และล็อกใบนี้ไม่ให้แก้"
                : isSigned && !isExecutive
                  ? "ลายเซ็นจะปรากฏในไฟล์ PDF ที่ export"
                  : undefined
            }
          />
          {isExecutive ? <InfoNotice bordered>ผู้บริหารเห็นใบของทุกเซลล์ · เซลล์เห็นเฉพาะใบของตัวเอง</InfoNotice> : null}
        </div>
      </PageBody>

      {hasActions ? (
        <StickyActionBar className={canEdit ? "grid grid-cols-[112px_1fr] gap-3" : "flex flex-col gap-2.5"}>{renderActions("mobile")}</StickyActionBar>
      ) : null}
    </>
  );
}
