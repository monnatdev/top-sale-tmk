"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/FormField";
import { InfoNotice } from "@/components/shared/InfoNotice";
import type { ActionResult } from "@/lib/actionResult";

type ApprovalActionsProps = {
  id: string;
  quoteNumber: string;
  /** signed URL ลายเซ็นของผู้บริหารที่ล็อกอิน — null = ยังไม่ตั้งค่า (อนุมัติไม่ได้) */
  signatureUrl: string | null;
  onApprove: (input: { id: string }) => Promise<ActionResult<void>>;
  onReject: (input: { id: string; reason: string }) => Promise<ActionResult<void>>;
  /** layout: มือถือ (ปุ่มเรียงแนวตั้ง) / เดสก์ท็อป (แนวนอน) */
  layout?: "mobile" | "desktop";
};

// ปุ่มของผู้บริหารตอนใบ "รออนุมัติ": อนุมัติ+เซ็น (ยืนยันพร้อมดูลายเซ็น) · ตีกลับพร้อมเหตุผล (บังคับกรอก)
export function ApprovalActions({ id, quoteNumber, signatureUrl, onApprove, onReject, layout = "desktop" }: ApprovalActionsProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  // done = action สำเร็จแล้ว รอหน้าใหม่จาก router.refresh() — dialog ค้างไว้จน component นี้ unmount (สถานะเปลี่ยน → ปุ่มหาย)
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const busy = pending || done;

  const run = (fn: () => Promise<ActionResult<void>>) =>
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) {
        setError(res.fieldErrors?.reason?.[0] ?? res.message);
        return;
      }
      setDone(true);
      router.refresh();
    });

  const mobile = layout === "mobile";

  return (
    <>
      <Button size={mobile ? "lg" : "default"} disabled={busy} onClick={() => setDialog("approve")} className={mobile ? "order-1" : ""}>
        อนุมัติ + เซ็นลายเซ็น
      </Button>
      <Button variant="destructive" disabled={busy} onClick={() => setDialog("reject")} className={mobile ? "order-2" : "-order-1"}>
        ตีกลับพร้อมเหตุผล
      </Button>

      {/* ---- อนุมัติ ---- */}
      <Dialog open={dialog === "approve"} onOpenChange={(o) => !o && !busy && setDialog(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>อนุมัติใบเสนอราคา {quoteNumber}</DialogTitle>
            <DialogDescription>ระบบจะแปะลายเซ็นจากโปรไฟล์ของคุณ และล็อกใบนี้ไม่ให้แก้ไข</DialogDescription>
          </DialogHeader>
          <div className="flex h-24 items-center justify-center overflow-hidden rounded-md border border-dashed border-border">
            {signatureUrl ? (
              <Image src={signatureUrl} alt="ลายเซ็นของคุณ" width={240} height={96} unoptimized className="h-full w-auto object-contain" />
            ) : (
              <span className="stripe-placeholder mono flex size-full items-center justify-center text-2xs text-muted-foreground">ยังไม่มีลายเซ็นในโปรไฟล์</span>
            )}
          </div>
          {!signatureUrl ? <InfoNotice>ต้องอัปโหลดลายเซ็นก่อน (Storage → signatures แล้วตั้ง signature_path ในโปรไฟล์) จึงจะอนุมัติได้</InfoNotice> : null}
          {error ? <p role="alert" className="text-body text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setDialog(null)}>
              ยกเลิก
            </Button>
            <Button disabled={busy || !signatureUrl} onClick={() => run(() => onApprove({ id }))}>
              {done ? "กำลังอัปเดตหน้า…" : pending ? "กำลังอนุมัติ…" : "ยืนยันอนุมัติ + เซ็น"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- ตีกลับ ---- */}
      <Dialog open={dialog === "reject"} onOpenChange={(o) => !o && !busy && setDialog(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>ตีกลับ {quoteNumber}</DialogTitle>
            <DialogDescription>เซลล์จะเห็นเหตุผลนี้ในใบ แก้ไขแล้วส่งอนุมัติใหม่ได้</DialogDescription>
          </DialogHeader>
          <FormField label="เหตุผลที่ตีกลับ" htmlFor="reject-reason" error={error ?? undefined}>
            <Textarea
              id="reject-reason"
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น ราคาข้อ 1 สูงไป ปรับเป็น 1,260"
              maxLength={500}
              aria-invalid={!!error || undefined}
            />
          </FormField>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setDialog(null)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" disabled={busy || !reason.trim()} onClick={() => run(() => onReject({ id, reason }))}>
              {done ? "กำลังอัปเดตหน้า…" : pending ? "กำลังตีกลับ…" : "ยืนยันตีกลับ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
