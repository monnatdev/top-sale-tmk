import { cn, formatThaiAddress, isBangkok } from "@/lib/utils";

export type CustomerSummaryData = {
  name: string;
  addressLine: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone?: string;
  taxId?: string;
  paymentType: "credit" | "cash";
  creditDays?: number;
  /** วันที่เสนอราคา format แล้ว */
  quoteDate: string;
};

type CustomerSummaryProps = {
  data: CustomerSummaryData;
  /** compact = บล็อกอ่านง่ายบนมือถือ · grid = 3 คอลัมน์บนเดสก์ท็อป */
  variant?: "compact" | "grid";
  className?: string;
};

function paymentLabel(d: CustomerSummaryData) {
  return d.paymentType === "credit" ? `เครดิต ${d.creditDays ?? 0} วัน` : "เงินสด";
}

// สรุปข้อมูลลูกค้า + หัวเอกสาร (ใช้ในหน้าตรวจสอบ/หน้าดูใบ)
export function CustomerSummary({ data, variant = "compact", className }: CustomerSummaryProps) {
  if (variant === "grid") {
    const cell = (label: string, value: React.ReactNode, mono?: boolean) => (
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("mt-0.5 text-sm", mono && "mono")}>{value}</div>
      </div>
    );
    return (
      <div className={cn("grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3", className)}>
        {cell("ชื่อบริษัท", <span className="font-medium">{data.name}</span>)}
        {cell("เบอร์โทร", data.phone ?? "—", true)}
        {cell("เลขผู้เสียภาษี", data.taxId ?? "—", true)}
        {cell("ที่อยู่ · เลขที่ / หมู่ / ถนน", data.addressLine)}
        {cell(isBangkok(data.province) ? "แขวง · เขต" : "ตำบล · อำเภอ", `${data.subDistrict} · ${data.district}`)}
        {cell("จังหวัด · รหัสไปรษณีย์", <>{data.province} <span className="mono">{data.postalCode}</span></>)}
        {cell("ประเภท", paymentLabel(data))}
        {cell("วันที่เสนอราคา", data.quoteDate, true)}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-sm font-semibold">{data.name}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {formatThaiAddress(data)}
        {data.phone || data.taxId ? (
          <>
            <br />
            <span className="mono">{[data.phone, data.taxId].filter(Boolean).join(" · ")}</span>
          </>
        ) : null}
      </p>
      <div className="mono mt-2.5 flex flex-wrap gap-4 border-t border-dotted border-border pt-2.5 text-xs text-muted-foreground">
        <span>{paymentLabel(data)}</span>
        <span>เสนอ {data.quoteDate}</span>
      </div>
    </div>
  );
}
