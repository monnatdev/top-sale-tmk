import { describe, expect, it } from "vitest";
import { COMPANY } from "@/lib/constants/company";
import { renderQuotationPdf, type QuotationPdfData } from "./quotationPdf";

const data: QuotationPdfData = {
  quoteNumber: "QT-2569-0041",
  quoteDate: "20/07/2569",
  paymentType: "credit",
  creditDays: 30,
  customer: { name: "บจก. ทาโกฟู้ดส์อินดัสทรี", addressLine: "99/12 ม.4 ถ.เทพารักษ์", subDistrict: "บางปลา", district: "บางพลี", province: "สมุทรปราการ", postalCode: "10540" },
  items: [
    { name: "ข้าวหอมมะลิปทุม 100%", spec: "บรรจุถุง PP ขาวล้วน ติดแท็ก", weightKg: "45", price: "1,260", image: null },
    { name: "ข้าวขาว", spec: "บรรจุกระสอบ ติดแท็ก", weightKg: "48", price: "1,145", image: null },
  ],
  notes: ["ยืนราคา 30 วันนับจากวันที่เสนอราคา", "กรุณาส่ง PO ล่วงหน้า 10-14 วัน"],
  signer: { name: "วิรัช เจริญพร", title: COMPANY.signerTitle },
  signature: null,
  company: COMPANY,
};

describe("renderQuotationPdf", () => {
  it("renders a valid single-page PDF with Thai fonts embedded", async () => {
    const buf = await renderQuotationPdf(data);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    const text = buf.toString("latin1");
    expect(text).toContain("IBMPlexSansThai");
    expect(text).toContain("/Count 1"); // หน้าเดียว
  }, 30000);
});
