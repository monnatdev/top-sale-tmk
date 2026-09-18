"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportPdfButtonProps = {
  id: string;
  /** ครั้งแรก (approved) = ปุ่มหลัก + สถานะจะเปลี่ยนเป็น "ส่งลูกค้าแล้ว" · ซ้ำ = ปุ่มรอง */
  primary?: boolean;
  label?: string;
  size?: "default" | "lg";
  className?: string;
};

// เปิด PDF ในแท็บใหม่ (มือถือ = viewer ของเครื่อง แชร์ต่อได้) แล้ว refresh หน้าเพื่อให้สถานะ/ประวัติอัปเดต
export function ExportPdfButton({ id, primary, label = "Export PDF", size = "default", className }: ExportPdfButtonProps) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);

  const open = () => {
    window.open(`/api/quotations/${id}/pdf`, "_blank", "noopener");
    setOpened(true);
    // route ทำงานเสร็จ (gen PDF + เปลี่ยนสถานะ) แล้วค่อย refresh — ใช้เวลาไม่กี่วิ
    setTimeout(() => router.refresh(), 2500);
  };

  return (
    <Button variant={primary ? "default" : "outline"} size={size} className={className} onClick={open}>
      <FileDownIcon /> {opened && primary ? "กำลังอัปเดตสถานะ…" : label}
    </Button>
  );
}
