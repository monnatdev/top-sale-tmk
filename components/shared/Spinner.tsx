import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

// spinner มาตรฐาน — ใช้ใน Button loading, nav, และ loading state ของหน้า
export function Spinner({ className, label = "กำลังโหลด" }: { className?: string; label?: string }) {
  return <Loader2Icon role="status" aria-label={label} className={cn("size-4 shrink-0 animate-spin", className)} />;
}
