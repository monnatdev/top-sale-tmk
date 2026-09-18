import { PlusIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { FormField } from "@/components/shared/FormField";
import { InfoNotice } from "@/components/shared/InfoNotice";
import { NumericText } from "@/components/shared/NumericText";
import { ProductThumbnail } from "@/components/shared/ProductThumbnail";
import { SearchInput } from "@/components/shared/SearchInput";
import { SectionCard } from "@/components/shared/SectionCard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CustomerSummary } from "@/components/quotation/CustomerSummary";
import { NoteList } from "@/components/quotation/NoteList";
import { PriceTable } from "@/components/quotation/PriceTable";
import { QuotationList } from "@/components/quotation/QuotationList";
import { StatusBadge } from "@/components/quotation/StatusBadge";
import { StatusFilterChips } from "@/components/quotation/StatusFilterChips";
import { StatusProgress } from "@/components/quotation/StatusProgress";
import { Timeline } from "@/components/quotation/Timeline";
import { WizardSteps } from "@/components/quotation/WizardSteps";
import { StatusBarChart } from "@/components/dashboard/StatusBarChart";
import { StatusCountCard } from "@/components/dashboard/StatusCountCard";
import { QUOTATION_STATUSES } from "@/lib/constants/quotationStatus";
import { InteractiveDemos } from "./InteractiveDemos";
import { MOCK_CUSTOMER, MOCK_NOTES, MOCK_PRODUCTS, MOCK_QUOTATIONS, MOCK_STATUS_COUNTS, MOCK_TIMELINE } from "./mockData";

export const metadata = { title: "UI Kit" };

const COLOR_TOKENS = [
  ["primary", "bg-primary"],
  ["primary-hover", "bg-primary-hover"],
  ["primary-soft", "bg-primary-soft"],
  ["foreground (ink)", "bg-foreground"],
  ["accent", "bg-accent"],
  ["background (paper)", "bg-background"],
  ["canvas", "bg-canvas"],
  ["card", "bg-card"],
  ["surface-muted", "bg-surface-muted"],
  ["border", "bg-border"],
  ["muted-foreground", "bg-muted-foreground"],
  ["destructive", "bg-destructive"],
  ["success", "bg-success"],
  ["sidebar", "bg-sidebar"],
] as const;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

// หน้า catalog สำหรับ dev — ดูทุก component/token ในที่เดียว (คู่กับ docs/UI-KIT.md) · ไม่ลิงก์จากเมนู
export default function UiKitPage() {
  return (
    <>
      <PageHeader title="UI Kit" subtitle="catalog ของ token + component จาก Claude Design · ดู docs/UI-KIT.md" />
      <PageBody className="gap-10">
        <Section title="สี (token)" hint="ใช้ผ่าน class เท่านั้น เช่น bg-primary, text-muted-foreground — ห้าม hex">
          <div className="grid grid-cols-3 gap-3 md:grid-cols-7">
            {COLOR_TOKENS.map(([name, cls]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div className={`h-12 rounded-md border border-border ${cls}`} />
                <span className="mono text-[10px] text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {QUOTATION_STATUSES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </Section>

        <Section title="ตัวอักษร" hint="IBM Plex Sans Thai 400/500/600 · ตัวเลข = IBM Plex Mono tabular (class numeric / mono)">
          <SectionCard>
            <div className="flex flex-col gap-2">
              <p className="text-3xl font-semibold">หัวข้อ 30 · text-3xl</p>
              <p className="text-2xl font-semibold">หัวหน้า 24 · text-2xl</p>
              <p className="text-xl font-semibold">หัวมือถือ 20 · text-xl</p>
              <p className="text-base font-semibold">หัว section 16 · text-base</p>
              <p className="text-sm">เนื้อหา 14 · text-sm</p>
              <p className="text-body">เนื้อหาบนการ์ด 13 · text-body</p>
              <p className="text-xs text-muted-foreground">label 12 · text-xs text-muted-foreground</p>
              <p className="text-2xs text-muted-foreground">caption 11 · text-2xs</p>
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <span className="mono text-xs text-muted-foreground">IBM Plex Mono · tabular</span>
                <NumericText value={1260} unit="บาท/ถุง" size="2xl" />
              </div>
            </div>
          </SectionCard>
        </Section>

        <Section title="ปุ่ม" hint="ส้มทึบ = ปุ่มหลักได้ปุ่มเดียวต่อหน้า · size lg = sticky ล่างจอมือถือ">
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <PlusIcon /> สร้างใบเสนอราคา
            </Button>
            <Button variant="outline">บันทึกร่าง</Button>
            <Button variant="outline-primary">
              <PlusIcon /> เพิ่มสินค้า
            </Button>
            <Button variant="destructive">ตีกลับพร้อมเหตุผล</Button>
            <Button variant="success">ปิดการขาย</Button>
            <Button variant="ghost">ยกเลิก</Button>
            <Button variant="link">แก้ไข</Button>
            <Button size="lg">อนุมัติ + เซ็นลายเซ็น</Button>
            <Button size="sm" variant="outline">
              เล็ก
            </Button>
            <Button size="icon-sm" variant="outline" aria-label="ลบ" className="text-destructive">
              <XIcon />
            </Button>
          </div>
        </Section>

        <Section title="ฟอร์ม" hint="FormField ครอบทุกช่อง · ตัวเลขใส่ class mono/numeric · ช่องล็อกใช้ readOnly">
          <SectionCard>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="ชื่อบริษัทลูกค้า" hint=" · ล็อกเมื่อเลือกลูกค้าเก่า" className="md:col-span-2">
                <Input readOnly defaultValue="บจก. ทาโกฟู้ดส์อินดัสทรี" />
              </FormField>
              <FormField label="เบอร์โทร">
                <Input className="mono" defaultValue="02-315-4477" />
              </FormField>
              <FormField label="รหัสไปรษณีย์" error="กรอกตัวเลข 5 หลัก">
                <Input className="numeric" defaultValue="1054" aria-invalid />
              </FormField>
              <FormField label="ราคาส่ง/ถุง" trailing="บาท">
                <Input className="numeric text-xl" defaultValue="1,290" />
              </FormField>
              <FormField label="ค้นหา">
                <SearchInput placeholder="ค้นหาชื่อลูกค้า หรือ เลขที่ใบ" />
              </FormField>
              <FormField label="หมายเหตุ" className="md:col-span-3">
                <Textarea placeholder="เงื่อนไขเพิ่มเติม" />
              </FormField>
            </div>
            <div className="mt-4">
              <InteractiveDemos />
            </div>
            <InfoNotice className="mt-4">แก้ที่อยู่ / เบอร์ / เลขภาษี / ประเภท ในใบนี้ ใช้เฉพาะใบนี้ ไม่เปลี่ยนข้อมูลลูกค้าในระบบ</InfoNotice>
          </SectionCard>
        </Section>

        <Section title="รายการใบเสนอราคา" hint="QuotationList = การ์ดบนมือถือ / ตารางบนเดสก์ท็อป · แถบสีซ้าย = สถานะ">
          <StatusFilterChips
            active="pending_approval"
            items={[{ status: "all", count: 38, href: "#" }, ...MOCK_STATUS_COUNTS.map((s) => ({ ...s, href: "#" }))]}
          />
          <QuotationList items={MOCK_QUOTATIONS.slice(0, 4)} showOwner />
        </Section>

        <Section title="ตารางราคาต่อถุง (ledger)" hint="signature element — เส้นประคั่นบรรทัด + ราคาตัวใหญ่สุดในหน้า · ไม่มีจำนวน ไม่มียอดรวม">
          <SectionCard title="ตารางราคาต่อถุง" meta="4 รายการ" flush divided>
            <PriceTable items={MOCK_PRODUCTS} />
          </SectionCard>
          <SectionCard title="แบบแก้ไขได้ (ฟอร์ม)" step="02" flush divided>
            <PriceTable
              items={MOCK_PRODUCTS.slice(0, 2)}
              renderTrailing={() => (
                <Button size="icon-xs" variant="outline" aria-label="ลบรายการ" className="text-destructive">
                  <XIcon />
                </Button>
              )}
              footer={
                <Button variant="link" className="font-semibold">
                  <PlusIcon /> เพิ่มสินค้า
                </Button>
              }
            />
          </SectionCard>
        </Section>

        <Section title="หน้าดู / ตรวจสอบใบ">
          <div className="grid gap-4 md:grid-cols-[1fr_340px]">
            <div className="flex flex-col gap-4">
              <SectionCard title="ลูกค้า" action={<Button variant="link" className="text-xs">แก้ไข</Button>}>
                <CustomerSummary data={MOCK_CUSTOMER} />
              </SectionCard>
              <SectionCard title="ข้อมูลลูกค้า (เดสก์ท็อป)">
                <CustomerSummary data={MOCK_CUSTOMER} variant="grid" />
              </SectionCard>
              <SectionCard title="หมายเหตุ / เงื่อนไข">
                <NoteList
                  notes={MOCK_NOTES}
                  renderTrailing={() => <XIcon className="size-3.5 shrink-0 text-destructive" />}
                  footer={
                    <Button variant="link" className="self-start text-body font-semibold">
                      <PlusIcon /> เพิ่มหมายเหตุ
                    </Button>
                  }
                />
              </SectionCard>
              <SectionCard title="ประวัติ">
                <Timeline entries={MOCK_TIMELINE} />
              </SectionCard>
            </div>
            <div className="flex flex-col gap-4">
              <SectionCard title="สถานะเอกสาร">
                <StatusProgress current="pending_approval" currentHint="อยู่ที่คุณ" />
              </SectionCard>
              <SectionCard title="สถานะเอกสาร · ตีกลับ">
                <StatusProgress current="returned" />
              </SectionCard>
              <SectionCard title="ลายเซ็นอนุมัติ">
                <div className="stripe-placeholder mono flex h-24 items-center justify-center rounded-md border border-dashed border-border text-2xs text-muted-foreground">
                  ลายเซ็นจากโปรไฟล์ผู้บริหาร
                </div>
              </SectionCard>
              <InfoNotice bordered>ผู้บริหารเห็นใบของทุกเซลล์ · เซลล์เห็นเฉพาะใบของตัวเอง</InfoNotice>
            </div>
          </div>
        </Section>

        <Section title="Wizard (มือถือ)">
          <SectionCard>
            <WizardSteps steps={["ลูกค้า", "สินค้า", "ตรวจสอบ"]} current={1} />
          </SectionCard>
        </Section>

        <Section title="ภาพรวม" hint="มีแค่จำนวนใบตามสถานะ · กดแล้วไปรายการที่กรอง">
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6 md:gap-4">
            {MOCK_STATUS_COUNTS.map((s) => (
              <StatusCountCard key={s.status} status={s.status} count={s.count} href={`/quotations?status=${s.status}`} />
            ))}
          </div>
          <SectionCard title="ใบเสนอราคาแยกตามสถานะ">
            <StatusBarChart data={MOCK_STATUS_COUNTS} />
          </SectionCard>
        </Section>

        <Section title="อื่นๆ">
          <div className="flex flex-wrap items-center gap-4">
            <BrandLogo size="sm" />
            <BrandLogo size="md" />
            <UserAvatar initials="สช" />
            <UserAvatar initials="วร" role="executive" />
            <ProductThumbnail size="sm" />
            <ProductThumbnail size="md" />
            <ProductThumbnail size="lg" />
            <Badge>default</Badge>
            <Badge variant="soft">soft</Badge>
            <Badge variant="outline">outline</Badge>
          </div>
        </Section>
      </PageBody>
    </>
  );
}
