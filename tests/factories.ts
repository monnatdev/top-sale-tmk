// สร้าง test data ด้วยค่า default ที่ "ปกติที่สุด" แล้ว override เฉพาะที่เทสสนใจ
// ใช้ type จาก schema เพื่อให้ factory พังตอน typecheck เมื่อ schema เปลี่ยน
import type { SessionUser } from "@/lib/auth/types";
import type { Customer, NewCustomer, NewProduct, NewQuotation, NewQuotationItem, Product, Quotation } from "@/lib/db/schema";

let seq = 0;
const nextId = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;

export function makeUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return { id: nextId(), name: "สมชาย ส.", role: "sale", ...overrides };
}

export function makeExecutive(overrides: Partial<SessionUser> = {}): SessionUser {
  return makeUser({ name: "วิรัช เจริญพร", role: "executive", ...overrides });
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date();
  return {
    id: nextId(),
    name: "ข้าวหอมมะลิปทุม 100%",
    packagingSpec: "บรรจุถุง PP ขาวล้วน ติดแท็ก",
    weightPerBag: 45,
    imagePath: null,
    isActive: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeNewProduct(overrides: Partial<NewProduct> = {}): NewProduct {
  return { name: "ข้าวหอมมะลิปทุม 100%", packagingSpec: "บรรจุถุง PP ขาวล้วน ติดแท็ก", weightPerBag: 45, ...overrides };
}

export function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  const now = new Date();
  return {
    id: nextId(),
    companyName: "บจก. ทาโกฟู้ดส์อินดัสทรี",
    addressLine: "99/12 ม.4 ถ.เทพารักษ์",
    subDistrict: "บางปลา",
    district: "บางพลี",
    province: "สมุทรปราการ",
    postalCode: "10540",
    phone: "02-315-4477",
    taxId: "0105548012345",
    paymentType: "credit",
    creditDays: 30,
    createdBy: nextId(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeNewCustomer(overrides: Partial<NewCustomer> = {}): NewCustomer {
  return { companyName: "บจก. ทาโกฟู้ดส์อินดัสทรี", createdBy: nextId(), ...overrides };
}

export function makeQuotation(overrides: Partial<Quotation> = {}): Quotation {
  const now = new Date();
  const customer = makeCustomer();
  return {
    id: nextId(),
    quoteNumber: "QT-2569-0001",
    customerId: customer.id,
    ownerId: nextId(),
    status: "draft",
    quoteDate: "2026-07-20",
    validUntil: null,
    customerName: customer.companyName,
    customerAddressLine: customer.addressLine,
    customerSubDistrict: customer.subDistrict,
    customerDistrict: customer.district,
    customerProvince: customer.province,
    customerPostalCode: customer.postalCode,
    customerPhone: customer.phone,
    customerTaxId: customer.taxId,
    paymentType: "credit",
    creditDays: 30,
    signedBy: null,
    signedAt: null,
    signaturePath: null,
    returnReason: null,
    sentAt: null,
    wonAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeNewQuotation(overrides: Partial<NewQuotation> = {}): NewQuotation {
  return {
    quoteNumber: "QT-2569-0001",
    customerId: nextId(),
    ownerId: nextId(),
    quoteDate: "2026-07-20",
    customerName: "บจก. ทาโกฟู้ดส์อินดัสทรี",
    ...overrides,
  };
}

export function makeNewQuotationItem(overrides: Partial<NewQuotationItem> = {}): NewQuotationItem {
  return {
    quotationId: nextId(),
    productName: "ข้าวหอมมะลิปทุม 100%",
    packagingSpec: "บรรจุถุง PP ขาวล้วน ติดแท็ก",
    weightPerBag: 45,
    pricePerBag: 1260,
    ...overrides,
  };
}
