import { cn } from "@/lib/utils";

export type TimelineEntry = {
  id: string;
  /** ผู้กระทำ เช่น "สมชาย ส." */
  who: string;
  /** สิ่งที่ทำ เช่น "ส่งให้ผู้บริหารอนุมัติ" */
  what: string;
  /** เวลา format แล้ว เช่น "18/07/2569 10:04" */
  when: string;
};

// ประวัติใบเสนอราคา (audit log) — มือถือ = จุด+ข้อความ · เดสก์ท็อป = เวลา | ข้อความ แบบ ledger
export function Timeline({ entries, className }: { entries: readonly TimelineEntry[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {entries.map((e) => (
        <li key={e.id} className="border-ledger flex gap-2.5 py-2.5 last:border-b-0 md:grid md:grid-cols-[150px_1fr] md:gap-4">
          <span aria-hidden className="mt-1.5 size-[7px] shrink-0 rounded-full bg-primary md:hidden" />
          <span className="mono order-2 hidden text-xs text-muted-foreground md:order-none md:block">{e.when}</span>
          <div className="flex flex-col">
            <span className="text-xs leading-relaxed md:text-body">
              <b className="font-semibold">{e.who}</b> {e.what}
            </span>
            <span className="mono text-2xs text-muted-foreground md:hidden">{e.when}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
