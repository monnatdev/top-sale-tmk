import { redirect } from "next/navigation";
import { QuotationForm } from "@/components/quotation/QuotationForm";
import { requireUser } from "@/lib/auth/session";
import { listCustomers } from "@/lib/db/queries/customers";
import { listActiveProducts } from "@/lib/db/queries/products";
import { saveDraft, submitQuotation } from "../actions";

export const metadata = { title: "สร้างใบเสนอราคา" };

export default async function NewQuotationPage() {
  const user = await requireUser();
  if (user.role !== "sale") redirect("/quotations"); // ผู้บริหารไม่สร้างใบ (service กันซ้ำอีกชั้น)

  const [products, customers] = await Promise.all([listActiveProducts(), listCustomers()]);
  return <QuotationForm products={products} customers={customers} onSaveDraft={saveDraft} onSubmit={submitQuotation} />;
}
