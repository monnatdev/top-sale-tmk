import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  className?: string;
};

// ช่องค้นหา — พื้นครีม (ต่างจาก input ฟอร์มที่พื้นขาว) สูง 44px / 40px เดสก์ท็อป
export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        className="h-11 bg-background pl-9 text-body md:h-10"
        {...props}
      />
    </div>
  );
}
