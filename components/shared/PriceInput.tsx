"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PriceInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange" | "inputMode"> & {
  /** ค่าตัวเลขจากฟอร์ม — 0/"" = ยังไม่กรอก */
  value: number | string;
  /** ส่งค่าดิบที่พิมพ์ (ไม่มี comma) เช่น "1260.5" — ผู้เรียก Number() เอง */
  onValueChange: (raw: string) => void;
};

// เอาเฉพาะตัวเลข + จุดเดียว + ทศนิยมไม่เกิน 2 ตำแหน่ง
export function sanitizePrice(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, "");
  const [int = "", ...rest] = cleaned.split(".");
  if (rest.length === 0) return int;
  return `${int}.${rest.join("").slice(0, 2)}`;
}

// "1260.5" → "1,260.5" · คงจุด/ศูนย์ท้ายไว้ตามที่ผู้ใช้กำลังพิมพ์
export function formatPriceInput(raw: string): string {
  if (!raw) return "";
  const [int, dec] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec === undefined ? grouped : `${grouped}.${dec}`;
}

function fromValue(value: number | string): string {
  if (value === "" || value === 0 || value === "0") return "";
  return formatPriceInput(sanitizePrice(String(value)));
}

// ช่องกรอกราคา: แสดง comma คั่นหลักพันขณะพิมพ์ (type=number ทำไม่ได้) — มือถือขึ้นแป้นตัวเลข
export function PriceInput({ value, onValueChange, className, ...props }: PriceInputProps) {
  const [text, setText] = useState(() => fromValue(value));
  // ถ้า parent เปลี่ยนค่าจากข้างนอก (เช่น reset ฟอร์ม) ให้ sync — แต่ไม่ทับสิ่งที่กำลังพิมพ์ ("1260." ยังเป็น 1260)
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (Number(sanitizePrice(text) || 0) !== Number(value || 0)) setText(fromValue(value));
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const raw = sanitizePrice(e.target.value);
        setText(formatPriceInput(raw));
        onValueChange(raw);
      }}
      className={cn("numeric", className)}
    />
  );
}
