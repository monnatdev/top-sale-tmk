import { redirect } from "next/navigation";

// หน้าแรกไม่มีเนื้อหา — ส่งไปหน้ารายการใบเสนอราคา (proxy.ts จะเด้งไป /login ถ้ายังไม่ล็อกอิน — ทำในข้อ 3)
export default function Home() {
  redirect("/quotations");
}
