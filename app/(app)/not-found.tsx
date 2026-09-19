import { LinkButton } from "@/components/shared/LinkButton";

// 404 ในโซนหลังล็อกอิน (ใบของคนอื่นก็ลงที่นี่ — ไม่บอกว่ามีอยู่)
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold">ไม่พบหน้าที่ต้องการ</h1>
        <p className="text-body text-muted-foreground">ลิงก์อาจไม่ถูกต้อง หรือคุณไม่มีสิทธิ์เข้าถึงรายการนี้</p>
      </div>
      <LinkButton href="/quotations" variant="outline">
        กลับหน้ารายการ
      </LinkButton>
    </main>
  );
}
