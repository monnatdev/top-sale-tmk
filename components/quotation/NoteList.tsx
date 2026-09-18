import { cn } from "@/lib/utils";

type NoteListProps = {
  notes: readonly { id: string; text: string }[];
  /** slot ท้ายแต่ละข้อ เช่น ปุ่มลบ × (ฟอร์ม) */
  renderTrailing?: (note: { id: string; text: string }) => React.ReactNode;
  /** ปุ่ม "+ เพิ่มหมายเหตุ" (ฟอร์ม) */
  footer?: React.ReactNode;
  className?: string;
};

// หมายเหตุ / เงื่อนไข — แต่ละข้อเป็นกล่องพื้นครีม
export function NoteList({ notes, renderTrailing, footer, className }: NoteListProps) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {notes.map((n) => (
        <div key={n.id} className="flex items-start justify-between gap-2.5 rounded-md bg-background px-3 py-2.5">
          <p className="text-xs leading-relaxed md:text-body">{n.text}</p>
          {renderTrailing?.(n)}
        </div>
      ))}
      {footer}
    </div>
  );
}
