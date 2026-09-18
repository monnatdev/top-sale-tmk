import Image from "next/image";
import { SectionCard } from "@/components/shared/SectionCard";

type SignatureCardProps = {
  /** signed URL — มีเฉพาะเมื่อผู้ดูเป็นผู้บริหาร (ห้ามส่งให้เซลล์) */
  imageUrl?: string | null;
  /** ชื่อผู้เซ็น + วันที่ (ใบที่อนุมัติแล้ว) */
  signedBy?: string | null;
  signedAt?: string | null;
  /** ข้อความแทนรูป เช่น "ลายเซ็นจากโปรไฟล์ผู้บริหาร" / "รอผู้บริหารอนุมัติ" */
  placeholder: string;
  hint?: string;
};

// การ์ด "ลายเซ็นอนุมัติ" คอลัมน์ขวาหน้าดูใบ — รูปจริงเห็นเฉพาะผู้บริหาร เซลล์เห็นแค่ชื่อ/วันที่
export function SignatureCard({ imageUrl, signedBy, signedAt, placeholder, hint }: SignatureCardProps) {
  return (
    <SectionCard title="ลายเซ็นอนุมัติ">
      <div className="flex h-24 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-card">
        {imageUrl ? (
          <Image src={imageUrl} alt={signedBy ? `ลายเซ็น ${signedBy}` : "ลายเซ็นผู้บริหาร"} width={240} height={96} unoptimized className="h-full w-auto object-contain" />
        ) : (
          <span className="stripe-placeholder mono flex size-full items-center justify-center text-2xs text-muted-foreground">{placeholder}</span>
        )}
      </div>
      {signedBy ? (
        <p className="mt-2.5 text-xs text-muted-foreground">
          เซ็นโดย <b className="font-semibold text-foreground">{signedBy}</b> · <span className="mono">{signedAt}</span>
        </p>
      ) : null}
      {hint ? <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </SectionCard>
  );
}
