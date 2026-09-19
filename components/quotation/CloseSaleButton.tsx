"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/actionResult";

type CloseSaleButtonProps = {
  id: string;
  quoteNumber: string;
  onClose: (input: { id: string }) => Promise<ActionResult<void>>;
  size?: "default" | "lg";
};

// "ปิดการขาย" (sent → won) — ยืนยันก่อน เพราะย้อนกลับไม่ได้
export function CloseSaleButton({ id, quoteNumber, onClose, size = "default" }: CloseSaleButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const busy = pending || done;

  const confirm = () =>
    startTransition(async () => {
      setError(null);
      const res = await onClose({ id });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setDone(true);
      router.refresh();
    });

  return (
    <>
      <Button variant="success" size={size} disabled={busy} onClick={() => setOpen(true)}>
        ปิดการขาย
      </Button>
      <Dialog open={open} onOpenChange={(o) => !o && !busy && setOpen(false)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>ปิดการขาย {quoteNumber}</DialogTitle>
            <DialogDescription>ยืนยันว่าลูกค้าตกลงซื้อตามใบเสนอราคานี้ — สถานะจะเปลี่ยนเป็น “ปิดการขาย” และย้อนกลับไม่ได้</DialogDescription>
          </DialogHeader>
          {error ? <p role="alert" className="text-body text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="success" loading={busy} onClick={confirm}>
              {done ? "กำลังอัปเดตหน้า…" : pending ? "กำลังบันทึก…" : "ยืนยันปิดการขาย"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
