import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ROLE_LABEL } from "@/lib/auth/types";
import { SignatureCard } from "@/components/quotation/SignatureCard";
import { requireUser } from "@/lib/auth/session";
import { getProfileSignaturePath } from "@/lib/db/queries/profiles";
import { getSignatureUrl } from "@/lib/storage/signedUrl";
import { getInitials } from "@/lib/utils";
import { logout } from "../actions";

export const metadata = { title: "ตั้งค่า" };

// ข้อมูลผู้ใช้ + ลายเซ็น (ผู้บริหาร — อัปโหลดผ่าน Supabase Storage เอง ดู docs/SETUP.md ข้อ 6) + ออกจากระบบ
export default async function SettingsPage() {
  const user = await requireUser();
  const signatureUrl = user.role === "executive" ? await getSignatureUrl(await getProfileSignaturePath(user.id)) : null;
  return (
    <>
      <PageHeader title="ตั้งค่า" subtitle="บัญชีผู้ใช้" />
      <PageBody>
        <SectionCard title="บัญชีของฉัน">
          <div className="flex items-center gap-3">
            <UserAvatar initials={getInitials(user.name)} role={user.role} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</span>
            </div>
          </div>
        </SectionCard>
        {user.role === "executive" ? (
          <SignatureCard
            imageUrl={signatureUrl}
            placeholder="ยังไม่ได้ตั้งค่าลายเซ็น"
            hint={signatureUrl ? "ลายเซ็นนี้จะถูกแปะในใบที่คุณอนุมัติ" : "อัปโหลดไฟล์ png/jpg เข้า Storage bucket “signatures” แล้วตั้ง signature_path ในตาราง profiles (ดู docs/SETUP.md)"}
          />
        ) : null}
        <form action={logout}>
          <Button type="submit" variant="outline" className="w-full md:w-auto">
            <LogOutIcon /> ออกจากระบบ
          </Button>
        </form>
      </PageBody>
    </>
  );
}
