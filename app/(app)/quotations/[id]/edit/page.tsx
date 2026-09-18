import { notFound, redirect } from "next/navigation";
import { QuotationForm } from "@/components/quotation/QuotationForm";
import { toFormInitial } from "@/components/quotation/viewModel";
import { requireUser } from "@/lib/auth/session";
import { listCustomers } from "@/lib/db/queries/customers";
import { listActiveProducts } from "@/lib/db/queries/products";
import { getQuotationById } from "@/lib/db/queries/quotations";
import { isEditable } from "@/lib/services/quotationStateMachine";
import { saveDraft, submitQuotation } from "../../actions";

export const metadata = { title: "แก้ไขใบเสนอราคา" };

export default async function EditQuotationPage({ params }: PageProps<"/quotations/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser();
  const q = await getQuotationById(id, user); // scope สิทธิ์ในตัว — ใบคนอื่น = ไม่พบ
  if (!q) notFound();
  if (q.ownerId !== user.id || !isEditable(q.status)) redirect(`/quotations/${id}`);

  const [products, customers] = await Promise.all([listActiveProducts(), listCustomers()]);
  return (
    <QuotationForm
      quotationId={q.id}
      quoteNumber={q.quoteNumber}
      initial={toFormInitial(q)}
      products={products}
      customers={customers}
      onSaveDraft={saveDraft}
      onSubmit={submitQuotation}
    />
  );
}
