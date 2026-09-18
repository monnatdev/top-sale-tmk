// format วันที่/ตัวเลขสำหรับแสดงผล — ทุกหน้าใช้ตัวนี้ ไม่ format เอง
const TZ = "Asia/Bangkok";

// ปี พ.ศ. ตามเวลาไทย (ใช้รันเลขที่ใบ) — server บน Vercel เป็น UTC จึงต้องระบุ timezone
export function getThaiYear(date: Date = new Date()): number {
  const y = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric" }).format(date);
  return Number(y) + 543;
}

// "YYYY-MM-DD" ของวันนี้ตามเวลาไทย (ค่าเริ่มต้นวันที่เสนอราคา)
export function todayDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return parts; // en-CA ให้รูปแบบ YYYY-MM-DD
}

// "2026-07-20" หรือ Date → "20/07/2569"
export function formatThaiDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  if (typeof value === "string") {
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return value;
    return `${d}/${m}/${Number(y) + 543}`;
  }
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
  return formatThaiDate(p);
}

// Date → "20/07/2569 09:12"
export function formatThaiDateTime(value: Date | null | undefined): string {
  if (!value) return "—";
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
  return `${formatThaiDate(value)} ${time}`;
}

// 1260 → "1,260" · 1260.5 → "1,260.50"
export function formatPrice(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  const hasFraction = Math.round(n * 100) % 100 !== 0;
  return n.toLocaleString("en-US", { minimumFractionDigits: hasFraction ? 2 : 0, maximumFractionDigits: 2 });
}

// น้ำหนัก 45 → "45" · 45.5 → "45.5"
export function formatWeight(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";
}
