import { BarChart3Icon, FileTextIcon, SettingsIcon, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// เมนูหลัก — ใช้ร่วมกันทั้ง Sidebar (เดสก์ท็อป) และ BottomNav (มือถือ)
// "ลูกค้า" ตัดออกใน MVP (ข้อ 4 ข้าม — จัดการลูกค้า/สินค้าผ่าน Supabase) · ใส่กลับเมื่อมีหน้า /customers
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/quotations", label: "ใบเสนอราคา", icon: FileTextIcon },
  { href: "/dashboard", label: "ภาพรวม", icon: BarChart3Icon },
  { href: "/settings", label: "ตั้งค่า", icon: SettingsIcon },
];

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
