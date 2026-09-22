import { notFound, redirect } from "next/navigation";
import { QuotationForm } from "@/components/quotation/QuotationForm";
import { toFormInitial } from "@/components/quotation/viewModel";
import { requireUser } from "@/lib/auth/session";
import { listActiveProducts } from "@/lib/db/queries/products";
import { withProductImageUrls } from "@/lib/storage/signedUrl";
import { getQuotationById } from "@/lib/db/queries/quotations";
import { isEditable } from "@/lib/services/quotationStateMachine";
import { saveDraft, searchCustomers, submitQuotation } from "../../actions";

export const metadata = { title: "แก้ไขใบเสนอราคา" };

export default async function EditQuotationPage({ params }: PageProps<"/quotations/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser();
  const [q, products] = await Promise.all([getQuotationById(id, user), listActiveProducts().then(withProductImageUrls)]); // scope สิทธิ์ในตัว — ใบคนอื่น = ไม่พบ
  if (!q) notFound();
  if (q.ownerId !== user.id || !isEditable(q.status)) redirect(`/quotations/${id}`);

  return (
    <QuotationForm
      quotationId={q.id}
      quoteNumber={q.quoteNumber}
      initial={toFormInitial(q)}
      products={products}
      onSearchCustomers={searchCustomers}
      onSaveDraft={saveDraft}
      onSubmit={submitQuotation}
    />
  );
}
