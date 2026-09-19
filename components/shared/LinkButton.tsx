"use client";

import Link, { useLinkStatus } from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/Spinner";

type LinkButtonProps = Omit<React.ComponentProps<typeof Button>, "render"> & {
  href: string;
  /** ไอคอนนำหน้า — ถูกแทนด้วย spinner ระหว่างรอหน้าใหม่ */
  icon?: React.ReactNode;
};

function Pending({ icon }: { icon?: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner /> : <>{icon}</>;
}

// ปุ่มที่เป็นลิงก์ (สร้างใบ, แก้ไข) — แสดง spinner จนหน้าใหม่มา ไม่งั้นกดแล้วเหมือนไม่มีอะไรเกิดขึ้น
export function LinkButton({ href, icon, children, ...props }: LinkButtonProps) {
  return (
    <Button render={<Link href={href} />} {...props}>
      <Pending icon={icon} />
      {children}
    </Button>
  );
}
