"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { StickyActionBar } from "@/components/layout/StickyActionBar";
import { FormField } from "@/components/shared/FormField";
import { InfoNotice } from "@/components/shared/InfoNotice";
import { SectionCard } from "@/components/shared/SectionCard";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { CreditDaysPicker } from "./CreditDaysPicker";
import { CustomerPickerSheet, type CustomerOption } from "./CustomerPickerSheet";
import { CustomerSummary } from "./CustomerSummary";
import type { LedgerItem } from "./LedgerRow";
import { NoteList } from "./NoteList";
import { PriceTable } from "./PriceTable";
import { ProductPickerSheet, type ProductOption } from "./ProductPickerSheet";
import { WizardSteps } from "./WizardSteps";
import type { ActionResult } from "@/lib/actionResult";
import type { FieldErrors } from "@/lib/errors";
import type { QuotationDraftInput } from "@/lib/validation/quotation";
import { formatThaiDate, todayDateString } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const STEPS = ["ลูกค้า", "สินค้า", "ตรวจสอบ"] as const;

export type QuotationFormValues = QuotationDraftInput;

type QuotationFormProps = {
  /** โหมดแก้ไข: id + เลขที่ใบ · ไม่มี = สร้างใหม่ */
  quotationId?: string;
  quoteNumber?: string;
  initial?: Partial<QuotationFormValues>;
  products: readonly ProductOption[];
  /** server actions — ส่งเข้ามาเพื่อให้ component ไม่ผูกกับ route */
  onSearchCustomers: (input: { q: string }) => Promise<ActionResult<CustomerOption[]>>;
  onSaveDraft: (input: QuotationFormValues & { id?: string }) => Promise<ActionResult<{ id: string }>>;
  onSubmit: (input: { id: string }) => Promise<ActionResult<void>>;
};

const EMPTY: QuotationFormValues = {
  customerId: null,
  companyName: "",
  addressLine: "",
  subDistrict: "",
  district: "",
  province: "",
  postalCode: "",
  phone: "",
  taxId: "",
  paymentType: "credit",
  creditDays: 30,
  quoteDate: todayDateString(),
  items: [],
  notes: [],
};

// ฟอร์มสร้าง/แก้ใบ — มือถือ = wizard 3 ขั้น · เดสก์ท็อป = 3 section ในหน้าเดียว (state ชุดเดียวกัน)
// ไม่มี business logic: validation จริง + snapshot อยู่ที่ service ผ่าน server action
export function QuotationForm({ quotationId, quoteNumber, initial, products, onSearchCustomers, onSaveDraft, onSubmit }: QuotationFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<QuotationFormValues>({ ...EMPTY, ...initial });
  const [step, setStep] = useState(0);
  const [savedId, setSavedId] = useState(quotationId);
  const [error, setError] = useState<{ message: string; fieldErrors?: FieldErrors } | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // ปุ่มไหนกำลังทำงาน (แสดง spinner เฉพาะปุ่มนั้น)
  const [intent, setIntent] = useState<"draft" | "submit" | null>(null);

  const set = <K extends keyof QuotationFormValues>(key: K, value: QuotationFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    // พิมพ์แก้แล้ว error ของช่องนั้นหาย
    setError((e) => {
      if (!e?.fieldErrors?.[key]) return e;
      const rest = { ...e.fieldErrors };
      delete rest[key];
      return { ...e, fieldErrors: rest };
    });
  };
  const fieldError = (key: string) => error?.fieldErrors?.[key]?.[0];

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const ledgerItems: LedgerItem[] = form.items.map((it) => {
    const p = productById.get(it.productId);
    return {
      id: it.productId,
      name: p?.name ?? "ไม่พบสินค้า",
      spec: p?.packagingSpec,
      weightKg: p?.weightPerBag ?? 0,
      price: it.pricePerBag,
      imageUrl: p?.imageUrl,
    };
  });

  const customerMode = form.customerId ? "existing" : "new";

  // สลับเป็น "ลูกค้าใหม่" → ล้างข้อมูลลูกค้าที่ดึงมาจากลูกค้าเก่าทั้งชุด (คงวันที่/สินค้า/หมายเหตุไว้)
  const clearCustomer = () =>
    setForm((f) => ({
      ...f,
      customerId: null,
      companyName: "",
      addressLine: "",
      subDistrict: "",
      district: "",
      province: "",
      postalCode: "",
      phone: "",
      taxId: "",
      paymentType: EMPTY.paymentType,
      creditDays: EMPTY.creditDays,
    }));

  const applyCustomer = (c: CustomerOption) =>
    setForm((f) => ({
      ...f,
      customerId: c.id,
      companyName: c.companyName,
      addressLine: c.addressLine,
      subDistrict: c.subDistrict,
      district: c.district,
      province: c.province,
      postalCode: c.postalCode,
      phone: c.phone ?? "",
      taxId: c.taxId ?? "",
      paymentType: c.paymentType,
      creditDays: c.paymentType === "credit" ? c.creditDays : f.creditDays,
    }));

  const setPrice = (productId: string, raw: string) => {
    const n = Number(raw);
    set(
      "items",
      form.items.map((it) => (it.productId === productId ? { ...it, pricePerBag: Number.isFinite(n) ? n : 0 } : it)),
    );
  };

  const addNote = () => {
    const t = noteDraft.trim();
    if (!t) return;
    set("notes", [...form.notes, t]);
    setNoteDraft("");
  };

  // ---- persist ----
  const persist = async (): Promise<string | null> => {
    setError(null);
    const res = await onSaveDraft({ ...form, id: savedId });
    if (!res.ok) {
      setError(res);
      return null;
    }
    setSavedId(res.data.id);
    return res.data.id;
  };

  const handleSaveDraft = () =>
    startTransition(async () => {
      setIntent("draft");
      const id = await persist();
      if (id) router.push(`/quotations/${id}`);
    });

  const handleSubmit = () =>
    startTransition(async () => {
      setIntent("submit");
      const id = await persist();
      if (!id) return;
      const res = await onSubmit({ id });
      if (!res.ok) {
        setError(res);
        return;
      }
      router.push(`/quotations/${id}`);
    });

  const goNext = () => {
    if (step === 0 && !form.companyName.trim()) {
      setError({ message: "กรุณาตรวจสอบข้อมูลที่กรอก", fieldErrors: { companyName: ["กรุณากรอกชื่อบริษัทลูกค้า"] } });
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  };
  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0 });
  };

  const mobileOnly = (i: number) => cn(step === i ? "flex" : "hidden", "md:flex");
  const title = quotationId ? "แก้ไขใบเสนอราคา" : "สร้างใบเสนอราคา";

  return (
    <>
      <PageHeader
        title={<span className="text-base md:text-2xl">{step === 2 ? "ตรวจสอบก่อนส่ง" : title}</span>}
        subtitle={
          <span className="hidden md:inline">
            {quoteNumber ? (
              <>
                แก้ไขร่าง · <span className="mono">{quoteNumber}</span>
              </>
            ) : (
              "ร่างใหม่ · เลขที่ใบจะออกเมื่อบันทึก"
            )}
          </span>
        }
        back={{ href: savedId ? `/quotations/${savedId}` : "/quotations", label: "ยกเลิก" }}
        aside={
          <Button variant="link" className="ml-auto text-body md:hidden" loading={pending} onClick={handleSaveDraft}>
            บันทึกร่าง
          </Button>
        }
        actions={
          <div className="hidden gap-3 md:flex">
            <Button variant="outline" loading={pending && intent === "draft"} disabled={pending} onClick={handleSaveDraft}>
              บันทึกร่าง
            </Button>
            <Button loading={pending && intent === "submit"} disabled={pending} onClick={handleSubmit}>
              ส่งให้ผู้บริหารอนุมัติ
            </Button>
          </div>
        }
      >
        <WizardSteps steps={STEPS} current={step} className="md:hidden" />
      </PageHeader>

      <PageBody withActionBar className="md:grid md:grid-cols-[1fr_360px] md:items-start">
        {error?.message ? (
          <p role="alert" className="rounded-md bg-status-returned-soft px-3.5 py-2.5 text-body text-destructive md:col-span-2">
            {error.message}
          </p>
        ) : null}

        {/* ===== ขั้น 1 / section 01: ลูกค้า + หัวเอกสาร ===== */}
        <div className={cn(mobileOnly(0), "flex-col gap-3.5 md:gap-5")}>
          <SectionCard
            step="01"
            title={<span className="hidden md:inline">ข้อมูลลูกค้า + หัวเอกสาร</span>}
            action={
              <SegmentedControl
                size="sm"
                className="hidden w-55 md:grid"
                value={customerMode}
                onChange={(v) => (v === "existing" ? setCustomerPickerOpen(true) : clearCustomer())}
                options={[
                  { value: "existing", label: "ลูกค้าเก่า" },
                  { value: "new", label: "ลูกค้าใหม่" },
                ]}
              />
            }
          >
            <div className="flex flex-col gap-3.5">
              <SegmentedControl
                className="md:hidden"
                value={customerMode}
                onChange={(v) => (v === "existing" ? setCustomerPickerOpen(true) : clearCustomer())}
                options={[
                  { value: "existing", label: "ลูกค้าเก่า" },
                  { value: "new", label: "ลูกค้าใหม่" },
                ]}
              />

              <div className="grid gap-3.5 md:grid-cols-3 md:gap-4">
                <FormField
                  label="ชื่อบริษัทลูกค้า"
                  htmlFor="companyName"
                  hint={customerMode === "existing" ? " · ล็อกเมื่อเลือกลูกค้าเก่า" : undefined}
                  error={fieldError("companyName")}
                  className="md:col-span-2"
                >
                  {customerMode === "existing" ? (
                    <div className="flex h-12 items-center justify-between rounded-md border border-border bg-surface-muted px-3.5 text-sm md:h-11">
                      <span className="truncate">{form.companyName}</span>
                      <Button variant="link" className="text-2xs" onClick={() => setCustomerPickerOpen(true)}>
                        เปลี่ยน
                      </Button>
                    </div>
                  ) : (
                    <Input id="companyName" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} aria-invalid={!!fieldError("companyName") || undefined} />
                  )}
                </FormField>
                <FormField label="เบอร์โทร" htmlFor="phone" error={fieldError("phone")}>
                  <Input id="phone" className="mono" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </FormField>
                <FormField label="เลขผู้เสียภาษี" htmlFor="taxId" error={fieldError("taxId")} className="md:order-last">
                  <Input id="taxId" className="mono" inputMode="numeric" maxLength={13} value={form.taxId} onChange={(e) => set("taxId", e.target.value)} aria-invalid={!!fieldError("taxId") || undefined} />
                </FormField>
                <FormField label="ที่อยู่ · เลขที่ / หมู่ / ถนน" htmlFor="addressLine" className="md:col-span-2">
                  <Input id="addressLine" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
                </FormField>
                <div className="grid grid-cols-2 gap-3 md:contents">
                  <FormField label="ตำบล / แขวง" htmlFor="subDistrict">
                    <Input id="subDistrict" value={form.subDistrict} onChange={(e) => set("subDistrict", e.target.value)} />
                  </FormField>
                  <FormField label="อำเภอ / เขต" htmlFor="district">
                    <Input id="district" value={form.district} onChange={(e) => set("district", e.target.value)} />
                  </FormField>
                </div>
                <div className="grid grid-cols-[1fr_120px] gap-3 md:contents">
                  <FormField label="จังหวัด" htmlFor="province">
                    <Input id="province" value={form.province} onChange={(e) => set("province", e.target.value)} />
                  </FormField>
                  <FormField label="รหัสไปรษณีย์" htmlFor="postalCode" error={fieldError("postalCode")}>
                    <Input id="postalCode" className="numeric" inputMode="numeric" maxLength={5} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} aria-invalid={!!fieldError("postalCode") || undefined} />
                  </FormField>
                </div>
              </div>

              <div className="grid gap-3.5 md:grid-cols-3 md:gap-4">
                <FormField label="ประเภท">
                  <SegmentedControl
                    value={form.paymentType}
                    onChange={(v) => set("paymentType", v)}
                    options={[
                      { value: "credit", label: "เครดิต" },
                      { value: "cash", label: "เงินสด" },
                    ]}
                  />
                </FormField>
                {form.paymentType === "credit" ? (
                  <div className="md:col-span-2">
                    <CreditDaysPicker value={form.creditDays} onChange={(d) => set("creditDays", d)} />
                    {fieldError("creditDays") ? <p className="mt-1 text-xs text-destructive">{fieldError("creditDays")}</p> : null}
                  </div>
                ) : null}
                <FormField label="วันที่เสนอราคา" htmlFor="quoteDate" error={fieldError("quoteDate")}>
                  <Input id="quoteDate" type="date" className="mono" value={form.quoteDate} onChange={(e) => set("quoteDate", e.target.value)} />
                </FormField>
              </div>

              <InfoNotice>แก้ที่อยู่ / เบอร์ / เลขภาษี / ประเภท ในใบนี้ ใช้เฉพาะใบนี้ ไม่เปลี่ยนข้อมูลลูกค้าในระบบ</InfoNotice>
            </div>
          </SectionCard>

          {/* ===== section 02: สินค้า (เดสก์ท็อปอยู่คอลัมน์ซ้ายต่อจาก 01 · มือถือคือขั้น 2 — render แยกด้านล่าง) ===== */}
          <div className="hidden md:block">
            <ProductSection
              items={ledgerItems}
              error={fieldError("items")}
              onAdd={() => setProductPickerOpen(true)}
              onRemove={(id) => set("items", form.items.filter((it) => it.productId !== id))}
              onPrice={setPrice}
            />
          </div>
        </div>

        {/* ===== ขั้น 2 (มือถือเท่านั้น): สินค้า ===== */}
        <div className={cn(step === 1 ? "flex" : "hidden", "flex-col gap-3 md:hidden")}>
          <ProductSection
            items={ledgerItems}
            error={fieldError("items")}
            onAdd={() => setProductPickerOpen(true)}
            onRemove={(id) => set("items", form.items.filter((it) => it.productId !== id))}
            onPrice={setPrice}
          />
          <p className="text-2xs leading-relaxed text-muted-foreground">ใบเสนอราคานี้เป็นตารางราคาต่อถุง — ไม่มีช่องจำนวนและไม่มียอดรวม</p>
        </div>

        {/* ===== ขั้น 3 (มือถือ): ตรวจสอบ · เดสก์ท็อป: คอลัมน์ขวา = หมายเหตุ ===== */}
        <div className={cn(mobileOnly(2), "flex-col gap-3 md:gap-4")}>
          <SectionCard title="ลูกค้า" action={<Button variant="link" className="text-xs" onClick={() => setStep(0)}>แก้ไข</Button>} className="md:hidden">
            <CustomerSummary
              data={{
                name: form.companyName || "—",
                addressLine: form.addressLine,
                subDistrict: form.subDistrict,
                district: form.district,
                province: form.province,
                postalCode: form.postalCode,
                phone: form.phone || undefined,
                taxId: form.taxId || undefined,
                paymentType: form.paymentType,
                creditDays: form.creditDays,
                quoteDate: formatThaiDate(form.quoteDate),
              }}
            />
          </SectionCard>
          <SectionCard title={`รายการสินค้า · ${form.items.length} รายการ`} action={<Button variant="link" className="text-xs" onClick={() => setStep(1)}>แก้ไข</Button>} flush className="md:hidden">
            {ledgerItems.length === 0 ? <p className="px-3.5 py-4 text-body text-muted-foreground">ยังไม่มีสินค้า</p> : <PriceTable items={ledgerItems} />}
          </SectionCard>

          <SectionCard step="03" title="หมายเหตุ / เงื่อนไข">
            <NoteList
              notes={form.notes.map((text, i) => ({ id: String(i), text }))}
              renderTrailing={(n) => (
                <button type="button" aria-label="ลบหมายเหตุ" className="shrink-0 text-destructive" onClick={() => set("notes", form.notes.filter((_, i) => String(i) !== n.id))}>
                  <XIcon className="size-3.5" />
                </button>
              )}
              footer={
                <div className="flex gap-2">
                  <Input
                    placeholder="พิมพ์หมายเหตุ เช่น ยืนราคา 30 วัน"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addNote();
                      }
                    }}
                    className="h-11 md:h-10"
                  />
                  <Button variant="outline-primary" className="h-11 shrink-0 md:h-10" disabled={!noteDraft.trim()} onClick={addNote}>
                    <PlusIcon /> เพิ่ม
                  </Button>
                </div>
              }
            />
            {fieldError("notes") ? <p className="mt-2 text-xs text-destructive">{fieldError("notes")}</p> : null}
          </SectionCard>
        </div>
      </PageBody>

      {/* ปุ่มหลัก sticky มือถือ — เปลี่ยนตามขั้น */}
      {step < 2 ? (
        <StickyActionBar split>
          <Button variant="outline" size="lg" onClick={step === 0 ? () => router.push(savedId ? `/quotations/${savedId}` : "/quotations") : goBack}>
            {step === 0 ? "ยกเลิก" : "ย้อนกลับ"}
          </Button>
          <Button size="lg" onClick={goNext}>
            {step === 0 ? "ถัดไป · เลือกสินค้า" : "ถัดไป · ตรวจสอบ"}
          </Button>
        </StickyActionBar>
      ) : (
        <StickyActionBar>
          <Button size="lg" loading={pending && intent === "submit"} disabled={pending} onClick={handleSubmit}>
            {pending && intent === "submit" ? "กำลังบันทึก…" : "ส่งให้ผู้บริหารอนุมัติ"}
          </Button>
          <div className="grid grid-cols-[112px_1fr] gap-3">
            <Button variant="outline" onClick={goBack} disabled={pending}>
              ย้อนกลับ
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} loading={pending && intent === "draft"} disabled={pending}>
              บันทึกร่าง
            </Button>
          </div>
        </StickyActionBar>
      )}

      <CustomerPickerSheet open={customerPickerOpen} onOpenChange={setCustomerPickerOpen} onSearch={onSearchCustomers} onSelect={applyCustomer} />
      <ProductPickerSheet
        open={productPickerOpen}
        onOpenChange={setProductPickerOpen}
        products={products}
        excludeIds={form.items.map((it) => it.productId)}
        onConfirm={(pick) => set("items", [...form.items, pick])}
      />
    </>
  );
}

// section รายการสินค้า (ใช้ซ้ำทั้งมือถือ/เดสก์ท็อป)
function ProductSection({
  items,
  error,
  onAdd,
  onRemove,
  onPrice,
}: {
  items: LedgerItem[];
  error?: string;
  onAdd: () => void;
  onRemove: (productId: string) => void;
  onPrice: (productId: string, raw: string) => void;
}) {
  return (
    <SectionCard
      step="02"
      title={<span>รายการสินค้า</span>}
      meta={<span className="md:hidden">{items.length} รายการ</span>}
      action={
        <Button variant="outline-primary" size="sm" className="hidden md:inline-flex" onClick={onAdd}>
          <PlusIcon /> เพิ่มสินค้า
        </Button>
      }
      flush
      divided
    >
      {items.length === 0 ? (
        <p className="px-3.5 py-5 text-center text-body text-muted-foreground md:px-6">ยังไม่มีสินค้า — กด “+ เพิ่มสินค้า”</p>
      ) : (
        <PriceTable
          items={items}
          renderPrice={(item) => (
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              aria-label={`ราคา ${item.name}`}
              value={item.price === 0 ? "" : String(item.price)}
              onChange={(e) => onPrice(item.id, e.target.value)}
              className="numeric h-10 w-24 text-lg md:h-10 md:w-30"
            />
          )}
          renderTrailing={(item) => (
            <Button variant="outline" size="icon-xs" aria-label={`ลบ ${item.name}`} className="text-destructive" onClick={() => onRemove(item.id)}>
              <XIcon />
            </Button>
          )}
        />
      )}
      <div className="border-t border-border px-3.5 py-2.5 md:px-4">
        <Button variant="link" className="font-semibold md:hidden" onClick={onAdd}>
          <PlusIcon /> เพิ่มสินค้า
        </Button>
        <Button variant="link" className="hidden font-semibold text-body md:inline-flex" onClick={onAdd}>
          <PlusIcon /> เพิ่มแถวสินค้า
        </Button>
      </div>
      {error ? <p className="px-3.5 pb-3 text-xs text-destructive">{error}</p> : null}
    </SectionCard>
  );
}
