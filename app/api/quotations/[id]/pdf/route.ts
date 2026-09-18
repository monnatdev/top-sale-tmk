import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { exportPdf } from "@/lib/services/quotationService";
import { quotationIdSchema } from "@/lib/validation/quotation";

export const dynamic = "force-dynamic";

// GET /api/quotations/:id/pdf — stream PDF (route handler เพราะเป็นไฟล์) · บาง: parse → auth → service → ตอบ
export async function GET(_req: Request, ctx: RouteContext<"/api/quotations/[id]/pdf">) {
  const parsed = quotationIdSchema.safeParse(await ctx.params);
  if (!parsed.success) return NextResponse.json({ message: "ใบเสนอราคาไม่ถูกต้อง" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  try {
    const { buffer, filename, transitioned } = await exportPdf(parsed.data.id, user);
    if (transitioned) {
      revalidatePath("/quotations");
      revalidatePath(`/quotations/${parsed.data.id}`);
    }
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        // inline = เปิดใน viewer ของเครื่อง (มือถือแชร์ต่อได้) · ชื่อไฟล์ = เลขที่ใบ
        "Content-Disposition": `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof AppError) return NextResponse.json({ message: e.message }, { status: e.status });
    console.error("[pdf] unexpected", e);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
