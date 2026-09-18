"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitQuotation } from "@/app/(app)/quotations/actions";

// ปุ่ม "ส่งให้ผู้บริหารอนุมัติ" บนหน้าดูใบ (ร่าง/ตีกลับ) — เรียก action แล้ว refresh
export function SubmitButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // done = ส่งแล้ว รอหน้าใหม่ (ปุ่มนี้จะ unmount เมื่อสถานะเปลี่ยน)
  const [done, setDone] = useState(false);

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const res = await submitQuotation({ id });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setDone(true);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-1">
      <Button size="lg" className="md:h-10" disabled={disabled || pending || done} onClick={submit}>
        {done ? "กำลังอัปเดตหน้า…" : pending ? "กำลังส่ง…" : "ส่งให้ผู้บริหารอนุมัติ"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
