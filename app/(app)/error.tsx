"use client";

import { useEffect } from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/shared/LinkButton";

// error boundary ของหน้าหลังล็อกอิน — ไม่โชว์รายละเอียดภายใน (log ฝั่ง server แล้ว) แค่ให้ลองใหม่/กลับหน้าหลัก
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error]", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold">เกิดข้อผิดพลาด</h1>
        <p className="text-body text-muted-foreground">
          โหลดหน้านี้ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          {error.digest ? (
            <>
              <br />
              <span className="mono text-2xs">รหัสอ้างอิง {error.digest}</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>
          <RotateCcwIcon /> ลองใหม่
        </Button>
        <LinkButton href="/quotations" variant="outline">
          กลับหน้ารายการ
        </LinkButton>
      </div>
    </main>
  );
}
