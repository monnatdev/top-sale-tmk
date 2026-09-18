// ข้อมูลตัวอย่างจากดีไซน์ — ใช้เฉพาะหน้า /ui-kit (catalog) เท่านั้น
import type { QuotationListItem } from "@/components/quotation/QuotationCard";
import type { LedgerItem } from "@/components/quotation/LedgerRow";
import type { TimelineEntry } from "@/components/quotation/Timeline";
import type { CustomerSummaryData } from "@/components/quotation/CustomerSummary";
import type { QuotationStatus } from "@/lib/constants/quotationStatus";

export const MOCK_SALES_USER = { name: "สมชาย ส.", initials: "สช", role: "sale" as const };
export const MOCK_EXEC_USER = { name: "วิรัช เจริญพร", initials: "วร", role: "executive" as const };

export const MOCK_QUOTATIONS: QuotationListItem[] = [
  { id: "1", quoteNumber: "QT-2569-0041", customerName: "บจก. ทาโกฟู้ดส์อินดัสทรี", ownerName: "สมชาย ส.", date: "20/07/2569", itemCount: 4, status: "pending_approval" },
  { id: "2", quoteNumber: "QT-2569-0040", customerName: "บมจ. ไทยรุ่งยูเนียนคาร์", ownerName: "ปรีดา ก.", date: "20/07/2569", itemCount: 6, status: "pending_approval" },
  { id: "3", quoteNumber: "QT-2569-0039", customerName: "บมจ. ไทยรุ่งยูเนียนคาร์", ownerName: "สมชาย ส.", date: "18/07/2569", itemCount: 3, status: "returned" },
  { id: "4", quoteNumber: "QT-2569-0038", customerName: "หจก. ข้าวทองเจริญ", ownerName: "ณัฐพล ว.", date: "17/07/2569", itemCount: 4, status: "approved" },
  { id: "5", quoteNumber: "QT-2569-0036", customerName: "หจก. ข้าวทองเจริญ", ownerName: "สมชาย ส.", date: "15/07/2569", itemCount: 5, status: "sent" },
  { id: "6", quoteNumber: "QT-2569-0034", customerName: "บจก. ทาโกฟู้ดส์อินดัสทรี", ownerName: "สมชาย ส.", date: "12/07/2569", itemCount: 2, status: "won" },
  { id: "7", quoteNumber: "QT-2569-0033", customerName: "หจก. ข้าวทองเจริญ", ownerName: "ณัฐพล ว.", date: "11/07/2569", itemCount: 4, status: "draft" },
];

export const MOCK_STATUS_COUNTS: { status: QuotationStatus; count: number }[] = [
  { status: "draft", count: 6 },
  { status: "pending_approval", count: 4 },
  { status: "approved", count: 7 },
  { status: "sent", count: 11 },
  { status: "won", count: 8 },
  { status: "returned", count: 2 },
];

export const MOCK_PRODUCTS: LedgerItem[] = [
  { id: "p1", name: "ข้าวหอมมะลิปทุม 100%", spec: "บรรจุถุง PP ขาวล้วน ติดแท็ก", weightKg: 45, price: 1260 },
  { id: "p2", name: "ข้าวหอมมะลิ 70:30", spec: "บรรจุถุง PP ขาวล้วน ติดแท็ก", weightKg: 45, price: 1100 },
  { id: "p3", name: "ข้าวขาว", spec: "บรรจุกระสอบ ติดแท็ก", weightKg: 48, price: 1145 },
  { id: "p4", name: "ข้าวเสาไห้", spec: "บรรจุถุง PP ขาวล้วน ติดแท็ก", weightKg: 45, price: 1290 },
];

export const MOCK_NOTES = [
  { id: "n1", text: "ยืนราคา 30 วันนับจากวันที่เสนอราคา" },
  { id: "n2", text: "สินค้าได้รับการรับรองมาตรฐาน อย. / GMP / HACCP" },
  { id: "n3", text: "กรุณาส่ง PO ล่วงหน้า 10-14 วัน" },
];

export const MOCK_TIMELINE: TimelineEntry[] = [
  { id: "t1", who: "สมชาย ส.", what: "สร้างใบเสนอราคา", when: "18/07/2569 09:12" },
  { id: "t2", who: "สมชาย ส.", what: "ส่งให้ผู้บริหารอนุมัติ", when: "18/07/2569 10:04" },
  { id: "t3", who: "วิรัช เจริญพร", what: "ตีกลับแก้ไข: ราคาข้อ 1 สูงไป", when: "18/07/2569 16:30" },
  { id: "t4", who: "สมชาย ส.", what: "แก้ราคาข้อ 1 จาก 1,320 เป็น 1,260", when: "19/07/2569 08:47" },
  { id: "t5", who: "สมชาย ส.", what: "ส่งอนุมัติใหม่", when: "20/07/2569 09:02" },
];

export const MOCK_CUSTOMER: CustomerSummaryData = {
  name: "บจก. ทาโกฟู้ดส์อินดัสทรี",
  addressLine: "99/12 ม.4 ถ.เทพารักษ์",
  subDistrict: "บางปลา",
  district: "บางพลี",
  province: "สมุทรปราการ",
  postalCode: "10540",
  phone: "02-315-4477",
  taxId: "0105548012345",
  paymentType: "credit",
  creditDays: 30,
  quoteDate: "20/07/2569",
};
