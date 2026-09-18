// Drizzle schema — ตารางทั้งหมดอยู่ที่ไฟล์นี้ที่เดียว (สเปก: docs/BRIEF.md ข้อ 4)
// เปลี่ยน schema → npm run db:generate → review SQL ใน drizzle/ → npm run db:migrate
//
// สิทธิ์: ไม่ใช้ RLS policy — คุมที่ backend (CLAUDE.md ข้อ 6) แต่ทุกตาราง .enableRLS() โดย "ไม่มี policy"
// เพื่อปิดทาง PostgREST/anon key ทั้งหมด · แอปต่อ DB ตรงด้วย role postgres (เจ้าของตาราง = ข้าม RLS)
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
// relative import (ไม่ใช้ @/) เพื่อให้ scripts/ ที่รันด้วย node ตรงๆ import schema ได้
import { QUOTATION_STATUSES } from "../constants/quotationStatus";
import { ROLES } from "../auth/types";

// ---------- enums ----------

export const roleEnum = pgEnum("role", ROLES);
export const paymentTypeEnum = pgEnum("payment_type", ["credit", "cash"]);
export const quotationStatusEnum = pgEnum("quotation_status", QUOTATION_STATUSES);
export const auditActionEnum = pgEnum("audit_action", [
  "created",
  "edited",
  "submitted",
  "approved",
  "returned",
  "exported",
  "closed",
]);

// คอลัมน์ที่ทุกตารางมี
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// ---------- profiles (ผู้ใช้ — ต่อจาก auth.users 1:1) ----------
// id = auth.users.id · FK ไป auth.users อยู่ใน migration custom (drizzle-kit ไม่รู้จัก schema auth)
// signature_path = path ใน Storage bucket private (ไม่ใช่ URL) — ขอ signed URL จาก backend ตอนใช้

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    role: roleEnum("role").notNull().default("sale"),
    signaturePath: text("signature_path"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("profiles_role_idx").on(t.role)],
).enableRLS();

// ---------- customers (ลูกค้า — แบบเบา) ----------
// ที่อยู่แยกช่องตามดีไซน์ เพื่อใช้ต่อในระบบได้ (ไม่เก็บเป็นก้อนเดียว)

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyName: text("company_name").notNull(),
    addressLine: text("address_line").notNull().default(""),
    subDistrict: text("sub_district").notNull().default(""),
    district: text("district").notNull().default(""),
    province: text("province").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    phone: text("phone"),
    taxId: text("tax_id"),
    paymentType: paymentTypeEnum("payment_type").notNull().default("credit"),
    creditDays: integer("credit_days").notNull().default(30),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (t) => [index("customers_created_by_idx").on(t.createdBy), index("customers_company_name_idx").on(t.companyName)],
).enableRLS();

// ---------- products (สินค้า master) ----------

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    packagingSpec: text("packaging_spec").notNull().default(""),
    // นน./ถุง (กก.) เช่น 45, 48
    weightPerBag: numeric("weight_per_bag", { precision: 6, scale: 2, mode: "number" }).notNull(),
    imagePath: text("image_path"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("products_is_active_idx").on(t.isActive)],
).enableRLS();

// ---------- quote_number_counters (รันเลขที่ใบรายปี) ----------
// เลขที่ = QT-<ปี พ.ศ.>-<4 หลัก> · service เพิ่มด้วย insert ... on conflict do update ... returning ใน transaction เดียวกับการสร้างใบ

export const quoteNumberCounters = pgTable("quote_number_counters", {
  // ปี พ.ศ. เช่น 2569
  year: integer("year").primaryKey(),
  lastNo: integer("last_no").notNull().default(0),
}).enableRLS();

// ---------- quotations (ใบเสนอราคา) ----------
// snapshot ข้อมูลลูกค้า ณ ตอนสร้าง — แก้ในใบได้โดยไม่กระทบ master และ master เปลี่ยนทีหลังใบเก่าไม่เปลี่ยนตาม

export const quotations = pgTable(
  "quotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteNumber: text("quote_number").notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    status: quotationStatusEnum("status").notNull().default("draft"),
    // mode string ("YYYY-MM-DD") — กัน timezone เลื่อนวันตอนแปลง Date ↔ date
    quoteDate: date("quote_date", { mode: "string" }).notNull(),
    validUntil: date("valid_until", { mode: "string" }),

    // snapshot ลูกค้า
    customerName: text("customer_name").notNull(),
    customerAddressLine: text("customer_address_line").notNull().default(""),
    customerSubDistrict: text("customer_sub_district").notNull().default(""),
    customerDistrict: text("customer_district").notNull().default(""),
    customerProvince: text("customer_province").notNull().default(""),
    customerPostalCode: text("customer_postal_code").notNull().default(""),
    customerPhone: text("customer_phone"),
    customerTaxId: text("customer_tax_id"),
    paymentType: paymentTypeEnum("payment_type").notNull().default("credit"),
    creditDays: integer("credit_days").notNull().default(30),

    // อนุมัติ + เซ็น (snapshot ลายเซ็น ณ ตอนเซ็น — ผู้บริหารเปลี่ยนลายเซ็นทีหลังใบเก่าไม่เปลี่ยน)
    signedBy: uuid("signed_by").references(() => profiles.id, { onDelete: "set null" }),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    signaturePath: text("signature_path"),
    // เหตุผลตีกลับล่าสุด (ประวัติเต็มอยู่ใน audit_log)
    returnReason: text("return_reason"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    wonAt: timestamp("won_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("quotations_quote_number_uidx").on(t.quoteNumber),
    index("quotations_owner_id_idx").on(t.ownerId),
    index("quotations_status_idx").on(t.status),
    index("quotations_customer_id_idx").on(t.customerId),
    index("quotations_created_at_idx").on(t.createdAt),
    // หน้ารายการของเซลล์: กรองเจ้าของ + สถานะ เรียงล่าสุด
    index("quotations_owner_status_created_idx").on(t.ownerId, t.status, t.createdAt),
  ],
).enableRLS();

// ---------- quotation_items (4 คอลัมน์ตามใบจริง — ไม่มี quantity / line_total / tax) ----------

export const quotationItems = pgTable(
  "quotation_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quotationId: uuid("quotation_id")
      .notNull()
      .references(() => quotations.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    // snapshot สินค้า
    productName: text("product_name").notNull(),
    packagingSpec: text("packaging_spec").notNull().default(""),
    weightPerBag: numeric("weight_per_bag", { precision: 6, scale: 2, mode: "number" }).notNull(),
    imagePath: text("image_path"),
    // ราคาส่ง/ถุง (บาท)
    pricePerBag: numeric("price_per_bag", { precision: 10, scale: 2, mode: "number" }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("quotation_items_quotation_id_idx").on(t.quotationId)],
).enableRLS();

// ---------- quotation_notes (หมายเหตุ / เงื่อนไข หลายข้อ) ----------

export const quotationNotes = pgTable(
  "quotation_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quotationId: uuid("quotation_id")
      .notNull()
      .references(() => quotations.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("quotation_notes_quotation_id_idx").on(t.quotationId)],
).enableRLS();

// ---------- audit_log (ประวัติ — ทุก transition + การแก้ราคา เขียนใน transaction เดียวกัน) ----------

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quotationId: uuid("quotation_id")
      .notNull()
      .references(() => quotations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    action: auditActionEnum("action").notNull(),
    // รายละเอียดอ่านได้ เช่น "ราคาข้อ 1: 1,320 → 1,260" หรือเหตุผลตีกลับ
    detail: text("detail"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("audit_log_quotation_id_idx").on(t.quotationId), index("audit_log_created_at_idx").on(t.createdAt)],
).enableRLS();

// ---------- relations (สำหรับ db.query.*.findMany({ with }) — ดึงใบ + items + notes ครั้งเดียว กัน N+1) ----------

export const profilesRelations = relations(profiles, ({ many }) => ({
  quotations: many(quotations, { relationName: "owner" }),
  customers: many(customers),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  createdBy: one(profiles, { fields: [customers.createdBy], references: [profiles.id] }),
  quotations: many(quotations),
}));

export const productsRelations = relations(products, ({ many }) => ({
  quotationItems: many(quotationItems),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  owner: one(profiles, { fields: [quotations.ownerId], references: [profiles.id], relationName: "owner" }),
  signer: one(profiles, { fields: [quotations.signedBy], references: [profiles.id], relationName: "signer" }),
  customer: one(customers, { fields: [quotations.customerId], references: [customers.id] }),
  items: many(quotationItems),
  notes: many(quotationNotes),
  auditLog: many(auditLog),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationItems.quotationId], references: [quotations.id] }),
  product: one(products, { fields: [quotationItems.productId], references: [products.id] }),
}));

export const quotationNotesRelations = relations(quotationNotes, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationNotes.quotationId], references: [quotations.id] }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  quotation: one(quotations, { fields: [auditLog.quotationId], references: [quotations.id] }),
  actor: one(profiles, { fields: [auditLog.actorId], references: [profiles.id] }),
}));

// ---------- types (ใช้ใน service/query/component แทนการประกาศซ้ำ) — Role อยู่ที่ lib/auth/types ----------

export type PaymentType = (typeof paymentTypeEnum.enumValues)[number];
export type AuditAction = (typeof auditActionEnum.enumValues)[number];

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Quotation = typeof quotations.$inferSelect;
export type NewQuotation = typeof quotations.$inferInsert;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type NewQuotationItem = typeof quotationItems.$inferInsert;
export type QuotationNote = typeof quotationNotes.$inferSelect;
export type NewQuotationNote = typeof quotationNotes.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
