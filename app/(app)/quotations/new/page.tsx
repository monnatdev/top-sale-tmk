import { redirect } from "next/navigation";
import { QuotationForm } from "@/components/quotation/QuotationForm";
import { requireUser } from "@/lib/auth/session";
import { listActiveProducts } from "@/lib/db/queries/products";
import { saveDraft, searchCustomers, submitQuotation } from "../actions";

export const metadata = { title: "สร้างใบเสนอราคา" };

export default async function NewQuotationPage() {
  const user = await requireUser();
  if (user.role !== "sale") redirect("/quotations"); // ผู้บริหารไม่สร้างใบ (service กันซ้ำอีกชั้น)

  const products = await listActiveProducts();
  return <QuotationForm products={products} onSearchCustomers={searchCustomers} onSaveDraft={saveDraft} onSubmit={submitQuotation} />;
}
