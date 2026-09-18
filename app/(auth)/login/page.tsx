import { BrandLogo } from "@/components/layout/BrandLogo";
import { LoginForm } from "@/components/auth/LoginForm";
import { login } from "./actions";

export const metadata = { title: "เข้าสู่ระบบ" };

// UI จาก Claude Design · login ผ่าน server action (Supabase Auth) — proxy.ts เด้งคนที่ล็อกอินแล้วไป /quotations
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-1">
      {/* แผงซ้ายสี ink — เดสก์ท็อปเท่านั้น */}
      <section className="hidden w-[42%] flex-col justify-between bg-sidebar p-14 text-sidebar-foreground lg:flex">
        <BrandLogo size="md" />
        <div className="flex max-w-md flex-col gap-5">
          <h2 className="text-3xl leading-snug font-semibold">
            ใบเสนอราคาข้าวสาร
            <br />
            ที่คุมราคาและลายเซ็นไว้ที่เดียว
          </h2>
          <p className="text-sm leading-relaxed text-sidebar-muted">
            เลิกทำใบเสนอราคาใน Excel — สร้าง ส่งอนุมัติ เซ็น แล้ว export PDF ตามฟอร์มบริษัทได้จากเครื่องเดียว
          </p>
          <div className="flex gap-7 border-t border-sidebar-border pt-3">
            <div>
              <div className="mono text-2xl text-primary">4</div>
              <div className="text-xs text-sidebar-muted">คอลัมน์ในใบเสนอราคา</div>
            </div>
            <div>
              <div className="mono text-2xl text-primary">6</div>
              <div className="text-xs text-sidebar-muted">สถานะเอกสาร</div>
            </div>
          </div>
        </div>
        <span className="mono text-2xs text-muted-foreground">ORGANIC POWER 2020 CO.,LTD</span>
      </section>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-sm flex-col gap-7 lg:max-w-105">
          {/* หัวมือถือ: โลโก้ + ชื่อแบรนด์ */}
          <div className="flex flex-col items-center gap-3.5 lg:hidden">
            <BrandLogo size="lg" />
            <div className="text-center">
              <div className="text-2xl font-semibold">ข้าวตราแม่ครัว</div>
              <div className="text-xs text-muted-foreground">ระบบออกใบเสนอราคา</div>
            </div>
          </div>
          {/* หัวเดสก์ท็อป */}
          <div className="hidden flex-col gap-1.5 lg:flex">
            <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
            <p className="text-body text-muted-foreground">ใช้บัญชีพนักงานที่แอดมินสร้างให้</p>
          </div>

          <LoginForm action={login} mobile />

          <p className="text-center text-2xs leading-relaxed text-muted-foreground lg:hidden">
            บริษัท ออร์แกนิค เพาเวอร์ 2020 จำกัด
            <br />
            สำหรับพนักงานภายในเท่านั้น
          </p>
        </div>
      </section>
    </main>
  );
}
