"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { CreditDaysPicker } from "@/components/quotation/CreditDaysPicker";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { ProductPickerSheet } from "@/components/quotation/ProductPickerSheet";
import { CustomerPickerSheet } from "@/components/quotation/CustomerPickerSheet";

// ตัวอย่าง component ที่ต้องมี state — แยกเป็น client เพื่อให้หน้า /ui-kit เป็น server component ได้
export function InteractiveDemos() {
  const [customerKind, setCustomerKind] = useState<"existing" | "new">("existing");
  const [payment, setPayment] = useState<"credit" | "cash">("credit");
  const [days, setDays] = useState(30);
  const [productOpen, setProductOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [picked, setPicked] = useState<string>("");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Button variant="outline-primary" onClick={() => setProductOpen(true)}>เปิด ProductPickerSheet</Button>
        <Button variant="outline" onClick={() => setCustomerOpen(true)}>เปิด CustomerPickerSheet</Button>
        {picked ? <span className="mono text-xs text-muted-foreground">{picked}</span> : null}
        <ProductPickerSheet
          open={productOpen}
          onOpenChange={setProductOpen}
          products={[
            { id: "00000000-0000-4000-8000-000000000001", name: "ข้าวหอมมะลิปทุม 100%", packagingSpec: "บรรจุถุง PP ขาวล้วน ติดแท็ก", weightPerBag: 45 },
            { id: "00000000-0000-4000-8000-000000000002", name: "ข้าวขาว", packagingSpec: "บรรจุกระสอบ ติดแท็ก", weightPerBag: 48 },
          ]}
          onConfirm={(p) => setPicked(`${p.productId.slice(-1)} @ ${p.pricePerBag}`)}
        />
        <CustomerPickerSheet
          open={customerOpen}
          onOpenChange={setCustomerOpen}
          onSearch={async () => ({
            ok: true,
            data: [{ id: "c1", companyName: "บจก. ทาโกฟู้ดส์อินดัสทรี", addressLine: "99/12 ม.4", subDistrict: "บางปลา", district: "บางพลี", province: "สมุทรปราการ", postalCode: "10540", phone: null, taxId: "0105548012345", paymentType: "credit", creditDays: 30 }],
          })}
          onSelect={(c) => setPicked(c.companyName)}
        />
      </div>
      <div className="flex flex-col gap-4">
        <SegmentedControl
          value={customerKind}
          onChange={setCustomerKind}
          options={[
            { value: "existing", label: "ลูกค้าเก่า" },
            { value: "new", label: "ลูกค้าใหม่" },
          ]}
        />
        <FormField label="ประเภท">
          <SegmentedControl
            value={payment}
            onChange={setPayment}
            options={[
              { value: "credit", label: "เครดิต" },
              { value: "cash", label: "เงินสด" },
            ]}
          />
        </FormField>
      </div>
      <CreditDaysPicker value={days} onChange={setDays} />
    </div>
  );
}
